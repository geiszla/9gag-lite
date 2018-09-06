'use strict'

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('restore').addEventListener('click', restoreDefault);

// Hide ads is always enabled when layout is simplified
const simplifyLayoutElement = document.getElementById('simplify-layout');
document.getElementById('hide-ads').addEventListener('click', event => {
    if (!event.target.checked) {
      simplifyLayoutElement.checked = false;
      simplifyLayoutElement.disabled = true;
    } else {
      simplifyLayoutElement.disabled = false;
    }
})
simplifyLayoutElement.addEventListener('click', event => {
  if (event.target.checked) {
    document.getElementById('hide-ads').checked = true;
  }
})


// Helper functions
function saveOptions() {
  const theme = document.getElementById('theme').value;
  const isHideAds = document.getElementById('hide-ads').checked;
  const isBlockPromoted = document.getElementById('promoted').checked;
  const isHotLimit = document.getElementById('hot-limit').checked;
  const hotLimitValue = parseInt(document.getElementById('hot-limit-value').value, 10);
  const isTrendingLimit = document.getElementById('trending-limit').checked;
  const trendingLimitValue = parseInt(document.getElementById('trending-limit-value').value, 10);
  const isSimplifyLayout = document.getElementById('simplify-layout').checked;

  chrome.storage.sync.set({
    theme,
    isHideAds,
    isBlockPromoted,
    isHotLimit,
    hotLimitValue,
    isTrendingLimit,
    trendingLimitValue,
    isSimplifyLayout
  }, () => {
    const status = document.getElementById('status');

    status.textContent = 'Options saved.';
    setTimeout(() => status.textContent = '', 2000);

    reloadTabs();
  });
}

function restoreOptions() {
  chrome.storage.sync.get(defaultOptions, items => {
    document.getElementById('theme').value = items.theme;
    document.getElementById('hide-ads').checked = items.isHideAds;
    document.getElementById('promoted').checked = items.isBlockPromoted;
    document.getElementById('hot-limit').checked = items.isHotLimit;
    document.getElementById('hot-limit-value').value = items.hotLimitValue;
    document.getElementById('trending-limit').checked = items.isTrendingLimit;
    document.getElementById('trending-limit-value').value = items.trendingLimitValue;
    document.getElementById('simplify-layout').checked = items.isSimplifyLayout;
  });
}

function restoreDefault() {
  const isContinueRestore = confirm('Do you want to restore all options to their default value?');

  if (isContinueRestore === true) {
    chrome.storage.sync.set(defaultOptions, () => {
      restoreOptions();
      simplifyLayoutElement.disabled = false;

      const status = document.getElementById('status');
      status.textContent = 'Defaults restored.';
      setTimeout(() => status.textContent = '', 2000);

      reloadTabs();
    });
  }
}

function reloadTabs() {
  chrome.tabs.query({url: '*://*.9gag.com/*'}, matchingTabs => {
    matchingTabs.forEach(matchingTab => {
      chrome.tabs.reload(matchingTab.id);
    });
  });
}
