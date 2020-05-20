document.addEventListener('DOMContentLoaded', function() {
    var link = document.getElementById('clickme');
    link.addEventListener('click', function() {
	  chrome.tabs.executeScript({
	    file: 'main.js', matchAboutBlank: true
	  }); 
    });
});
