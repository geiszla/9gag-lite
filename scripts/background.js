'use strict';

chrome.contextMenus.create({
  id: 'download',
  title: 'Download Post',
  contexts: ['image', 'video']
});
chrome.contextMenus.onClicked.addListener(downloadPost);

function downloadPost() {
  chrome.tabs.query({ currentWindow: true, active: true },
    tabs => chrome.tabs.sendMessage(tabs[0].id, 'getMediaSources'));
}
