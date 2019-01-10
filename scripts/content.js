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
    try {
      const mediaSource = getMediaSource();
      sendResponse(mediaSource);
    } catch (error) {
      console.log('Media download error:');
      console.log(error);

      alert('This media cannot be downloaded. You can only download posts.');
    }
  }
});

function getMediaSource() {
  const sources = [];

  let sourceElements = clickedElement.getElementsByTagName('source');
  const isImage = sourceElements.length === 0;

  if (isImage) {
    // If it's an image, add its source URL to the sources...
    if (clickedElement.src) {
      const mediaFormat = new URL(clickedElement.src).pathname.split('.').pop();
      sources.push({ url: clickedElement.src, format: mediaFormat });
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

  // Download full resolution image
  if (isImage && userOptions.isDownloadBigImage) {
    mediaSource.url = mediaSource.url.replace('_460s', '_700b');
  }

  // Change file name to include date, and post type
  let name;
  if (userOptions.isChangeFileName) {
    const date = new Date();
    const dateString = date.getFullYear().toString().substr(-2)
      + date.getMonth().toString().padStart(2, '0')
      + date.getDate().toString().padStart(2, '0')
      + date.getHours().toString().padStart(2, '0')
      + date.getMinutes().toString().padStart(2, '0')
      + date.getSeconds().toString().padStart(2, '0');

    const postElement = clickedElement.closest('article');
    const postType = getPostType(postElement);
    const mediaFormat = new URL(mediaSource.url).pathname.split('.').pop();

    name = `${dateString}_${postType}.${mediaFormat}`;
  }

  return { ...mediaSource, name };
}


/* ---------------------------------------- Script start ---------------------------------------- */

const PostType = Object.freeze({
  IMAGE: 'image',
  GIF: 'gif',
  VIDEO: 'video',
  STANDALONE_VIDEO: 'stanalonevideo'
});

// Only start post modification, if a list view of posts exists
const containerElement = document.getElementById('container');
if (containerElement) {
  // Set up observer for script to run after AJAX page load
  createAddObserver(containerElement, (addedNode) => {
    if (addedNode.className && addedNode.className.includes('main-wrap')) {
      initialize(containerElement);
    }
  }, { childList: true, subtree: true });

  // Initialize script
  initialize(containerElement);
}

window.addEventListener('load', zoomIntoAvatars);


/* --------------------------------------- Main functions --------------------------------------- */

function initialize(rootElement) {
  const postListView = rootElement.querySelector('[id^="list-view"]');

  if (!postListView) {
    return;
  }

  // Observe post list for new post streams
  createAddObserver(postListView, (addedNode) => {
    if (addedNode.className && addedNode.className.includes('list-stream')) {
      fixStream(addedNode);
    }
  });

  // Stream #0 won't be readded on page change, only the articles in it change,
  // therefore we need an observer on that stream that looks for new articles
  const stream0 = postListView.children[0];
  createAddObserver(stream0, (addedNode) => {
    if (addedNode.tagName === 'ARTICLE') {
      fixStream(stream0);
    }
  }, { childList: true, subtree: true });

  // Fix initial post streams
  const initialStreamElements = postListView.querySelectorAll('[id^="stream-"]');
  [].forEach.call(initialStreamElements, (initialStream) => {
    fixStream(initialStream);
  });
}

function fixStream(streamElement) {
  const posts = Array.from(streamElement.getElementsByTagName('article'));

  // Filter post types
  for (let i = 0; i < posts.length; i++) {
    const postType = getPostType(posts[i]);

    if ((!userOptions.isShowImages && postType === PostType.IMAGE)
      || (!userOptions.isShowGifs && postType === PostType.GIF)
      || (!userOptions.isShowVideos && postType === PostType.VIDEO)
      || (userOptions.isHideStandaloneVideos && postType === PostType.STANDALONE_VIDEO)) {
      posts[i].style.display = 'none';
      posts.splice(i, 1);
      i--;
    } else {
      // If post is not filtered, do other modifications
      const videoElement = posts[i].getElementsByTagName('video')[0];

      if (videoElement) {
        fixVideo(videoElement, posts[i], postType);
      }
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

function fixVideo(videoElement, post, postType) {
  // Add video duration to the title
  if ((userOptions.isShowGIFDuration && postType === PostType.GIF)
    || (userOptions.isShowVideoDuration && postType === PostType.VIDEO)) {
    videoElement.addEventListener('loadedmetadata', () => addVideoDuration(videoElement, post));
  }

  // Don't autoplay videos
  if ((userOptions.isPreventGIFAutoplay && postType === PostType.GIF)
    || (userOptions.isPreventVideoAutoplay && postType === PostType.VIDEO)) {
    let isVideoClicked = false;

    videoElement.addEventListener('playing', () => {
      if (!isVideoClicked) {
        videoElement.pause();

        videoElement.addEventListener('click', () => {
          // After click, it should play as normal and don't pause again
          isVideoClicked = true;

          // Videos don't start by default when user clicks on it, so we need to start it ourselves
          if (postType === PostType.VIDEO) {
            videoElement.play();
          }
        });
      }
    });
  }
}

function addVideoDuration(videoElement, postElement) {
  const duration = new Date(0);
  duration.setSeconds(videoElement.duration);

  const seconds = duration.getSeconds().toString().padStart(2, '0');

  const durationText = ` (${`${duration.getMinutes()}:${seconds}`})`;
  postElement.querySelector('[data-evt*="PostTitle"]').children[0].textContent += durationText;
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


/* ----------------------------------- Avatar zoom functions ------------------------------------ */

function zoomIntoAvatars() {
  const commentContainer = document.querySelector('.comment-box + div');

  if (!commentContainer) {
    return;
  }

  const avatars = commentContainer.getElementsByClassName('avatar');

  // Observe for new comments loading dynamically
  createAddObserver(commentContainer, (addedNode) => {
    if (addedNode.tagName === 'DIV') {
      const commentElement = addedNode.getElementsByClassName('avatar');
      addAvatarTooltip(commentElement[0]);
    }
  }, { childList: true });

  // Apply avatar zoom to initial comments
  [].forEach.call(avatars, addAvatarTooltip);
}

function addAvatarTooltip(avatarElement) {
  let tooltip = avatarElement.querySelector('[class="lite-avatar"]');

  avatarElement.addEventListener('mouseenter', () => {
    const tooltipStyle = `
        position: absolute;
        top: -18%;
        left: -18%;

        width: auto;
        height: auto;

        z-index: 99;
      `;

    if (tooltip) {
      tooltip.style = tooltipStyle;
    } else {
      const avatarImage = avatarElement.getElementsByTagName('img')[0];

      tooltip = document.createElement('img');
      tooltip.src = avatarImage.src;
      tooltip.className = 'lite-avatar';
      tooltip.style = tooltipStyle;
      avatarImage.parentNode.appendChild(tooltip);
    }
  });

  avatarElement.addEventListener('mouseleave', () => {
    tooltip.style = 'display: none';
  });
}


/* -------------------------------------- Helper functions -------------------------------------- */

function getPostType(postElement) {
  let postType = PostType.IMAGE;

  if (!postElement.getElementsByClassName('post-meta')[0]) {
    postType = PostType.STANDALONE_VIDEO;
  } else if (postElement.getElementsByTagName('picture')[0]) {
    postType = PostType.IMAGE;
  } else if (postElement.getElementsByClassName('gif-post')[0]) {
    postType = PostType.GIF;
  } else if (postElement.getElementsByClassName('video-post')[0]) {
    postType = PostType.VIDEO;
  }

  return postType;
}

function createAddObserver(targetElement, callback, options = { childList: true }) {
  const observer = new MutationObserver((mutationsList) => {
    mutationsList.forEach((mutation) => {
      mutation.addedNodes.forEach((addedNode) => { callback(addedNode); });
    });
  });
  observer.observe(targetElement, options);

  return observer;
}
