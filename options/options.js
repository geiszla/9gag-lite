'use strict'

const booleanOptions = [
  'isHideAds',
  'isHotLimit',
  'isTrendingLimit',
  'isSimplifyLayout',
  'isShowGifs',
  'isShowVideos'
];

const stringOptions = [
  'theme'
]

const intOptions = [
  'hotLimitValue',
  'trendingLimitValue'
]

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('restore').addEventListener('click', restoreDefault);

// Hide ads is always enabled when layout is simplified
const simplifyLayoutElement = document.getElementById('isSimplifyLayout');
document.getElementById('isHideAds').addEventListener('click', ({ target }) => {
    if (!target.checked) {
      simplifyLayoutElement.checked = false;
      simplifyLayoutElement.disabled = true;
    } else {
      simplifyLayoutElement.disabled = false;
    }
})
simplifyLayoutElement.addEventListener('click', ({ target }) => {
  if (target.checked) {
    document.getElementById('isHideAds').checked = true;
  }
})

// Dynamic theme change
document.getElementById('theme').addEventListener("change", ({ target }) => {
  changeTheme(target.value);
});

// Functions
function saveOptions() {
  // Get option values from the DOM
  const options = {}
  booleanOptions.forEach(option => options[option] = document.getElementById(option).checked);
  stringOptions.forEach(option => options[option] = document.getElementById(option).value);
  intOptions.forEach(option => options[option] = parseInt(document.getElementById(option).value, 10));

  chrome.storage.sync.set(options, () => {
    const status = document.getElementById('status');

    status.textContent = 'Options saved.';
    setTimeout(() => status.textContent = '', 2000);

    reloadTabs();
  });
}

function restoreOptions() {
  chrome.storage.sync.get(defaultOptions, items => {
    // Apply boolean options (to checked property)
    booleanOptions.forEach(option => document.getElementById(option).checked = items[option]);

    // Apply string and int options (to value property)
    const valueOptions = stringOptions.concat(intOptions);
    valueOptions.forEach(option => document.getElementById(option).value = items[option]);

    changeTheme(items.theme);
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

function changeTheme(theme) {
  const addedStyles = document.getElementsByClassName('9gag-lite-style');

  Array.prototype.forEach.call(addedStyles, styleElement => {
    styleElement.remove();
  });

  if (theme !== 'default') {
    addStylesToDOM(`styles/${theme}/theme.css`);
    addStylesToDOM(`styles/${theme}/options.css`);
  }
}
