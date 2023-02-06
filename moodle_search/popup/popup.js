if (typeof browser === "undefined") {
  var browser = chrome;
}

document.getElementById("reload_button").addEventListener("click", () => {
    console.log("reload button clicked");
    (async () => {
        const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
        await chrome.tabs.sendMessage(tab.id, {name: "reloadMessage"});
    })();
});

document.getElementById("search_button").addEventListener("click", () => {
    browser.runtime.sendMessage({name:"searchMessage"});
});



