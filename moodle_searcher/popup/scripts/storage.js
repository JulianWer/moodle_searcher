let _browser = typeof browser === "undefined" ? chrome : browser;
export async function setItem(key, value){
    let obj = await _browser.storage.local.get();
    obj[key] = value
    _browser.storage.local.set(obj);
}

export async function getItem(key, default_value=""){
    let obj = await _browser.storage.local.get();
    if (typeof obj !== "undefined" && key in obj)
        default_value = obj[key];
    return default_value;
}
