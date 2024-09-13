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

          const img = document.getElementById('catImage'); //getting and setting image of the cat
          img.src = chrome.runtime.getURL('catsitting.png');
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