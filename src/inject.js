import { debounce, throttle, uniq, flattenDeep } from "lodash-es";
import { kebabCase } from "change-case";
import { toggles } from "./config.js";

import { Toast } from "bootstrap";

import { consolePrefixer } from "console-prefixer";

const logger = consolePrefixer({
  defaultPrefix: {
    text: "better-azure-boards",
    style:
      "background: cyan; color: black;font-weight:bold; padding:2px; border-radius:2px;",
  },
});

/**
 * Wraps a given DOM node (e.g., a text node) in a new HTML element.
 *
 * @param {Node} node The node to wrap.
 * @param {string} wrapperTag The tag name of the new wrapper element (e.g., 'span', 'div').
 * @returns {Element|null} The new wrapper element, or null if the node has no parent.
 */
function wrapNodeInElement(node, wrapperTag) {
  // Ensure the node has a parent to interact with the DOM structure
  if (!node.parentNode) {
    return null;
  }

  // 1. Create the new wrapper element
  const wrapper = document.createElement(wrapperTag);

  // 2. Insert the wrapper element into the DOM immediately before the original node
  node.parentNode.insertBefore(wrapper, node);

  // 3. Move the original node inside the wrapper
  wrapper.appendChild(node);

  return wrapper;
}

class BetterAzureBoards {
  constructor() {
    this.userOptions = {};

    this.throttledCheckForTables = throttle(
      this.checkForTables.bind(this),
      500,
    );
    this.throttledActivateBetterCardStatus = throttle(
      this.activateBetterCardStatus.bind(this),
      250,
    );
    this.throttledActivateShowParentAsBreadcrumbs = throttle(
      this.activateShowParentAsBreadcrumbs.bind(this),
      500,
    );
    this.throttledAutoSave = throttle(this.autoSave.bind(this), 500);
    this.throttledActivateAutoSave = throttle(
      this.activateAutoSave.bind(this),
      500,
    );
    this.throttledCheckForWorkForm = throttle(
      this.checkForWorkForm.bind(this),
      500,
    );

    this.throttledActivateCopyNumberToClipboard = throttle(
      this.activateCopyNumberToClipboard.bind(this),
      1000,
    );

    this.debouncedEmbedFigma = debounce(this.embedFigma.bind(this), 1000);

    this.setUpMutationObservers();
    this.init();
    this.initToast();

    this.eventsAdded = {};
  }

  init() {
    const options = {};

    toggles.forEach((toggle) => {
      options[toggle] = true;
    });

    chrome.storage.sync.get(options, (items) => {
      toggles.forEach((toggle) => {
        if (items[toggle]) {
          document.documentElement.classList.add(
            `bab-${kebabCase(toggle)}-enabled`,
          );
        }
      });

      this.userOptions = items;

      if (items.autoSave) {
        this.throttledActivateAutoSave();
      }

      if (items.closeModalByClickingOutside) {
        if (!this.eventsAdded["doc.click.modalDismiss"]) {
          document.addEventListener("click", (event) => {
            if (event.target.classList.contains("bolt-dialog-callout")) {
              const dialog = event.target.querySelector(
                ".bolt-dialog-callout-content",
              );

              if (dialog) {
                const closeButton = dialog.querySelector(
                  "button[aria-label='Close'], button[aria-label='Dismiss']",
                );
                if (closeButton) {
                  closeButton.click();
                }
              }
            }
          });
          this.eventsAdded["doc.click.modalDismiss"] = true;
        }
      }

      setInterval(() => {
        this.throttledCheckForTables();
        this.throttledCheckForWorkForm();
        if (!this.userOptions.copyNumberToClipboard) {
          logger.debug("copyNumberToClipboard option is disabled");
          return;
        }
        this.throttledActivateCopyNumberToClipboard(document.body);
      }, 2000);

      this.throttledCheckForTables();
      this.throttledCheckForWorkForm();

      document.addEventListener("DOMContentLoaded", () => {
        this.throttledCheckForWorkForm();
        this.throttledCheckForTables();
      });

      window.addEventListener("load", () => {
        this.throttledCheckForWorkForm();
        this.throttledCheckForTables();
      });
    });
  }

  initToast() {
    window.addEventListener("bab-toast", (event) => {
      const { text, type } = event.detail;
      const toastEl = document.createElement("div");
      toastEl.className = `toast align-items-center text-bg-${type} border-0`;
      toastEl.setAttribute("role", "alert");
      toastEl.setAttribute("aria-live", "assertive");
      toastEl.setAttribute("aria-atomic", "true");
      toastEl.innerHTML = `
        <div class="d-flex">
          <div class="toast-body">
            ${text}
          </div>
        </div>
      `;

      const container = document.createElement("div");
      container.classList.add("bab-toast-container");
      container.appendChild(toastEl);
      document.body.appendChild(container);

      const toast = new Toast(toastEl);
      toast.show();

      toastEl.addEventListener("hidden.bs.toast", () => {
        container.remove();
      });
    });
  }

  setUpMutationObservers() {
    this.cardFieldMutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.target.classList.contains("rooster-editor") &&
          mutation.attributeName === "class" &&
          !mutation.target.classList.contains("edit-mode") &&
          !mutation.target.closest(".work-item-form-discussion")
        ) {
          this.throttledAutoSave();
        } else if (
          ["value", "aria-rowcount"].includes(mutation.attributeName)
        ) {
          this.throttledAutoSave();
        }
      }
    });

    this.workFormMutationObserver = new MutationObserver((mutations) => {
      this.throttledActivateAutoSave();
      mutations.forEach((mutation) => {
        const { target } = mutation;
        if (
          target.classList.contains("bolt-portal-host") ||
          target.classList.contains("region-page")
        ) {
          this.workFormMutationObserver.observe(target, {
            childList: true,
            subtree: true,
          });
        }
        this.throttledActivateShowParentAsBreadcrumbs(target);
        this.throttledActivateCopyNumberToClipboard(target);

        if (target.closest(".bab-figma-embeds")) {
          return;
        }

        if (!this.userOptions.embedFigma) {
          logger.debug("embedFigma option is disabled");
          return;
        }

        this.debouncedEmbedFigma();
      });
    });

    this.tableMutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        const { target } = mutation;
        if (target.classList.contains("taskboard-card")) {
          this.throttledActivateBetterCardStatus(target.parentElement);
          this.throttledActivateCopyNumberToClipboard(target.parentElement);
        }
      });
    });
  }

  autoSave() {
    const buttons = document.querySelectorAll(
      "#__bolt-save-dialog, #__bolt-save",
    );

    buttons.forEach((button) => {
      if (button.innerText === "Save") {
        button.click();
        button.setAttribute("bab-better-autosaved", "");
        setTimeout(() => {
          button.removeAttribute("bab-better-autosaved");
        }, 1500);
        return;
      }

      const toggle = document.querySelector(
        "[aria-label='More save options'].enabled",
      );

      if (toggle) {
        toggle.click();
        const save = document.getElementById("__bolt-save");
        save.click();
      }
    });
  }

  activateShowParentAsBreadcrumbs(target = document) {
    if (!this.userOptions.showParentAsBreadcrumbs) {
      logger.debug("showParentAsBreadcrumbs option is disabled");
      return;
    }

    target.querySelectorAll(".link-type-name").forEach((elem) => {
      if (elem.innerText === "Parent") {
        const parent = elem.parentElement.querySelector(
          ".link-type-links .artifact-link-container",
        );
        logger.debug("Found parent link:", parent);
        const header = elem
          .closest(".work-item-form-dialog, .work-item-form-page")
          ?.querySelector(".work-item-form-header");
        if (
          parent &&
          header &&
          !header.querySelector(".bab-better-parent-link")
        ) {
          const linkClone = parent.cloneNode(true);
          linkClone.querySelector(".artifact-details")?.remove();
          linkClone.querySelector(".remove-item-button-container")?.remove();
          linkClone.classList.add("bab-better-parent-link");
          linkClone.classList.remove("padding-bottom-8");
          linkClone.style.maxWidth = "30%";
          header.querySelector(".secondary-text").prepend(linkClone);
        }
      }
    });
  }

  checkForTables() {
    const tables = document.querySelectorAll(
      ".bolt-table:not(.bab-better-table)",
    );

    tables.forEach((table) => {
      table.classList.add("bab-better-table");

      if (!this.userOptions.moreProminentStateOnCards) {
        logger.debug("moreProminentStateOnCards option is disabled");
        return;
      }

      this.throttledActivateBetterCardStatus(table);
      this.tableMutationObserver.observe(table, {
        childList: true,
        subtree: true,
      });

      this.throttledActivateCopyNumberToClipboard(table);
    });

    if (!this.eventsAdded["doc.click.betterCardStatus"]) {
      document.body.addEventListener("click", (event) => {
        logger.debug("Click event:", event);

        this.throttledActivateBetterCardStatus(document.body);
      });
      this.eventsAdded["doc.click.betterCardStatus"] = true;
    }
  }

  activateBetterCardStatus(target) {
    if (!target) {
      logger.debug("No target for betterCardStatus");
      return;
    }

    if (!this.userOptions.moreProminentStateOnCards) {
      logger.debug("moreProminentStateOnCards option is disabled");
      return;
    }

    const cards = target.parentElement.querySelectorAll(
      ".taskboard-card:not(.bab-better-card-state)",
    );

    cards.forEach((card) => {
      card.classList.add("bab-better-card-state");
      const circle = card.querySelector(".work-item-state-circle");

      if (!circle) {
        logger.debug("No circle found for card:", card);
        return;
      }

      const state = circle.closest(".card-work-item-state");

      if (!state) {
        logger.debug("No state element found for circle:", circle);
        return;
      }

      state.setAttribute("style", circle.getAttribute("style"));
    });
  }

  activateAutoSave() {
    if (!this.userOptions.autoSave) {
      logger.debug("autoSave option is disabled");
      return;
    }

    const containers = document.querySelectorAll(
      ".work-item-form-dialog,.work-item-form-page",
    );

    containers.forEach((container) => {
      const elements = container.querySelectorAll(
        "#__bolt-Stat-e-input:not(.bab-better-autosave), .bolt-dropdown-expandable-textfield-input:not(.bab-better-autosave), .rooster-editor:not(.bab-better-autosave), .work-item-attachments-grid:not(.bab-better-autosave)",
      );

      elements.forEach((elem) => {
        elem.classList.add("bab-better-autosave");

        if (elem.closest(".work-item-form-discussion")) {
          return;
        }

        this.cardFieldMutationObserver.observe(elem, {
          attributes: true,
          attributeFilter: ["value", "class", "aria-rowcount"],
        });
      });

      const textFields = container.querySelectorAll(
        ".bolt-textfield-input:not(.bab-better-autosave)",
      );

      textFields.forEach((field) => {
        field.classList.add("bab-better-autosave");
        field.addEventListener("blur", () => {
          this.throttledAutoSave();
        });
      });
    });
  }

  checkForWorkForm() {
    const workForms = document.querySelectorAll(
      ".bolt-portal-host, .work-item-form-expanded-section-container, .work-item-form-page, .region-page",
    );

    this.workFormMutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    workForms.forEach((form) => {
      if (!form.classList.contains("bab-better-portal-host")) {
        form.classList.add("bab-better-portal-host");
        this.throttledActivateShowParentAsBreadcrumbs(form);
        this.throttledActivateCopyNumberToClipboard(form);
        this.workFormMutationObserver.observe(form, {
          childList: true,
          subtree: true,
        });
      }
    });
  }

  activateCopyNumberToClipboard(target) {
    if (!this.userOptions.copyNumberToClipboard) {
      logger.debug("copyNumberToClipboard option is disabled");
      return;
    }

    target
      .querySelectorAll(".work-item-form-header .work-item-title-textfield")
      .forEach((elem) => {
        const header = elem.closest(".work-item-form-header");

        if (
          header.getAttribute("bab-better-copy-to-clipboard-parent") === "true"
        ) {
          return;
        }

        header.setAttribute("bab-better-copy-to-clipboard-parent", "true");

        const row = elem.closest(".body-xl");
        if (row) {
          if (row.childNodes?.[0]?.nodeType === Node.TEXT_NODE) {
            const node = row.childNodes[0];
            if (/\d+/.test(node.textContent)) {
              const wrapper = wrapNodeInElement(node, "span");

              wrapper.setAttribute("bab-better-copy-to-clipboard", "true");
              wrapper.addEventListener(
                "click",
                this.onCopyNumberToClipboardClick.bind(this),
              );
            }
          }
        }
      });

    target.querySelectorAll(".wit-card .selectable-text").forEach((elem) => {
      if (elem.getAttribute("bab-better-copy-to-clipboard") === "true") {
        return;
      }

      elem.setAttribute("bab-better-copy-to-clipboard", "true");
      elem.addEventListener(
        "click",
        this.onCopyNumberToClipboardClick.bind(this),
      );
    });
  }

  onCopyNumberToClipboardClick(event) {
    const number = event.target.innerText.replace("#", "").trim();
    navigator.clipboard.writeText(number).then(
      () => {
        const text = `📎 Copied ${number} to clipboard`;
        window.dispatchEvent(
          new CustomEvent("bab-toast", {
            detail: {
              text,
              type: "success",
            },
          }),
        );
        logger.debug(text);
      },
      (err) => {
        const text = "Could not copy text";
        logger.error(text, err);
        window.dispatchEvent(
          new CustomEvent("bab-toast", {
            detail: {
              text,
              type: "danger",
            },
          }),
        );
      },
    );
  }

  embedFigma() {
    if (!this.userOptions.embedFigma) {
      logger.debug("embedFigma option is disabled");
      return;
    }

    document
      .querySelectorAll(
        ".work-item-form-collapsible-section-content .rooster-editor:not(.edit-mode)",
      )
      .forEach((editor) => {
        let figmas = uniq(
          flattenDeep([
            ...editor.innerText.matchAll(
              /(http.+figma\.com\/[file|design][^\s<>]+\?[^\s<>]+)/g,
            ),
          ]),
        );

        figmas = figmas.map((url) =>
          url.replace("www.figma.com", "embed.figma.com"),
        );

        if (figmas.length === 0) {
          return;
        }

        logger.debug("Found Figma URLs:", figmas);

        const embedsContainer = editor
          .closest(".work-item-form-collapsible-section-content")
          .querySelector(".bab-figma-embeds");

        if (!embedsContainer) {
          const container = document.createElement("div");
          container.classList.add("bab-figma-embeds");
          editor
            .closest(".work-item-form-collapsible-section-content")
            .appendChild(container);
        }

        figmas.forEach((url) => {
          const src = new URL(url);
          src.searchParams.set("embed-host", "azureboards");
          if (
            !editor
              .closest(".work-item-form-collapsible-section-content")
              .querySelector(
                `.bab-figma-embeds iframe[src="${src.toString()}"]`,
              )
          ) {
            const iframe = document.createElement("iframe");
            iframe.src = src.toString();
            iframe.style.width = "100%";
            iframe.style.height = "500px";
            iframe.style.border = "1px solid #ccc";
            iframe.style.borderRadius = "4px";
            iframe.style.marginTop = "16px";
            editor
              .closest(".work-item-form-collapsible-section-content")
              .querySelector(".bab-figma-embeds")
              .appendChild(iframe);
          } else {
            logger.debug("Figma embed already exists for URL:", url);
          }
        });
      });
  }
}

new BetterAzureBoards();
