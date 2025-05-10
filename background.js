setInterval(() => {
    const speed = (Math.random() * 5 + 1).toFixed(2); // Simulated Mbps
  
    chrome.tabs.query({}, (tabs) => {
      for (let tab of tabs) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (speed) => {
            window.dispatchEvent(new CustomEvent("updateNetworkSpeed", { detail: speed }));
          },
          args: [speed]
        });
      }
    });
  }, 2000);
  