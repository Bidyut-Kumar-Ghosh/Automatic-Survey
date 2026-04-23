(function () {

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

})();