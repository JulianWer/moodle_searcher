function getArrayOfCorrectPdfUrls(){
    let urls = new Array();
    const a = document.querySelectorAll("a.aalink");
    for (let i = 0; i < a.length; i++ ) {
        let regex = new RegExp("moodle.hs-mannheim.de/mod/resource"); 
        if(a[i].href.search(regex)>0){
            urls.push(a[i].href);
        }
    }
    return urls;
}
getArrayOfCorrectPdfUrls()
