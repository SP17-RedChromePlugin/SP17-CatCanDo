chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({
    text: 'OFF'
  });
});

const extension = 'https://'

// When the user clicks on the extension action
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.url.startsWith(extension) && !tab.url.startsWith("chrome://")) {
    //retrieve the action badge to check if the extension is 'ON' or 'OFF'
    const prevState = await chrome.action.getBadgeText({ tabId: tab.id });
    // next state will always be the opposite
    const nextState = prevState === 'ON' ? 'OFF' : 'ON';

    //set the action badge to the next state
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

/*
---Time tracking---
*/

let activeURL = null;
let timeSpent = {};
let tabDomains = {}; // Store tab domain information
let tabStartTimes = {}; //Stores time that the tab was opened
let totalTime = {}; //Stores total time spent on a website
let totalTimeEachDay = {}; //Stores the totalTime object for each day, for a week. Will have seven objects, one for each day of the week
let currentDay = null; //Stores the current date

//Postprocess domain names
function processDomain(input) {
  if (input) {
    console.log(input);
    var parseInput = input.split('.');
    if (parseInput.length > 2) {
      return parseInput[1];
    } else if (parseInput.length == 1 || parseInput.length == 2) {
      return parseInput[0];
    } else {
      return input;
    }
  }
  return 'null';
}

//listen for window focus change
chrome.windows.onFocusChanged.addListener(windowId => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
      console.log("User is inactive");
  } else {
    console.log("User is back.")
  }
});

// Detect navigation
chrome.webNavigation.onCompleted.addListener(function(details) {
  if (details.frameId === 0) {  // Main frame only
    chrome.tabs.get(details.tabId, function(tab) {
        // Extract the hostname from the URL
        let url = new URL(tab.url);
        let domain = processDomain(url.hostname);

        // Log the website domain
        tabDomains[details.tabId] = domain;
        tabStartTimes[details.tabId] = new Date();
        console.log("New website opened:", domain);
        console.log("Website opened at: ", tabStartTimes[details.tabId]);
    });
  }
});

//When a tab is updated, like moving to a new page
chrome.webNavigation.onBeforeNavigate.addListener(function(details) {
  if (details.frameId === 0) {
    let currentDomain = tabDomains[details.tabId]; // Get the current domain for this tab
    let newUrl = new URL(details.url);
    let newDomain = processDomain(newUrl.hostname);

    if (currentDomain) {
      console.log("Domain changed from:", currentDomain, "to:", newDomain);
      let currentDate = new Date();
      let dateDifference = currentDate - tabStartTimes[details.tabId];
      if (totalTime[currentDomain] == null) {
        totalTime[currentDomain] = 0;
      }
      totalTime[currentDomain] += dateDifference / (1000); //converting milliseconds to seconds
      tabDomains[details.tabId] = newDomain;
      tabStartTimes[details.tabId] = currentDate;
      totalTimeEachDay[currentDay.getDay()] = totalTime;
      console.log("Time spent on that website: ", totalTime[currentDomain]);
    }
  }
});

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
  let domain = tabDomains[tabId]; // Get the stored domain for the closed tab
  if (domain) {
    console.log("Tab closed:", domain);
    let currentDate = new Date();
    let dateDifference = currentDate - tabStartTimes[tabId];
    if (totalTime[domain] == null) {
      totalTime[domain] = 0;
    }
    totalTime[domain] += dateDifference / (1000); //converting milliseconds to seconds
    totalTimeEachDay[currentDay.getDay()] = totalTime;
    console.log("Time spent on that website: ", totalTime[domain]);
    delete tabDomains[tabId]; // Clean up the stored info
    delete tabStartTimes[tabId];
    saveTimeData();
  }
});

//If a message is received, this function runs
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getTotalTime') {
    sendResponse(totalTime); // Send the totalTime object as the response
  }
  if (message.action === 'getTotalTimeEachDay') {
    sendResponse(totalTimeEachDay); // Send the totalTimeEachDay object as the response
  }
});

function saveTimeData() {
  //totalTime = {}; //to clear data
  chrome.storage.local.set({ totalTime: totalTime }, function() {
      console.log('Time spent data saved', totalTime);
  });
  chrome.storage.local.set({ currentDay: currentDay.toISOString() }, function() {
    console.log('Current day saved', currentDay);
  });
  chrome.storage.local.set({ totalTimeEachDay: totalTimeEachDay }, function() {
    console.log('Time spent each day for past week saved', totalTimeEachDay);
  });
}

function loadTimeData() {
  currentDay = new Date();
  chrome.storage.local.get('totalTime', function(result) {
      if (result.totalTime) {
        totalTime = result.totalTime;
        console.log("TotalTime, ", totalTime);
      }
  });
  chrome.storage.local.get('totalTimeEachDay', function(result) {
    if (result.totalTimeEachDay) {
      totalTimeEachDay = result.totalTimeEachDay;
      console.log("TotalTimeEachDay, ", totalTimeEachDay);
    }
  });
  chrome.storage.local.get('currentDay', function(result) {
    if (result.currentDay) {
      result.currentDay = new Date(result.currentDay);
      console.log("Previous day, ", result.currentDay);
      console.log("Current day, ", currentDay);

      if (result.currentDay instanceof Date && !isNaN(result.currentDay) && result.currentDay.getDay() != currentDay.getDay()) {
        console.log("New day, resetting time data");
        //If there are multiple days in between result.currentDay and currentDay, set the totalTimeEachDay object to null
        for (let day = result.currentDay.getDay() + 1; day < currentDay.getDay(); day++) {
          console.log("User was not logged in on day ", day);
          totalTimeEachDay[day] = {};
        }
        totalTimeEachDay[result.currentDay.getDay()] = totalTime;
        totalTime = {};
        console.log("New totalTimeEachDay, ", totalTimeEachDay);
        console.log("New totalTime, ", totalTime);
      }
    }
  });
}

// Load data on extension start
loadTimeData();