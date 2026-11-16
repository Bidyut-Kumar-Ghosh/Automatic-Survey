let running = false;
let activeTab = null;
let loadedQuestions = [];
let loadedFormUrl = null;

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

function detectGoogleFormUrl(input) {
  const value = String(input || '').trim();
  if (!value) return null;

  const lowered = value.toLowerCase();

  if (lowered.includes('forms.gle')) {
    const match = value.match(/forms\.gle\/([A-Za-z0-9_-]+)/i);
    if (match) {
      return { formType: 'google', formUrl: `https://forms.gle/${match[1]}` };
    }
  }

  if (lowered.includes('docs.google.com') || lowered.includes('google.com/forms')) {
    const match = value.match(/(?:https?:\/\/)?(?:docs\.google\.com\/forms(?:\/u\/\d+)?\/d\/e\/|docs\.google\.com\/forms(?:\/u\/\d+)?\/d\/|(?:www\.)?google\.com\/forms\/d\/e\/|(?:www\.)?google\.com\/forms\/d\/)([A-Za-z0-9_-]+)/i)
      || value.match(/(?:\b|_)id=([A-Za-z0-9_-]{10,})(?:&|$)/i);

    if (match) {
      const formId = match[1];
      const hasEPath = /\/forms(?:\/u\/\d+)?\/d\/e\//i.test(value) || /\/forms\/d\/e\//i.test(value);
      return {
        formType: 'google',
        formUrl: hasEPath
          ? `https://docs.google.com/forms/d/e/${formId}/viewform`
          : `https://docs.google.com/forms/d/${formId}/viewform`
      };
    }
  }

  const directId = value.match(/^[A-Za-z0-9_-]{10,}$/);
  if (directId) {
    return {
      formType: 'google',
      formUrl: `https://docs.google.com/forms/d/e/${directId[0]}/viewform`
    };
  }

  return null;
}

function detectMicrosoftFormUrl(input) {
  const value = String(input || '').trim();
  if (!value) return null;

  const match = value.match(/forms\.office\.com\/(?:r\/|.*?[?&](?:id|formId|formid)=)([A-Za-z0-9]+)/i)
    || value.match(/forms\.office\.com\/.*/i);

  if (match) {
    const formId = match[1] || value.match(/(?:r\/|id=)([A-Za-z0-9]+)/i)?.[1];
    if (formId) {
      return { formType: 'microsoft', formUrl: `https://forms.office.com/r/${formId}` };
    }
    return { formType: 'microsoft', formUrl: value };
  }

  return null;
}

function getFormMatch(input) {
  return detectMicrosoftFormUrl(input) || detectGoogleFormUrl(input);
}

function extractGoogleQuestions(tabId) {
  return chrome.scripting.executeScript({
    target: { tabId },
    func: async () => {
      let previousHeight = 0;
      let unchangedAttempts = 0;
      let scrollAttempts = 0;

      while (scrollAttempts < 50 && unchangedAttempts < 2) {
        window.scrollBy(0, window.innerHeight);
        await new Promise(resolve => setTimeout(resolve, 200));
        const height = document.documentElement.scrollHeight;
        unchangedAttempts = height === previousHeight ? unchangedAttempts + 1 : 0;
        previousHeight = height;
        scrollAttempts++;
      }

      window.scrollTo(0, 0);
      await new Promise(resolve => setTimeout(resolve, 300));

      const getLabel = element => String(
        element.getAttribute('aria-label') ||
        element.innerText ||
        element.textContent ||
        element.value ||
        ''
      ).trim();
      const containers = Array.from(document.querySelectorAll('[role="listitem"]'));
      const questions = [];

      containers.forEach(container => {
        const heading = container.querySelector('[role="heading"], .M7eMe');
        const label = String(
          heading?.innerText ||
          container.getAttribute('aria-label') ||
          container.innerText ||
          ''
        ).trim();
        const radios = Array.from(container.querySelectorAll('[role="radio"]'));
        const checkboxes = Array.from(container.querySelectorAll('[role="checkbox"]'));
        const selects = Array.from(container.querySelectorAll('select, [role="listbox"], [role="combobox"]'));
        const textInputs = container.querySelectorAll('input[type="text"], textarea');
        const dateInputs = container.querySelectorAll('input[type="date"], input[type="time"]');

        if (radios.length) {
          const choices = radios.map(getLabel);
          const isAgeQuestion = /(age|years old|how old|birth year|date of birth)/i.test(label);
          const numericScale = choices.length >= 3 && choices.every(choice => /^\d+$/.test(choice));
          const ratingPrompt = /(rating|rate|scale|satisfaction|likelihood|how likely|agree|disagree)/i.test(label);
          questions.push({
            label,
            kind: !isAgeQuestion && (numericScale || ratingPrompt) ? 'rating' : 'choice',
            choices
          });
          return;
        }

        if (checkboxes.length) {
          questions.push({ label, kind: 'checkbox', choices: checkboxes.map(getLabel) });
          return;
        }

        if (selects.length) {
          const choices = Array.from(selects[0].querySelectorAll('option, [role="option"]'))
            .filter(option => (option.value || option.getAttribute('role') === 'option') && getLabel(option))
            .map(getLabel);
          if (choices.length) {
            questions.push({ label, kind: 'choice', choices });
            return;
          }
        }

        if (textInputs.length || dateInputs.length) {
          questions.push({ label, kind: 'auto', choices: [] });
        }
      });

      return questions;
    }
  });
}

function renderQuestionSettings(questions) {
  const panel = document.getElementById('questionPanel');
  const list = document.getElementById('questionList');
  const count = document.getElementById('questionCount');
  const empty = document.getElementById('questionEmpty');
  list.replaceChildren();
  panel.hidden = false;
  count.textContent = `${questions.length} question${questions.length === 1 ? '' : 's'}`;
  empty.hidden = questions.length > 0;

  questions.forEach((question, questionIndex) => {
    const card = document.createElement('article');
    card.className = 'question-card';
    card.dataset.questionIndex = String(questionIndex);

    const header = document.createElement('div');
    header.className = 'question-card-header';
    const number = document.createElement('span');
    number.className = 'question-number';
    number.textContent = `Q${String(questionIndex + 1).padStart(2, '0')}`;
    const kind = document.createElement('span');
    kind.className = 'question-kind';
    kind.textContent = question.kind === 'rating'
      ? 'Rating scale'
      : question.kind === 'checkbox'
        ? 'Multiple choice'
        : question.kind === 'choice'
          ? 'Choice'
          : 'Automatic answer';
    header.append(number, kind);

    const title = document.createElement('p');
    title.className = 'question-title';
    title.textContent = question.label || `Question ${questionIndex + 1}`;
    card.append(header, title);

    if (question.kind === 'rating') {
      const select = document.createElement('select');
      select.className = 'question-rating-select';
      select.dataset.questionIndex = String(questionIndex);
      select.setAttribute('aria-label', `Rating answer for question ${questionIndex + 1}`);
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = 'Choose a rating';
      select.append(placeholder);
      question.choices.forEach((choice, choiceIndex) => {
        const option = document.createElement('option');
        option.value = String(choiceIndex);
        option.textContent = choice || `Option ${choiceIndex + 1}`;
        select.append(option);
      });
      card.append(select);
    } else if (question.kind === 'choice' || question.kind === 'checkbox') {
      const answerList = document.createElement('div');
      answerList.className = 'question-answer-list';
      const base = Math.floor(100 / question.choices.length);
      const remainder = 100 % question.choices.length;

      question.choices.forEach((choice, choiceIndex) => {
        const row = document.createElement('label');
        row.className = 'question-answer-row';
        const choiceLabel = document.createElement('span');
        choiceLabel.className = 'question-answer-label';
        choiceLabel.textContent = choice || `Option ${choiceIndex + 1}`;
        const weight = document.createElement('input');
        weight.className = 'question-weight';
        weight.type = 'number';
        weight.min = '0';
        weight.max = '100';
        weight.step = '1';
        weight.value = String(base + (choiceIndex < remainder ? 1 : 0));
        weight.dataset.questionIndex = String(questionIndex);
        weight.dataset.choiceIndex = String(choiceIndex);
        weight.setAttribute('aria-label', `Percentage for ${choice || `option ${choiceIndex + 1}`}`);
        const percent = document.createElement('span');
        percent.textContent = '%';
        const weightWrap = document.createElement('span');
        weightWrap.style.display = 'flex';
        weightWrap.style.alignItems = 'center';
        weightWrap.style.gap = '4px';
        weightWrap.append(weight, percent);
        row.append(choiceLabel, weightWrap);
        answerList.append(row);
      });

      const total = document.createElement('p');
      total.className = 'question-total';
      total.dataset.totalFor = String(questionIndex);
      card.append(answerList, total);
      answerList.addEventListener('input', () => updateQuestionTotal(card));
      updateQuestionTotal(card);
    } else {
      const note = document.createElement('p');
      note.className = 'question-help';
      note.textContent = 'This question will use the existing automatic answer behavior.';
      card.append(note);
    }

    list.append(card);
  });
}

function updateQuestionTotal(card) {
  const weights = Array.from(card.querySelectorAll('.question-weight'));
  const total = weights.reduce((sum, input) => sum + (Number(input.value) || 0), 0);
  const totalLabel = card.querySelector('.question-total');
  totalLabel.textContent = `Total: ${total}% (must equal 100%)`;
  totalLabel.classList.toggle('invalid', total !== 100);
}

function collectQuestionSettings() {
  return loadedQuestions.map((question, questionIndex) => {
    if (question.kind === 'rating') {
      const select = document.querySelector(`.question-rating-select[data-question-index="${questionIndex}"]`);
      if (!select || select.value === '') {
        throw new Error(`Choose a rating for question ${questionIndex + 1}.`);
      }
      return { kind: 'rating', selectedIndex: Number(select.value) };
    }

    if (question.kind === 'choice' || question.kind === 'checkbox') {
      const inputs = Array.from(document.querySelectorAll(`.question-weight[data-question-index="${questionIndex}"]`));
      const weights = inputs.map(input => Number(input.value));
      if (weights.some(weight => !Number.isInteger(weight) || weight < 0 || weight > 100)
        || weights.reduce((sum, weight) => sum + weight, 0) !== 100) {
        throw new Error(`Choice percentages for question ${questionIndex + 1} must total 100%.`);
      }
      return { kind: question.kind, weights };
    }

    return { kind: 'auto' };
  });
}

function initPopup() {
  const runBtn = document.getElementById("run");
  const stopBtn = document.getElementById("stop");
  const loadQuestionsBtn = document.getElementById('loadQuestions');
  const formIdInput = document.getElementById('formId');
  const updatesBtn = document.querySelector('.updates-btn');
  const closeUpdatesBtn = document.getElementById('closeUpdatesBtn');
  const updatesModal = document.getElementById('updatesModal');
  const ownerToggle = document.getElementById('ownerToggle');
  const socialLinks = document.getElementById('socialLinks');

  if (!runBtn || !stopBtn) {
    return;
  }

  if (ownerToggle && socialLinks) {
    ownerToggle.addEventListener('click', () => {
      const expanded = ownerToggle.getAttribute('aria-expanded') === 'true';
      ownerToggle.setAttribute('aria-expanded', String(!expanded));
      socialLinks.hidden = expanded;
    });
  }

  formIdInput.addEventListener('input', () => {
    loadedQuestions = [];
    loadedFormUrl = null;
    document.getElementById('questionPanel').hidden = true;
  });

  loadQuestionsBtn.addEventListener('click', async () => {
    if (running) return;

    const formMatch = getFormMatch(formIdInput.value);
    const status = document.getElementById('status');
    if (!formMatch) {
      status.textContent = 'Invalid form link.';
      status.className = 'error';
      status.style.display = 'block';
      return;
    }
    if (formMatch.formType !== 'google') {
      status.textContent = 'Question preview is currently available for Google Forms only.';
      status.className = 'error';
      status.style.display = 'block';
      return;
    }

    loadQuestionsBtn.disabled = true;
    loadedQuestions = [];
    loadedFormUrl = null;
    document.getElementById('questionPanel').hidden = true;
    status.textContent = 'Loading Google Form questions...';
    status.className = 'processing';
    status.style.display = 'block';
    let previewTab = null;

    try {
      previewTab = await chrome.tabs.create({ url: formMatch.formUrl, active: false });
      await waitForLoad(previewTab.id);
      const [result] = await extractGoogleQuestions(previewTab.id);
      loadedQuestions = result.result || [];
      loadedFormUrl = formMatch.formUrl;
      renderQuestionSettings(loadedQuestions);
      status.textContent = `Loaded ${loadedQuestions.length} question${loadedQuestions.length === 1 ? '' : 's'}.`;
      status.className = loadedQuestions.length ? 'success' : 'error';
    } catch (error) {
      loadedQuestions = [];
      loadedFormUrl = null;
      status.textContent = `Could not load questions: ${error.message}`;
      status.className = 'error';
    } finally {
      if (previewTab) {
        try {
          await chrome.tabs.remove(previewTab.id);
        } catch (error) {
          console.error('Failed to close preview tab:', error);
        }
      }
      loadQuestionsBtn.disabled = false;
    }
  });

  runBtn.addEventListener("click", async () => {

    // Prevent starting if already running
    if (running || loadQuestionsBtn.disabled) {
      return;
    }

    running = true;
    runBtn.disabled = true;

    let input = formIdInput.value;
    let count = parseInt(document.getElementById("count").value);
    let mode = document.getElementById("mode").value;
    let status = document.getElementById("status");
    let submissionError = null;

    stopBtn.style.display = "block";
    status.style.display = "block";

    // Detect form type and extract ID
    const formMatch = getFormMatch(input);
    const formType = formMatch?.formType || null;
    const formUrl = formMatch?.formUrl || null;

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

    let questionSettings = [];
    if (formType === 'google') {
      if (loadedFormUrl !== formUrl || loadedQuestions.length === 0) {
        status.textContent = 'Load the Google Form questions before starting.';
        status.className = 'error';
        stopBtn.style.display = 'none';
        runBtn.disabled = false;
        running = false;
        return;
      }
      try {
        questionSettings = collectQuestionSettings();
      } catch (error) {
        status.textContent = error.message;
        status.className = 'error';
        status.style.display = 'block';
        stopBtn.style.display = 'none';
        runBtn.disabled = false;
        running = false;
        return;
      }
    }

    let delay;
    switch(mode) {
      case "ultra": delay = 300; break;
      case "fast": delay = 800; break;
      case "safe": delay = 2000; break;
      case "slow": delay = 4000; break;
      default: delay = 8000;
    }

    status.innerText = "📂 Opening form...";
    status.className = "processing";

    try {
      // Create tab with error handling
      activeTab = await chrome.tabs.create({ url: formUrl, active: false }).catch(err => {
        throw new Error('Failed to create tab: ' + err.message);
      });

      updateProgress(0, count);

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
          await sleep(4000);
        }

        status.innerText = `⏳ Processing ${i + 1}/${count}`;
        status.className = "processing";

        updateProgress(i + 1, count);

        await waitForLoad(activeTab.id);

        await chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          func: (cnt, fType, settings, resetCount) => {
            sessionStorage.setItem('totalFormCount', String(cnt));
            if (resetCount) sessionStorage.setItem('submissionCount', '0');
            sessionStorage.setItem('formType', fType);
            sessionStorage.setItem('questionSettings', JSON.stringify(settings));
            sessionStorage.removeItem('submitClickResult');
          },
          args: [count, formType, questionSettings, i === 0]
        });

        await chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          files: ["content.js"]
        });

        const submission = await waitForSubmission(activeTab.id, delay, formType);
        if (!submission.confirmed) {
          submissionError = submission.submitButtonMissing
            ? 'Submit button was not found. The form is open for inspection.'
            : 'Submission could not be confirmed. Check the form for missing answers.';
          status.textContent = `❌ ${submissionError}`;
          status.className = 'error';
          stopBtn.style.display = 'none';
          try {
            await chrome.tabs.update(activeTab.id, { active: true });
          } catch (error) {
            console.error('Could not bring the form tab forward:', error);
          }
          break;
        }

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

      const finalStatus = submissionError
        ? `❌ ${submissionError}`
        : running ? "✅ All Done!" : "⛔ Stopped";
      status.innerText = finalStatus;
      status.className = submissionError ? "error" : running ? "success" : "error";
      stopBtn.style.display = "none";
      status.style.setProperty('--progress', '0%');
      
      // Close the tab after completion
      if (activeTab && !submissionError) {
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

  stopBtn.addEventListener("click", () => {
    running = false;
  });

  if (updatesBtn) {
    updatesBtn.addEventListener('click', () => {
      if (updatesModal) {
        updatesModal.classList.add('active');
      }
    });
  }

  if (closeUpdatesBtn && updatesModal) {
    closeUpdatesBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      updatesModal.classList.remove('active');
    });
  }

  if (updatesModal) {
    updatesModal.addEventListener('click', (e) => {
      if (e.target.id === 'updatesModal') {
        e.target.classList.remove('active');
      }
    });
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function waitForLoad(tabId) {
  return new Promise((resolve, reject) => {
    const cleanup = () => chrome.tabs.onUpdated.removeListener(listener);
    const listener = (id, info) => {
      if (id === tabId && info.status === 'complete') {
        cleanup();
        resolve();
      }
    };

    chrome.tabs.onUpdated.addListener(listener);
    chrome.tabs.get(tabId).then(tab => {
      if (tab.status === 'complete') {
        cleanup();
        resolve();
      }
    }).catch(error => {
      cleanup();
      reject(error);
    });
  });
}

function waitForSubmission(tabId, delay = 2000, formType = "google") {
  return new Promise((resolve, reject) => {
    const initialDelay = Math.max(6000, Math.floor(delay * 1.2));
    const checkInterval = Math.max(500, Math.floor(delay * 0.5));
    const maxChecks = 30;
    let checkCount = 0;

    const check = async () => {
      try {
        checkCount++;
        const [result] = await chrome.scripting.executeScript({
          target: { tabId },
          func: fType => {
            const text = (document.body?.innerText || '').toLowerCase();
            if (fType === 'microsoft') {
              return {
                confirmed: text.includes('thank') || text.includes('thanks') ||
                  text.includes('submitted') || text.includes('response received'),
                submitButtonMissing: sessionStorage.getItem('submitClickResult') === 'button-not-found'
              };
            }

            const confirmationText = /\byour response has been recorded\b|\bresponse has been recorded\b|\bresponse submitted successfully\b|\bthank you for your response\b|\bthanks for responding\b/i;
            const confirmed = confirmationText.test(text) ||
              /\/formresponse(?:\/|$)/i.test(location.pathname) ||
              Boolean(document.querySelector('[class*="ResponseConfirmation"]'));
            return {
              confirmed,
              submitButtonMissing: sessionStorage.getItem('submitClickResult') === 'button-not-found'
            };
          },
          args: [formType]
        });

        if (result.result.confirmed) {
          resolve({ confirmed: true, submitButtonMissing: false });
        } else if (result.result.submitButtonMissing) {
          resolve({ confirmed: false, submitButtonMissing: true });
        } else if (checkCount >= maxChecks) {
          resolve({ confirmed: false, submitButtonMissing: false });
        } else {
          setTimeout(check, checkInterval);
        }
      } catch (error) {
        reject(error);
      }
    };

    setTimeout(check, initialDelay);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPopup);
} else {
  initPopup();
}