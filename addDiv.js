// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    if (message.action === 'addDiv') {
      // Create a div with full-screen overlay
      
      const existingDiv = document.getElementById('overlayDiv')
      if (!existingDiv) {
        fetch(chrome.runtime.getURL('overlay.html'))
        .then(response => response.text())
        .then(html => {
          const div = document.createElement('div');
          div.innerHTML = html;
          document.body.appendChild(div.firstElementChild); // Append the actual div element

          // Image and click event set-up:
          const img = document.getElementById('catImage'); //getting and setting image of the cat
          img.src = chrome.runtime.getURL('images/catsitting.png');
          img.addEventListener('click', toggleMenu);

          const settingButton = document.getElementById('settingsButton');
          settingButton.src = chrome.runtime.getURL('images/settingButton1.png');
          settingButton.addEventListener('click', settingsMenu);

          const calendarButton = document.getElementById('calendarButton');
          calendarButton.src = chrome.runtime.getURL('images/calenderButton1.png');
          calendarButton.addEventListener('click', calendarMenu);
        })
        .catch(err => console.error('Error loading overlay:', err));
      }
    } else if (message.action === 'removeDiv') {
      const div = document.getElementById('overlayDiv');
      if (div) {
        div.remove();
      }
    }
  });

  function toggleMenu() {
    const menu = document.getElementById('catMenu');
    if (menu) {
      if (menu.style.display === 'none') { menu.style.display = 'block'} //toggles visibility based on current visibility
      else { menu.style.display = 'none'}
    }
  }

  function settingsMenu() {
    console.log("Settings clicked!");
    chrome.runtime.sendMessage({ action: "openSettings" });
  }

  function calendarMenu() {
    console.log("Calendar clicked!");
  }