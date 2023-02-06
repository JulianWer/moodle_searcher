if (typeof browser === "undefined") {
  var browser = chrome;
}
chrome.runtime.onMessage.addListener(
    function(message, sender, sendResponse) {
        switch(message.name){
            case "searchMessage":
                break;
            case "reloadMessage":
                dowloadAllPdfs(getArrayOfCorrectPdfUrls());            
                break;
            default:
                console.error("Message not found");
        }
        sendResponse();
    }
  );
  
  function getArrayOfCorrectPdfUrls(){
      let urls = new Array();
      const a = document.querySelectorAll("a.aalink");
      for (let i = 0; i < a.length; i++ ) {
          let regex = new RegExp("moodle.hs-mannheim.de/mod/resource"); 
        if(a[i].href.search(regex)>0){
            urls.push({link:a[i].href, key:a[i].innerText});//TODO add Title to key
        }
    }
    return urls;
}

function dowloadAllPdfs(urls){
  console.log(urls);
  for (let i of urls) {
      downloadPdf(i);
  }
}

function downloadPdf(url){
  var xhr = new XMLHttpRequest();
  console.log(url);
  xhr.open("GET", url.link);
  xhr.responseType = "blob";
  xhr.onload = function() {
      if(xhr.status && xhr.status === 200) {
          savePdf(xhr.response, "moodle_pdf:"+url.key);
      } 
  }
  xhr.send();
}


function savePdf(pdf, key) {
  var fileReader = new FileReader();

  fileReader.onload = function (evt) {
      var result = evt.target.result;

      try {
          localStorage.setItem(key, result);
      } catch (e) {
          console.log("Storage failed: " + e);
      }
  };

  fileReader.readAsDataURL(pdf);
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