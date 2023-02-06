// for cross browser support
let _browser = typeof browser === "undefined" ? chrome : browser;

document.getElementById("reload_button").addEventListener("click", () => sendMessage("reloadMessage"));
document.getElementById("search_button").addEventListener("click", () => sendMessage("searchMessage", {query: getQuery()}, showPdf));


function showPdf(response){
    // TODO doesnt work, yet
    let pdf = response.pdf;    
    let page = response.page;
    let iframe_container = document.getElementById("iframe_container");
    console.log(iframe_container);
    let blob = new Blob([pdf], {type: 'application/pdf'});
    let blobURL = URL.createObjectURL(blob);
    //blobURL = "https://moodle.hs-mannheim.de/pluginfile.php/353156/mod_resource/content/2/FlippedClassroom.pdf";
    iframe_container.innerHTML = '<iframe src="'+ blobURL +'" width="100%" height="500px">';
}

function sendMessage(name, data = {}, response_handler = null){    
    _browser.tabs.query({active: true, lastFocusedWindow: true}, (tabs) => {
        data["name"] = name;
        _browser.tabs.sendMessage(tabs[0].id, data, response_handler);        
    });
    
}

function getQuery(){
    return document.getElementById("search_input").value;
}