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

          const settingsMenuDiv = document.getElementById('settingsMenu');
          settingsMenuDiv.style.backgroundImage = `url(${chrome.runtime.getURL('images/catmenu.png')})`;
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
    const settingsMenu = document.getElementById('settingsMenu');
    if (menu) {
      if (menu.style.display === 'none') { menu.style.display = 'block';} //toggles visibility based on current visibility
      else { menu.style.display = 'none'}
      if (settingsMenu) {
        settingsMenu.style.display = 'none';
      }
    }
  }

  let animationInterval = null;
  function settingsMenu() {
    const menu = document.getElementById('settingsMenu');
    if (menu) {
      if (menu.style.display === 'none') { 

        if (animationInterval) {
          clearInterval(animationInterval);
        }

        let positionY = 400;
        var delta = 10;
        const initialPos = positionY;
        const initialDelta = delta;
        const rateOfDecay = 1 / (1 - (initialDelta/initialPos));
        menu.style.backgroundPosition = `center ${positionY}px`;
        menu.style.display = 'block';

        animationInterval = setInterval(() => {
          positionY -= delta;
          delta /= rateOfDecay;
          
          // Apply the updated background position
          menu.style.backgroundPosition = `center ${positionY}px`;
          
          // Stop the animation once the background reaches the center (0px)
          if (positionY <= 0.2) {
            menu.style.backgroundPosition = `center 0px`;
            if (animationInterval) {
              clearInterval(animationInterval);
            }
          }
        }, 3);  // Interval speed in ms
      }
      else { 
        if (animationInterval) {
          clearInterval(animationInterval);
          animationInterval = null;  // Reset interval ID
        }
        menu.style.display = 'none';
      }
    }
  }

  function calendarMenu() {
    console.log("Calendar clicked!");
  }