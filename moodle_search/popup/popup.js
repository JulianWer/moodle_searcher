// for cross browser support
let _browser = typeof browser === "undefined" ? chrome : browser;

document.getElementById("reload_button").addEventListener("click", () => sendMessage("reloadMessage"));
document.getElementById("search_button").addEventListener("click", () => sendMessage("searchMessage"));


function sendMessage(name, data = {}){
    (async () => {
        const [tab] = await _browser.tabs.query({active: true, lastFocusedWindow: true});
        data["name"] = name;
        await _browser.tabs.sendMessage(tab.id, data);
    })();
}
