/* global createAsyncApiMethods */

'use strict';

createAsyncApiMethods(chrome.tabs);

/* --------------------------------------- Context menus ---------------------------------------- */

chrome.contextMenus.create({
  id: 'downloadImage',
  title: 'Download image',
  contexts: ['image']
});
chrome.contextMenus.onClicked.addListener(downloadPostAsync);

chrome.contextMenus.create({
  id: 'downloadVideo',
  title: 'Download video',
  contexts: ['video']
});
chrome.contextMenus.onClicked.addListener(downloadPostAsync);


/* ----------------------------------------- Functions ------------------------------------------ */


async function downloadPostAsync() {
  const tabs = await chrome.tabs.queryAsync({ currentWindow: true, active: true });
  const mediaSource = await chrome.tabs.sendMessageAsync(tabs[0].id, 'getMediaSource');

  chrome.downloads.download({ url: mediaSource.url });
}
