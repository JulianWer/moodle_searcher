// for cross browser support
let _browser = typeof browser === "undefined" ? chrome : browser;


_browser.runtime.onMessage.addListener(
  async(message, _, sendResponse) => {
    switch (message.name) {
      case "reloadMessage":
        console.log( await getArrayOfCorrectPdfUrls());
        sendMessage("downloadSubject", { subject: getHeading(), files: await getArrayOfCorrectPdfUrls() });
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
  const links = Array.from(document.querySelectorAll("a.aalink.stretched-link"));
  //const regex = new RegExp("moodle.hs-mannheim.de/mod/resource");
 
  function isLinkToPDF(a) {
    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open('HEAD', a.href, true);

      xhr.onload = function () {
        var contentType = xhr.getResponseHeader('Content-Type');
        var bool = contentType === 'application/pdf';
        resolve(bool);
      };

      xhr.onerror = function () {
        reject(new Error('Network error'));
      };

      xhr.send();
    });
  }
  function formatLink(a) {
    return {
      url: a.href,
      key: a.innerText
    }
  }
  return Promise.all(links.map(function (link) {
    return isLinkToPDF(link).then(function (bool) {
      return bool ? formatLink(link) : null;
    });
  })).then(function (filteredLinks) {
    return filteredLinks.filter(function (link) {
      return link !== null;
    });
  });
}

function sendMessage(name, data = {}, response_handler = null) {
  data.name = name;
  _browser.runtime.sendMessage(data, response_handler);
}
