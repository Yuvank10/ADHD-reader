const blocklist = document.getElementById("blocklist");
const bionicColor = document.getElementById("bionicColor");
const bionicColorValue = document.getElementById("bionicColorValue");
const fontSize = document.getElementById("fontSize");
const fontSizeValue = document.getElementById("fontSizeValue");
const saveButton = document.getElementById("save");
const status = document.getElementById("status");

function parseBlocklist(value) {
	return value
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean);
}

async function loadOptions() {
	const settings = await chrome.storage.sync.get([
		"adhdReaderBlocklist",
		"adhdReaderBionicColor",
		"adhdReaderFontSize"
	]);

	blocklist.value = (settings.adhdReaderBlocklist || []).join("\n");
	bionicColor.value = settings.adhdReaderBionicColor || "#ef6c4c";
	bionicColorValue.textContent = bionicColor.value;
	fontSize.value = String(settings.adhdReaderFontSize || 18);
	fontSizeValue.textContent = `${fontSize.value}px`;
}

bionicColor.addEventListener("input", () => {
	bionicColorValue.textContent = bionicColor.value;
});

fontSize.addEventListener("input", () => {
	fontSizeValue.textContent = `${fontSize.value}px`;
});

saveButton.addEventListener("click", async () => {
	const updates = {
		adhdReaderBlocklist: parseBlocklist(blocklist.value),
		adhdReaderBionicColor: bionicColor.value,
		adhdReaderFontSize: Number(fontSize.value)
	};

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

	status.textContent = "Saved.";
	window.setTimeout(() => {
		status.textContent = "";
	}, 1200);
});

loadOptions();
