import { changeTheme, setupOptionsAsync } from './common.js';


/* ---------------------------------------- Set up page ----------------------------------------- */

setupOptionsAsync(checkBehavior);


/* ----------------------------------------- Functions ------------------------------------------ */

function checkBehavior(userOptions) {
  // Check the behavior of input HTML elements (e.g. disabled or not)
  changeTheme(userOptions.theme);
}
