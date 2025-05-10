setInterval(() => {
    const speed = (Math.random() * 5 + 1).toFixed(2); // Random Mbps
    chrome.tabs.query({}, (tabs) => {
      for (let tab of tabs) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (s) => {
            window.dispatchEvent(new CustomEvent("updateNetworkSpeed", { detail: s }));
          },
          args: [speed]
        });
      }
    });
  }, 2000);
  