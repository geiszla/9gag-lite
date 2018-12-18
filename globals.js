/* exported addStylesToDOM, createAsyncApiMethods, defaultOptions */

// Globals: Global variables and functions that are needed for both the options and the content.

'use strict';


/* ----------------------------------------- Variables ------------------------------------------ */

// Default option values
const defaultOptions = {
  // Personalization
  theme: 'dark',
  isHideAds: true,
  isSimplifyLayout: true,
  isHideStandaloneVideos: true,

  // Posts
  isHotLimit: false,
  hotLimitValue: 1000,
  isTrendingLimit: false,
  trendingLimitValue: 500,

  // Post types
  isShowImages: true,
  isShowGifs: true,
  isShowVideos: true
};


/* ----------------------------------------- Functions ------------------------------------------ */

function addStylesToDOM(relativePath) {
  const stylesElement = document.createElement('link');
  stylesElement.rel = 'stylesheet';
  stylesElement.type = 'text/css';
  stylesElement.href = chrome.runtime.getURL(relativePath);
  stylesElement.className = '9gag-lite-style';

  document.head.appendChild(stylesElement);
}

/* eslint no-param-reassign: 0 */
// Add async versions of the chrome API methods to the API object
function createAsyncApiMethods(functionsObject) {
  Object.keys(functionsObject).forEach((functionName) => {
    if (!functionName.startsWith('on')) {
      functionsObject[`${functionName}Async`] = (...args) => new Promise((resolve) => {
        functionsObject[functionName](...args, (response) => {
          if (!chrome.runtime.lastError) {
            resolve(response);
          }
        });
      });
    }
  });
}
