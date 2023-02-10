// for cross browser support
let _browser = typeof browser === "undefined" ? chrome : browser;


_browser.runtime.onMessage.addListener(
  (message, _, sendResponse) => {
    switch (message.name) {
      case "reloadMessage":
        sendMessage("downloadSubject", { subject: getHeading(), files: getArrayOfCorrectPdfUrls() });
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
  function isLinkToPDF(a) {
    function childIsPdfImg(child) {
      return child.nodeName === "IMG" && child.src.includes("pdf-24");
    }
    return childIsPdfImg(a.firstChild) && a.href.search(regex) > 0;
  }
  function formatLink(a) {
    return {
      url: a.href,
      key: a.innerText
    }
  }
  return links.filter(isLinkToPDF).map(formatLink);
}

function sendMessage(name, data = {}, response_handler = null) {
  data.name = name;
  _browser.runtime.sendMessage(data, response_handler);
}
