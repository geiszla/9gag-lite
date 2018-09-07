'use strict'

// Set up observer for script to run after AJAX page load
const pageLoadObserver = new MutationObserver(mutationsList => {
  mutationsList.forEach(mutation => {
    mutation.addedNodes.forEach(addedNode => {
      if (addedNode.className && addedNode.className.includes('main-wrap')) {
        initialize();
      }
    })
  });
});

const containerElement = document.getElementById('container');
if (containerElement) {
  pageLoadObserver.observe(containerElement, {childList: true, subtree: true});
}

// Initialize script
initialize();

// Functions
function initialize() {
  const postListView = document.querySelector('[id^="list-view"]');

  if (postListView) {
    // Fix initial post streams
    const initialStreamElements = postListView.querySelectorAll('[id^="stream-"]');
    Array.prototype.forEach.call(initialStreamElements, initialStream => {
      fixPosts(initialStream);
    });

    // Fix streams as they loaded dynamically when page is scrolled
    const streamObserver = new MutationObserver(mutationsList => {
      mutationsList.forEach(mutation => fixPosts(mutation.target));
    });
    streamObserver.observe(postListView, {childList: true});
  }
}

function fixPosts(streamElement) {
  const posts = Array.from(streamElement.querySelectorAll('article[id^="jsid-post-"]'));

  // Filter post types
  for (let i = 0; i < posts.length; i++) {
    if (!userOptions.isShowImages && posts[i].getElementsByTagName('picture')[0]
      || !userOptions.isShowGifs && posts[i].getElementsByClassName('gif-post')[0]
      || !userOptions.isShowVideos && posts[i].getElementsByClassName('video-post')[0]) {
      posts[i].style.display = 'none';
      posts.splice(i, 1);
      i--;
    }
  }

  // Page specific fixes
  const currentUrl = window.location.href;

  if (userOptions.isHotLimit && (currentUrl.endsWith('9gag.com/') || currentUrl.includes('/hot'))) {
    // HOT page: Remove posts with less than 1000 points
    hidePosts(posts, userOptions.hotLimitValue)
  } else if (userOptions.isTrendingLimit && currentUrl.includes('/trending')) {
    // TRENDING page: Remove posts with less than 500 points
    hidePosts(posts, userOptions.trendingLimitValue);
  }
}

function hidePosts(posts, pointLimit) {
  posts.forEach(post => {
    const pointString = post.getElementsByClassName('point')[0].textContent;
    const pointRegex = /([0-9,]+).*points/;
    const pointMatch = pointRegex.exec(pointString);

    if (pointMatch.length > 1) {
      const pointCount = parseInt(pointMatch[1].replace(',', ''), 10);

      if (pointCount < pointLimit) {
        post.style.display = 'none';
      }
    }
  });
}
