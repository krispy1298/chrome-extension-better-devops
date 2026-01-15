function autoSave() {
  const button = document.getElementById("__bolt-save-dialog");

  if (button.innerText === "Save") {
    button.click();
    return;
  }

  const toggle = document.querySelector(
    "[aria-label='More save options'].enabled"
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
    const status = document.getElementById("__bolt-Stat-e-input");
    if (status) {
      mutationObserver.observe(status, {
        attributes: true,
        attributeFilter: ["value"],
      });
    }
  }, saveInterval);
}

setAutoSaveStatus();
