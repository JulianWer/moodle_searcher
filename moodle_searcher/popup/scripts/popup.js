// TODO mark found words in pdfs
// TODO maybe add little arrow in each subject and file row
// TODO show container with animation etc

import {
  getAllSubjectsOfQuery,
  getAllFilesFromSubjectOfQuery,
  getAllPagesFromFileOfQuery,
  clearDatabase,
} from "./script.js";
import "../../pdfjs-3.3.122-dist/build/pdf.js";
import { initMoodleUrl, getMoodleTabId } from "./moodleUrl.js";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "../pdfjs-3.3.122-dist/build/pdf.worker.js";

// for cross browser support
let _browser = typeof browser === "undefined" ? chrome : browser;
console.log("popup is running");

const CACHE = {
  subjects: [],
  files: [],
  query: "",
};

let currentActiveContainer = -1; // -1 = empty, 0 = subjects, 1 = files, 2 = pages
let CONTENT_CONTAINERS = [
  document.getElementById("subject-container"),
  document.getElementById("files-container"),
  document.getElementById("pages-container"),
];

hideNavButtons();
hideAllContainers();
await initMoodleUrl();

document.getElementById("reload-button").addEventListener("click", () => {
  rotateReloadImage();
  sendMessage("reloadMessage");
});
document.getElementById("search-button").addEventListener("click", async () => {
  await updateQuery();
  await showSubjectsFromQuery();
});
document.body.addEventListener("keypress", async (e) => {
  if (e.key === "Enter") {
    await updateQuery();
    await showSubjectsFromQuery();
  }
});
document
  .getElementById("prev-button")
  .addEventListener("click", () => showPreviousTable());
document.getElementById("clear-button").addEventListener("click", async () => {
  await clearDatabase();
  await showSubjectsFromQuery();
});

_browser.runtime.onMessage.addListener(async (message, _, sendResponse) => {
  switch (message.name) {
    case "downloadDone":
      stopRotattionReloadImage();
      break;
    default:
      console.error("Message not found");
  }
});

function rotateReloadImage() {
  // added class rotated is defined in style.css
  let reloadButton = document.getElementById("reload-image");
  reloadButton.className = "rotated";
}
function stopRotattionReloadImage() {
  let reloadButton = document.getElementById("reload-image");
  reloadButton.className = "reload-image";
}

function hideAllContainers() {
  for (let container of CONTENT_CONTAINERS) {
    container.style.display = "none";
  }
}

function showContainer(_) {
  hideAllContainers();
  CONTENT_CONTAINERS[currentActiveContainer].style.display = "block";
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

function showList(valueAndEventList, container_id) {
  clearDiv(container_id);
  let table = document.createElement("ul");
  //table.classList.add("material-element");
  table.classList.add("content-list");
  table.classList.add("no-scrollbar");
  for (let [value, event] of valueAndEventList)
    table.appendChild(createRow(value, event));
  let container = document.getElementById(container_id);
  container.appendChild(table);
  hideAllContainers();
  container.style.display = "block";
}

function showPreviousTable() {
  switch (currentActiveContainer) {
    case 1:
      currentActiveContainer = 0;
      showContainer("subjects-container");
      break;
    case 2:
      currentActiveContainer = 1;
      showContainer("files-container");
      break;
    default:
      hideNavButtons();
      hideAllContainers();
      break;
  }
}

function showNavButtons() {
  let button = document.getElementById("prev-button");
  button.disabled = false;
  button.classList.remove("disabled");
  button.style.cursor = "pointer";
}

function hideNavButtons() {
  let button = document.getElementById("prev-button");
  button.disabled = true;
  button.classList.add("disabled");
  button.style.cursor = "default";
}

async function showSubjectsFromQuery() {
  let subjects = await getAllSubjectsOfQuery(CACHE.query);
  CACHE.subjects = subjects;
  showSubjects(subjects);
}

function showSubjects(subjects) {
  showNavButtons();
  currentActiveContainer = 0;
  showList(
    subjects.map((subject) => [
      subject.name,
      () => showFilesOfSubjectFromQuery(subject),
    ]),
    "subject-container"
  );
}

async function showFilesOfSubjectFromQuery(subject) {
  let files = await getAllFilesFromSubjectOfQuery(subject, CACHE.query);
  CACHE.files = files;
  currentActiveContainer = 1;
  showList(
    files.map((file) => [
      file.name,
      () => {
        currentActiveContainer = 2;
        clearDiv("pages-container");
        showFile(file);
        showContainer("pages-container");
      },
    ]),
    "files-container"
  );
}

function showFile(file) {
  getAllPagesFromFileOfQuery(file, CACHE.query).then((pages) => {
    if (pages.length > 0) {
      renderPages(pages, file);
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
    let canvas = getCanvas(viewport.width, viewport.height, () =>
      window.open(fileUrl + "#page=" + pageNumber)
    );
    document.getElementById("pages-container").appendChild(canvas);
    page.render({
      canvasContext: canvas.getContext("2d"),
      viewport: viewport,
    });
  });
}

function getCanvas(width, height, onclickHandler) {
  let canvas = document.createElement("canvas");
  canvas.height = height;
  canvas.width = width;
  canvas.onclick = onclickHandler;
  return canvas;
}

// async function highlightQueryOnRenderedPage(page) {
//     let query = CACHE.query;
//     let textContent = getTextOfPage(page);
//     let queryIndex = (await textContent).indexOf(query);
//     if (queryIndex >= 0) {
//         let queryLength = query.length;
//         let queryRects = await getRectsOfTextOnPage(page, queryIndex, queryLength);
//         console.log(queryRects);
//         for (let rect of queryRects) {
//             highlightRectOnCanvas(rect, page);
//         }
//     }
// }

// function highlightRectOnCanvas(rect, page) { // TODO working wierdly
//     let canvas = document.getElementById("pages-container").lastChild;
//     let context = canvas.getContext("2d");
//     context.beginPath();
//     context.rect(rect.x, rect.y, rect.width, rect.height);
//     context.fillStyle = "yellow";
//     context.fill();
// }

// function getRectsOfTextOnPage(page, queryIndex, queryLength){
//     return page.getTextContent().then((textContent) => {
//         let rects = [];
//         let textItems = textContent.items;
//         for (let i = 0; i < textItems.length; i++) {
//             let textItem = textItems[i];
//             let text = textItem.str;
//             let textLength = text.length;
//             let textRect = textItem.transform;
//             if (queryIndex >= 0 && queryIndex < textLength) {
//                 let rect = {
//                     x: textRect[4],
//                     y: textRect[5],
//                     width: textRect[0] * textLength,
//                     height: textRect[3]
//                 };
//                 rects.push(rect);
//                 queryIndex = -1;
//             } else if (queryIndex >= textLength) {
//                 queryIndex -= textLength;
//             }
//         }
//         return rects;
//     });
// }

async function sendMessage(name, data = {}, response_handler = null) {
  data["name"] = name;
  _browser.tabs.sendMessage(await getMoodleTabId(), data, response_handler);
}
