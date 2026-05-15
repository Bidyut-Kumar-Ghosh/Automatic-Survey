## FormFlow – Survey Helper

FormFlow is a Chrome extension that automates the process of filling and submitting surveys. It is designed to help developers, researchers, and students quickly generate multiple responses for testing, analysis, or demonstration purposes.

### ✨ Features
- Auto-fill **Google Forms** and **Microsoft Forms** with random responses
- Supports multiple-choice questions
- Bulk response generation (user-defined count)
- Single-tab execution (no tab clutter)
- Adjustable speed (ultra / fast / safe / slow modes)
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
The extension opens a form, detects question elements, selects answers based on distribution patterns, and submits responses automatically in a controlled loop. It supports both Google Forms and Microsoft Forms with intelligent platform detection.

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

### v2.5 - Latest Release (December 2024)
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

**From v2.0 to v2.5:**
- No breaking changes
- Old functionality maintained
- New Microsoft Forms support optional
- Enhanced error recovery automatic

---

## 🐛 Known Issues & Troubleshooting

**Issue: "Invalid Form Link" error**
- Solution: Ensure you've copied the complete link from Google Forms or Microsoft Forms

**Issue: Tab closing on some devices**
- Solution: v2.5 includes automatic tab recreation - if tab closes, it will automatically reopen and continue

**Issue: Only partial questions filling**
- Solution: Increase delay setting to "Safe" or "Slow" for forms with many questions

**Issue: "10 question(s) need to be completed" error**
- Solution: This is now fixed in v2.5 - all questions will load before submission

---

## 📞 Support & Feedback

For issues, suggestions, or feature requests, please open an issue on the repository.

**Developer:** Bidyut Kumar Ghosh  
**Last Updated:** December 2024  
**Current Version:** 2.5



New Update Coming Soon