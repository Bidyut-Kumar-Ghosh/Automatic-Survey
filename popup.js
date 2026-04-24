let running = false;

function updateProgress(current, total) {
  const percentage = (current / total) * 100;
  const statusEl = document.getElementById("status");
  statusEl.style.setProperty('--progress', percentage + '%');
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

  let match = input.match(/[-\w]{25,}/);
  if (!match) {
    status.innerText = "❌ Invalid Form Link";
    status.className = "error";
    runBtn.disabled = false;
    running = false;
    setTimeout(() => {
      status.style.display = "none";
    }, 2500);
    return;
  }

  let formId = match[0];
  let formUrl = `https://docs.google.com/forms/d/e/${formId}/viewform`;

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

  let tab = await chrome.tabs.create({ url: formUrl, active: false });

  updateProgress(0, count);

  // Store total count in tab storage for content script
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (cnt) => {
      sessionStorage.setItem('totalFormCount', cnt);
      sessionStorage.setItem('submissionCount', '0');
    },
    args: [count]
  });

  for (let i = 0; i < count; i++) {

    if (!running) break;

    status.innerText = `⏳ Processing ${i + 1}/${count}`;
    status.className = "processing";

    updateProgress(i + 1, count);

    await waitForLoad(tab.id);

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });

    await waitForSubmission(tab.id, delay);

    await sleep(delay);

    await chrome.tabs.update(tab.id, { url: formUrl });
  }

  status.innerText = running ? "Done ✅" : "Stopped ⛔";
  status.className = running ? "success" : "error";
  document.getElementById("stop").style.display = "none";
  status.style.setProperty('--progress', '0%');
  runBtn.disabled = false;
  running = false;
  
  setTimeout(() => {
    status.style.display = "none";
  }, 3000);
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

function waitForSubmission(tabId, delay = 4000) {
  return new Promise(resolve => {
    // Adjust timeouts based on delay
    const initialDelay = Math.max(300, Math.floor(delay * 0.6));
    const checkInterval = Math.max(500, Math.floor(delay * 0.5));

    const check = async () => {
      let [res] = await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => {
          let t = document.body.innerText.toLowerCase();
          return t.includes("response") || t.includes("thank");
        }
      });

      if (res.result) resolve();
      else setTimeout(check, checkInterval);
    };

    setTimeout(check, initialDelay);
  });
}