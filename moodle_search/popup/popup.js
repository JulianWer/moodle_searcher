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


// for cross browser support
let _browser = typeof browser === "undefined" ? chrome : browser;
console.log("popup is running");

document.getElementById("reload_button").addEventListener("click", () => sendMessage("reloadMessage"));
document.getElementById("search_button").addEventListener("click", () => sendMessage("searchMessage", {query: getQuery()}));
document.getElementById("search_button").addEventListener("click", () => sendMessage("getAllSubjects", {}, showResults));
//document.getElementById("result_cell").addEventListener("click", () => clearDiv("result-container"));
function showResults(response){
    document.getElementById("result-container").appendChild(createTable(response));
}

function createTable(response){
    let table = document.createElement("table");
    table.setAttribute("id", "results_table");
    for (let arg of response){
        table.appendChild(createRow(arg));
    }
    return table;
}

function createRow(arg){
    let row = document.createElement("tr");
    let cell = document.createElement("td");
    cell.onclick = () => clearDiv("result-container");
    cell.appendChild(document.createTextNode(arg));
    row.appendChild(cell);
    return row;
}

function clearDiv(elementID) {
    document.getElementById(elementID).innerHTML = "";
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