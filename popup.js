let running = false;
let activeTab = null;

function updateProgress(current, total) {
  const percentage = (current / total) * 100;
  const statusEl = document.getElementById("status");
  statusEl.style.setProperty('--progress', percentage + '%');
}

// Handle tab closure/errors
function handleTabError(error, tabId) {
  console.error('Tab error:', error);
  if (activeTab && activeTab.id === tabId) {
    activeTab = null;
  }
}

document.getElementById("run").addEventListener("click", async () => {

  // Prevent starting if already running
  if (running) {
    return;
  }

  running = true;
  const runBtn = document.getElementById("run");
  runBtn.disabled = true;

  let input = document.getElementById("formId").value;
  let count = parseInt(document.getElementById("count").value);
  let mode = document.getElementById("mode").value;
  let status = document.getElementById("status");

  document.getElementById("stop").style.display = "block";
  status.style.display = "block";

  // Detect form type and extract ID
  let formType = null;
  let formUrl = null;

  // Check if it's Microsoft Forms
  if (input.includes("forms.office.com")) {
    formType = "microsoft";
    // Extract form ID from Microsoft Forms URL
    let match = input.match(/forms\.office\.com\/r\/([a-zA-Z0-9]+)|id=([a-zA-Z0-9]+)/);
    if (match) {
      let formId = match[1] || match[2];
      formUrl = `https://forms.office.com/r/${formId}`;
    }
  } else {
    // Assume Google Forms
    formType = "google";
    let match = input.match(/[-\w]{25,}/);
    if (match) {
      let formId = match[0];
      formUrl = `https://docs.google.com/forms/d/e/${formId}/viewform`;
    }
  }

  if (!formUrl) {
    status.innerText = "❌ Invalid Form Link";
    status.className = "error";
    runBtn.disabled = false;
    running = false;
    setTimeout(() => {
      status.style.display = "none";
    }, 2500);
    return;
  }

  let delay;
  switch(mode) {
    case "ultra": delay = 300; break;
    case "fast": delay = 800; break;
    case "safe": delay = 2000; break;
    case "slow": delay = 4000; break;
    default: delay = 2000;
  }

  status.innerText = "📂 Opening form...";
  status.className = "processing";

  try {
    // Create tab with error handling
    activeTab = await chrome.tabs.create({ url: formUrl, active: false }).catch(err => {
      throw new Error('Failed to create tab: ' + err.message);
    });

    updateProgress(0, count);

    // Store total count and form type in tab storage for content script
    chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      func: (cnt, fType) => {
        sessionStorage.setItem('totalFormCount', cnt);
        sessionStorage.setItem('submissionCount', '0');
        sessionStorage.setItem('formType', fType);
      },
      args: [count, formType]
    });

    for (let i = 0; i < count; i++) {

      if (!running) break;

      // Check if tab still exists
      try {
        await chrome.tabs.get(activeTab.id);
      } catch (err) {
        status.innerText = "⚠️ Tab was closed. Restarting...";
        status.className = "error";
        // Try to recreate the tab
        activeTab = await chrome.tabs.create({ url: formUrl, active: false });
        await sleep(1000);
      }

      status.innerText = `⏳ Processing ${i + 1}/${count}`;
      status.className = "processing";

      updateProgress(i + 1, count);

      await waitForLoad(activeTab.id);

      await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        files: ["content.js"]
      });

      await waitForSubmission(activeTab.id, delay, formType);

      await sleep(delay);

      // Safely update tab
      try {
        await chrome.tabs.update(activeTab.id, { url: formUrl });
      } catch (err) {
        console.error('Failed to update tab:', err);
        // Recreate tab if update fails
        activeTab = await chrome.tabs.create({ url: formUrl, active: false });
      }
    }

    status.innerText = running ? "✅ All Done!" : "⛔ Stopped";
    status.className = running ? "success" : "error";
    document.getElementById("stop").style.display = "none";
    status.style.setProperty('--progress', '0%');
    
    // Close the tab after completion
    if (activeTab) {
      try {
        await chrome.tabs.remove(activeTab.id);
      } catch (err) {
        console.error('Failed to close tab:', err);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
    status.innerText = `❌ Error: ${error.message}`;
    status.className = "error";
    
    // Try to close tab on error
    if (activeTab) {
      try {
        await chrome.tabs.remove(activeTab.id);
      } catch (err) {
        console.error('Failed to close tab on error:', err);
      }
    }
  } finally {
    runBtn.disabled = false;
    running = false;
    activeTab = null;
    
    setTimeout(() => {
      status.style.display = "none";
    }, 3000);
  }
});

document.getElementById("stop").addEventListener("click", () => {
  running = false;
});

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function waitForLoad(tabId) {
  return new Promise(resolve => {
    chrome.tabs.onUpdated.addListener(function listener(id, info) {
      if (id === tabId && info.status === "complete") {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    });
  });
}

function waitForSubmission(tabId, delay = 2000, formType = "google") {
  return new Promise(resolve => {
    // Adjust timeouts based on delay, with longer initial delay for loading all questions
    const initialDelay = Math.max(3000, Math.floor(delay * 1.2));
    const checkInterval = Math.max(500, Math.floor(delay * 0.5));
    let maxChecks = 30; // Maximum number of checks before giving up
    let checkCount = 0;

    const check = async () => {
      checkCount++;
      let [res] = await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: (fType) => {
          let t = document.body.innerText.toLowerCase();
          if (fType === "microsoft") {
            // Microsoft Forms shows different confirmation messages
            return t.includes("thank") || t.includes("thanks") || t.includes("submitted") || t.includes("response received");
          } else {
            // Google Forms messages
            return t.includes("response") || t.includes("thank");
          }
        },
        args: [formType]
      });

      if (res.result || checkCount >= maxChecks) {
        resolve();
      } else {
        setTimeout(check, checkInterval);
      }
    };

    setTimeout(check, initialDelay);
  });
}