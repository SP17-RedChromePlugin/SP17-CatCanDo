// Listen for messages from the background script
let stateChangeTimeout = null;
let shadowRoot = null;
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => { //Fires when a chrome message is sent
    if (message.action === 'addDiv') {

      //Cat state deciding loop
      executeStateChange();
      
      // Create a div with full-screen overlay
      const existingDiv = document.getElementById('overlayDiv')
      if (!existingDiv) {
        fetch(chrome.runtime.getURL('overlay.html'))
        .then(response => response.text())
        .then(html => {
          const div = document.createElement('div');
          shadowRoot = div.attachShadow({ mode: 'open' }); //Creating a shadow root so that external css does not affect inserted html
          shadowRoot.innerHTML = `
                <style>
                    #overlayDiv {
                        all: initial; /* Reset all inherited styles */
                        font-size: 15px;
                        font-family: Arial, sans-serif; /* Ensure font-family is defined */
                        font-weight: normal;
                        font-style: normal;
                        color: black;
                        line-height: 1; /* Explicitly set line height */
                        margin: 0;
                        padding: 0;
                        border: 0;
                        vertical-align: baseline;
                    }
                </style>
                ${html}`;
          document.body.appendChild(div); // Append the actual div element

          addGraphs(); // Add the graphs to the overlay
          
          // Image and click event set-up:
          const catPet = shadowRoot.getElementById('catImage'); //getting and setting image of the cat
          catPet.src = chrome.runtime.getURL('images/catsitting.png');
          catPet.addEventListener('click', catClicked);
          catPet.addEventListener('mouseover', () => catHovered(true));
          catPet.addEventListener('mouseout', () => catHovered(false));

          const mainDiv = shadowRoot.getElementById('catContainer');
          mainDiv.addEventListener('mouseover', () => showMenu(true));
          mainDiv.addEventListener('mouseout', () => showMenu(false));

          const menuOpener = shadowRoot.getElementById('catMenuOpener'); //getting and setting image of the cat
          menuOpener.src = chrome.runtime.getURL('images/upButton.png');
          menuOpener.addEventListener('click', toggleMenu); //mouseover and mouseout are also events

          const settingButton = shadowRoot.getElementById('settingsButton');
          settingButton.src = chrome.runtime.getURL('images/settingButton1.png');
          settingButton.addEventListener('click', settingsMenu);

          const calendarButton = shadowRoot.getElementById('calendarButton');
          calendarButton.src = chrome.runtime.getURL('images/calenderButton1.png');
          calendarButton.addEventListener('click', statsMenu);

          const settingsMenuDiv = shadowRoot.getElementById('statsMenu');
          settingsMenuDiv.style.backgroundImage = `url(${chrome.runtime.getURL('images/catmenu.png')})`;

          // Time stats
          const listElement = shadowRoot.getElementById('time-list'); // The list in overlay.html
          
          chrome.runtime.sendMessage({ action: 'getTotalTime' }, function(response) {
            console.log("Received response:", response); // Log the response
            if (response) {
              let sortedResponse = Object.entries(response).sort((a, b) => b[1] - a[1]).slice(0,10);
              listElement.innerHTML = ''; // Clear the list
              for (const [domain, time] of sortedResponse) {
                let listItem = document.createElement('li');
                if (time < 60) {
                  listItem.innerHTML = `<b>${domain}</b>: ${Math.ceil(time)} seconds`;
                } else if (time < 3600) {
                  listItem.innerHTML = `<b>${domain}</b>: ${Math.round(time/60)} minutes`;
                } else {
                  listItem.innerHTML = `<b>${domain}</b>: ${(time/3600).toFixed(1)} hours`; 
                }
                listElement.appendChild(listItem);
              }
            }
          });
        })
        .catch(err => console.error('Error loading overlay:', err));
      }
    } else if (message.action === 'removeDiv') {
      const div = shadowRoot.getElementById('overlayDiv');
      clearTimeout(stateChangeTimeout);
      if (div) {
        div.remove();
      }
    }
  });

  let menuOpen = false;
  function toggleMenu() {
    const menu = shadowRoot.getElementById('catMenu');
    const settingsMenu = shadowRoot.getElementById('statsMenu');
    if (menu) {
      if (menu.style.display === 'none') { 
        menu.style.display = 'flex';
        menuOpen = true;
      } //toggles visibility based on current visibility
      else { 
        menu.style.display = 'none'
        menuOpen = false;
      }
      if (settingsMenu) {
        settingsMenu.style.display = 'none';
      }
    }
  }

  let animationInterval = null;
  function statsMenu() {
    const menu = shadowRoot.getElementById('statsMenu');
    const settingInterior = shadowRoot.getElementById('statsInterior');
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
        menu.style.display = 'flex';
        settingInterior.style.display = 'none';

        animationInterval = setInterval(() => {
          positionY -= delta;
          delta /= rateOfDecay;
          
          //apply the updated background position
          menu.style.backgroundPosition = `center ${positionY}px`;
          
          // stop the animation once the background reaches the center (0px)
          if (positionY <= 2) {
            menu.style.backgroundPosition = `center 0px`;
            settingInterior.style.display = 'flex';
            if (animationInterval) {
              clearInterval(animationInterval);
            }
          }
        }, 3);  // interval speed in ms
      }
      else { 
        if (animationInterval) {
          clearInterval(animationInterval);
          animationInterval = null;  // reset interval ID
        }
        menu.style.display = 'none';
      }
    }
  }

  function settingsMenu() {
    console.log("Settings clicked!!!!");
  }

  function executeStateChange() {
    let randomDelay = Math.floor(Math.random() * 20000) + 10000;
  
    stateChangeTimeout = setTimeout(() => {
      // Generate a new state (0, 1, or 2)
      let newState = Math.floor(Math.random() * 3);
      
      switch (newState) {
        case 0:
          sleepState();
          break;
        case 1:
          walkState();
          break;
        case 2:
          sitState();
          break;
      }
  
      //recursively call the function
      executeStateChange();
      
    }, randomDelay);
  }

  // Cat States
  function sleepState() {
    console.log("Cat is sleeping... Zzz...");
  }

  function walkState() {
    console.log("Cat is walking!");
  }

  function sitState() {
    console.log("Cat is sitting.");
  }

  // Cat interaction
  let speechBubbleTimeoutId = null;
  function catClicked() {
    const speechBubble = shadowRoot.getElementById('speechBubble');
    if (speechBubbleTimeoutId) { //Clear timeout and hide speech bubble
      clearTimeout(speechBubbleTimeoutId);
      speechBubbleTimeoutId = null;
      speechBubble.style.display = 'none';
    } else {
      const menu = shadowRoot.getElementById('catMenu');
      const settingsMenu = shadowRoot.getElementById('statsMenu');
      menu.style.display = 'none';
      settingsMenu.style.display = 'none';

      chrome.runtime.sendMessage({ action: 'getTotalTime' }, function(response) {
        //console.log("Received response:", response); // Log the response
        if (response) {
          let sortedResponse = Object.entries(response).sort((a, b) => b[1] - a[1]).slice(0,10);
          let speechChoice = Math.floor(Math.random() * 3);
          switch (speechChoice) {
            case 0: //Say what the website with the most time is
              let mostTime = sortedResponse[0];
              let mostTimeHours = Math.floor(mostTime[1] / 60);
              speechBubble.innerHTML = `You've spent the most time on <b>${mostTime[0]}</b>! That's <b>${mostTimeHours}</b> minutes!`;
              break;
            case 1: //Say your total time
              let totalTime = 0;
              for (const [domain, time] of sortedResponse) {
                totalTime += time;
              }
              let hours = Math.floor(totalTime / 3600);
              let minutes = Math.floor((totalTime % 3600) / 60);
              speechBubble.innerHTML = `You've spent <b>${hours}</b> hours and <b>${minutes}</b> minutes exploring the web!`;
              break;
            case 2: //Say favorite websites
              let favWebsites = sortedResponse.slice(0, 3);
              speechBubble.innerHTML = `Your favorite websites look to be <b>${favWebsites[0][0]}</b>, <b>${favWebsites[1][0]}</b>, and <b>${favWebsites[2][0]}</b>!`;
              break;
          }
        }
      });

      speechBubble.style.display = 'block';
      speechBubbleTimeoutId = setTimeout(() => {
        speechBubble.style.display = 'none';
      }, 8000);
    }
  }

  function catHovered(isHovering) {
    console.log("hover: ", isHovering)
  }

  function showMenu(isOpen) {
    const menuOpener = shadowRoot.getElementById('catMenuOpener');
    if (menuOpener) {
      if (isOpen) {
        menuOpener.style.display = 'block';
      } else if (menuOpen === false) {
        menuOpener.style.display = 'none';
      }
    }
  }

  function addGraphs() {
    let weekChartDate = [];
    chrome.runtime.sendMessage({ action: 'getTotalTimeEachDay' }, function(response) {
      if (response) {
        //Get total cumulative time for each dictionary in the response 0-7
        for (let i = 0; i < 7; i++) {
          let totalTime = 0;
          for (domain in response[i]) {
            totalTime += response[i][domain];
          }
          weekChartDate.push(totalTime/3600);
          console.log("Total time for day", i, "is", totalTime);
        }
      }
    });

    const ctx = shadowRoot.getElementById('weekChartCanvas').getContext('2d');
    const weekChart = new Chart(ctx, {
        type: 'bar', // or 'line', 'pie', etc.
        data: {
            labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            datasets: [{
                label: 'Hours Spent Online',
                data: weekChartDate, // Replace with your actual data
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}