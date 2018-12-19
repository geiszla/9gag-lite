/* global userOptions */

// Content script: Runs after the DOM is complete, but before subresources have loaded

'use strict';

/* --------------------------------- Background script helpers ---------------------------------- */

let clickedElement;

document.addEventListener('contextmenu', ({ target }) => {
  clickedElement = target;
});

chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  if (message === 'getMediaSource') {
    // Get source url and the format of the clicked media
    const mediaSource = getMediaSource();
    sendResponse(mediaSource);
  }
});

function getMediaSource() {
  const sources = [];

  let sourceElements = clickedElement.getElementsByTagName('source');
  const isImage = sourceElements.length === 0;

  if (isImage) {
    // If it's an image, add its source URL to the sources...
    if (clickedElement.src) {
      const currentFormat = new URL(clickedElement.src).pathname.split('.').pop();
      sources.push({ url: clickedElement.src, format: currentFormat });
    }

    // ...and set sources to its sibling source elements
    sourceElements = clickedElement.parentNode.getElementsByTagName('source');
  }

  // Iterate through the source elements and parse the sources from them
  [].forEach.call(sourceElements, (element) => {
    let format = element.type.split('/')[1];
    const url = element.src || element.srcset;

    // If it's a webm, add the correct sub-format string at the end
    if (url.includes('svwm.webm')) {
      format += 'Vp8';
    } else if (url.includes('svvp9.webm')) {
      format += 'Vp9';
    }

    sources.push({ url, format });
  });

  // Get the preferred format from user options and select the correct source based on that
  const preferredFormat = isImage ? userOptions.downloadImageFormat
    : userOptions.downloadVideoFormat;
  const mediaSource = sources.find(source => source.format === preferredFormat) || sources[0];

  return mediaSource;
}


/* ---------------------------------------- Script start ---------------------------------------- */

// Set up observer for script to run after AJAX page load
const pageLoadObserver = new MutationObserver((mutationsList) => {
  mutationsList.forEach((mutation) => {
    mutation.addedNodes.forEach((addedNode) => {
      if (addedNode.className && addedNode.className.includes('main-wrap')) {
        initialize();
      }
    });
  });
});

const containerElement = document.getElementById('container');
if (containerElement) {
  pageLoadObserver.observe(containerElement, { childList: true, subtree: true });
}

// Initialize script
initialize();


/* --------------------------------------- Main functions --------------------------------------- */

// Functions
function initialize() {
  const postListView = document.querySelector('[id^="list-view"]');

  if (postListView) {
    // Fix initial post streams
    const initialStreamElements = postListView.querySelectorAll('[id^="stream-"]');
    Array.prototype.forEach.call(initialStreamElements, (initialStream) => {
      fixPosts(initialStream);
    });

    // Fix streams as they loaded dynamically when page is scrolled
    const streamObserver = new MutationObserver((mutationsList) => {
      mutationsList.forEach(mutation => fixPosts(mutation.target));
    });
    streamObserver.observe(postListView, { childList: true });
  }
}

function fixPosts(streamElement) {
  const posts = Array.from(streamElement.getElementsByTagName('article'));

  // Filter post types
  for (let i = 0; i < posts.length; i++) {
    if ((!userOptions.isShowImages && posts[i].getElementsByTagName('picture')[0])
      || (!userOptions.isShowGifs && posts[i].getElementsByClassName('gif-post')[0])
      || (!userOptions.isShowVideos && posts[i].getElementsByClassName('video-post')[0])
      || (userOptions.isHideStandaloneVideos && !posts[i].getElementsByClassName('post-meta')[0])) {
      posts[i].style.display = 'none';
      posts.splice(i, 1);
      i--;
    }
  }

  // Page specific fixes
  const currentUrl = window.location.href;

  if (userOptions.isHotLimit && (currentUrl.endsWith('9gag.com/') || currentUrl.includes('/hot'))) {
    // HOT page: Remove posts with less points than limit
    hidePostsOutOfLimit(posts, userOptions.hotLimitValue);
  } else if (userOptions.isTrendingLimit && currentUrl.includes('/trending')) {
    // TRENDING page: Remove posts with less points than limit
    hidePostsOutOfLimit(posts, userOptions.trendingLimitValue);
  }
}

/* eslint no-param-reassign: 0 */
function hidePostsOutOfLimit(posts, pointLimit) {
  posts.forEach((post) => {
    const pointString = post.getElementsByClassName('point')[0].textContent;
    const pointMatch = /([0-9,]+).*points/.exec(pointString);

    if (pointMatch.length > 1) {
      const pointCount = parseInt(pointMatch[1].replace(',', ''), 10);

      if (pointCount < pointLimit) {
        post.style.display = 'none';
      }
    }
  });
}
