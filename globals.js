/* exported addStylesToDOM, createAsyncApiMethods, defaultOptions, reloadTabs */

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
  isShowVideos: true,

  // Download format
  downloadImageFormat: 'jpg',
  downloadVideoFormat: 'mp4',
  isChangeFileName: true
};


/* ----------------------------------------- Functions ------------------------------------------ */

async function reloadTabs() {
  chrome.tabs.query({ lastFocusedWindow: true, active: true }, (activeTabs) => {
    const currentTab = activeTabs[0];

    chrome.windows.getAll({ populate: true }, (windows) => {
      let enabledTabs = [];

      windows.forEach((window) => {
        const currentEnabledTabs = window.tabs.filter((tab) => {
        // Don't reload current extension tab
          const isCurrentTab = currentTab && currentTab.id === tab.id;
          const tabUrl = new URL(tab.url);

          return tabUrl.hostname.includes('9gag.com')
          || (!isCurrentTab && tab.url.includes(`chrome-extension://${chrome.runtime.id}`));
        });

        enabledTabs = enabledTabs.concat(currentEnabledTabs);
      });

      enabledTabs.forEach((tab) => { chrome.tabs.reload(tab.id); });
    });
  });
}

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
