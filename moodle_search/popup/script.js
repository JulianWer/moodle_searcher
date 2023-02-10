import '../pdfjs-3.3.122-dist/build/pdf.js'
pdfjsLib.GlobalWorkerOptions.workerSrc = '../pdfjs-3.3.122-dist/build/pdf.worker.js';
console.log("background.js loaded");
// for cross browser support
let _browser = typeof browser === "undefined" ? chrome : browser;

_browser.runtime.onMessage.addListener(
    (message, _, sendResponse) => {
        switch (message.name) {
            case "downloadSubject":
                storeSubject(message.subject).then(
                    (subjectID) => dowloadAllPdfs(message.urls, subjectID)
                );
                break;
            default:
                console.error("Message not found");
        }
    }
);

const DBNAME = "MoodleExtensionDB";
const POSSIBLE_STORES = ["Subjects", "Files"];
function getDBRequest(reject) {
      const request = window.indexedDB.open(DBNAME, 1);
      request.onerror = reject;
      return request;
}

function storeData(storeName, value) {
    return new Promise((resolve, reject) => {
    const request = getDBRequest(reject);
    request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(storeName, "readwrite");
        const objectStore = transaction.objectStore(storeName);
        console.log(value);
        const objectStoreRequest = objectStore.put(value);
        objectStoreRequest.onsuccess = resolve;
        objectStoreRequest.onerror = reject;
        objectStoreRequest.onsuccess = (event) => {
            resolve(event.target.result);
        }
    };
    request.onupgradeneeded = (event) => {
        const db = event.target.result;
        for (let store of POSSIBLE_STORES)
            db.createObjectStore(store, { keyPath: "id", autoIncrement: true });
    };
    });
}

function checkIfSubjectExists(subject) {
    return new Promise((resolve, reject) => {
        const request = getDBRequest(reject);
        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction("Subjects", "readonly");
            const objectStore = transaction.objectStore("Subjects");
            const objectStoreRequest = objectStore.getAll();
            objectStoreRequest.onsuccess = (event) => {
                const result = event.target.result;
                const subjectExists = result.some((e) => e.name === subject);
                resolve(subjectExists);
            }
            objectStoreRequest.onerror = reject;
        };
    });
}

function clearDatabase() {
    return new Promise((resolve, reject) => {
        const request = getDBRequest(reject);
        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(POSSIBLE_STORES, "readwrite");
            for (let store of POSSIBLE_STORES) {
                const objectStore = transaction.objectStore(store);
                objectStore.clear();
            }
            transaction.oncomplete = resolve;
            transaction.onerror = reject;
        };
    });
}

function getAllData (storeName, optionalWhereKeyValuePair = {}) {
    return new Promise((resolve, reject) => {
        const request = getDBRequest(reject);
        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(storeName, "readonly");
            const objectStore = transaction.objectStore(storeName);
            const objectStoreRequest = objectStore.getAll();
            objectStoreRequest.onsuccess = (event) => resolve(event.target.result);
            objectStoreRequest.onerror = reject;
            objectStoreRequest.onsuccess = (event) => {
                let result = event.target.result;
                for (let [key, value] of Object.entries(optionalWhereKeyValuePair))
                    result = result.filter((e) => e[key] === value);
                resolve(result);
            };
        };
    });
}

function getData(storeName, key) {
    if (key === undefined) {
        return this.getAllData(storeName);
    }
    return new Promise((resolve, reject) => {
        const request = getDBRequest(reject);
        request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(POSSIBLE_STORES, "readonly");
        const objectStore = transaction.objectStore(storeName);
        const objectStoreRequest = objectStore.get(key);
        objectStoreRequest.onsuccess = (event) => resolve(event.target.result);
        objectStoreRequest.onerror = reject;
        };
    });
}


function dowloadAllPdfs(urls, subjectID) {
    console.log(urls);
    function downloadFile(url) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url.link);
        xhr.responseType = "blob";
        xhr.onload = function () {
            if (xhr.status && xhr.status === 200) {
                saveFile(xhr.response, url, subjectID);
            }
        }
        xhr.send();
    }
    for (let i of urls) {
        downloadFile(i);
    }
}

function saveFile(pdf, url, subjectID){
    var fileReader = new FileReader();
    fileReader.onload = function (evt) {
      var result = evt.target.result;
      storeData(POSSIBLE_STORES[1], {
        name: url.key,
        url: url.link,
        data: result,
        subjectID: subjectID
      }).then(() => {
        console.log("Data stored successfully");
      }).catch((error) => {
        console.error("Error storing data:", error);
      });
    };
    fileReader.readAsDataURL(pdf);
}

function storeSubject(subject){
    return storeData(POSSIBLE_STORES[0], {name: subject});
}

async function getAllPagesFromFile(file){
    let pdf = await pdfjsLib.getDocument(file.data).promise;
    let pages = [];
    for (let pageNumber=1; pageNumber <= pdf.numPages; pageNumber++){
        pages.push(await pdf.getPage(pageNumber));
    }
    return pages;
}

async function getAllFilesOfSubject(subject){
    return  (await getAllData(POSSIBLE_STORES[1], {subjectID: subject.id}));
}

async function getAllSubjects(){
    return await getAllData(POSSIBLE_STORES[0]);
}

async function getTextOfPage(page){
    return (await page.getTextContent()).items.map((i)=>i.str).join(" ");
}

async function pageMatchesQuery(page, query){
    return false;
    // TODO create query language options (OR, AND, NOT, ..., Case Sesnsitive etc)
    return (await getTextOfPage(page)).toLowerCase().replace(" ", "").includes(query.toLowerCase().replace(" ", ""));
}

async function fileMatchesQuery(file, query){
    return containsFilter(await getAllPagesFromFile(file), async (page) => await pageMatchesQuery(page, query));
}

async function subjectMatchesQuery(subject, query){
    return containsFilter(await getAllFilesOfSubject(subject), async (file) => await fileMatchesQuery(file, query));
}

async function containsFilter(iter, filter){
    // returns true if filter is true for at least one element of iter
    for (let i of iter){
        if (await filter(await i)){
            return true;
        }
    }
    return false;
}

export async function getAllPagesFromFileOfQuery(file, query){
    return (await getAllPagesFromFile(file)).filter(async (page) => await pageMatchesQuery(page, query));
}

export async function getAllFilesFromSubjectOfQuery(subject, query){
    return (await getAllFilesOfSubject(subject)).filter(async (file)=> await fileMatchesQuery(file, query));
}

export async function getAllSubjectsOfQuery(query){
    return (await getAllSubjects()).filter(async (subject)=> await subjectMatchesQuery(subject, query));
}
