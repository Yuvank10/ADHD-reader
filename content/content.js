(() => {
	const STORAGE_KEYS = {
		enabled: "adhdReaderEnabled",
		boldRatio: "adhdReaderBoldRatio",
		bionicColor: "adhdReaderBionicColor",
		blocklist: "adhdReaderBlocklist",
		fontSize: "adhdReaderFontSize"
	};

	const SKIP_SELECTOR = [
		"script",
		"style",
		"noscript",
		"textarea",
		"input",
		"button",
		"select",
		"option",
		"code",
		"pre",
		"kbd",
		"samp",
		"svg",
		"math",
		"iframe"
	].join(",");

	let currentBoldRatio = 0.5;
	let currentBionicColor = "#ef6c4c";
	let isEnabled = true;
	let isProcessing = false;
	let previousBodyFontSize = "";
	let typographyApplied = false;

	function normalizeColor(value) {
		return /^#[0-9a-fA-F]{6}$/.test(String(value)) ? String(value) : "#ef6c4c";
	}

	function getHostname() {
		return window.location.hostname.toLowerCase();
	}

	function isBlockedSite(blocklist = []) {
		const hostname = getHostname();
		return blocklist.some((entry) => {
			const normalized = String(entry).trim().toLowerCase();
			return normalized && (hostname === normalized || hostname.endsWith(`.${normalized}`));
		});
	}

	function shouldSkipNode(textNode) {
		const parent = textNode.parentElement;
		if (!parent) {
			return true;
		}

		if (parent.closest(".adhd-reader-bionic")) {
			return true;
		}

		if (parent.closest(SKIP_SELECTOR)) {
			return true;
		}

		if (parent.closest("[contenteditable='true']")) {
			return true;
		}

		return parent.tagName === "B" && parent.classList.contains("adhd-reader-bionic");
	}

	function renderTextNode(textNode) {
		if (!textNode.nodeValue || !textNode.nodeValue.trim()) {
			return;
		}

		if (shouldSkipNode(textNode)) {
			return;
		}

		const helper = globalThis.AdhdReaderBionic;
		if (!helper) {
			return;
		}

		const fragment = helper.createBionicFragment(document, textNode.nodeValue, currentBoldRatio, currentBionicColor);
		const wrapper = document.createElement("span");
		wrapper.className = "adhd-reader-bionic";
		wrapper.appendChild(fragment);
		textNode.parentNode.replaceChild(wrapper, textNode);
	}

	function walkAndApply(root = document.body) {
		if (!root || isProcessing || !isEnabled) {
			return;
		}

		isProcessing = true;

		try {
			const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
				acceptNode(node) {
					if (!node.nodeValue || !node.nodeValue.trim()) {
						return NodeFilter.FILTER_REJECT;
					}

					return shouldSkipNode(node) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
				}
			});

			const textNodes = [];
			while (walker.nextNode()) {
				textNodes.push(walker.currentNode);
			}

			textNodes.forEach(renderTextNode);
		} finally {
			isProcessing = false;
		}
	}

	function restoreAndReapply() {
		document.querySelectorAll("span.adhd-reader-bionic").forEach((element) => {
			const parent = element.parentNode;
			if (!parent) {
				return;
			}

			parent.replaceChild(document.createTextNode(element.textContent || ""), element);
		});

		walkAndApply(document.body);
	}

	function applyTypography(settings) {
		if (!document.body) {
			return;
		}

		if (!typographyApplied) {
			previousBodyFontSize = document.body.style.fontSize;
		}

		const fontSizeSetting = Number(settings[STORAGE_KEYS.fontSize] || 18);
		document.body.style.fontSize = `${fontSizeSetting}px`;
		document.body.style.lineHeight = "1.75";
		typographyApplied = true;
	}

	function clearTypography() {
		if (!document.body || !typographyApplied) {
			return;
		}

		document.body.style.fontSize = previousBodyFontSize;
		document.body.style.lineHeight = "";
		typographyApplied = false;
	}

	function disableEffects() {
		document.querySelectorAll("span.adhd-reader-bionic").forEach((element) => {
			const parent = element.parentNode;
			if (!parent) {
				return;
			}

			parent.replaceChild(document.createTextNode(element.textContent || ""), element);
		});

		clearTypography();
	}

	function applySettings(settings) {
		isEnabled = settings[STORAGE_KEYS.enabled] ?? true;
		currentBoldRatio = settings[STORAGE_KEYS.boldRatio] ?? 0.5;
		currentBionicColor = normalizeColor(settings[STORAGE_KEYS.bionicColor]);

		if (!isEnabled || isBlockedSite(settings[STORAGE_KEYS.blocklist] ?? [])) {
			disableEffects();
			return;
		}

		applyTypography(settings);
		restoreAndReapply();
	}

	async function loadAndApplySettings() {
		const settings = await chrome.storage.sync.get([
			STORAGE_KEYS.enabled,
			STORAGE_KEYS.boldRatio,
			STORAGE_KEYS.bionicColor,
			STORAGE_KEYS.blocklist
		]);

		applySettings(settings);
	}

	chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
		if (message?.type === "ADHD_READER_SETTINGS_UPDATED") {
			loadAndApplySettings().then(() => sendResponse({ ok: true }));
			return true;
		}

		if (message?.type === "ADHD_READER_TOGGLE") {
			isEnabled = Boolean(message.enabled);
			restoreAndReapply();
			sendResponse({ ok: true });
		}
	});

	const observer = new MutationObserver((mutations) => {
		if (!isEnabled) {
			return;
		}

		const shouldReprocess = mutations.some((mutation) => {
			return Array.from(mutation.addedNodes).some((node) => node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE);
		});

		if (shouldReprocess) {
			walkAndApply(document.body);
		}
	});

	function start() {
		loadAndApplySettings().finally(() => {
			if (document.body) {
				observer.observe(document.body, {
					childList: true,
					subtree: true
				});

				walkAndApply(document.body);
			}
		});
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", start, { once: true });
	} else {
		start();
	}
})();
