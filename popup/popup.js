const enabledToggle = document.getElementById("enabledToggle");
const boldRatio = document.getElementById("boldRatio");
const ratioValue = document.getElementById("ratioValue");
const openOptions = document.getElementById("openOptions");
const status = document.getElementById("status");

function normalizeRatio(value) {
	return Number(value) / 100;
}

async function loadState() {
	const settings = await chrome.storage.sync.get([
		"adhdReaderEnabled",
		"adhdReaderBoldRatio"
	]);

	enabledToggle.checked = settings.adhdReaderEnabled ?? true;
	const ratio = Math.round((settings.adhdReaderBoldRatio ?? 0.5) * 100);
	boldRatio.value = String(ratio);
	ratioValue.textContent = `${ratio}%`;
}

async function saveSettings(updates) {
	await chrome.storage.sync.set(updates);
	const fullSettings = await chrome.storage.sync.get([
		"adhdReaderEnabled",
		"adhdReaderBoldRatio",
		"adhdReaderBlocklist",
		"adhdReaderBionicColor",
		"adhdReaderFontSize"
	]);
	chrome.runtime.sendMessage({
		type: "ADHD_READER_SETTINGS_UPDATED",
		settings: fullSettings
	});

	status.textContent = "Saved";
	window.setTimeout(() => {
		status.textContent = "";
	}, 1200);
}

enabledToggle.addEventListener("change", () => {
	saveSettings({ adhdReaderEnabled: enabledToggle.checked });
});

boldRatio.addEventListener("input", () => {
	ratioValue.textContent = `${boldRatio.value}%`;
});

boldRatio.addEventListener("change", () => {
	saveSettings({ adhdReaderBoldRatio: normalizeRatio(boldRatio.value) });
});

openOptions.addEventListener("click", () => {
	chrome.runtime.openOptionsPage();
});

loadState();
