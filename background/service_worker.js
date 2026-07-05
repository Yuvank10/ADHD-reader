const DEFAULT_SETTINGS = {
	adhdReaderEnabled: true,
	adhdReaderBoldRatio: 0.5,
	adhdReaderBionicColor: "#ef6c4c",
	adhdReaderBlocklist: []
};

chrome.runtime.onInstalled.addListener(async () => {
	const existing = await chrome.storage.sync.get(Object.keys(DEFAULT_SETTINGS));
	const missing = Object.fromEntries(
		Object.entries(DEFAULT_SETTINGS).filter(([key]) => existing[key] === undefined)
	);

	if (Object.keys(missing).length > 0) {
		await chrome.storage.sync.set(missing);
	}
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message?.type === "ADHD_READER_SAVE_SETTINGS") {
		chrome.storage.sync.set(message.settings || {}).then(() => {
			sendResponse({ ok: true });
		});
		return true;
	}

	if (message?.type === "ADHD_READER_GET_SETTINGS") {
		chrome.storage.sync.get(Object.keys(DEFAULT_SETTINGS)).then((settings) => {
			sendResponse({ ok: true, settings });
		});
		return true;
	}

	return false;
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
	if (changeInfo.status !== "complete") {
		return;
	}

	const settings = await chrome.storage.sync.get(Object.keys(DEFAULT_SETTINGS));
	if (settings.adhdReaderEnabled === false) {
		return;
	}

	try {
		await chrome.tabs.sendMessage(tabId, {
			type: "ADHD_READER_SETTINGS_UPDATED",
			settings
		});
	} catch {
		// Content script may not be available on every tab.
	}
});
