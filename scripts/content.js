/* global userOptions */

// Content script: Runs after the DOM is complete, but before subresources have loaded

'use strict';

/* --------------------------------- Background script helpers ---------------------------------- */

let clickedElement;

document.addEventListener('contextmenu', ({ target }) => {
  clickedElement = target;
});

chrome.runtime.onMessage.addListener((message) => {
  if (message === 'getMediaSources') {
    const sourceElements = clickedElement.getElementsByTagName('source');
    const sources = [].map.call(sourceElements, (element) => {
      let name = element.type.split('/')[1];
      const url = element.src;

      if (url.includes('svwm.webm')) {
        name += ' VP8 (older format)';
      }

      return { name, url };
    }).sort((first, second) => first.name.localeCompare(second.name));

    downloadFile(sources[0]);
    console.log(JSON.stringify(sources, null, 2));
  }
});

function downloadFile(source) {
  const link = document.createElement('a');
  link.download = '';
  link.href = source.url;
  console.log(link);
  link.click();
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
  const posts = Array.from(streamElement.querySelectorAll('article[id^="jsid-post-"]'));

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
