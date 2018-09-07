// Global variables and functions that is needed for both the options and the content.

// Functions
function addStylesToDOM(relativePath) {
  const stylesElement = document.createElement('link');
  stylesElement.rel = 'stylesheet';
  stylesElement.type = 'text/css';
  stylesElement.href = chrome.runtime.getURL(relativePath);
  stylesElement.className = '9gag-lite-style';

  document.head.appendChild(stylesElement);
}
