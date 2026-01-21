function autoSave() {
  const button = document.getElementById("__bolt-save-dialog");

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

function setAutoSaveStatus() {
  const saveInterval = 500; // Save every .5 seconds
  setInterval(() => {
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
  }, saveInterval);
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

setAutoSaveStatus();

setInterval(() => {
  checkForTables();
}, 2000);

checkForTables();

document.addEventListener("DOMContentLoaded", () => {
  checkForTables();
});

window.addEventListener("load", () => {
  checkForTables();
});
