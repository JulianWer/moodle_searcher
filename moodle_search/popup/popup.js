import '../pdfjs-3.3.122-dist/build/pdf.js'
pdfjsLib.GlobalWorkerOptions.workerSrc = '../pdfjs-3.3.122-dist/build/pdf.worker.js';


function textFilter(page, query){
    return page.includes(query);
}

function getPdfTexts(data, query) {
    function getTextOfPage(page){
       return page.getTextContent().then(
            (textContent) => textContent.items.map((i)=>i.str).join(" ")  
        )
    }
    async function getArrayOfPages(pdf){
        let pages = {};
        for (let pageNumber=1; pageNumber <= pdf.numPages; pageNumber++){
            let page = await pdf.getPage(pageNumber);
            let text = await getTextOfPage(page);
            if (textFilter(text, query)){
                pages[pageNumber] = text;
            }
        }
        return pages;
    }
    return new Promise((resolve, reject) => {
        pdfjsLib.getDocument(data).promise.then(async (pdf) => {
            resolve(await getArrayOfPages(pdf));
        })
    });
}


// async function getPdfText(data) {
//     let doc = await pdfjsLib.getDocument(data);
//     let pageTexts = Array.from({length: doc.numPages}, async (_, pageNumber) => {
//         return (
//             await (
//                 await doc.getPage(pageNumber+1)
//             ).getTextContent()
//         ).items.map(token => token.str).join('');
//     });
//     return await pageTexts;//filter(pageTexts, (text) => text.includes(query)));
// }

// for cross browser support
let _browser = typeof browser === "undefined" ? chrome : browser;
console.log("popup is running");

document.getElementById("reload_button").addEventListener("click", () => sendMessage("reloadMessage"));
document.getElementById("search_button").addEventListener("click", () => sendMessage("searchMessage", {query: getQuery()}, showPdf));

async function showPdf(response){
    console.log(await getPdfTexts(response.pdf, ""));
    let iframe = document.createElement("iframe");
    iframe.setAttribute("src", response.pdf+"#page="+response.page);
    iframe.setAttribute("width", "100%");
    iframe.setAttribute("height", "500px");
    iframe.setAttribute("frameborder", "0");
    iframe_container.childNodes.forEach(c => iframe_container.removeChild(c));    
    iframe_container.appendChild(iframe);

    // TODO not working, yet
    var blob = new Blob([response.pdf], {type: "application/pdf"});
    // Create Blog URL 
    var url = window.URL.createObjectURL(blob);
    chrome.tabs.create({url:url});
    window.open(url, 'something.pdf');

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