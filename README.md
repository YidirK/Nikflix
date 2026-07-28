<p align="center">
  <img src="assets/50k-users.png" alt="50 000 users" width="600"/>
</p>

# Netflix Password-Sharing (household) Bypass Extension

An extension that allows bypassing Netflix's password-sharing restrictions.
If you like this project, consider giving it a star ⭐ or a tip if you feel generous!


## 📥 Installation on Chrome, Edge, Brave , or any other Chromium-based browser

[![Download on Chrome](https://img.shields.io/badge/Download-Chrome-blue?logo=googlechrome)](https://chromewebstore.google.com/detail/nikflix/knjoabokknkpkhbbdclmnjcoeedmgema?hl=en-GB&authuser=0)
[![Chrome Web Store Rating](https://img.shields.io/chrome-web-store/rating/knjoabokknkpkhbbdclmnjcoeedmgema)](https://chromewebstore.google.com/detail/nikflix/knjoabokknkpkhbbdclmnjcoeedmgema?hl=en-GB&authuser=0)
[![Chrome Web Store Users](https://img.shields.io/chrome-web-store/users/knjoabokknkpkhbbdclmnjcoeedmgema)](https://chromewebstore.google.com/detail/nikflix/knjoabokknkpkhbbdclmnjcoeedmgema?hl=en-GB&authuser=0)

## 📥 Installation on Firefox Browser

[![Download on Firefox](https://img.shields.io/badge/Download-Firefox-orange?logo=firefox)](https://addons.mozilla.org/fr/firefox/addon/nikflix/)
[![Mozilla Add-on Stars](https://img.shields.io/amo/stars/nikflix)](https://addons.mozilla.org/fr/firefox/addon/nikflix/)
[![Mozilla Add-on Users](https://img.shields.io/amo/users/nikflix)](https://addons.mozilla.org/fr/firefox/addon/nikflix/)

----
## 🌐 Website

You can check out our website here:  
https://nikflix.hergol.me
---

## ✨ Features

- Bypasses Netflix account-sharing restrictions
- Works directly in the browser with no complex configuration
-  Get Around the Netflix Password-Sharing Ban (Netflix household).
<p align="center">
  <img src="assets/demo.png" alt="DEMO" width="300"/>
</p>

----

# 📝 Changelog

## [1.9.3] - 2026-05-12
- ✓ Fix: resolved service worker crashes and improved compatibility with the Teleparty sidebar (thanks to [RenatoGarciaLopes](https://github.com/RenatoGarciaLopes))
- ✓ Chromium: added i18n support to automatically detect and translate the user’s language. You can add your own language support in `#translate`

# 🌍 Translation
To add your own language translation:

1. Go to the `_locales` folder.
2. Create a new folder using your language code (for example: `fr`, `es`, `de`, etc.).
3. Inside that folder, create a `messages.json` file.
4. Copy the structure from another existing language file.
5. Translate the values and save the file.

Example:
```txt
_locales/
 ├── en/
 │    └── messages.json
 ├── fr/
 │    └── messages.json
 ```

## 👥 Contributors
<a href="https://github.com/YidirK/Nikflix/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=YidirK/Nikflix" />
</a> 


## 💬 Note
Several people have contacted me to inform me about a technique that directly blocks Netflix API, which is used to check whether you are part of the Netflix household.
However, I prefer not to use this method for two reasons:
- It doesn’t always work, and its effectiveness depends on the region.
- From a legal standpoint, my extension is less risky because we simply modify the content that has already been sent and add our own content on top. We don’t block any requests, which is legally safer. I wanted to avoid any legal issues for myself and also protect my users from being banned.
##  🤝 Contributing
Contributions are welcome! Feel free to submit a Pull Request or report an issue.


## ⚠️ Disclaimer

This extension may violate Netflix's terms of service. Use at your own risk.

---

## 📄 License
This project is under license.
See LICENSE file for details.

---
### ⭐ Enjoying the extension? Show your support with a star — or a tip if you feel generous! ⭐
[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/S6S61G68F3)
