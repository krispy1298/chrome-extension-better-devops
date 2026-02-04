function autoSave() {
  const buttons = document.querySelectorAll(
    "#__bolt-save-dialog, #__bolt-save",
  );

  buttons.forEach((button) => {
    if (button.innerText === "Save") {
      button.click();
      button.setAttribute("better-autosaved", "");
      setTimeout(() => {
        button.removeAttribute("better-autosaved");
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

function betterParentLink(target = document) {
  target.querySelectorAll(".link-type-name").forEach((elem) => {
    if (elem.innerText === "Parent") {
      const parent = elem.parentElement.querySelector(
        ".link-type-links .artifact-link-container",
      );
      console.debug("Found parent link:", parent);
      const header = elem
        .closest(".work-item-form-dialog, .work-item-form-page")
        ?.querySelector(".work-item-form-header");
      if (parent && header && !header.querySelector(".better-parent-link")) {
        const linkClone = parent.cloneNode(true);
        linkClone.querySelector(".artifact-details")?.remove();
        linkClone.querySelector(".remove-item-button-container")?.remove();
        linkClone.classList.add("better-parent-link");
        linkClone.classList.remove("padding-bottom-8");
        linkClone.style.maxWidth = "30%";
        header.querySelector(".secondary-text").prepend(linkClone);
      }
    }
  });
}

const cardFieldMutationObserver = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (
      mutation.target.classList.contains("rooster-editor") &&
      mutation.attributeName === "class" &&
      !mutation.target.classList.contains("edit-mode")
    ) {
      autoSave();
    } else if (["value", "aria-rowcount"].includes(mutation.attributeName)) {
      autoSave();
    }
  }
});

function setAutoSave() {
  const containers = document.querySelectorAll(
    ".work-item-form-dialog,.work-item-form-page",
  );

  containers.forEach((container) => {
    const elements = container.querySelectorAll(
      "#__bolt-Stat-e-input:not(.better-autosave), .bolt-dropdown-expandable-textfield-input:not(.better-autosave), .rooster-editor:not(.better-autosave), .work-item-attachments-grid:not(.better-autosave)",
    );
    elements.forEach((elem) => {
      elem.classList.add("better-autosave");
      cardFieldMutationObserver.observe(elem, {
        attributes: true,
        attributeFilter: ["value", "class", "aria-rowcount"],
      });
    });

    const textFields = container.querySelectorAll(
      ".bolt-textfield-input:not(.better-autosave)",
    );

    textFields.forEach((field) => {
      field.classList.add("better-autosave");
      field.addEventListener("blur", () => {
        autoSave();
      });
    });
  });
}

const workFormMutationObserver = new MutationObserver((mutations) => {
  setAutoSave();
  mutations.forEach((mutation) => {
    if (
      mutation.target.classList.contains("bolt-portal-host") ||
      mutation.target.classList.contains("region-page")
    ) {
      workFormMutationObserver.observe(mutation.target, {
        childList: true,
        subtree: true,
      });
    }
    betterParentLink(mutation.target);
  });
});

function checkForWorkForm() {
  const workForms = document.querySelectorAll(
    ".bolt-portal-host, .work-item-form-expanded-section-container, .work-item-form-page, .region-page",
  );

  workFormMutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  workForms.forEach((form) => {
    if (!form.classList.contains("better-portal-host")) {
      form.classList.add("better-portal-host");
      betterParentLink(form);
      workFormMutationObserver.observe(form, {
        childList: true,
        subtree: true,
      });
    }
  });
}

const tableMutationObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.target.classList.contains("taskboard-card")) {
      betterCardStatus(mutation.target.parentElement);
    }
  });
});

function checkForTables() {
  const tables = document.querySelectorAll(".bolt-table:not(.better-table)");
  tables.forEach((table) => {
    table.classList.add("better-table");
    betterCardStatus(table);
    tableMutationObserver.observe(table, {
      childList: true,
      subtree: true,
    });
  });
}

function betterCardStatus(target) {
  if (!target) {
    console.debug("No target for betterCardStatus");
    debugger;
    return;
  }
  const cards = target.querySelectorAll(
    ".taskboard-card:not(.better-card-state)",
  );
  cards.forEach((card) => {
    card.classList.add("better-card-state");
    const circle = card.querySelector(".work-item-state-circle");
    const state = circle.closest(".card-work-item-state");
    state.setAttribute("style", circle.getAttribute("style"));
  });
}

setInterval(() => {
  checkForTables();
}, 2000);

checkForTables();

document.addEventListener("DOMContentLoaded", () => {
  checkForWorkForm();
  checkForTables();
});

window.addEventListener("load", () => {
  checkForWorkForm();
  checkForTables();
});
