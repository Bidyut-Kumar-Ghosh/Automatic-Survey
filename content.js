(function () {

  let formType = sessionStorage.getItem('formType') || 'google';
  const questionSettings = JSON.parse(sessionStorage.getItem('questionSettings') || '[]');

  function randomChoice(items) {
    if (!items || !items.length) return null;
    return items[Math.floor(Math.random() * items.length)];
  }

  function randomClick(options) {
    const choice = randomChoice(Array.from(options));
    if (!choice) return false;
    choice.click();
    return true;
  }

  function clickSubmitButton() {
    const buttons = Array.from(document.querySelectorAll('button[type="submit"], input[type="submit"], [role="button"]'));
    const submitButton = buttons.find(button => {
      if (!button.getClientRects().length || button.disabled || button.getAttribute('aria-disabled') === 'true') {
        return false;
      }

      const label = String(
        button.getAttribute('aria-label') ||
        button.innerText ||
        button.textContent ||
        button.value ||
        ''
      ).replace(/\s+/g, ' ').trim().toLowerCase();
      return /^(submit|submit form|submit response|send)$/.test(label);
    });

    if (!submitButton) {
      console.error('Could not find a visible Submit button.');
      return false;
    }

    submitButton.click();
    return true;
  }

  function weightedChoice(options, weights) {
    const entries = Array.from(options).map((option, index) => ({
      option,
      weight: Number(weights && weights[index])
    })).filter(entry => entry.weight > 0);

    if (!weights) {
      return randomChoice(Array.from(options));
    }
    if (entries.length === 0) {
      return null;
    }

    const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);
    let remaining = Math.random() * totalWeight;
    for (const entry of entries) {
      remaining -= entry.weight;
      if (remaining < 0) return entry.option;
    }
    return entries[entries.length - 1].option;
  }

  function randomTextValue() {
    const words = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel', 'india', 'juliet', 'kilo', 'lima', 'mike', 'november', 'oscar', 'papa', 'quebec', 'romeo', 'sierra', 'tango', 'uniform', 'victor', 'whiskey', 'xray', 'yankee', 'zulu'];
    const count = 2 + Math.floor(Math.random() * 3);
    const text = Array.from({ length: count }, () => randomChoice(words)).join(' ');
    return `${text} ${Math.floor(Math.random() * 900 + 100)}`;
  }

  function normalizeText(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/&nbsp;/gi, ' ')
      .replace(/[^a-z0-9\s\-–]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function getQuestionText(element) {
    if (!element) return '';
    const prompt = element.querySelector(
      '[role="heading"], [data-automation-id="questionTitle"], .M7eMe'
    ) || element;
    const text = prompt.innerText ||
      prompt.textContent ||
      prompt.getAttribute('aria-label') ||
      prompt.getAttribute('title') ||
      '';
    return String(text).replace(/\s+/g, ' ').trim();
  }

  function getAgeBounds(questionText) {
    const text = normalizeText(questionText);
    const lowerMatch = text.match(/(?:minimum|min|lowest|lower|from|at least|older than|over|above)\s*(\d{1,3})/i);
    const upperMatch = text.match(/(?:maximum|max|highest|upper|no more than|up to|under|below|less than|younger than|before)\s*(\d{1,3})/i);

    let minAge = 18;
    let maxAge = 65;

    if (lowerMatch && Number(lowerMatch[1])) {
      minAge = Math.max(0, Number(lowerMatch[1]));
    }
    if (upperMatch && Number(upperMatch[1])) {
      maxAge = Math.max(minAge + 1, Number(upperMatch[1]));
    }

    return { min: minAge, max: maxAge };
  }

  function getOptionText(option) {
    const labels = option.labels
      ? Array.from(option.labels).map(label => label.innerText || label.textContent).filter(Boolean).join(' ')
      : '';
    const wrappedLabel = option.closest ? option.closest('label') : null;
    return String(
      option.getAttribute('aria-label') ||
      labels ||
      (wrappedLabel && (wrappedLabel.innerText || wrappedLabel.textContent)) ||
      option.innerText ||
      option.textContent ||
      (option.parentElement && option.parentElement.innerText) ||
      option.value ||
      ''
    ).trim();
  }

  function pickAgeOption(options, questionText) {
    const text = normalizeText(questionText);
    if (!/\b(age|years old|years of age|how old|birth year|date of birth)\b/i.test(text)) {
      return null;
    }

    const bounds = getAgeBounds(questionText);
    const entries = Array.from(options).map(option => {
      const label = normalizeText(getOptionText(option));
      const rangeMatch = label.match(/(\d{1,3})\s*(?:-|–|to)\s*(\d{1,3})/);
      const singleMatch = label.match(/\b(\d{1,3})\b/);
      const firstNum = rangeMatch ? Number(rangeMatch[1]) : singleMatch ? Number(singleMatch[1]) : null;
      const secondNum = rangeMatch ? Number(rangeMatch[2]) : null;

      return {
        option,
        firstNum,
        secondNum,
        label
      };
    });

    const validEntries = entries.filter(({ firstNum, secondNum }) => {
      if (firstNum === null && secondNum === null) return true;
      if (secondNum !== null) return firstNum >= bounds.min && secondNum <= bounds.max;
      return firstNum >= bounds.min && firstNum <= bounds.max;
    });

    if (validEntries.length > 0) {
      return validEntries[Math.floor(Math.random() * validEntries.length)].option;
    }

    const fallback = entries[Math.floor(Math.random() * entries.length)];
    return fallback ? fallback.option : null;
  }

  function pickEducationOption(options, questionText) {
    const text = normalizeText(questionText);
    if (!/(education|educational|school|degree|qualification|academic|highest level|study)/i.test(text)) {
      return null;
    }

    const priority = [
      { pattern: /(doctorate|phd|professional degree|md|jd|law degree|medical degree)/i, value: 7 },
      { pattern: /(master|msc|mba|postgraduate|graduate degree)/i, value: 6 },
      { pattern: /(bachelor|undergraduate|degree)/i, value: 5 },
      { pattern: /(associate|technical|diploma|trade|community college)/i, value: 4 },
      { pattern: /(some college|college|certificate)/i, value: 3 },
      { pattern: /(high school|secondary|ged|diploma)/i, value: 2 },
      { pattern: /(primary|middle school|elementary|junior high)/i, value: 1 },
      { pattern: /(no formal|none|not completed)/i, value: 0 }
    ];

    const entries = Array.from(options).map(option => {
      const label = normalizeText(getOptionText(option));
      const score = priority.find(item => item.pattern.test(label))?.value || 0;
      return { option, score, label };
    });

    const best = entries.filter(({ score }) => score > 0);
    if (best.length > 0) {
      const topScore = Math.max(...best.map(entry => entry.score));
      const candidates = best.filter(entry => entry.score === topScore);
      return candidates[Math.floor(Math.random() * candidates.length)].option;
    }

    return entries.length > 0 ? entries[Math.floor(Math.random() * entries.length)].option : null;
  }

  function pickContextualOption(options, questionText) {
    const ageOption = pickAgeOption(options, questionText);
    if (ageOption) return ageOption;

    const educationOption = pickEducationOption(options, questionText);
    if (educationOption) return educationOption;

    const question = normalizeText(questionText);
    const isFrequencyQuestion = /\b(how often|frequency|frequently|regularly|per day|per week|per month|per year)\b/i.test(question);
    const isOpinionQuestion = /\b(satisf\w*|agree\w*|disagree\w*|recommend\w*|likely|likelihood|rating|rate|quality|easy|difficult|impact|important|extent|confident|experience)\b/i.test(question);
    if (!isFrequencyQuestion && !isOpinionQuestion) {
      return null;
    }

    const entries = Array.from(options).map(option => ({
      option,
      label: normalizeText(getOptionText(option))
    }));
    const neutralEntry = entries.find(({ label }) =>
      /\b(neutral|neither|not sure|unsure|no preference|don t know|do not know|moderate|average|sometimes|occasionally)\b/i.test(label)
    );

    if (neutralEntry) {
      return neutralEntry.option;
    }

    return entries.length > 0 ? entries[Math.floor(entries.length / 2)].option : null;
  }

  // Scroll to load all questions
  async function loadAllQuestions() {
    return new Promise(resolve => {
      let lastScrollHeight = document.documentElement.scrollHeight;
      let scrollAttempts = 0;
      const maxAttempts = 50;

      const scrollInterval = setInterval(() => {
        window.scrollBy(0, window.innerHeight);
        
        const newScrollHeight = document.documentElement.scrollHeight;
        scrollAttempts++;

        if (newScrollHeight === lastScrollHeight || scrollAttempts >= maxAttempts) {
          clearInterval(scrollInterval);
          window.scrollTo(0, 0); // Scroll back to top
          setTimeout(() => resolve(), 500);
        }
        lastScrollHeight = newScrollHeight;
      }, 200);
    });
  }

  // Handle Google Forms
  if (formType === 'google') {
    (async () => {
      // First, scroll to load all questions
      await loadAllQuestions();

      let submissionCount = parseInt(sessionStorage.getItem('submissionCount') || '0');
      let questionIndex = 0;

      // Find ALL question containers (works for all question types)
      const questionContainers = document.querySelectorAll('[role="listitem"]');
      
      console.log(`Found ${questionContainers.length} questions to fill`);
    
    questionContainers.forEach((container) => {
      const questionText = getQuestionText(container);
      const settings = questionSettings[questionIndex];

      // 1. Radio buttons (Single choice)
      const radioOptions = container.querySelectorAll('[role="radio"]');
      if (radioOptions.length > 0) {
        const selectedOption = settings && settings.kind === 'rating'
          ? radioOptions[settings.selectedIndex]
          : settings && settings.kind === 'choice'
            ? weightedChoice(radioOptions, settings.weights)
            : pickContextualOption(radioOptions, questionText) || weightedChoice(radioOptions);
        if (selectedOption) selectedOption.click();
        questionIndex++;
        return;
      }

      // 2. Checkboxes (Multiple choice)
      const checkboxOptions = container.querySelectorAll('[role="checkbox"]');
      if (checkboxOptions.length > 0) {
        // Select 1-3 random checkboxes for variety
        const pool = Array.from(checkboxOptions).map((option, index) => ({
          option,
          weight: settings && settings.kind === 'checkbox'
            ? Number(settings.weights[index])
            : 1
        })).filter(entry => entry.weight > 0);
        const numToSelect = Math.ceil(Math.random() * Math.min(3, pool.length));
        for (let i = 0; i < numToSelect; i++) {
          const totalWeight = pool.reduce((sum, entry) => sum + entry.weight, 0);
          let remaining = Math.random() * totalWeight;
          let selectedIndex = pool.length - 1;
          for (let j = 0; j < pool.length; j++) {
            remaining -= pool[j].weight;
            if (remaining < 0) {
              selectedIndex = j;
              break;
            }
          }
          pool.splice(selectedIndex, 1)[0].option.click();
        }
        questionIndex++;
        return;
      }

      // 3. Dropdown/Select elements
      const selectElements = container.querySelectorAll('select, [role="listbox"], [role="combobox"]');
      if (selectElements.length > 0) {
        selectElements.forEach(select => {
          const options = select.querySelectorAll('option, [role="option"]');
          if (options.length > 0) {
            const validOptions = Array.from(options).filter(o =>
              (o.value || o.getAttribute('role') === 'option') && o.textContent.trim()
            );
            const selectedOption = settings && settings.kind === 'choice'
              ? weightedChoice(validOptions, settings.weights)
              : pickContextualOption(validOptions, questionText) || weightedChoice(validOptions);
            if (selectedOption) selectedOption.click();
          }
        });
        questionIndex++;
        return;
      }

      // 4. Text input fields
      const textInputs = container.querySelectorAll('input[type="text"], textarea');
      if (textInputs.length > 0) {
        textInputs.forEach(input => {
          const ageBounds = getAgeBounds(questionText);
          if (/\b(age|years old|years of age|how old|birth year|date of birth)\b/i.test(questionText)) {
            const ageValue = Math.floor(Math.random() * (ageBounds.max - ageBounds.min + 1)) + ageBounds.min;
            input.value = String(ageValue);
          } else {
            input.value = randomTextValue();
          }
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        });
        questionIndex++;
        return;
      }

      // 5. Linear scale / Rating
      const ratingOptions = container.querySelectorAll('[role="radio"][aria-label*="1"], [role="radio"][aria-label*="2"], [role="radio"][aria-label*="3"], [role="radio"][aria-label*="4"], [role="radio"][aria-label*="5"]');
      if (ratingOptions.length > 0) {
        const rating = Math.ceil(Math.random() * ratingOptions.length);
        if (ratingOptions[rating - 1]) {
          ratingOptions[rating - 1].click();
        }
        questionIndex++;
        return;
      }

      // 6. Date/Time inputs
      const dateInputs = container.querySelectorAll('input[type="date"], input[type="time"]');
      if (dateInputs.length > 0) {
        const today = new Date();
        dateInputs.forEach(input => {
          if (input.type === 'date') {
            input.value = today.toISOString().split('T')[0];
          } else if (input.type === 'time') {
            input.value = `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;
          }
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        });
        questionIndex++;
        return;
      }
    });

      console.log(`Filled ${questionIndex} questions`);

      // Click submit button
      setTimeout(() => {
        const clicked = clickSubmitButton();
        sessionStorage.setItem('submitClickResult', clicked ? 'clicked' : 'button-not-found');
        if (clicked) {
          console.log('Clicking submit button');
          sessionStorage.setItem('submissionCount', (submissionCount + 1).toString());
        }
      }, 5000);
    })();
  } 
  // Handle Microsoft Forms
  else if (formType === 'microsoft') {
    (async () => {
      // First, scroll to load all questions
      await loadAllQuestions();

      let submissionCount = parseInt(sessionStorage.getItem('submissionCount') || '0');
      let questionIndex = 0;

      // Find all question items in Microsoft Forms
      const questionItems = document.querySelectorAll('[data-automation-id="questionItem"], .form-item, .form-question, li[data-test-id]');
      
      console.log(`Found ${questionItems.length} questions to fill`);
    
      questionItems.forEach((item) => {
      const questionText = getQuestionText(item);

      // 1. Radio buttons (single choice)
      let options = item.querySelectorAll('input[type="radio"]');
      if (options.length > 0) {
        const selectedOption = pickContextualOption(options, questionText);
        if (selectedOption) {
          selectedOption.click();
        } else {
          randomClick(options);
        }
        questionIndex++;
        return;
      }

      // 2. Checkboxes (multiple choice)
      options = item.querySelectorAll('input[type="checkbox"]');
      if (options.length > 0) {
        const numToSelect = Math.ceil(Math.random() * Math.min(3, options.length));
        const selected = new Set();
        while (selected.size < numToSelect) {
          selected.add(Math.floor(Math.random() * options.length));
        }
        selected.forEach(idx => options[idx].click());
        questionIndex++;
        return;
      }

      // 3. Text inputs
      const textInputs = item.querySelectorAll('input[type="text"], textarea, .form-input');
      if (textInputs.length > 0) {
        textInputs.forEach(input => {
          const ageBounds = getAgeBounds(questionText);
          if (/\b(age|years old|years of age|how old|birth year|date of birth)\b/i.test(questionText)) {
            const ageValue = Math.floor(Math.random() * (ageBounds.max - ageBounds.min + 1)) + ageBounds.min;
            input.value = String(ageValue);
          } else {
            input.value = randomTextValue();
          }
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        });
        questionIndex++;
        return;
      }

      // 4. Dropdown/Select
      const selectElements = item.querySelectorAll('select');
      if (selectElements.length > 0) {
        selectElements.forEach(select => {
          const options = Array.from(select.querySelectorAll('option')).filter((option, index) =>
            index > 0 && option.value && option.textContent.trim()
          );
          if (options.length > 0) {
            const selectedOption = pickContextualOption(options, questionText) || randomChoice(options);
            select.value = selectedOption.value;
            select.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
        questionIndex++;
        return;
      }
    });

      console.log(`Filled ${questionIndex} questions`);

      // Click submit button for Microsoft Forms
      setTimeout(() => {
        const clicked = clickSubmitButton();
        sessionStorage.setItem('submitClickResult', clicked ? 'clicked' : 'button-not-found');
        if (clicked) {
          console.log('Clicking submit button');
          sessionStorage.setItem('submissionCount', (submissionCount + 1).toString());
        }
      }, 5000);
    })();
  }

})();