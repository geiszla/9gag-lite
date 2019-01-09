/* eslint no-param-reassign: 0 */

import { changeTheme, setupOptionsAsync } from './common.js';

// Elements
const themeSelector = document.getElementById('theme');
const hideAdsCheckbox = document.getElementById('isHideAds');
const simplifyLayoutCheckbox = document.getElementById('isSimplifyLayout');

const hotLimitCheckbox = document.getElementById('isHotLimit');
const hotLimitNumberInput = document.getElementById('hotLimitValue');
const trendingLimitCheckbox = document.getElementById('isTrendingLimit');
const trendingLimitNumberInput = document.getElementById('trendingLimitValue');

// Set up page
document.getElementById('more').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// Change theme of options window when theme is changed
themeSelector.addEventListener('change', () => { changeTheme(themeSelector.value); });

setupOptionsAsync(checkBehavior, true);

// Functions
function checkBehavior(userOptions) {
  // Disable checkboxes if they can't be used
  simplifyLayoutCheckbox.disabled = !hideAdsCheckbox.checked;
  hotLimitNumberInput.disabled = !hotLimitCheckbox.checked;
  trendingLimitNumberInput.disabled = !trendingLimitCheckbox.checked;

  validateTypeFilter();
  changeTheme(userOptions.theme);
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
