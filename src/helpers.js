function fetchWorkItemData(url) {
  return fetch(url, { credentials: "include" })
    .then((response) => response.text())
    .then((html) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const data = doc.getElementById("dataProviders");
      // 2. Get the raw JSON string from the element's text content
      // Use .textContent for better performance and security over .innerHTML
      const jsonString = data.textContent;

      // 3. Parse the JSON string into a usable JavaScript object
      try {
        const { data } = JSON.parse(jsonString);
        return data;
      } catch (error) {
        console.error("Error parsing JSON:", error);
      }
    });
}

export { fetchWorkItemData };
