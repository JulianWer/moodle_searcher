// for cross browser support
let _browser = typeof browser === "undefined" ? chrome : browser;

_browser.runtime.onMessage.addListener(
  (message, _, __) => {
    switch (message.name) {
      case "searchMessage":
        break;
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
    storeData("MoodleExtensionDB", "Files", {
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



function storeData(dbName, storeName, value) {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(dbName, 1);
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction([storeName], "readwrite");
      const objectStore = transaction.objectStore(storeName);
      const objectStoreRequest = objectStore.put(value);
      objectStoreRequest.onsuccess = () => {
        resolve();
      };
      objectStoreRequest.onerror = (error) => {
        reject(error);
      };
    };
    request.onerror = (error) => {
      reject(error);
    };
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore(storeName, { keyPath: "id", autoIncrement: true });
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