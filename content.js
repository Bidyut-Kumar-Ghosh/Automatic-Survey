(function () {

  let formType = sessionStorage.getItem('formType') || 'google';

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
    const textBits = [
      element.innerText,
      element.textContent,
      element.getAttribute('aria-label'),
      element.getAttribute('title')
    ];
    return textBits.filter(Boolean).join(' ');
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

  function pickAgeOption(options, questionText) {
    const text = normalizeText(questionText);
    if (!/(age|years old|years of age|how old|birth year|date of birth)/i.test(text)) {
      return null;
    }

    const bounds = getAgeBounds(questionText);
    const entries = Array.from(options).map(option => {
      const label = normalizeText(option.textContent || option.value || option.getAttribute('aria-label') || '');
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
      const label = normalizeText(option.textContent || option.value || option.getAttribute('aria-label') || '');
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
    
    questionContainers.forEach((container, index) => {
      const questionText = getQuestionText(container);

      // 1. Radio buttons (Single choice)
      const radioOptions = container.querySelectorAll('[role="radio"]');
      if (radioOptions.length > 0) {
        randomClick(radioOptions);
        questionIndex++;
        return;
      }

      // 2. Checkboxes (Multiple choice)
      const checkboxOptions = container.querySelectorAll('[role="checkbox"]');
      if (checkboxOptions.length > 0) {
        // Select 1-3 random checkboxes for variety
        const numToSelect = Math.ceil(Math.random() * Math.min(3, checkboxOptions.length));
        const selected = new Set();
        while (selected.size < numToSelect) {
          selected.add(Math.floor(Math.random() * checkboxOptions.length));
        }
        selected.forEach(idx => checkboxOptions[idx].click());
        questionIndex++;
        return;
      }

      // 3. Dropdown/Select elements
      const selectElements = container.querySelectorAll('select, [role="listbox"], [role="combobox"]');
      if (selectElements.length > 0) {
        selectElements.forEach(select => {
          const options = select.querySelectorAll('option, [role="option"]');
          if (options.length > 0) {
            const validOptions = Array.from(options).filter(o => o.value && o.textContent.trim());
            const ageChoice = pickAgeOption(validOptions, questionText);
            const educationChoice = pickEducationOption(validOptions, questionText);

            if (ageChoice) {
              ageChoice.click();
              return;
            }
            if (educationChoice) {
              educationChoice.click();
              return;
            }

            validOptions[Math.floor(Math.random() * validOptions.length)].click();
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
          if (/(age|years old|years of age|how old|birth year|date of birth)/i.test(questionText)) {
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

      // Increment submission counter
      sessionStorage.setItem('submissionCount', (submissionCount + 1).toString());

      // Click submit button
      setTimeout(() => {
        const btn = document.querySelector('div[role="button"][jsname]') || document.querySelector('button[type="submit"]');
        if (btn) {
          console.log('Clicking submit button');
          btn.click();
        }
      }, 1500);
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
        randomClick(options);
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
          if (/(age|years old|years of age|how old|birth year|date of birth)/i.test(questionText)) {
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
          const opts = select.querySelectorAll('option');
          if (opts.length > 1) {
            select.value = opts[Math.floor(Math.random() * (opts.length - 1)) + 1].value;
            select.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
        questionIndex++;
        return;
      }
    });

      console.log(`Filled ${questionIndex} questions`);

      // Increment submission counter
      sessionStorage.setItem('submissionCount', (submissionCount + 1).toString());

      // Click submit button for Microsoft Forms
      setTimeout(() => {
        const submitBtn = document.querySelector('button[aria-label*="Submit"]') ||
                          document.querySelector('button[type="submit"]') ||
                          document.querySelector('[data-automation-id="submitButton"]') ||
                          document.querySelector('button.ms-Button--primary') ||
                          Array.from(document.querySelectorAll('button')).find(b => b.textContent.toLowerCase().includes('submit'));
        
        if (submitBtn) {
          console.log('Clicking submit button');
          submitBtn.click();
        }
      }, 1500);
    })();
  }

})();