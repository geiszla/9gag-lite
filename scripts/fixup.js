// Fixes for after the content is loaded
'use strict'

// Load more posts if the initial streams contain less than what fits on screen
setTimeout(() => {
  const html = document.documentElement;
  if (html.scrollHeight <= html.clientHeight) {
    const body = document.body;

    // Make body height bigger, then scroll down to the bottom to trigger post loading
    body.style.height = body.clientHeight + 5 + 'px';
    window.scrollTo(0, body.scrollHeight);
    body.style.height = '';
  }
}, 1500);
