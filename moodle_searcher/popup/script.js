import '../pdfjs-3.3.122-dist/build/pdf.js'
pdfjsLib.GlobalWorkerOptions.workerSrc = '../pdfjs-3.3.122-dist/build/pdf.worker.js';
console.log("script.js loaded");

// for cross browser support
let _browser = typeof browser === "undefined" ? chrome : browser;

_browser.runtime.onMessage.addListener(
    (message, _, sendResponse) => {
        switch (message.name) {
            case "downloadSubject":
                storeSubject(message.subject).then(
                    async (subjectID) => {
                        await removeFilesFromSubject(subjectID);
                        dowloadAllPdfs(message.files, subjectID)
                    }
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
    request.onupgradeneeded = (event => {
        const db = event.target.result;
        for (let store of POSSIBLE_STORES) {
            let objectStore = db.createObjectStore(store, { keyPath: "id", autoIncrement: true });
            // create index
            if (store === "Files"){
                if (!objectStore.indexNames.contains('subjectID')) {
                    objectStore.createIndex('subjectID', 'subjectID');
                }
            }
        }
    });
    return request;
}

function getKeyOfExistingSubject(subject) {
    return new Promise((resolve, reject) => {
        const request = getDBRequest(reject);
        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction("Subjects", "readonly");
            const objectStore = transaction.objectStore("Subjects");
            const objectStoreRequest = objectStore.getAll();
            objectStoreRequest.onsuccess = (event) => {
                const result = event.target.result;
                result.some((e) => {
                    if (e.name === subject) {
                        resolve(e.id);
                        return true;
                    }
                });
            }
            objectStoreRequest.onerror = reject;
        };
    });
}

function executeTransaction(storeName, readMode, objectStoreExecuter) {
    return new Promise((resolve, reject) => {
        const request = getDBRequest(reject);
        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(storeName, readMode);
            const objectStore = transaction.objectStore(storeName);
            objectStoreExecuter(objectStore, resolve, reject);
        }
    });
}

function storeData(storeName, value) {
    return executeTransaction(storeName, "readwrite", (objectStore, resolve, reject) => {
        const objectStoreRequest = objectStore.put(value);
        objectStoreRequest.onsuccess = resolve;
        objectStoreRequest.onsuccess = (event) => {
            resolve(event.target.result);
        }
        objectStoreRequest.onerror = reject;
    }
    );
}

function checkIfSubjectExists(subject) {
    return executeTransaction("Subjects", "readonly", (objectStore, resolve, reject) => {
        const objectStoreRequest = objectStore.getAll();
        objectStoreRequest.onsuccess = (event) => {
            const result = event.target.result;
            const subjectExists = result.some((e) => e.name === subject);
            resolve(subjectExists);
        }
        objectStoreRequest.onerror = reject;
    });
}
async function removeFilesFromSubject(subjectID){
    return new Promise((resolve, reject) => {
        const request = getDBRequest(reject);
        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(["Files"], "readwrite");
            const objectStore = transaction.objectStore("Files");

            // get all the entries where subject == "Value" and delete them
            const index = objectStore.index('subjectID');
            const cursor = index.openCursor(IDBKeyRange.only(subjectID));
            cursor.onsuccess = (event) => {
                const result = event.target.result;
                if (result) {
                    objectStore.delete(result.primaryKey);
                    result.continue();
                } else {
                    console.log('All entries with subject = "Value" have been deleted');
                    resolve();
                }
            };
        }
    });
}

export function clearDatabase() {
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

function getAllData(storeName, optionalWhereKeyValuePair = {}) {
    return executeTransaction(storeName, "readonly", (objectStore, resolve, reject) => {
        const objectStoreRequest = objectStore.getAll();
        objectStoreRequest.onerror = reject;
        objectStoreRequest.onsuccess = (event) => {
            let result = event.target.result;
            for (let [key, value] of Object.entries(optionalWhereKeyValuePair))
                result = result.filter((item) => item[key] === value);
            resolve(result);
        };
    });
}

function dowloadAllPdfs(files, subjectID) {
    files.forEach(file => saveFile(file, subjectID));
}

function saveFile(file, subjectID) {
    getAllPagesFromFile(file).then(async (pages) => {
        storeData("Files", {
            name: file.key,
            url: file.url,
            data: await Promise.all(pages.map(getTextOfPage)),
            subjectID: subjectID
        }).then(() => {
            console.log("Data stored successfully");
        }).catch((error) => {
            console.error("Error storing data:", error);
        });
    });
}

export async function getTextOfPage(page) {
    return (await page.getTextContent()).items.map((i) => i.str).join(" ");
}

async function storeSubject(subject) {
    if (!await checkIfSubjectExists(subject))
        return storeData("Subjects", { name: subject });
    else
        return getKeyOfExistingSubject(subject);
}

async function getAllPagesFromFile(file) {
    let pdf = await pdfjsLib.getDocument(file.url).promise;
    let pages = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        pages.push(await pdf.getPage(pageNumber));
    }
    return pages;
}

async function getAllFilesOfSubject(subject) {
    return (await getAllData("Files", { subjectID: subject.id }));
}

async function getAllSubjects() {
    return await getAllData("Subjects");
}

function pageMatchesQuery(pageText, query) {
    // TODO create query language options (OR, AND, NOT, ..., Case Sesnsitive etc)
    return pageText.toLowerCase().replace(" ", "").includes(query.toLowerCase().replace(" ", ""));
}

function fileMatchesQuery(file, query) {
    for (const page of file.data) {
        if (pageMatchesQuery(page, query)) {
            return true;
        }
    }
    return false;
}

async function subjectMatchesQuery(subject, query) {
    for (const file of await getAllFilesOfSubject(subject)) {
        if (fileMatchesQuery(file, query)) {
            return true;
        }
    }
    return false;
}

export async function getAllPagesFromFileOfQuery(file, query) {
    return new Promise((resolve, reject) => {
        let pages = [];
        for (let [pageNumber, page] of Object.entries(file.data)) {
            if (pageMatchesQuery(page, query)) {
                pages.push({ pageNumber: pageNumber, pageText: page });
            }
        }
        resolve(pages);
    });
}

export async function getAllFilesFromSubjectOfQuery(subject, query) {
    return new Promise(async (resolve, reject) => {
        let files = [];
        for (let file of (await getAllFilesOfSubject(subject))) {
            if (fileMatchesQuery(file, query)) {
                files.push(file);
            }
        }
        resolve(files);
    });
}

export async function getAllSubjectsOfQuery(query) {
    return new Promise(async (resolve, reject) => {
        let subjects = [];
        for (let subject of (await getAllSubjects())) {
            if (await subjectMatchesQuery(subject, query)) {
                subjects.push(subject);
            }
        }
        resolve(subjects);
    });
}
