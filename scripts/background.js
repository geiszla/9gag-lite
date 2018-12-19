/* global createAsyncApiMethods, reloadTabs */

'use strict';


/* ------------------------------------------- Setup -------------------------------------------- */

reloadTabs();
createAsyncApiMethods(chrome.tabs);
createContextMenus();


/* --------------------------------------- Context menus ---------------------------------------- */

function createContextMenus() {
  chrome.contextMenus.removeAll();

  chrome.contextMenus.create({
    id: 'downloadImage',
    title: 'Download image',
    contexts: ['image']
  });
  chrome.contextMenus.onClicked.addListener(downloadPostAsync);

  chrome.contextMenus.create({
    id: 'downloadVideo',
    title: 'Download GIF/video',
    contexts: ['video']
  });
  chrome.contextMenus.onClicked.addListener(downloadPostAsync);
}


/* ----------------------------------------- Functions ------------------------------------------ */


async function downloadPostAsync() {
  const currentTabs = await chrome.tabs.queryAsync({ currentWindow: true, active: true });
  const mediaSource = await chrome.tabs.sendMessageAsync(currentTabs[0].id, 'getMediaSource');

  chrome.downloads.download({ url: mediaSource.url, filename: mediaSource.name });
}
