(function () {

  let formType = sessionStorage.getItem('formType') || 'google';

  function selectOptionByDistribution(options, submissionIndex, totalCount, distributionType) {
    if (!options.length) return false;
    
    const numOptions = options.length;
    let weights = [];
    
    // Different distribution patterns for variety
    switch(distributionType) {
      case 'descending':
        // Descending: 1, 0.5, 0.25, 0.125...
        for (let i = 0; i < numOptions; i++) {
          weights[i] = 1 / Math.pow(2, i);
        }
        break;
      case 'ascending':
        // Ascending: 0.125, 0.25, 0.5, 1 (reverse)
        for (let i = 0; i < numOptions; i++) {
          weights[i] = 1 / Math.pow(2, numOptions - 1 - i);
        }
        break;
      case 'uniform':
        // Uniform: equal distribution
        for (let i = 0; i < numOptions; i++) {
          weights[i] = 1;
        }
        break;
      case 'gaussian':
        // Gaussian: peak in middle
        for (let i = 0; i < numOptions; i++) {
          let center = (numOptions - 1) / 2;
          weights[i] = Math.exp(-Math.pow(i - center, 2) / (numOptions / 2));
        }
        break;
      default:
        for (let i = 0; i < numOptions; i++) {
          weights[i] = 1 / Math.pow(2, i);
        }
    }
    
    // Normalize weights
    let totalWeight = weights.reduce((a, b) => a + b, 0);
    let distribution = weights.map(w => Math.round((w / totalWeight) * totalCount));
    
    // Calculate cumulative distribution
    let cumulative = 0;
    for (let i = 0; i < numOptions; i++) {
      cumulative += distribution[i];
      if (submissionIndex < cumulative) {
        options[i].click();
        return true;
      }
    }
    
    // Fallback to last option
    options[numOptions - 1].click();
    return true;
  }

  function randomClick(options) {
    if (!options.length) return false;
    options[Math.floor(Math.random() * options.length)].click();
    return true;
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
      let totalCount = parseInt(sessionStorage.getItem('totalFormCount') || '50');
      const distributionPatterns = ['descending', 'ascending', 'uniform', 'gaussian', 'random'];
      let questionIndex = 0;

      // Find ALL question containers (works for all question types)
      const questionContainers = document.querySelectorAll('[role="listitem"]');
      
      console.log(`Found ${questionContainers.length} questions to fill`);
    
    questionContainers.forEach((container, index) => {
      const patternIndex = questionIndex % distributionPatterns.length;
      const pattern = distributionPatterns[patternIndex];

      // 1. Radio buttons (Single choice)
      const radioOptions = container.querySelectorAll('[role="radio"]');
      if (radioOptions.length > 0) {
        if (pattern === 'random') {
          randomClick(radioOptions);
        } else {
          selectOptionByDistribution(radioOptions, submissionCount, totalCount, pattern);
        }
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
            // Skip first option if it's placeholder
            const validOptions = Array.from(options).filter(o => o.value && o.textContent.trim());
            if (validOptions.length > 0) {
              validOptions[Math.floor(Math.random() * validOptions.length)].click();
            }
          }
        });
        questionIndex++;
        return;
      }

      // 4. Text input fields
      const textInputs = container.querySelectorAll('input[type="text"], textarea');
      if (textInputs.length > 0) {
        textInputs.forEach(input => {
          input.value = `Response ${submissionCount + 1}`;
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
      let totalCount = parseInt(sessionStorage.getItem('totalFormCount') || '50');
      const distributionPatterns = ['descending', 'ascending', 'uniform', 'gaussian', 'random'];
      let questionIndex = 0;

      // Find all question items in Microsoft Forms
      const questionItems = document.querySelectorAll('[data-automation-id="questionItem"], .form-item, .form-question, li[data-test-id]');
      
      console.log(`Found ${questionItems.length} questions to fill`);
    
      questionItems.forEach((item) => {
      const patternIndex = questionIndex % distributionPatterns.length;
      const pattern = distributionPatterns[patternIndex];

      // 1. Radio buttons (single choice)
      let options = item.querySelectorAll('input[type="radio"]');
      if (options.length > 0) {
        if (pattern === 'random') {
          randomClick(options);
        } else {
          selectOptionByDistribution(options, submissionCount, totalCount, pattern);
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
          input.value = `Response ${submissionCount + 1}`;
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