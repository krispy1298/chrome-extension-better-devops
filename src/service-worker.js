import browser from "webextension-polyfill";

browser.runtime.onInstalled.addListener((details) => {
  if (details.reason === "update") {
    browser.tabs.create({ url: "update.html" });
  }
});
