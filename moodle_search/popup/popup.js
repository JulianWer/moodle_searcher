// TODO delete files before reload
// TODO make darkmode-toggle persistent
// TODO mark found words in pdfs
// TODO hide/show prev-button logic isnt consistent

import { getAllSubjectsOfQuery, getAllFilesFromSubjectOfQuery, getAllPagesFromFileOfQuery, clearDatabase } from './script.js';
import '../pdfjs-3.3.122-dist/build/pdf.js'
pdfjsLib.GlobalWorkerOptions.workerSrc = '../pdfjs-3.3.122-dist/build/pdf.worker.js';

// for cross browser support
let _browser = typeof browser === "undefined" ? chrome : browser;
console.log("popup is running");

let currentTableLevel = 0; // 0 = empty, 1 = subjects, 2 = files, 3 = pages
let currentSubject = null;

const CACHE = {
    subjects: [],
    files: [],
    query: ""
}

document.getElementById("reload-button").addEventListener("click", () => sendMessage("reloadMessage"));
document.getElementById("search-button").addEventListener("click", () => {
    updateQuery();
    showSubjectsFromQuery();
});
document.getElementById("prev-button").addEventListener("click", () => showPreviousTable());
document.getElementById("clear-button").addEventListener("click", () => {
    clearDatabase();
    showSubjectsFromQuery();
});

let checkb = document.getElementById("theme-toggle");

checkb.addEventListener("change", function(e) {
    if (this.checked) {
        setDarkMode();
    } else {
        setLightMode();
    }
});

function setDarkMode() {
    document.body.style.backgroundColor = "#1C1C1C";
    document.body.style.color = "white";
    document.getElementById("moodle-logo").src = "../images/logo_dark.png";
}
function setLightMode() {
    document.body.style.backgroundColor = "white";
    document.body.style.color = "black";
    document.getElementById("moodle-logo").src = "../images/logo_light.png";
}

function updateQuery() {
    CACHE.query = document.getElementById("search-input").value;
}

function clearDiv(elementID) {
    document.getElementById(elementID).innerHTML = "";
}

function createRow(name, onclick) {
    let row = document.createElement("li");
    row.onclick = onclick;
    row.appendChild(document.createTextNode(name));
    return row;
}

function showList(valueAndEventList) {
    clearDiv("result-container");
    let table = document.createElement("ul");
    table.setAttribute("id", "content-list");
    for (let [value, event] of valueAndEventList)
        table.appendChild(createRow(value, event));
    document.getElementById("result-container").appendChild(table);
}

function showPreviousTable() {
    clearDiv("result-container");
    switch (currentTableLevel) {
        case 1:
            currentTableLevel = 0;
            break;
        case 2:
            currentTableLevel = 1;
            showSubjects(CACHE.subjects);
            break;
        case 3:
            currentTableLevel = 2;
            showFilesOfSubject(currentSubject, CACHE.files);
            break;
        case 0:
        default:
            hideButtons();
            break;
    }
}

function showButtons() { // TODO rename
    let button = document.getElementById("prev-button");
    button.disabled = false;
    button.classList.remove("disabled");

}

function hideButtons() { // TODO rename
    let button = document.getElementById("prev-button");
    button.disabled = true;
    button.classList.add("disabled");
}

async function showSubjectsFromQuery() {
    let subjects = await getAllSubjectsOfQuery(CACHE.query);
    CACHE.subjects = subjects;
    showSubjects(subjects);
}

function showSubjects(subjects) {
    showButtons();
    currentTableLevel = 1;
    showList(subjects.map((subject) => [
        subject.name,
        () => showFilesOfSubjectFromQuery(subject)
    ]));
}

async function showFilesOfSubjectFromQuery(subject) {
    let files = await getAllFilesFromSubjectOfQuery(subject, CACHE.query);
    CACHE.files = files;
    showFilesOfSubject(currentSubject, files);
}

async function showFilesOfSubject(subject, files) {
    currentSubject = subject,
    currentTableLevel = 2;
    showList(files.map((file) => [
        file.name,
        () => {
            clearDiv("result-container");
            currentTableLevel = 3;
            showFile(file);
        }
    ]));
}

function showFile(file) {
    getAllPagesFromFileOfQuery(file, CACHE.query).then((pages) => {
        if (pages.length > 0) {
            renderPages(pages, file)
        }
    });
}

function renderPages(pages, file) {
    pdfjsLib.getDocument(file.url).promise.then((pdf) => {
        for (let page of pages) {
            renderPage(pdf, 1 + parseInt(page.pageNumber), file.url);
        }
    });
}

function renderPage(pdf, pageNumber, fileUrl) {
    pdf.getPage(pageNumber).then(function (page) {
        let viewport = page.getViewport({ scale: 1.0 });
        let canvas = getCanvas(viewport.width, viewport.height, () => window.open(fileUrl + "#page=" + pageNumber));
        document.getElementById("result-container").appendChild(canvas);
        page.render({
            canvasContext: canvas.getContext('2d'),
            viewport: viewport
        });
    });
}

function getCanvas(width, height, onclickHandler) {
    var canvas = document.createElement("canvas");
    canvas.height = height;
    canvas.width = width;
    canvas.onclick = onclickHandler
    return canvas;
}

function sendMessage(name, data = {}, response_handler = null) {
    _browser.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        data["name"] = name;
        _browser.tabs.sendMessage(tabs[0].id, data, response_handler);
    });
}
