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
          addDraggingListeners() // adds the dragging listeners to the stats menu
          
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

  // ************************************************************************************************
  // Cat States
  // ************************************************************************************************

  function executeStateChange() {
    let randomDelay = Math.floor(Math.random() * 40000) + 10000;
  
    stateChangeTimeout = setTimeout(() => {
      // Generate a new state (0, 1, or 2)
      let newState = Math.floor(Math.random() * 3);

      //end any previous animation
      endAnimation();
      
      switch (newState) {
        case 0:
          sleepState(randomDelay);
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

 let zInterval = null;
 function sleepState(animationDuration) {
    console.log("Cat is sleeping... Zzz...");
  
    const catPetImage = shadowRoot.getElementById('catImage');
    catPetImage.src = chrome.runtime.getURL('images/catsleepinggif.gif');
  
    const catContainer = shadowRoot.getElementById('catContainer');
    let interval = 800;  // Time between Zs (in ms)
  
    // Function to create a single "Z" image with animation
    function createZ() {
      const sleepZ = document.createElement('img');
      sleepZ.src = chrome.runtime.getURL('images/sleepingZ.png');
      sleepZ.style.position = 'absolute';
      sleepZ.style.width = '50px';
      sleepZ.style.height = '50px';
      sleepZ.style.top = `${catPetImage.offsetTop}px`; 
      sleepZ.style.left = `${catPetImage.offsetLeft + Math.random() * 50}px`;  // Random horizontal offset
      sleepZ.style.opacity = 1;
      sleepZ.style.transition = 'all 3s ease-out';  // Longer animation
  
      // Append the Z image to the container
      catContainer.appendChild(sleepZ);
  
      // Trigger the animation
      setTimeout(() => {
        sleepZ.style.top = `${catPetImage.offsetTop - 150 - Math.random() * 50}px`;  // Random upward movement
        sleepZ.style.opacity = 0;  // Fade out
      }, 10);
  
      // Remove the Z after animation ends
      sleepZ.addEventListener('transitionend', () => {
        sleepZ.remove();
      });
    }
  
    // Create multiple Zs over time
    zInterval = setInterval(() => {
      createZ();
    }, interval);
  
    // Stop creating Zs after the animation duration
    setTimeout(() => {
      clearInterval(zInterval);
      console.log("Sleeping animation ended.");
    }, animationDuration);
  }

  function walkState() {
    console.log("Cat is walking!");
    endAnimation();
    const catPet = shadowRoot.getElementById('catContainer');
    const catPetImage = shadowRoot.getElementById('catImage');

    catPetImage.src = chrome.runtime.getURL('images/catwalkinggif.gif'); // Update to walking gif

    let positionX = parseInt(catPet.style.transform.replace(/[^\d\-\.]/g, '')) || 0; // Retain previous position
    const step = 5; // Pixels to move per step

    // Randomly choose direction: 1 for right, -1 for left
    const direction = Math.random() < 0.5 ? 1 : -1;

    // Flip the cat based on direction using CSS scaleX
    catPetImage.style.transform = `scaleX(${direction})`;

    // Clear any previous animation intervals to avoid overlap
    if (animationInterval) clearInterval(animationInterval);

    // Create a new interval to animate the cat's movement
    animationInterval = setInterval(() => {
      positionX += step * direction; // Move the cat in the chosen direction

      // Check if the cat moves off-screen and reverse its direction
      if (positionX > window.innerWidth - catPet.offsetWidth || positionX < 0) {
        console.log(`PositionX: ${positionX}, WindowWidth: ${window.innerWidth}, CatWidth: ${catPet.offsetWidth}`);
        clearInterval(animationInterval); // Stop the animation
        walkState(); // Restart with a new direction
        return;
      }

        // Apply the new position
        catPet.style.transform = `translateX(${positionX}px)`;
    }, 100); // Adjust interval speed for smoother animation
  }

  function sitState() {
    console.log("Cat is sitting.");
  }

  function endAnimation(){
    //const catPet = shadowRoot.getElementById('catContainer');
    const catPetImage = shadowRoot.getElementById('catImage');

    if (animationInterval) {
      clearInterval(animationInterval); // Stop the animation
      animationInterval = null;
    }
    if (zInterval) {
      clearInterval(zInterval);
      zInterval = null;
    }
    catPetImage.src = chrome.runtime.getURL('images/catsitting.png');
  }


  // ************************************************************************************************
  // Cat interaction
  // ************************************************************************************************

  let speechBubbleTimeoutId = null;
  function catClicked() {
    //end any active animation
    endAnimation();

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
              let mostTimeMinutes = Math.floor(mostTime[1] / 60);
              if (mostTime < 60) {
                speechBubble.innerHTML = `You've spent the most time on <b>${mostTime[0]}</b> today! That's <b>${mostTime}</b> seconds!`;
              } else {
                speechBubble.innerHTML = `You've spent the most time on <b>${mostTime[0]}</b> today! That's <b>${mostTimeMinutes}</b> minutes!`;
              }
              break;
            case 1: //Say your total time
              let totalTime = 0;
              for (const [domain, time] of sortedResponse) {
                totalTime += time;
              }
              let hours = Math.floor(totalTime / 3600);
              let minutes = Math.floor((totalTime % 3600) / 60);
              speechBubble.innerHTML = `You've spent <b>${hours}</b> hours and <b>${minutes}</b> minutes exploring the web today!`;
              break;
            case 2: //Say favorite websites
              let favWebsites = sortedResponse.slice(0, 3);
              if (favWebsites.length < 3) {
                speechBubble.innerHTML = `You haven't visited a lot of websites today :3`;
              } else {
                speechBubble.innerHTML = `You've spent the most time on <b>${favWebsites[0][0]}</b>, <b>${favWebsites[1][0]}</b>, and <b>${favWebsites[2][0]}</b> today!`;
              }
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

  // ************************************************************************************************
  // Menu Dragging
  // ************************************************************************************************

  function addDraggingListeners() {
    const statsMenu = shadowRoot.getElementById('statsMenu');
    let isDragging = false;
    let offsetX, offsetY;

    statsMenu.addEventListener('mousedown', function(e) {
        isDragging = true;
        offsetX = e.clientX - statsMenu.getBoundingClientRect().left;
        offsetY = e.clientY - statsMenu.getBoundingClientRect().top;
        statsMenu.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', function(e) {
        if (isDragging) {
            statsMenu.style.left = `${e.clientX - offsetX}px`;
            statsMenu.style.top = `${e.clientY - offsetY}px`;
        }
    });

    document.addEventListener('mouseup', function() {
        isDragging = false;
        statsMenu.style.cursor = 'move';
    });
  }

  // ************************************************************************************************
  // Graph Functionality
  // ************************************************************************************************

  function addGraphs() {
    let weekChartDate = [];
    let weekDomainTime = {};

    chrome.runtime.sendMessage({ action: 'getTotalTimeEachDay' }, function(response) {
      if (response) {
        // Get total cumulative time for each day (0-7)
        for (let i = 0; i < 7; i++) {
          let totalTime = 0;
          for (let domain in response[i]) {
            totalTime += response[i][domain];
          }
          weekChartDate.push(totalTime / 3600);
        }

        // Get cumulative time for each unique domain
        for (let i = 0; i < 7; i++) {
          for (let domain in response[i]) {
            if (!weekDomainTime[domain]) {
              weekDomainTime[domain] = 0;
            }
            weekDomainTime[domain] += response[i][domain];
          }
        }
        //Converting to Minutes
        for (let domain in weekDomainTime) {
          weekDomainTime[domain] /= 60;
        }

        //Checking values for WeekDomainTime
        //console.log("WeekDomainTime, ", weekDomainTime);
        //console.log("week Domain Keys: ", Object.keys(weekDomainTime));
        //console.log("week Domain Values: ", Object.values(weekDomainTime));

        //Sorting weekChartDate so that the ending value is the current day
        let currentDate = new Date();
        let currentDay = currentDate.getDay();
        weekChartDate = weekChartDate.slice(currentDay + 1).concat(weekChartDate.slice(0, currentDay + 1));
        //Creating a new array for the days of the week that aligns with weekChartDate
        let daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        let daysOfWeekOrdered = daysOfWeek.slice(currentDay + 1).concat(daysOfWeek.slice(0, currentDay + 1));
        //If the max value in weekChartDate is less than 1, multiply each value by 60 to convert to minutes
        labelForGraph = 'Hours';
        if (Math.max(...weekChartDate) < 1) { //The ... is the spread operator I just learned!
          weekChartDate = weekChartDate.map((value) => value * 60);
          labelForGraph = 'Minutes';
        }

        // Create the charts
        const ctx = shadowRoot.getElementById('weekChartCanvas').getContext('2d');
        const weekChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: daysOfWeekOrdered,
                datasets: [{
                    label: labelForGraph,
                    data: weekChartDate,
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

        let sortedWeekDomainTime = Object.entries(weekDomainTime).sort((a, b) => b[1] - a[1]).slice(0,5);
        const ctx2 = shadowRoot.getElementById('websiteUsageCanvas').getContext('2d');
        const websiteChart = new Chart(ctx2, {
            type: 'pie',
            data: {
                labels: sortedWeekDomainTime.map(([domain, time]) => domain),
                datasets: [{
                    label: 'Minutes',
                    data: sortedWeekDomainTime.map(([domain, time]) => time),
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.2)', 
                        'rgba(255, 99, 132, 0.2)', 
                        'rgba(54, 162, 235, 0.2)', 
                        'rgba(255, 206, 86, 0.2)', 
                        'rgba(153, 102, 255, 0.2)'
                    ],
                    borderColor: [
                        'rgba(75, 192, 192, 1)', 
                        'rgba(255, 99, 132, 1)', 
                        'rgba(54, 162, 235, 1)', 
                        'rgba(255, 206, 86, 1)', 
                        'rgba(153, 102, 255, 1)'
                    ],
                    borderWidth: 1
                }]
            }
        });
      }
    });
}
