'use strict'

const booleanOptions = [
  'isHideAds',
  'isHotLimit',
  'isTrendingLimit',
  'isSimplifyLayout',
  'isShowImages',
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
setupBehavior();

// Functions
function setupBehavior() {
  // Dynamic theme change
  document.getElementById('theme').addEventListener("change", ({ target }) => {
    changeTheme(target.value);
  });
  
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
  
  // At least one post type is always enabled
}

function saveOptions() {
  validateTypeFilter();

  // Get option values from the DOM
  const options = {}
  booleanOptions.forEach(option => options[option] = document.getElementById(option).checked);
  stringOptions.forEach(option => options[option] = document.getElementById(option).value);
  intOptions.forEach(option => options[option] = parseInt(document.getElementById(option).value, 10));

  chrome.storage.sync.set(options, () => {
    const status = document.getElementById('status');

    if (validateNumberInputs()) {
      status.style.color = '';
      status.textContent = 'Options saved.';
    } else {
      status.style.color = 'orange';
      status.textContent = 'Options saved (with warnings).';
    }
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

function validateNumberInputs() {
  const numberInputElements = document.querySelectorAll('input[type="number"]');

  let isAllValid = true;
  Array.prototype.forEach.call(numberInputElements, inputElement => {
    const isElementChecked = inputElement.id === 'hotLimitValue'
      && document.getElementById('isHotLimit').checked
      || inputElement.id === 'trendingLimitValue'
      && document.getElementById('isTrendingLimit').checked;

    const isValueValid = inputElement.max && parseInt(inputElement.value, 10) > inputElement.max
    || inputElement.min && parseInt(inputElement.value, 10) < inputElement.min;

    if (isElementChecked && isValueValid) {
        showWarning(true, inputElement);
        isAllValid = false;
    } else {
      showWarning(false, inputElement);
    }
  });

  return isAllValid;
}

function showWarning(isWarning, targetElement) {
  if (isWarning) {
    targetElement.style.backgroundColor = 'orange';
  } else {
    targetElement.style.backgroundColor = '';
  }
}

function validateTypeFilter() {
  const showImagesElement = document.getElementById('isShowImages');
  const showGifsElement = document.getElementById('isShowGifs');
  const showVideosElement = document.getElementById('isShowVideos');

  if (!showImagesElement.checked && !showGifsElement.checked && !showVideosElement.checked) {
    showImagesElement.checked = true;
  }
}
