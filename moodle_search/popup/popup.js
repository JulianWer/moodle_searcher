if (typeof browser === "undefined") {
  var browser = chrome;
}

document.getElementById("reload_button").addEventListener("click", () => {
    console.log("reload button clicked");
    (async () => {
        const [tab] = await browser.tabs.query({active: true, lastFocusedWindow: true});
        await browser.tabs.sendMessage(tab.id, {name: "reloadMessage"});
    })();
});

document.getElementById("search_button").addEventListener("click", () => {
    browser.runtime.sendMessage({name:"searchMessage"});
});



