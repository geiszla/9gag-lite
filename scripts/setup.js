/* global addStylesToDOM, defaultOptions */

// Setup script: Runs after any files from css, but before any other DOM is constructed
// or any other script is run

'use strict';

let userOptions = defaultOptions;
chrome.storage.sync.get(defaultOptions, (items) => {
  userOptions = items;

  // Hide ads
  if (userOptions.isHideAds) {
    addStylesToDOM('styles/ads.css');

    // Simplify layout
    if (userOptions.isSimplifyLayout) {
      addStylesToDOM('styles/simple.css');
    }
  }

  // Change theme
  if (userOptions.theme !== 'default') {
    addStylesToDOM(`styles/${userOptions.theme}/theme.css`);
    addStylesToDOM(`styles/${userOptions.theme}/styles.css`);
    addStylesToDOM(`styles/${userOptions.theme}/listing.css`);

    if (window.location.href.includes('/gag/')) {
      addStylesToDOM(`styles/${userOptions.theme}/comments.css`);
    }
  }
});
