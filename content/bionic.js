(() => {
	const DEFAULT_BOLD_RATIO = 0.5;

	function escapeHTML(text) {
		return String(text)
			.replaceAll("&", "&amp;")
			.replaceAll("<", "&lt;")
			.replaceAll(">", "&gt;")
			.replaceAll('"', "&quot;")
			.replaceAll("'", "&#39;");
	}

	function getSplitIndex(word, boldRatio = DEFAULT_BOLD_RATIO) {
		if (word.length <= 3) {
			return word.length;
		}

		const ratio = Number.isFinite(boldRatio) ? boldRatio : DEFAULT_BOLD_RATIO;
		const clampedRatio = Math.min(0.9, Math.max(0.1, ratio));
		const index = Math.ceil(word.length * clampedRatio);

		return Math.min(word.length - 1, Math.max(1, index));
	}

	function bionicWordHTML(word, boldRatio = DEFAULT_BOLD_RATIO, bionicColor = "#ef6c4c") {
		if (!word) {
			return "";
		}

		const splitIndex = getSplitIndex(word, boldRatio);

		if (splitIndex >= word.length) {
			return `<b>${escapeHTML(word)}</b>`;
		}

		const firstPart = escapeHTML(word.slice(0, splitIndex));
		const secondPart = escapeHTML(word.slice(splitIndex));

		return `<b style="color:${escapeHTML(bionicColor)}">${firstPart}</b>${secondPart}`;
	}

	function bionicTextHTML(text, boldRatio = DEFAULT_BOLD_RATIO, bionicColor = "#ef6c4c") {
		return String(text).replace(/\b[\p{L}\p{N}'’\-]+\b/gu, (match) => bionicWordHTML(match, boldRatio, bionicColor));
	}

	function createBionicFragment(documentRef, text, boldRatio = DEFAULT_BOLD_RATIO, bionicColor = "#ef6c4c") {
		const template = documentRef.createElement("template");
		template.innerHTML = bionicTextHTML(text, boldRatio, bionicColor);
		return template.content;
	}

	globalThis.AdhdReaderBionic = {
		bionicWordHTML,
		bionicTextHTML,
		createBionicFragment
	};
})();
