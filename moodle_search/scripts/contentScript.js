// for cross browser support
let _browser = typeof browser === "undefined" ? chrome : browser;


_browser.runtime.onMessage.addListener(
  (message, _, sendResponse) => {
    switch (message.name) {
      case "searchMessage":
        getPdf(message.query).then(
          (val)=>{
            console.log(typeof val);
            sendResponse(val);
          }).catch(err=>console.log(err));
        return true;
      case "reloadMessage":
        dowloadAllPdfs(getArrayOfCorrectPdfUrls());
        break;
      default:
        console.error("Message not found");
    }
  }
);

function getArrayOfCorrectPdfUrls() {
  const urls = [];
  const links = Array.from(document.querySelectorAll("a.aalink"));
  const regex = new RegExp("moodle.hs-mannheim.de/mod/resource");
  function getHeading() {
    const heading = document.querySelector(".page-header-headings");
    if (heading && heading.childElementCount > 0) {
      return heading.firstChild.innerText;
    } else {
      return "no heading";
    }
  }
  function isLink(a) {
    return a.href.search(regex) > 0;
  }
  function formatLink(a) {
    return {
      link: a.href,
      key: getHeading() + ": " + a.innerText
    }
  }
  return links.filter(isLink).map(formatLink);
}

function dowloadAllPdfs(urls) {
  console.log(urls);
  for (let i of urls) {
    downloadPdf(i);
  }
}

function downloadPdf(url) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url.link);
  xhr.responseType = "blob";
  xhr.onload = function () {
    if (xhr.status && xhr.status === 200) {
      savePdf(xhr.response, url.key);
    }
  }
  xhr.send();
}


function savePdf(pdf, key) {
  var fileReader = new FileReader();

  fileReader.onload = function (evt) {
    var result = evt.target.result;
    storeData("Files", {
      name: key,
      data: result
    }).then(() => {
      console.log("Data stored successfully");
    }).catch((error) => {
      console.error("Error storing data:", error);
    });
  };

  fileReader.readAsDataURL(pdf);
}


function getPdf(query){
   //TODO page
    return getData("Files", {id:1})
      .then((pdf) => {return {pdf:String(pdf.data), name:String(pdf.name), page:2}});
}

function getDBRequest(reject){
  const request = window.indexedDB.open("MoodleExtensionDB", 1);
  request.onerror = reject;
  return request;
}

function storeData(storeName, value) {
  return new Promise((resolve, reject) => {
    const request = getDBRequest(reject);
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction([storeName], "readwrite");
      const objectStore = transaction.objectStore(storeName);
      const objectStoreRequest = objectStore.put(value);
      objectStoreRequest.onsuccess = resolve;
      objectStoreRequest.onerror = reject;
    };
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore(storeName, { keyPath: "id", autoIncrement: true });
    };
  });
};

function getData(storeName, key) {
  return new Promise((resolve, reject) => {
    const request = getDBRequest(reject);
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction([storeName], "readonly");
      const objectStore = transaction.objectStore(storeName);
      const objectStoreRequest = objectStore.get(16);//TODO key
      objectStoreRequest.onsuccess = (event) => resolve(event.target.result);
      objectStoreRequest.onerror = reject;
    };
  });
};


/*
PDF IFrame
const iframeDocument = document.getElementById('pdf-js-viewer').contentWindow;
let searchText = "TheTextYouWantoToHighlight";

iframeDocument.PDFViewerApplication.pdfViewer.findController.executeCommand('find', {
    caseSensitive: false, 
    findPrevious: undefined,
    highlightAll: true, 
    phraseSearch: true, 
    query: searchText
})
*/

