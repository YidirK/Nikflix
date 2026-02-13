//logique of popup butttons
document.getElementById('code-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://github.com/YidirK/Nikflix' });
});

document.getElementById('coffee-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://ko-fi.com/yidirk' });
});

document.getElementById('bug-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://github.com/YidirK/Nikflix/issues/new?template=bug_report.md' });
});

//get version of the extension
document.addEventListener("DOMContentLoaded", () => {
    const versionEl = document.getElementById("version");
    if (versionEl) {
        const manifestData = chrome.runtime.getManifest();
        versionEl.textContent = `v${manifestData.version}`;
    }
    checkForUpdate();
});

async function checkForUpdate() {
    try {
        const remoteData = await getData();
        if (remoteData && remoteData.version) {
            const currentVersion = chrome.runtime.getManifest().version;
            const remoteVersion = remoteData.version;

            console.log("Current version:", currentVersion);
            console.log("Remote version:", remoteVersion);

            if (currentVersion < remoteVersion) {
                console.log("New version available!");
                // Open the extension popup/page to notify user
                openExtensionForUpdate(remoteVersion);
            } else {
                console.log("Extension is up to date");
            }
        }
    } catch (error) {
        console.error("Error checking for updates:", error);
    }
}

function openExtensionForUpdate(newVersion) {
    const updateMessageEl = document.getElementById('update-message');
    if (updateMessageEl) {
        updateMessageEl.textContent = `New version ${newVersion} is available!`;
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

        const result = await response.json();
        console.log(result);
        console.log("Remote version:", result.version);
        return result;
    } catch (error) {
        console.error(error.message);
        return null;
    }
}


// send message to main.js
function sendMessage(message) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {message: message});
    });
}


const toggle = document.getElementById('controllerToggle');
const statusText = document.getElementById('statusText');
const typeToggle = document.getElementById('controllerTypeToggle');
const typeText = document.getElementById('typeText');

function syncControllerToggle(isNetflix) {
    const container = toggle.closest('.controller-toggle') || toggle.parentElement && toggle.parentElement.parentElement;
    if (isNetflix) {
        toggle.checked = true;
        toggle.disabled = true;
        if (container) container.style.opacity = '0.7';
        statusText.textContent = 'Enable';
        statusText.className = 'status-text status-active';
        sendMessage('enable');
        chrome.storage.session.set({ status: 'enable' });
    } else {
        toggle.disabled = false;
        if (container) container.style.opacity = '1';
    }
}

toggle.addEventListener('change', function() {

    this.parentElement.style.transform = 'scale(0.95)';
    setTimeout(() => {
        this.parentElement.style.transform = 'scale(1)';
    }, 150);


    const message = this.checked ? "enable" : "disable";
    statusText.textContent = this.checked ? "Enable" : "Disable";
    statusText.className = this.checked ? "status-text status-active" : "status-text status-inactive";


    sendMessage(message);
    chrome.storage.session.set({ status: message });
});

typeToggle.addEventListener('change', function() {
    this.parentElement.style.transform = 'scale(0.95)';
    setTimeout(() => {
        this.parentElement.style.transform = 'scale(1)';
    }, 150);

    const value = this.checked ? "netflix" : "nikflix";
    typeText.textContent = this.checked ? "Netflix" : "Nikflix";
    typeText.className = this.checked ? "status-text status-active" : "status-text status-inactive";
    syncControllerToggle(this.checked);

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {message: "controllerType", value: value});
        if (tabs[0].url && tabs[0].url.indexOf("netflix.com") !== -1) {
            chrome.tabs.reload(tabs[0].id);
        }
    });
    chrome.storage.local.set({ controllerType: value });
});

// Logique du bouton debug
const debug = document.getElementById('bug-info');

debug.addEventListener('click', function() {
    sendMessage("debug");
    console.log("debug");
});



//state for enable controller buttun
document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.session.get(["status"], function(result) {
        const status = result.status || "enable";

        toggle.checked = (status === "enable");
        statusText.textContent = toggle.checked ? 'Enable' : 'Disable';
        statusText.className = toggle.checked ? 'status-text status-active' : 'status-text status-inactive';
    });

    chrome.storage.local.get(["controllerType"], function(result) {
        const type = result.controllerType || "nikflix";
        typeToggle.checked = (type === "netflix");
        typeText.textContent = typeToggle.checked ? 'Netflix' : 'Nikflix';
        typeText.className = typeToggle.checked ? 'status-text status-active' : 'status-text status-inactive';
        syncControllerToggle(typeToggle.checked);
    });
});