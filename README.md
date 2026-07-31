<p align="center">
  <img src="assets/50k-users.png" alt="50,000 users" width="600"/>
</p>

# Netflix Password-Sharing (Household) Bypass Extension

An open-source browser extension that allows bypassing Netflix's password-sharing (Household) restrictions.

If you like this project, consider giving it a ⭐ or supporting it with a tip!

---


## 📥 Installation on Chrome, Edge, Brave, and other Chromium-based browsers

[![Download on Chrome](https://img.shields.io/badge/Download-Chrome-blue?logo=googlechrome)](https://chromewebstore.google.com/detail/nikflix/knjoabokknkpkhbbdclmnjcoeedmgema?hl=en-GB&authuser=0)

[![Chrome Web Store Rating](https://img.shields.io/chrome-web-store/rating/knjoabokknkpkhbbdclmnjcoeedmgema)](https://chromewebstore.google.com/detail/nikflix/knjoabokknkpkhbbdclmnjcoeedmgema?hl=en-GB&authuser=0)

[![Chrome Web Store Users](https://img.shields.io/chrome-web-store/users/knjoabokknkpkhbbdclmnjcoeedmgema)](https://chromewebstore.google.com/detail/nikflix/knjoabokknkpkhbbdclmnjcoeedmgema?hl=en-GB&authuser=0)

---

## 📥 Installation on Firefox

[![Download on Firefox](https://img.shields.io/badge/Download-Firefox-orange?logo=firefox)](https://addons.mozilla.org/firefox/addon/nikflix/)

[![Mozilla Add-on Stars](https://img.shields.io/amo/stars/nikflix)](https://addons.mozilla.org/firefox/addon/nikflix/)

[![Mozilla Add-on Users](https://img.shields.io/amo/users/nikflix)](https://addons.mozilla.org/firefox/addon/nikflix/)

---

## 🌐 Website

Visit our website:

https://nikflix.hergol.me

---

# ✨ Features

- Bypass Netflix Household restrictions.
- Works directly in your browser.
- No complex configuration required.
- Supports Chromium-based browsers and Firefox.
- Open source.
- Modern TypeScript codebase powered by WXT.

<p align="center">
  <img src="assets/demo.png" alt="Demo" width="300"/>
</p>

---

# 📝 Changelog
## [1.9.4] - 2026-07-31

### 🚀 Major Rewrite

- ✓ Complete project rewrite.
- ✓ Migrated from JavaScript to **TypeScript**.
- ✓ Migrated to the **WXT Framework**.
- ✓ Cleaner architecture.
- ✓ Easier maintenance.
- ✓ Improved developer experience.
- ✓ Simplified browser compatibility.

### ✨ New Features

- ✓ Added a dynamic contributors list.

### 🛠️ Fixes

#### Thanks to @reservedbytes

- ✓ Fixed controller delay and `null` video `TypeError`.
- ✓ Fixed click dead zones and made small UI improvements.
- ✓ Fixed popup failing to load due to an i18n import casing issue.
- ✓ Fixed clashing player UIs on accounts without the Household restriction.
- ✓ Fixed the controller not rebuilding when Netflix automatically changes episodes.

#### Thanks to @AdmirableAmbiguity

- ✓ Fixed the fullscreen overlay scrollbar issue.

## [1.9.3] - 2026-05-12

- ✓ Fixed service worker crashes.
- ✓ Improved compatibility with the Teleparty sidebar (thanks to RenatoGarciaLopes).
- ✓ Added Chromium i18n support with automatic language detection.
---

# 🌍 Translation

Want to translate Nikflix?

1. Go to the `_locales` folder.
2. Create a folder using your language code (`fr`, `es`, `de`, etc.).
3. Add a `messages.json` file.
4. Copy an existing translation.
5. Translate the values.

Example:

```text
_locales/
├── en/
│   └── messages.json
├── fr/
│   └── messages.json
```

---

## 👥 Contributors

<a href="https://github.com/YidirK/Nikflix/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=YidirK/Nikflix" />
</a>

---

## 💬 Technical Note

Several people have suggested blocking the Netflix API responsible for checking whether a user belongs to a Netflix Household.

I intentionally chose **not** to use this approach for several reasons:

- It is unreliable and its effectiveness varies depending on the region.
- It is easier for Netflix to detect.
- From a legal perspective, Nikflix is designed to modify the page after Netflix has already delivered its content, rather than blocking or interfering with network requests.
- This approach reduces legal risks for both the project and its users.

---

## 🤝 Contributing

Contributions are always welcome!

Whether it's:

- Fixing bugs
- Improving compatibility
- Adding new translations
- Refactoring code
- Improving documentation

Feel free to open an Issue or submit a Pull Request.

---

## ⚠️ Disclaimer

This extension may violate Netflix's Terms of Service.

Use it at your own risk.

---

## 📄 License

This project is released under the LICENSE included in this repository.

---

### ⭐ Enjoying Nikflix?

If this project helped you, please consider giving it a GitHub ⭐.

You can also support future development with a small donation.

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/S6S61G68F3)