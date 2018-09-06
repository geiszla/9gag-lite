'use strict'

let userOptions = defaultOptions;
chrome.storage.sync.get(defaultOptions, items => {
  userOptions = items;

  if (userOptions.isHideAds) {
    addStylesToDOM('styles/ads.css');
  }

  // Simplify layout
  if (userOptions.isSimplifyLayout) {
    addStylesToDOM('styles/simple.css');
  }

  // Change theme
  if (userOptions.theme === 'dark') {
    addStylesToDOM('styles/dark/theme.css');

    if (window.location.href.includes('/gag/')) {
      addStylesToDOM('styles/dark/comments.css');
    } else if (window.location.href.includes('/u/') || window.location.href.includes('/tag/')) {
      addStylesToDOM('styles/dark/listing.css');
    }
  }

  // Helper functions
  function addStylesToDOM(relativePath) {
    const stylesElement = document.createElement('link');
    stylesElement.rel = 'stylesheet';
    stylesElement.type = 'text/css';
    stylesElement.href = chrome.runtime.getURL(relativePath);

    document.head.appendChild(stylesElement);
  }
});
