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


//logique enable disable controller:
const toggle = document.getElementById('controllerToggle');
const statusText = document.getElementById('statusText');

toggle.addEventListener('change', function() {
    this.parentElement.style.transform = 'scale(0.95)';
    setTimeout(() => {
        this.parentElement.style.transform = 'scale(1)';
    }, 150);

    if (this.checked) {
        statusText.textContent = 'Enable';
        statusText.className = 'status-text status-active';
        chrome.tabs.query({active: true , currentWindow:true},function (tabs){
            chrome.tabs.sendMessage(tabs[0].id, {message:"enable"})
        })
        console.log("enable")
    } else {
        statusText.textContent = 'Disable';
        statusText.className = 'status-text status-inactive';
        chrome.tabs.query({active: true , currentWindow:true},function (tabs){
            chrome.tabs.sendMessage(tabs[0].id, {message:"disable"})
        })
        console.log("disable")
    }
});

