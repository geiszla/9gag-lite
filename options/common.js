/* global addStylesToDOM, createAsyncApiMethods, defaultOptions, reloadTabs */


/* -------------------------------------- Global constants -------------------------------------- */
const Theme = Object.freeze({
  DEFAULT: 'default',
  DARK: 'dark'
});
let previousTheme = Theme.DEFAULT;

const listIds = [];
const numberInputCheckboxIds = {
  hotLimitValue: 'isHotLimit',
  trendingLimitValue: 'isTrendingLimit'
};

let isPopup = false;


/* -------------------------------------- Setup and start --------------------------------------- */

createAsyncApiMethods(chrome.storage.sync);
createAsyncApiMethods(chrome.windows);
createAsyncApiMethods(chrome.tabs);

/* ------------------------------------- Exported functions ------------------------------------- */

export async function setupOptionsAsync(checkBehavior, isFromPopup) {
  isPopup = isFromPopup;

  // Get user options
  const userOptions = await chrome.storage.sync.getAsync(defaultOptions);

  // Chenage theme of options page if needed
  changeTheme(userOptions.theme);

  // Get current options on page by input type
  const optionIds = { checkbox: [], text: [], number: [] };
  [].forEach.call(document.getElementsByTagName('input'), (element) => {
    optionIds[element.type].push(element.id);
  });

  [].forEach.call(document.getElementsByTagName('select'), (element) => {
    optionIds.text.push(element.id);
  });

  // Restore saved options
  restoreOptionsAsync(optionIds, checkBehavior);

  // Save options on enter
  document.addEventListener('keypress', ({ code }) => {
    if (code === 'Enter') {
      saveOptionsAsync(optionIds);
    }
  });

  // Add event listeners
  document.getElementById('save').addEventListener('click', () => saveOptionsAsync(optionIds));
  document.getElementById('restore').addEventListener('click',
    () => restoreDefaultsAsync(optionIds));

  // Check behavior on checkbox state change
  [].forEach.call(document.querySelectorAll('input[type="checkbox"]'), (checkbox) => {
    checkbox.addEventListener('click', () => checkBehavior(userOptions));
  });
}

export function changeTheme(theme) {
  if (theme === previousTheme) {
    return;
  }

  // Remove existing styles
  const addedStyles = document.getElementsByClassName('9gag-lite-style');
  while (addedStyles.length > 0) {
    addedStyles[0].remove();
  }

  // Apply correct style
  if (theme !== 'default') {
    addStylesToDOM(`styles/${theme}/theme.css`);
    addStylesToDOM(`styles/${theme}/options.css`);
  }

  previousTheme = theme;
}

/* --------------------------------------- Main functions --------------------------------------- */

async function saveOptionsAsync(optionIds) {
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

  reloadTabs(isPopup);
}

async function restoreDefaultsAsync(optionIds, checkBehavior) {
  const confirmText = 'Do you want to restore all options to their default value?';
  const isContinueRestore = window.confirm(confirmText);

  if (isContinueRestore === true) {
    // Set chrome sync storage with default values
    await chrome.storage.sync.setAsync(defaultOptions);
    restoreOptionsAsync(optionIds);

    // Set status text
    const status = document.getElementById('status');
    status.textContent = 'Defaults restored.';
    setTimeout(() => { status.textContent = ''; }, 2000);

    changeTheme(defaultOptions.theme);
    checkBehavior(defaultOptions);
  }
}

async function restoreOptionsAsync(optionIds, checkBehavior) {
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

  checkBehavior(items);
}


/* -------------------------------------- Helper functions -------------------------------------- */

function validateNumberInputs() {
  const numberInputElements = document.querySelectorAll('input[type="number"]');

  let isAllValid = true;
  [].forEach.call(numberInputElements, (inputElement) => {
    const numberInputElement = document.getElementById(numberInputCheckboxIds[inputElement.id]);

    // If option is enabled
    if (numberInputElement.checked) {
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
