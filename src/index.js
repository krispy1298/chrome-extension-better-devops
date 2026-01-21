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
      "#__bolt-Stat-e-input:not(.better-autosave), .bolt-dropdown-expandable-textfield-input:not(.better-autosave)",
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

setAutoSaveStatus();
