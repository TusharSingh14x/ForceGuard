// Background script for FocusGuard
console.log('FocusGuard Background Service Worker initialized.');

let activeTabDomain = null;
let isSessionActive = false;
const DISTRACTING_SITES = ['youtube.com', 'www.youtube.com', 'twitter.com', 'x.com', 'instagram.com', 'facebook.com', 'reddit.com'];

// Track website visits and time spent
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    handleTabSwitch(activeInfo.tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.active) {
        handleTabSwitch(tabId);
    }
});

async function handleTabSwitch(tabId) {
    try {
        const tab = await chrome.tabs.get(tabId);
        if (!tab.url || !tab.url.startsWith('http')) return;

        const url = new URL(tab.url);
        const domain = url.hostname;

        activeTabDomain = domain;

        if (isSessionActive && DISTRACTING_SITES.some(site => domain.includes(site))) {
            chrome.tabs.sendMessage(tabId, {
                type: 'BLOCK_SITE',
                reason: 'You are in your study session, resume'
            }).catch(err => console.log('Content script not ready'));
        }

        chrome.storage.local.set({ currentDomain: domain, isSessionActive });
    } catch (e) {
        console.error(e);
    }
}

// Communication with dashboard and content scripts
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
    console.log('External message received:', message);
    if (message.type === 'SET_SESSION_STATUS') {
        isSessionActive = message.active;
        chrome.storage.local.set({ isSessionActive });

        // If session started, check current tab immediately
        if (isSessionActive) {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) handleTabSwitch(tabs[0].id);
            });
        }
        sendResponse({ success: true });
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_STATUS') {
        sendResponse({ domain: activeTabDomain, isSessionActive });
    }
});
