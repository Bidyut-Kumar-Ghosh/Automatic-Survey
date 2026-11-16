## FormFlow – Survey Helper

FormFlow is a Chrome extension that automates the process of filling and submitting surveys. It is designed to help developers, researchers, and students quickly generate multiple responses for testing, analysis, or demonstration purposes.

### ✨ Features
- Auto-fill **Google Forms** and **Microsoft Forms** with random responses
- Supports multiple-choice questions
- Bulk response generation (user-defined count)
- Single-tab execution (no tab clutter)
- Adjustable speed (ultra / fast / safe / slow modes)
- Google Forms question preview with per-question answer distributions
- Individual rating-scale selection before starting a Google Forms run
- Context-aware choices for recognized age, education, frequency, and opinion questions
- Real-time progress tracking
- Start / Stop control
- Intelligent response distribution patterns

### 🚀 Use Cases
- Testing form functionality (Google Forms & Microsoft Forms)
- Generating sample survey datasets
- Demonstrating workflows and automation
- Academic projects and experimentation
- Load testing and stress testing forms

### ⚙️ How It Works
For Google Forms, load a question preview before starting. Set choice percentages for each choice question and select a value for each rating-scale question; these settings take precedence over automatic selection. When no manual choice is configured, recognized age and education questions use their existing matching rules, while frequency and opinion scales prefer a neutral or middle option. Other questions retain random fallback behavior. Microsoft Forms uses the same contextual matching when the question and its options can be recognized.

### 🔧 Supported Platforms
- ✅ **Google Forms** - `https://docs.google.com/forms/...`
- ✅ **Microsoft Forms** - `https://forms.office.com/r/...`

### ⚠️ Disclaimer
This tool is intended for educational and testing purposes only. Use responsibly and avoid misuse on live or sensitive data collection systems.

### 🛠 Tech Stack
- JavaScript (Vanilla)
- Chrome Extension API (Manifest v3)
- DOM Automation
- Cross-platform form handling

---

## 📋 Version History

### v3.1 - Latest Release (November 2026)
**Extension cleanup**

**Changes:**
- ✅ Removed the optional local analytics feature and its host setup

### v2.8 - Context-Aware Question Selection (November 2026)
**Context-Aware Question Selection**

**Changes:**
- ✅ Added contextual matching for recognized age and education questions
- ✅ Prefer neutral or middle options for frequency and opinion scales
- ✅ Preserve configured Google Forms choice percentages and rating selections
- ✅ Keep random fallback behavior when no matching rule applies

### v2.7 - Per-Question Google Forms Setup (November 2026)
**Per-Question Google Forms Setup**

**Changes:**
- ✅ Added a Google Forms question preview before starting a run
- ✅ Added per-question answer percentage controls for choice questions
- ✅ Added a required answer selector for each rating-scale question
- ✅ Preserved automatic filling for other question types and Microsoft Forms

### v2.6 (November 2026)
**Popup UI Refresh**

**Changes:**
- ✅ Refreshed the popup layout, controls, and status styling
- ✅ Added a visual progress indicator
- ✅ Improved form labels and keyboard focus visibility
- ✅ Respects reduced-motion preferences

### v2.5 - December 2024
**Major Update: Dual-Platform Support & Performance Improvements**

**New Features:**
- ✅ Full support for Microsoft Forms (forms.office.com)
- ✅ Automatic platform detection (Google vs Microsoft)
- ✅ All question types now supported: radio buttons, checkboxes, dropdowns, text inputs, date/time, rating scales

**Fixes & Improvements:**
- ✅ Fixed critical bug: All questions now fill correctly (previously only first 5-6 questions were filled)
- ✅ Implemented lazy-loading detection and scroll-based question loading
- ✅ Enhanced tab management with automatic error recovery
- ✅ Tab closure detection mid-process with automatic recreation
- ✅ Improved submission detection timing (increased from 300ms to 3000ms initial delay)
- ✅ Better error handling with graceful fallbacks

**UI Enhancements:**
- ✅ Modern glassmorphism design with purple/pink/orange gradient theme
- ✅ Smooth animations and transitions (0.5-0.8s ease-out)
- ✅ Version badge display in popup header
- ✅ Updates notification icon with changelog modal
- ✅ Enhanced visual feedback for all interactions

**Technical Improvements:**
- ✅ Refined distribution patterns (ascending, descending, uniform, gaussian, random)
- ✅ Cross-platform JavaScript execution
- ✅ Session storage for multi-tab coordination
- ✅ Scroll-based DOM element detection for dynamic content

**Installation:**
1. Download the extension files
2. Go to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the extension folder

**Usage:**
1. Open the FormFlow extension popup
2. Paste a Google Forms or Microsoft Forms link/ID
3. Set the number of responses to generate
4. Choose speed preference (Ultra Fast to Slow)
5. Click "▶ Start" to begin automation
6. Monitor progress in real-time

**Supported Question Types:**
- Single choice (radio buttons)
- Multiple choice (checkboxes)
- Dropdown/select menus
- Short text inputs
- Long text areas
- Date inputs
- Time inputs
- Linear/rating scales (1-5)

---

### v2.0 - Initial Release (November 2024)
**First Public Release**

**Features:**
- ✅ Google Forms automation support
- ✅ Basic question filling with random answers
- ✅ Bulk response generation
- ✅ Speed control (4 preset modes)
- ✅ Progress tracking
- ✅ Start/Stop controls
- ✅ Simple UI design

**Supported Platforms:**
- Google Forms only

**Known Limitations:**
- Limited to Google Forms
- Basic question type support
- Manual tab management

---

## 🔄 Migration Guide

**From v2.7 to v2.8:**
- No breaking changes
- Google Forms choice percentages and rating selections continue to take precedence
- Recognized questions may now receive a contextual neutral or matching option; other questions keep random fallback behavior

---

## 🐛 Known Issues & Troubleshooting

**Issue: "Invalid Form Link" error**
- Solution: Ensure you've copied the complete link from Google Forms or Microsoft Forms

**Issue: Tab closing on some devices**
- Solution: v2.5 includes automatic tab recreation - if tab closes, it will automatically reopen and continue

**Issue: Only partial questions filling**
- Solution: Increase delay setting to "Safe" or "Slow" for forms with many questions

**Issue: Question preview does not show all questions**
- Solution: Wait for the Google Form to load completely, then select "Load Google Form Questions" again

**Issue: Chrome shows "Leave site? Changes you made may not be saved"**
- The extension waits for a submission confirmation before navigating. If none appears, it stops and brings the form forward so you can check for missing answers.

---

## 📞 Support & Feedback

For issues, suggestions, or feature requests, please open an issue on the repository.

**Developer:** Bidyut Kumar Ghosh  
**Last Updated:** November 2026
**Current Version:** 3.1
