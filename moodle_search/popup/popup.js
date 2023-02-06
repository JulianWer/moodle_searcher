const urlArray = null;

chrome.runtime.onMessage.addListener(gotMessage);
function gotMessage(message, sender, sendResponse){
    console.log(message.urls);
    urlArray = message.urls;
}

function dowloadAllPdfs(){
    for (let i = 0; i < urlArray.length; i++ ) {
        downloadPdf(urlArray[i]);
    }
}

function downloadPdf(url){
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.responseType = "blob";
    xhr.onload = function() {
        if(xhr.status && xhr.status === 200) {
            savePdf(xhr.response, "download_test");
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
