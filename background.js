chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({
    text: 'OFF'
  });
});

const extension = 'https://'

// When the user clicks on the extension action
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.url.startsWith(extension) && !tab.url.startsWith("chrome://")) {
    // We retrieve the action badge to check if the extension is 'ON' or 'OFF'
    const prevState = await chrome.action.getBadgeText({ tabId: tab.id });
    // Next state will always be the opposite
    const nextState = prevState === 'ON' ? 'OFF' : 'ON';

    // Set the action badge to the next state
    await chrome.action.setBadgeText({
      tabId: tab.id,
      text: nextState
    });

    if (nextState === 'ON') {
      chrome.tabs.sendMessage(tab.id, { action: 'addDiv' });
    } else if (nextState === 'OFF') {
      chrome.tabs.sendMessage(tab.id, { action: 'removeDiv' });
    }
  }
});

//When the user clicks on the settings button
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "openSettings") {
    chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
  }
});