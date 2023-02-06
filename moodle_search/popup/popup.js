// for cross browser support
let _browser = typeof browser === "undefined" ? chrome : browser;

document.getElementById("reload_button").addEventListener("click", () => sendMessage("reloadMessage"));
document.getElementById("search_button").addEventListener("click", () => sendMessage("searchMessage", {query: getQuery()}, showPdf));


function showPdf(response){
    let pdf = response.pdf;//contains data, id, name
    let page = response.page;
    let iframe_container = document.getElementById("iframe_container");
    console.log(iframe_container);
    var blob = new Blob([pdf.data], {type: 'application/pdf'});
    var blobURL = URL.createObjectURL(blob);
    iframe_container.innerHTML = '<iframe id="pdf-js-viewer" src="' + pdf.data + '" width="100%" height="100%" allowfullscreen webkitallowfullscreen></iframe>';
}

function sendMessage(name, data = {}, response_handler = null){
    (async () => {
        const [tab] = await _browser.tabs.query({active: true, lastFocusedWindow: true});
        data["name"] = name;
        const reponse = await _browser.tabs.sendMessage(tab.id, data);
        response_handler(reponse);
    })();
}

function getQuery(){
    return document.getElementById("search_input").value;
}