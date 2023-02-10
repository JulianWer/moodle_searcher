// for cross browser support
let _browser = typeof browser === "undefined" ? chrome : browser;


_browser.runtime.onMessage.addListener(
  (message, _, sendResponse) => {
    switch (message.name) {
      case "reloadMessage":
        let heading = getHeading();
        let urls = getArrayOfCorrectPdfUrls();
        sendMessage("downloadSubject", {subject: heading, urls: urls});  
        break;
      default:
        console.error("Message not found");
    }
  }
);

function getHeading() {
  const heading = document.querySelector(".page-header-headings");
  return (heading && heading.childElementCount > 0)
    ? heading.firstChild.innerText
    : "no heading";
}

function getArrayOfCorrectPdfUrls() {
  const links = Array.from(document.querySelectorAll("a.aalink"));
  const regex = new RegExp("moodle.hs-mannheim.de/mod/resource");
  function isLink(a) {
    return a.href.search(regex) > 0;
  }
  function formatLink(a) {
    return {
      link: a.href,
      key: a.innerText
    }
  }
  return links.filter(isLink).map(formatLink);
}

function sendMessage(name, data = {}, response_handler = null){    
  data.name = name;
  _browser.runtime.sendMessage(data, response_handler);
}

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

