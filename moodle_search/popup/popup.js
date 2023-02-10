import { getAllSubjectsOfQuery, getAllFilesFromSubjectOfQuery, getAllPagesFromFileOfQuery, clearDatabase } from './script.js';
import '../pdfjs-3.3.122-dist/build/pdf.js'
pdfjsLib.GlobalWorkerOptions.workerSrc = '../pdfjs-3.3.122-dist/build/pdf.worker.js';

// for cross browser support
let _browser = typeof browser === "undefined" ? chrome : browser;
console.log("popup is running");

let currentTableLevel = 0; // 0 = empty, 1 = subjects, 2 = files, 3 = pages
let currentSubject = null;

let cachedSubjects = [];
let cachedFiles = [];


document.getElementById("reload_button").addEventListener("click", () => sendMessage("reloadMessage"));
document.getElementById("search_button").addEventListener("click", () => showSubjectsFromQuery(getQuery()));
document.getElementById("prev-button").addEventListener("click", () => showPrevTable());
document.getElementById("clear-button").addEventListener("click", () => {
    clearDatabase();
    showSubjectsFromQuery(getQuery());
});

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
            showSubjects(cachedSubjects, getQuery());
            break;
        case 3:
            currentTableLevel = 2;
            showFilesOfSubject(currentSubject, cachedFiles, getQuery());
            break;
        case 0:
        default:
            document.getElementById("prev-button").style.visibility = "hidden";
            document.getElementById("clear-button").style.visibility = "hidden";
            break;    
    }
}
async function showSubjectsFromQuery(query){
    let subjects = await getAllSubjectsOfQuery(query);
    cachedSubjects = subjects;
    showSubjects(subjects, query);
}

async function showSubjects(subjects, query) {
    document.getElementById("prev-button").style.visibility = "visible";
    document.getElementById("clear-button").style.visibility = "visible";
    currentTableLevel = 1;
    createTable(subjects.map((subject)=>
        [
            subject.name, 
            () => showFilesOfSubjectFromQuery(subject, query)
        ]
    ));
}

async function showFilesOfSubjectFromQuery(subject, query) {
    let files = await getAllFilesFromSubjectOfQuery(subject, query);
    cachedFiles = files;
    showFilesOfSubject(currentSubject, files, query);
}

async function showFilesOfSubject(subject, files, query){
    currentSubject = subject,
    currentTableLevel = 2;
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
    var viewport = page.getViewport({ scale: 1.0 });
    var canvas = document.createElement("canvas");
    var context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
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