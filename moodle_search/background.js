

// chrome.storage.local.set({key: "value"}, function() {
//     console.log("Data is stored in storage.");
//   });
//   chrome.storage.local.get(["key"], function(result) {
//     console.log("Value of key is: " + result.key);
//   });
console.log("background.js is running");
chrome.runtime.onMessage.addListener(gotMessage);

function gotMessage(message, sender, sendResponse){
    console.log(message.urls);
}