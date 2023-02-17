import {getItem, setItem} from "./storage.js";

async function loadColorTheme() {
    let theme = await getTheme();
    if (theme === "auto") {
        if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches)
            theme = "dark";
        else
            theme = "light";
    }
    document.documentElement.setAttribute("data-theme", theme);
}

async function changeColorTheme(newTheme) {
    console.log(newTheme);
    await setTheme(newTheme);
    await loadColorTheme();
}

async function getTheme() {
    return await getItem("theme", "auto");
}

async function setTheme(theme) {
    return await setItem("theme", theme);
}

const SELECT = document.getElementById("theme-select");
if (SELECT) {
    SELECT.value = await getTheme();
    SELECT.addEventListener("change", (_) => changeColorTheme(SELECT.value));
}
await loadColorTheme();
