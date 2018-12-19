/* global addStylesToDOM, createAsyncApiMethods, defaultOptions, reloadTabs */


/* -------------------------------------- Global constants -------------------------------------- */

const themeSelector = document.getElementById('theme');
const hideAdsCheckbox = document.getElementById('isHideAds');
const simplifyLayoutCheckbox = document.getElementById('isSimplifyLayout');

const hotLimitCheckbox = document.getElementById('isHotLimit');
const hotLimitNumberInput = document.getElementById('hotLimitValue');
const trendingLimitCheckbox = document.getElementById('isTrendingLimit');
const trendingLimitNumberInput = document.getElementById('trendingLimitValue');

const themes = Object.freeze({
  DEFAULT: 'default',
  DARK: 'dark'
});
let previousTheme = themes.DEFAULT;

const listIds = [];


/* -------------------------------------- Setup and start --------------------------------------- */

createAsyncApiMethods(chrome.storage.sync);
createAsyncApiMethods(chrome.windows);
createAsyncApiMethods(chrome.tabs);

setupOptions();


/* ------------------------------------- Element behaviors -------------------------------------- */

function setupOptions() {
  // Get current options on page by input type
  const optionIds = { checkbox: [], text: [], number: [] };
  [].forEach.call(document.getElementsByTagName('input'), (element) => {
    optionIds[element.type].push(element.id);
  });

  [].forEach.call(document.getElementsByTagName('select'), (element) => {
    optionIds.text.push(element.id);
  });

  // Save options on enter
  document.addEventListener('keypress', ({ code }) => {
    if (code === 'Enter') {
      saveOptionsAsync(optionIds);
    }
  });

  // Add event listeners
  document.addEventListener('DOMContentLoaded', () => restoreOptionsAsync(optionIds));
  document.getElementById('save').addEventListener('click', () => saveOptionsAsync(optionIds));
  document.getElementById('restore').addEventListener('click',
    () => restoreDefaultsAsync(optionIds));

  // Check behavior on checkbox state change
  [].forEach.call(document.querySelectorAll('input[type="checkbox"]'), (checkbox) => {
    checkbox.addEventListener('click', () => checkOptions());
  });

  // Change theme of options window when theme is changed
  themeSelector.addEventListener('change', () => { changeTheme(themeSelector.value); });
}

function checkOptions() {
  // Disable checkboxes if they can't be used
  simplifyLayoutCheckbox.disabled = !hideAdsCheckbox.checked;
  hotLimitNumberInput.disabled = !hotLimitCheckbox.checked;
  trendingLimitNumberInput.disabled = !trendingLimitCheckbox.checked;

  changeTheme(themeSelector.value);
  validateTypeFilter();
}

/* --------------------------------------- Main functions --------------------------------------- */

async function saveOptionsAsync(optionIds) {
  validateTypeFilter();

  // Get option values from the DOM
  const options = {};

  // Boolean
  optionIds.checkbox.forEach((id) => {
    options[id] = document.getElementById(id).checked;
  });

  // String
  optionIds.text.forEach((id) => {
    const optionValue = document.getElementById(id).value;
    options[id] = listIds.includes(id) ? optionValue.split(',').map(element => element.trim())
      : optionValue;
  });

  // Number
  optionIds.number.forEach((id) => {
    options[id] = parseFloat(document.getElementById(id).value);
  });

  // Save them to chrome sync storage
  await chrome.storage.sync.setAsync(options);

  // Set status text and color
  const status = document.getElementById('status');

  if (validateNumberInputs()) {
    status.style.color = '';
    status.textContent = 'Options saved';
  } else {
    status.style.color = 'orange';
    status.textContent = 'Options saved (with warnings)';
  }
  setTimeout(() => { status.textContent = ''; }, 2000);

  reloadTabs();
}

async function restoreDefaultsAsync(optionIds) {
  const confirmText = 'Do you want to restore all options to their default value?';
  const isContinueRestore = window.confirm(confirmText);

  if (isContinueRestore === true) {
    const restoredOptions = {};
    // Only restore options on the current page (either popup or more options page)
    Object.keys(defaultOptions).forEach((option) => {
      if (Object.keys(optionIds).some(id => optionIds[id].includes(option))) {
        restoredOptions[option] = defaultOptions[option];
      }
    });

    // Set chrome sync storage with default values
    await chrome.storage.sync.setAsync(restoredOptions);
    restoreOptionsAsync(optionIds);

    // Set status text
    const status = document.getElementById('status');
    status.textContent = 'Defaults restored.';
    setTimeout(() => { status.textContent = ''; }, 2000);

    reloadTabs();
  }
}

async function restoreOptionsAsync(optionIds) {
  // Get options from chrome sync storage
  const items = await chrome.storage.sync.getAsync(defaultOptions);

  // Apply boolean options (to "checked" property)
  optionIds.checkbox.forEach((option) => {
    document.getElementById(option).checked = items[option];
  });

  // Apply string and number options (to "value" property)
  const valueOptions = optionIds.text.concat(optionIds.number);
  valueOptions.forEach((option) => {
    const optionValue = listIds.includes(option) ? items[option].join(', ') : items[option];
    document.getElementById(option).value = optionValue;
  });

  checkOptions(items);
}


/* -------------------------------------- Helper functions -------------------------------------- */

function validateNumberInputs() {
  const numberInputElements = document.querySelectorAll('input[type="number"]');

  let isAllValid = true;
  Array.prototype.forEach.call(numberInputElements, (inputElement) => {
    const isElementChecked = (inputElement.id === 'hotLimitValue' && hotLimitCheckbox.checked)
      || (inputElement.id === 'trendingLimitValue' && trendingLimitCheckbox.checked);

    // If option is enabled
    if (isElementChecked) {
      let isValueValid;
      // Check minimum of number input
      if (inputElement.min) {
        const minValue = parseInt(inputElement.min, 10);
        isValueValid = parseInt(inputElement.value, 10) >= minValue;
      }

      // Check maximumof number input
      if (inputElement.max) {
        const maxValue = parseInt(inputElement.max, 10);
        isValueValid = parseInt(inputElement.value, 10) <= maxValue;
      }

      if (!isValueValid) {
        isAllValid = false;
        showWarning(true, inputElement);
      } else {
        showWarning(false, inputElement);
      }
    }
  });

  return isAllValid;
}

/* eslint no-param-reassign: 0 */
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

  // At least one must be checked
  if (!showImagesElement.checked && !showGifsElement.checked && !showVideosElement.checked) {
    showImagesElement.checked = true;
  }
}

function changeTheme(theme) {
  if (theme === previousTheme) {
    return;
  }

  // Remove existing styles
  const addedStyles = document.getElementsByClassName('9gag-lite-style');
  Array.prototype.forEach.call(addedStyles, styleElement => styleElement.remove());

  // Apply correct style
  if (theme !== 'default') {
    addStylesToDOM(`styles/${theme}/theme.css`);
    addStylesToDOM(`styles/${theme}/options.css`);
  }

  previousTheme = theme;
}
