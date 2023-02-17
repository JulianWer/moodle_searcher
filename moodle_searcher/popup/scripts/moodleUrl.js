// for cross browser support
let _browser = typeof browser === "undefined" ? chrome : browser;

import {getItem, setItem} from "./storage.js";

async function allowedUrl(url) {
    let urlFromSettingsAsRegexPattern = new RegExp(
        "^" + (await getMoodleUrl()).replaceAll(".", "\\.").replaceAll("*", ".*") + "((/.*)|)$",
        "i"
    );
    return urlFromSettingsAsRegexPattern.test(url);
}

export async function getMoodleUrl() {
    return await getItem("moodleUrl", "https://your-moodle.de")
}

export async function setMoodleUrl(url) {
    await setItem("moodleUrl", url + "/*");
}

export function getMoodleTabId() {
    return new Promise((resolve, _) => {
        _browser.tabs.query({active: true, lastFocusedWindow: true}, async (tabs) => {
            if (await allowedUrl(tabs[0].url)) {
                console.log(tabs);
                resolve(tabs[0].id);
            } else {
                // TODO show an error for a not matching url
            }
        });
    });
}

export async function initMoodleUrl() {
    //console.log(await _browser.scripting.getRegisteredContentScripts());
    _browser.scripting.unregisterContentScripts({
        ids: (await _browser.scripting.getRegisteredContentScripts()).map((obj) => obj.id)
    });
    console.log(await getMoodleUrl());
    _browser.scripting.registerContentScripts([{
        id: "moodle-script",
        matches: [await getMoodleUrl()],
        js: ['scripts/contentScript.js'],
        runAt: "document_start"
    }]);
    console.log(await getMoodleTabId());
    _browser.scripting.executeScript({
        target: {tabId: await getMoodleTabId()},
        files: ["scripts/contentScript.js"],
    })
}
