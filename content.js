(function () {

  let formType = sessionStorage.getItem('formType') || 'google';

  function selectOptionByDistribution(options, submissionIndex, totalCount, distributionType) {
    if (!options.length) return;
    
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
        return;
      }
    }
    
    // Fallback to last option
    options[numOptions - 1].click();
  }

  function randomClick(options) {
    if (!options.length) return;
    options[Math.floor(Math.random() * options.length)].click();
  }

  // Handle Google Forms
  if (formType === 'google') {
    const groups = document.querySelectorAll('[role="radiogroup"]');
    let submissionCount = parseInt(sessionStorage.getItem('submissionCount') || '0');
    let totalCount = parseInt(sessionStorage.getItem('totalFormCount') || '50');

    const distributionPatterns = ['descending', 'ascending', 'uniform', 'gaussian', 'random'];

    groups.forEach((group, index) => {
      const options = group.querySelectorAll('[role="radio"]');
      
      // Each question gets a different distribution pattern
      const patternIndex = index % distributionPatterns.length;
      const pattern = distributionPatterns[patternIndex];
      
      if (pattern === 'random') {
        randomClick(options);
      } else {
        selectOptionByDistribution(options, submissionCount, totalCount, pattern);
      }
    });

    // Increment submission counter
    sessionStorage.setItem('submissionCount', (submissionCount + 1).toString());

    setTimeout(() => {
      const btn = document.querySelector('div[role="button"][jsname]');
      if (btn) btn.click();
    }, 1000);
  } 
  // Handle Microsoft Forms
  else if (formType === 'microsoft') {
    let submissionCount = parseInt(sessionStorage.getItem('submissionCount') || '0');
    let totalCount = parseInt(sessionStorage.getItem('totalFormCount') || '50');
    const distributionPatterns = ['descending', 'ascending', 'uniform', 'gaussian', 'random'];

    // Find all question containers in Microsoft Forms
    // Microsoft Forms uses different selectors than Google Forms
    const questionContainers = document.querySelectorAll('[data-automation-id="questionItem"], .ms-TextField-group, [role="group"]');
    
    let questionIndex = 0;
    questionContainers.forEach((container, index) => {
      // Try to find radio buttons or choice inputs
      const radioOptions = container.querySelectorAll('input[type="radio"], input[type="checkbox"]');
      
      if (radioOptions.length > 0) {
        const patternIndex = questionIndex % distributionPatterns.length;
        const pattern = distributionPatterns[patternIndex];
        
        if (pattern === 'random') {
          const randomOption = radioOptions[Math.floor(Math.random() * radioOptions.length)];
          randomOption.click();
        } else {
          // Apply distribution pattern
          let weights = [];
          const numOptions = radioOptions.length;
          
          switch(pattern) {
            case 'descending':
              for (let i = 0; i < numOptions; i++) {
                weights[i] = 1 / Math.pow(2, i);
              }
              break;
            case 'ascending':
              for (let i = 0; i < numOptions; i++) {
                weights[i] = 1 / Math.pow(2, numOptions - 1 - i);
              }
              break;
            case 'uniform':
              for (let i = 0; i < numOptions; i++) {
                weights[i] = 1;
              }
              break;
            case 'gaussian':
              for (let i = 0; i < numOptions; i++) {
                let center = (numOptions - 1) / 2;
                weights[i] = Math.exp(-Math.pow(i - center, 2) / (numOptions / 2));
              }
              break;
          }
          
          let totalWeight = weights.reduce((a, b) => a + b, 0);
          let distribution = weights.map(w => Math.round((w / totalWeight) * totalCount));
          
          let cumulative = 0;
          for (let i = 0; i < numOptions; i++) {
            cumulative += distribution[i];
            if (submissionCount < cumulative) {
              radioOptions[i].click();
              break;
            }
          }
          
          if (cumulative === 0) {
            radioOptions[numOptions - 1].click();
          }
        }
        questionIndex++;
      }
    });

    // Increment submission counter
    sessionStorage.setItem('submissionCount', (submissionCount + 1).toString());

    // Click submit button for Microsoft Forms
    setTimeout(() => {
      // Try different submit button selectors for Microsoft Forms
      let submitBtn = document.querySelector('button[type="submit"]') ||
                      document.querySelector('button:contains("Submit")') ||
                      document.querySelector('[data-automation-id="submitButton"]') ||
                      document.querySelector('button.ms-Button--primary');
      
      if (submitBtn) {
        submitBtn.click();
      }
    }, 1000);
  }

})();