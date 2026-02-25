import { Toast } from "bootstrap";
import { toggles } from "./config.js";

// Saves options to chrome.storage
const saveOptions = () => {
  const toast = new Toast(document.getElementById("success-toast"));

  const options = {};

  toggles.forEach((toggle) => {
    options[toggle] = document.getElementById(toggle).checked;
  });

  chrome.storage.sync.set(options, () => {
    toast.show();
  });
};

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
const restoreOptions = () => {
  const options = {};

  toggles.forEach((toggle) => {
    options[toggle] = true;
  });

  chrome.storage.sync.get(options, (items) => {
    toggles.forEach((toggle) => {
      document.getElementById(toggle).checked = items[toggle];
    });

    document.getElementById("content").classList.add("show");
  });
};

document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("save").addEventListener("click", saveOptions);
