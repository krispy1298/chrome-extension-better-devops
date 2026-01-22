function autoSave() {
  const button = document.getElementById("__bolt-save-dialog");

  if (!button) {
    return;
  }

  if (button.innerText === "Save") {
    button.click();
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
}

const mutationObserver = new MutationObserver(() => {
  autoSave();
});

function setAutoSave() {
  const elements = document.querySelectorAll(
    "#__bolt-Stat-e-input:not(.better-autosave), .bolt-dropdown-expandable-textfield-input:not(.better-autosave), #__bolt-Remaining-Work-input:not(.better-autosave)",
  );
  elements.forEach((elem) => {
    elem.classList.add("better-autosave");
    mutationObserver.observe(elem, {
      attributes: true,
      attributeFilter: ["value"],
    });
  });
}

const workFormMutationObserver = new MutationObserver(() => {
  setAutoSave();
});

function checkForWorkForm() {
  const workForms = document.querySelectorAll(
    ".bolt-portal-host, .work-item-form-expanded-section-container",
  );

  workForms.forEach((form) => {
    if (!form.classList.contains("better-portal-host")) {
      form.classList.add("better-portal-host");
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
