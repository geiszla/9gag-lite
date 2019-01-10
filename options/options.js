import { setupOptionsAsync } from './common.js';


/* ---------------------------------------- Set up page ----------------------------------------- */

setupOptionsAsync(checkBehavior);

setVersion();


/* ----------------------------------------- Functions ------------------------------------------ */

async function setVersion() {
  // Set version number in footer
  const response = (await fetch(chrome.runtime.getURL('manifest.json')));
  const manifest = await response.json();

  const versionElement = document.getElementById('version');
  if (versionElement) {
    document.getElementById('version').textContent = `v${manifest.version}`;
  }
}

function checkBehavior() {
  // Check the behavior of input HTML elements (e.g. disabled or not)
}
