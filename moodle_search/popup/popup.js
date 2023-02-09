import '../pdfjs-3.3.122-dist/build/pdf.js'
pdfjsLib.GlobalWorkerOptions.workerSrc = '../pdfjs-3.3.122-dist/build/pdf.worker.js';

async function getPdfText(data) {
    let doc = await pdfjsLib.getDocument(data);
    let pageTexts = Array.from({length: doc.numPages}, async (_, pageNumber) => {
        return (
            await (
                await doc.getPage(pageNumber+1)
            ).getTextContent()
        ).items.map(token => token.str).join('');
    });
    return await Promise.all(pageTexts);//filter(pageTexts, (text) => text.includes(query)));
}

// for cross browser support
let _browser = typeof browser === "undefined" ? chrome : browser;
console.log("popup is running");

document.getElementById("reload_button").addEventListener("click", () => sendMessage("reloadMessage"));
document.getElementById("search_button").addEventListener("click", () => sendMessage("searchMessage", {query: getQuery()}, showPdf));

function showPdf(response){
    console.log(getPdfText(response.pdf));
    let iframe = document.createElement("iframe");
    iframe.setAttribute("src", response.pdf+"#page="+response.page);
    iframe.setAttribute("width", "100%");
    iframe.setAttribute("height", "500px");
    iframe.setAttribute("frameborder", "0");
    iframe_container.childNodes.forEach(c => iframe_container.removeChild(c));
    iframe_container.appendChild(iframe);
}

function sendMessage(name, data = {}, response_handler = null){    
    _browser.tabs.query({active: true, lastFocusedWindow: true}, (tabs) => {
        data["name"] = name;
        _browser.tabs.sendMessage(tabs[0].id, data, response_handler);        
    });
}

function getQuery(){
    return document.getElementById("search_input").value;
}