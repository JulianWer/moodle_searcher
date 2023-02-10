import { getAllSubjectsOfQuery, getAllFilesFromSubjectOfQuery, getAllPagesFromFileOfQuery } from './script.js';
import '../pdfjs-3.3.122-dist/build/pdf.js'
pdfjsLib.GlobalWorkerOptions.workerSrc = '../pdfjs-3.3.122-dist/build/pdf.worker.js';

// for cross browser support
let _browser = typeof browser === "undefined" ? chrome : browser;
console.log("popup is running");

let currentTableLevel = 0; // 0 = empty, 1 = subjects, 2 = files, 3 = pages
let currentSubject = null;

document.getElementById("reload_button").addEventListener("click", () => sendMessage("reloadMessage"));
document.getElementById("search_button").addEventListener("click", () => showSubjects(getQuery()));
document.getElementById("prev-button").addEventListener("click", () => showPrevTable());

function clearDiv(elementID) {
    document.getElementById(elementID).innerHTML = "";
}

function createRow(name, onclick) {
    let row = document.createElement("tr");
    let cell = document.createElement("td");
    cell.onclick = onclick;
    cell.appendChild(document.createTextNode(name));
    row.appendChild(cell);
    return row;
}

function createTable(valueAndEventList) {
    clearDiv("result-container");
    let table = document.createElement("table");
    table.setAttribute("id", "results_table");
    for (let [value, event] of valueAndEventList)
        table.appendChild(createRow(value, event));
    document.getElementById("result-container").appendChild(table);
}

function showPrevTable(){
    clearDiv("result-container");
    switch(currentTableLevel){
        case 1:
            currentTableLevel = 0;
            break;
        case 2:
            currentTableLevel = 1;
            showSubjects(getQuery());
            break;
        case 3:
            currentTableLevel = 2;
            showFilesOfSubject(currentSubject, getQuery());
            break;
        case 0:
        default:
            document.getElementById("prev-button").style.visibility = "hidden";
            break;    
    }
}

async function showSubjects(query) {
    document.getElementById("prev-button").style.visibility = "visible";

    let subjects = await getAllSubjectsOfQuery(query);
    currentTableLevel = 1;
    createTable(subjects.map((subject)=>
        [
            subject.name, 
            () => showFilesOfSubject(subject, query)
        ]
    ));
}

async function showFilesOfSubject(subject, query){
    currentSubject = subject,
    currentTableLevel = 2;
    console.log("showFilesOfSubject");
    let files = await getAllFilesFromSubjectOfQuery(subject, query);
    console.log(files);
    createTable(files.map((file) =>
        [
            file.name,
            () => {
                clearDiv("result-container");
                currentTableLevel = 3;
                getAllPagesFromFileOfQuery(file, query).then((pages)=>pages.forEach((page)=>renderPages(page, file.url)));
            }
        ]
    ));
}

function renderPages(page, originalFileUrl) {
    //console.log("handlePages");
    //console.log(page);
    var viewport = page.getViewport({ scale: 1.0 });
    var canvas = document.createElement("canvas");
    var context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    console.log(canvas);
    document.getElementById("result-container").appendChild(canvas);
    canvas.onclick = () => { window.open(originalFileUrl + "#page=" + page._pageIndex) }
    let renderContext = { canvasContext: context, viewport: viewport };
    let renderTask = page.render(renderContext);
    renderTask.promise.then(function () {
        console.log('Page rendered');
    });
}

function sendMessage(name, data = {}, response_handler = null) {
    _browser.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        data["name"] = name;
        _browser.tabs.sendMessage(tabs[0].id, data, response_handler);
    });
}

function getQuery() {
    return document.getElementById("search_input").value;
}