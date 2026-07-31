import { t, applyI18n } from '../../src/modules/i18n';

document.getElementById('code-btn')?.addEventListener('click', () => {
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    chrome.tabs.create({ url: 'https://github.com/YidirK/Nikflix' });
  } else {
    window.open('https://github.com/YidirK/Nikflix', '_blank');
  }
});

document.getElementById('coffee-btn')?.addEventListener('click', () => {
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    chrome.tabs.create({ url: 'https://ko-fi.com/yidirk' });
  } else {
    window.open('https://ko-fi.com/yidirk', '_blank');
  }
});

document.getElementById('bug-btn')?.addEventListener('click', () => {
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    chrome.tabs.create({ url: 'https://github.com/YidirK/Nikflix/issues/new?template=bug_report.md' });
  } else {
    window.open('https://github.com/YidirK/Nikflix/issues/new?template=bug_report.md', '_blank');
  }
});

document.getElementById('contact-info')?.addEventListener('click', () => {
  window.open('mailto:yidirk@hergol.me', '_blank');
});

document.addEventListener("DOMContentLoaded", () => {
  applyI18n();
  const versionEl = document.getElementById("version");
  if (versionEl && typeof chrome !== 'undefined' && chrome.runtime?.getManifest) {
    const manifestData = chrome.runtime.getManifest();
    versionEl.textContent = `v${manifestData.version}`;
  }
  checkForUpdate();
  loadContributors();
});

async function checkForUpdate() {
  try {
    const remoteData = await getData();
    if (remoteData && remoteData.version && typeof chrome !== 'undefined' && chrome.runtime?.getManifest) {
      const currentVersion = chrome.runtime.getManifest().version;
      const remoteVersion = remoteData.version;

      if (currentVersion < remoteVersion) {
        openExtensionForUpdate(remoteVersion);
      }
    }
  } catch (error) {
    console.error("Error checking for updates:", error);
  }
}

function openExtensionForUpdate(newVersion: string) {
  const updateMessageEl = document.getElementById('update-message');
  if (updateMessageEl) {
    const msg = t('updateAvailableVersion', [newVersion]);
    updateMessageEl.textContent = msg !== 'updateAvailableVersion'
      ? msg
      : `${t('updateAvailable')} (v${newVersion})`;
    updateMessageEl.style.display = 'block';
  }
}

async function getData() {
  const url = "https://raw.githubusercontent.com/YidirK/Nikflix/refs/heads/master/chromium/manifest.json";
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

const CONTRIBUTORS_URL = "https://api.github.com/repos/YidirK/Nikflix/contributors";
const CONTRIBUTORS_TTL = 24 * 60 * 60 * 1000;
const OWNER = "YidirK";

async function loadContributors() {
  const container = document.getElementById('contributors');
  if (!container) return;

  if (typeof chrome !== 'undefined' && chrome.storage) {
    const cached = (await chrome.storage.local.get("contributors")).contributors;
    if (cached) {
      renderContributors(container, cached.logins);
      if (Date.now() - cached.fetchedAt < CONTRIBUTORS_TTL) return;
    }
  }

  try {
    const response = await fetch(CONTRIBUTORS_URL);
    if (!response.ok) throw new Error(`Response status: ${response.status}`);

    const logins = (await response.json())
      .filter((contributor: any) => contributor.type === "User" && contributor.login !== OWNER)
      .map((contributor: any) => contributor.login);

    renderContributors(container, logins);
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ contributors: { logins, fetchedAt: Date.now() } });
    }
  } catch (error) {
    console.error("Error loading contributors:", error);
  }
}

function renderContributors(container: HTMLElement, logins: string[]) {
  container.replaceChildren();
  logins.forEach((login, index) => {
    const link = document.createElement('a');
    link.href = `https://github.com/${login}`;
    link.target = '_blank';
    link.textContent = `@${login}`;
    container.appendChild(link);

    if (index < logins.length - 1) {
      container.appendChild(document.createTextNode(' • '));
    }
  });
}

function sendMessage(message: string) {
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { message });
      }
    });
  }
}

const toggle = document.getElementById('controllerToggle') as HTMLInputElement | null;
const statusText = document.getElementById('statusText');

if (toggle && statusText) {
  toggle.addEventListener('change', function () {
    if (this.parentElement) {
      this.parentElement.style.transform = 'scale(0.95)';
      setTimeout(() => {
        if (this.parentElement) this.parentElement.style.transform = 'scale(1)';
      }, 150);
    }

    const message = this.checked ? "enable" : "disable";
    statusText.textContent = this.checked ? "Enable" : "Disable";
    statusText.className = this.checked ? "status-text status-active" : "status-text status-inactive";

    sendMessage(message);
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ status: message });
    }
  });
}

const debug = document.getElementById('bug-info');
if (debug) {
  debug.addEventListener('click', () => {
    sendMessage("debug");
  });
}

if (toggle && statusText && typeof chrome !== 'undefined' && chrome.storage) {
  chrome.storage.local.get(["status"], (result) => {
    const status = result.status || "enable";
    toggle.checked = status === "enable";
    statusText.textContent = toggle.checked ? 'Enable' : 'Disable';
    statusText.className = toggle.checked ? 'status-text status-active' : 'status-text status-inactive';
  });
}
