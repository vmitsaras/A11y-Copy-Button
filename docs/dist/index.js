//#region src/index.ts
/** Subscribe to a copy-button event and return an idempotent unsubscribe function. */
function addCopyButtonEventListener(target, name, listener, options) {
	const eventListener = listener;
	let subscribed = true;
	target.addEventListener(name, eventListener, options);
	return () => {
		if (!subscribed) return;
		subscribed = false;
		target.removeEventListener(name, eventListener, options);
	};
}
const COMPONENT_NAME = "a11y-copy-button";
const DEFAULT_MESSAGES = Object.freeze({
	copy: "Copy",
	copying: "Copying",
	copied: "Copied",
	failed: "Copy failed",
	unavailable: "Copy unavailable",
	reset: "Ready to copy",
	disabled: "Copy disabled"
});
const DEFAULT_OPTIONS = Object.freeze({
	copyMode: "text",
	resetDelay: 2200,
	disabled: false,
	locale: "en",
	announceStatus: true,
	fallbackCopy: false,
	allowEmpty: false
});
const SELECTORS = Object.freeze({
	root: "[data-a11y-copy-button]",
	label: "[data-a11y-copy-button-label]",
	status: "[data-a11y-copy-button-status]",
	source: "[data-a11y-copy-button-source]",
	button: "button"
});
const CLASSES = Object.freeze({
	root: "a11y-copy-button",
	label: "a11y-copy-button__label",
	status: "a11y-copy-button__status",
	initialized: "is-initialized",
	disabled: "is-disabled",
	copying: "a11y-copy-button--copying",
	success: "a11y-copy-button--success",
	error: "a11y-copy-button--error"
});
const ATTRIBUTES = Object.freeze({
	root: "data-a11y-copy-button",
	value: "data-a11y-copy-button-value",
	sourceSelector: "data-a11y-copy-button-source-selector",
	sourceAttribute: "data-a11y-copy-button-source-attribute",
	copyMode: "data-a11y-copy-button-copy-mode",
	resetDelay: "data-a11y-copy-button-reset-delay",
	disabled: "data-a11y-copy-button-disabled",
	locale: "data-a11y-copy-button-locale",
	announceStatus: "data-a11y-copy-button-announce-status",
	fallbackCopy: "data-a11y-copy-button-fallback-copy",
	allowEmpty: "data-a11y-copy-button-allow-empty"
});
const EVENTS = Object.freeze({
	init: `${COMPONENT_NAME}:init`,
	ready: `${COMPONENT_NAME}:ready`,
	beforeCopy: `${COMPONENT_NAME}:before-copy`,
	copy: `${COMPONENT_NAME}:copy`,
	success: `${COMPONENT_NAME}:success`,
	error: `${COMPONENT_NAME}:error`,
	reset: `${COMPONENT_NAME}:reset`,
	disabled: `${COMPONENT_NAME}:disabled`,
	enabled: `${COMPONENT_NAME}:enabled`,
	addonError: `${COMPONENT_NAME}:addon-error`,
	destroy: `${COMPONENT_NAME}:destroy`
});
const STATUS_MESSAGE_KEYS = Object.freeze({
	idle: "copy",
	copying: "copying",
	success: "copied",
	error: "failed",
	disabled: "disabled"
});
const STATUS_CLASSES = Object.freeze([
	CLASSES.copying,
	CLASSES.success,
	CLASSES.error
]);
const ROOT_STATE_CLASSES = Object.freeze([
	CLASSES.initialized,
	CLASSES.disabled,
	...STATUS_CLASSES
]);
const COPY_BUTTON_EVENTS = EVENTS;
var A11yCopyButton = class A11yCopyButton {
	static instances = /* @__PURE__ */ new WeakMap();
	root;
	button;
	options;
	messagesByLocale = /* @__PURE__ */ new Map();
	addedClasses = /* @__PURE__ */ new Map();
	originalRootStateClasses = /* @__PURE__ */ new Set();
	addons = [];
	originalState;
	labelElement = null;
	statusElement = null;
	generatedStatusElement = null;
	statusOriginalParent = null;
	statusOriginalNextSibling = null;
	statusPlacementObserver = null;
	sourceElement;
	resetTimer;
	initialized = false;
	destroyed = false;
	lifecycleGeneration = 0;
	currentValue;
	currentStatus = "idle";
	copyGeneration = 0;
	setAriaLabel = false;
	handleClick = (event) => {
		event.preventDefault();
		this.copyFromTrigger(event).catch(() => {});
	};
	constructor(root, options = {}) {
		const existing = A11yCopyButton.instances.get(root);
		if (existing) return existing;
		if (!(root instanceof HTMLElement)) throw new TypeError("A11yCopyButton requires an HTMLElement root.");
		const button = findButton(root);
		if (!button) throw new TypeError("A11yCopyButton requires a real button root or descendant button.");
		this.root = root;
		this.button = button;
		this.options = normalizeOptions(root, options);
		this.addons = [...this.options.addons];
		this.messagesByLocale.set("en", DEFAULT_MESSAGES);
		this.messagesByLocale.set(this.options.locale, this.options.messages);
		this.originalState = {
			buttonType: this.button.getAttribute("type"),
			buttonDisabled: this.button.disabled,
			buttonAriaLabel: this.button.getAttribute("aria-label"),
			buttonAriaBusy: this.button.getAttribute("aria-busy"),
			labelText: null,
			statusText: null,
			statusRole: null,
			statusLive: null,
			statusAtomic: null
		};
		A11yCopyButton.instances.set(root, this);
		this.init();
	}
	init() {
		if (this.initialized) return;
		const existing = A11yCopyButton.instances.get(this.root);
		if (existing && existing !== this) throw new Error("Copy button root is already initialized by another instance.");
		A11yCopyButton.instances.set(this.root, this);
		this.originalRootStateClasses = new Set(ROOT_STATE_CLASSES.filter((className) => this.root.classList.contains(className)));
		this.lifecycleGeneration += 1;
		this.destroyed = false;
		this.runAddonHook("beforeInit");
		this.dispatch(EVENTS.init, {});
		this.addClass(this.root, CLASSES.root);
		this.addClass(this.root, CLASSES.initialized);
		this.labelElement = this.findLabelElement();
		this.statusElement = this.findStatusElement();
		if (this.labelElement) {
			this.originalState.labelText = this.labelElement.textContent;
			this.addClass(this.labelElement, CLASSES.label);
		}
		if (!this.statusElement) {
			this.statusElement = this.createStatusElement();
			this.generatedStatusElement = this.statusElement;
		} else {
			this.originalState.statusText = this.statusElement.textContent;
			this.originalState.statusRole = this.statusElement.getAttribute("role");
			this.originalState.statusLive = this.statusElement.getAttribute("aria-live");
			this.originalState.statusAtomic = this.statusElement.getAttribute("aria-atomic");
			if (this.button.contains(this.statusElement)) {
				this.statusOriginalParent = this.statusElement.parentNode;
				this.statusOriginalNextSibling = this.statusElement.nextSibling;
				this.statusElement.remove();
			}
		}
		this.placeStatusElement();
		this.addClass(this.statusElement, CLASSES.status);
		this.configureStatusElement();
		this.configureButton();
		this.findSourceElement();
		this.button.addEventListener("click", this.handleClick);
		if (this.options.disabled) this.applyDisabled(true, false);
		else this.setStatus("idle", "");
		this.initialized = true;
		this.runAddonHook("afterInit");
		this.dispatch(EVENTS.ready, {});
	}
	destroy() {
		if (!this.initialized) return;
		this.lifecycleGeneration += 1;
		this.copyGeneration += 1;
		this.runAddonHook("beforeDestroy");
		this.clearResetTimer();
		this.statusPlacementObserver?.disconnect();
		this.statusPlacementObserver = null;
		this.button.removeEventListener("click", this.handleClick);
		this.button.disabled = this.originalState.buttonDisabled;
		restoreAttribute(this.button, "type", this.originalState.buttonType);
		restoreAttribute(this.button, "aria-label", this.originalState.buttonAriaLabel);
		restoreAttribute(this.button, "aria-busy", this.originalState.buttonAriaBusy);
		if (this.labelElement && this.originalState.labelText !== null) this.labelElement.textContent = this.originalState.labelText;
		if (this.generatedStatusElement) this.generatedStatusElement.remove();
		else if (this.statusElement) {
			this.statusElement.textContent = this.originalState.statusText ?? "";
			restoreAttribute(this.statusElement, "role", this.originalState.statusRole);
			restoreAttribute(this.statusElement, "aria-live", this.originalState.statusLive);
			restoreAttribute(this.statusElement, "aria-atomic", this.originalState.statusAtomic);
			if (this.statusOriginalParent) {
				const sibling = this.statusOriginalNextSibling;
				this.statusOriginalParent.insertBefore(this.statusElement, sibling?.parentNode === this.statusOriginalParent ? sibling : null);
			}
		}
		for (const [element, classes] of this.addedClasses) element.classList.remove(...classes);
		this.addedClasses.clear();
		for (const className of ROOT_STATE_CLASSES) this.root.classList.toggle(className, this.originalRootStateClasses.has(className));
		this.generatedStatusElement = null;
		this.statusOriginalParent = null;
		this.statusOriginalNextSibling = null;
		this.setAriaLabel = false;
		this.initialized = false;
		this.sourceElement = void 0;
		A11yCopyButton.instances.delete(this.root);
		this.destroyed = true;
		this.dispatch(EVENTS.destroy, {});
		this.runAddonHook("afterDestroy", {}, void 0, false);
	}
	copy(value) {
		return this.copyInternal(value);
	}
	setValue(value) {
		this.options.value = value;
		this.currentValue = value;
	}
	getValue() {
		return this.currentValue ?? this.options.value ?? "";
	}
	setLabel(label) {
		if (this.labelElement) {
			this.labelElement.textContent = label;
			return;
		}
		this.button.textContent = label;
	}
	setStatus(status, message) {
		this.placeStatusElement();
		this.currentStatus = status;
		this.root.classList.remove(...STATUS_CLASSES);
		if (status === "copying") {
			this.root.classList.add(CLASSES.copying);
			this.button.setAttribute("aria-busy", "true");
		} else restoreAttribute(this.button, "aria-busy", this.originalState.buttonAriaBusy);
		if (status === "success") this.root.classList.add(CLASSES.success);
		if (status === "error") this.root.classList.add(CLASSES.error);
		if (status === "disabled") this.root.classList.add(CLASSES.disabled);
		else if (!this.options.disabled) this.root.classList.remove(CLASSES.disabled);
		const resolvedMessage = message ?? this.t(STATUS_MESSAGE_KEYS[status]);
		if (this.statusElement) this.statusElement.textContent = status === "idle" && message === void 0 ? "" : resolvedMessage;
	}
	reset() {
		this.runAddonHook("beforeReset");
		this.clearResetTimer();
		if (this.options.disabled) this.setStatus("disabled");
		else this.setStatus("idle", "");
		this.dispatch(EVENTS.reset, { status: this.currentStatus });
		this.runAddonHook("afterReset");
	}
	enable() {
		this.applyDisabled(false, true);
	}
	disable() {
		this.applyDisabled(true, true);
	}
	setLocale(locale, messages = {}) {
		const currentMessages = this.messagesByLocale.get(locale) ?? DEFAULT_MESSAGES;
		const nextMessages = Object.freeze({
			...DEFAULT_MESSAGES,
			...currentMessages,
			...messages
		});
		this.options.locale = locale;
		this.options.messages = nextMessages;
		this.messagesByLocale.set(locale, nextMessages);
		if (this.setAriaLabel) this.button.setAttribute("aria-label", this.t("copy"));
		if (this.currentStatus !== "idle") this.setStatus(this.currentStatus);
	}
	t(key, params = {}) {
		return ((this.messagesByLocale.get(this.options.locale) ?? DEFAULT_MESSAGES)[key] ?? key).replace(/\{([a-zA-Z0-9_]+)\}/g, (_, name) => {
			const value = params[name];
			return value === void 0 || value === null ? "" : String(value);
		});
	}
	registerAddon(addon) {
		addNormalizedAddon(this.addons, addon);
	}
	unregisterAddon(name) {
		const index = this.addons.findIndex((addon) => addon.name === name);
		if (index >= 0) this.addons.splice(index, 1);
	}
	getAddon(name) {
		return this.addons.find((addon) => addon.name === name);
	}
	getAddons() {
		return [...this.addons];
	}
	async copyFromTrigger(trigger) {
		await this.copyInternal(void 0, trigger);
	}
	async copyInternal(explicitValue, trigger) {
		if (!this.initialized) this.init();
		const generation = ++this.copyGeneration;
		if (this.options.disabled) {
			const error = new Error(this.t("disabled"));
			await this.handleCopyError(error, generation, void 0, void 0, trigger);
			throw error;
		}
		let resolved;
		try {
			resolved = await this.resolveValue(explicitValue, generation);
		} catch (error) {
			await this.handleCopyError(error, generation, void 0, void 0, trigger);
			throw error;
		}
		if (!this.isCurrentCopy(generation)) return;
		if (!this.options.allowEmpty && resolved.value.trim().length === 0) {
			const error = new Error(this.t("unavailable"));
			await this.handleCopyError(error, generation, resolved.value, resolved.source, trigger);
			throw error;
		}
		const detail = {
			value: resolved.value,
			source: resolved.source,
			trigger
		};
		this.clearResetTimer();
		this.setStatus("copying");
		this.dispatch(EVENTS.beforeCopy, detail);
		await this.runAddonHook("beforeCopy", detail, generation);
		if (!this.isCurrentCopy(generation)) return;
		try {
			await this.writeText(resolved.value, generation);
			if (!this.isCurrentCopy(generation)) return;
			this.currentValue = resolved.value;
			this.dispatch(EVENTS.copy, detail);
			await this.runAddonHook("afterCopy", detail, generation);
			if (!this.isCurrentCopy(generation)) return;
			this.setStatus("success");
			this.dispatch(EVENTS.success, detail);
			await this.runAddonHook("onSuccess", detail, generation);
			if (this.isCurrentCopy(generation)) this.scheduleReset();
		} catch (error) {
			await this.handleCopyError(error, generation, resolved.value, resolved.source, trigger);
			throw error;
		}
	}
	async resolveValue(explicitValue, generation) {
		await this.runAddonHook("beforeResolveValue", { explicitValue }, generation);
		if (!this.isCurrentCopy(generation)) return {
			value: "",
			source: "custom"
		};
		let resolved;
		if (explicitValue !== void 0) resolved = {
			value: explicitValue,
			source: "explicit"
		};
		else if (this.options.copyMode === "custom" || this.options.getValue) resolved = {
			value: stringifyValue(this.options.getValue ? await this.options.getValue(this.root) : ""),
			source: "custom"
		};
		else if (this.options.value !== void 0) resolved = {
			value: this.options.value,
			source: "option"
		};
		else resolved = this.resolveFromSource();
		if (this.isCurrentCopy(generation)) await this.runAddonHook("afterResolveValue", resolved, generation);
		return resolved;
	}
	resolveFromSource() {
		const source = this.findSourceElement();
		if (!source) return {
			value: getText(this.root),
			source: "root-text"
		};
		if (this.options.sourceAttribute) return {
			value: source.getAttribute(this.options.sourceAttribute) ?? "",
			source: source === this.root ? "root-attribute" : "source-attribute"
		};
		if (this.options.copyMode === "attribute") return {
			value: "",
			source: source === this.root ? "root-attribute" : "source-attribute"
		};
		if (this.options.copyMode === "value") return {
			value: getElementValue(source),
			source: "source-value"
		};
		return {
			value: getText(source),
			source: source === this.root ? "root-text" : "source-text"
		};
	}
	async writeText(value, generation) {
		const clipboard = globalThis.navigator?.clipboard;
		const clipboardError = new Error(this.t("unavailable"));
		if (clipboard && typeof clipboard.writeText === "function") try {
			await clipboard.writeText(value);
			return;
		} catch (error) {
			if (!this.options.fallbackCopy || !this.isCurrentCopy(generation)) throw error;
		}
		else if (!this.options.fallbackCopy) throw clipboardError;
		if (this.isCurrentCopy(generation)) await fallbackWriteText(value);
	}
	async handleCopyError(error, generation, value, source, trigger) {
		if (!this.isCurrentCopy(generation)) return;
		this.setStatus(this.options.disabled ? "disabled" : "error");
		const detail = {
			error,
			value,
			source,
			trigger
		};
		this.dispatch(EVENTS.error, detail);
		await this.runAddonHook("onError", detail, generation);
		if (this.isCurrentCopy(generation)) this.scheduleReset();
	}
	isCurrentCopy(generation) {
		return this.initialized && generation === this.copyGeneration;
	}
	applyDisabled(disabled, emit) {
		this.copyGeneration += 1;
		this.clearResetTimer();
		this.options.disabled = disabled;
		this.button.disabled = disabled;
		if (disabled) {
			this.root.classList.add(CLASSES.disabled);
			this.setStatus("disabled");
			if (emit) this.dispatch(EVENTS.disabled, { status: this.currentStatus });
			return;
		}
		this.root.classList.remove(CLASSES.disabled);
		this.setStatus("idle", "");
		if (emit) this.dispatch(EVENTS.enabled, { status: this.currentStatus });
	}
	scheduleReset() {
		this.clearResetTimer();
		if (this.options.resetDelay <= 0) return;
		this.resetTimer = globalThis.setTimeout(() => {
			this.reset();
		}, this.options.resetDelay);
	}
	clearResetTimer() {
		if (this.resetTimer !== void 0) {
			globalThis.clearTimeout(this.resetTimer);
			this.resetTimer = void 0;
		}
	}
	findLabelElement() {
		return safeQuery(this.root, SELECTORS.label);
	}
	findStatusElement() {
		if (this.root === this.button && this.button.nextElementSibling?.matches(SELECTORS.status)) return this.button.nextElementSibling;
		return safeQuery(this.root, SELECTORS.status);
	}
	findSourceElement() {
		if (this.sourceElement && (this.root.contains(this.sourceElement) || this.sourceElement.isConnected)) return this.sourceElement;
		this.sourceElement = void 0;
		if (this.options.sourceSelector) {
			const source = safeQuery(this.root, this.options.sourceSelector) ?? safeQuery(document, this.options.sourceSelector);
			this.sourceElement = source ?? void 0;
			return source;
		}
		const source = safeQuery(this.root, SELECTORS.source);
		this.sourceElement = source ?? void 0;
		return source;
	}
	createStatusElement() {
		const statusElement = document.createElement("span");
		statusElement.setAttribute("data-a11y-copy-button-status", "");
		statusElement.className = CLASSES.status;
		if (this.root !== this.button) this.root.append(statusElement);
		return statusElement;
	}
	placeStatusElement() {
		if (!this.statusElement || this.destroyed) return;
		if (this.statusElement.parentNode) {
			this.statusPlacementObserver?.disconnect();
			this.statusPlacementObserver = null;
			return;
		}
		if (this.button.parentNode) {
			this.button.after(this.statusElement);
			this.statusPlacementObserver?.disconnect();
			this.statusPlacementObserver = null;
		} else if (!this.statusPlacementObserver) {
			this.statusPlacementObserver = new MutationObserver(() => this.placeStatusElement());
			this.statusPlacementObserver.observe(this.button.ownerDocument, {
				childList: true,
				subtree: true
			});
		}
	}
	configureStatusElement() {
		if (!this.statusElement || !this.options.announceStatus) return;
		this.statusElement.setAttribute("role", "status");
		this.statusElement.setAttribute("aria-live", "polite");
		this.statusElement.setAttribute("aria-atomic", "true");
	}
	configureButton() {
		if (this.button.getAttribute("type") !== "button") this.button.setAttribute("type", "button");
		if (!hasAccessibleName(this.button)) {
			this.button.setAttribute("aria-label", this.t("copy"));
			this.setAriaLabel = true;
		}
	}
	addClass(element, className) {
		if (!element.classList.contains(className)) {
			element.classList.add(className);
			const classes = this.addedClasses.get(element) ?? /* @__PURE__ */ new Set();
			classes.add(className);
			this.addedClasses.set(element, classes);
		}
	}
	async runAddonHook(hook, data = {}, generation, reportErrors = true) {
		const lifecycleGeneration = this.lifecycleGeneration;
		for (const addon of this.addons) {
			if (generation !== void 0 && !this.isCurrentCopy(generation)) return;
			if (generation === void 0 && lifecycleGeneration !== this.lifecycleGeneration) return;
			if (generation === void 0 && this.destroyed && hook !== "afterDestroy") return;
			const handler = addon[hook];
			if (typeof handler !== "function") continue;
			try {
				await handler({
					instance: this,
					root: this.root,
					button: this.button,
					options: this.options,
					...data
				});
			} catch (error) {
				const currentOperation = generation === void 0 ? lifecycleGeneration === this.lifecycleGeneration && !this.destroyed : this.isCurrentCopy(generation);
				if (reportErrors && currentOperation) this.dispatch(EVENTS.addonError, {
					addon: addon.name,
					hook,
					error
				});
			}
		}
	}
	dispatch(name, detail) {
		if (this.destroyed && name !== EVENTS.destroy) return;
		this.root.dispatchEvent(new CustomEvent(name, {
			bubbles: true,
			composed: false,
			cancelable: false,
			detail: {
				instance: this,
				...detail
			}
		}));
	}
};
function createCopyButton(root, options = {}) {
	return new A11yCopyButton(root, options);
}
function initCopyButtonAll(options = {}) {
	if (typeof document === "undefined") return [];
	return Array.from(document.querySelectorAll(SELECTORS.root), (root) => createCopyButton(root, options));
}
function normalizeOptions(root, options) {
	const dataOptions = readDataOptions(root);
	const copyMode = normalizeCopyMode(options.copyMode ?? dataOptions.copyMode ?? DEFAULT_OPTIONS.copyMode);
	const locale = options.locale ?? dataOptions.locale ?? DEFAULT_OPTIONS.locale;
	const messages = Object.freeze({
		...DEFAULT_MESSAGES,
		...options.messages
	});
	return {
		value: options.value ?? dataOptions.value,
		sourceSelector: options.sourceSelector ?? dataOptions.sourceSelector,
		sourceAttribute: options.sourceAttribute ?? dataOptions.sourceAttribute,
		copyMode,
		getValue: options.getValue,
		resetDelay: options.resetDelay ?? dataOptions.resetDelay ?? DEFAULT_OPTIONS.resetDelay,
		disabled: options.disabled ?? dataOptions.disabled ?? DEFAULT_OPTIONS.disabled,
		locale,
		messages,
		announceStatus: options.announceStatus ?? dataOptions.announceStatus ?? DEFAULT_OPTIONS.announceStatus,
		fallbackCopy: options.fallbackCopy ?? dataOptions.fallbackCopy ?? DEFAULT_OPTIONS.fallbackCopy,
		allowEmpty: options.allowEmpty ?? dataOptions.allowEmpty ?? DEFAULT_OPTIONS.allowEmpty,
		addons: normalizeAddons(options.addons)
	};
}
function normalizeAddons(addons = []) {
	const normalizedAddons = [];
	for (const addon of addons) addNormalizedAddon(normalizedAddons, addon);
	return normalizedAddons;
}
function addNormalizedAddon(addons, addon) {
	const normalizedAddon = normalizeAddon(addon);
	const existingIndex = addons.findIndex((item) => item.name === normalizedAddon.name);
	if (existingIndex >= 0) addons.splice(existingIndex, 1);
	addons.push(normalizedAddon);
}
function normalizeAddon(addon) {
	const name = addon.name.trim();
	if (!name) throw new TypeError("Copy button addons require a non-empty name.");
	return {
		...addon,
		name
	};
}
function readDataOptions(root) {
	return {
		value: readValueAttribute(root, ATTRIBUTES.value),
		sourceSelector: readStringAttribute(root, ATTRIBUTES.sourceSelector),
		sourceAttribute: readStringAttribute(root, ATTRIBUTES.sourceAttribute),
		copyMode: normalizeCopyMode(readStringAttribute(root, ATTRIBUTES.copyMode)),
		resetDelay: readIntegerAttribute(root, ATTRIBUTES.resetDelay),
		disabled: readBooleanAttribute(root, ATTRIBUTES.disabled),
		locale: readStringAttribute(root, ATTRIBUTES.locale),
		announceStatus: readBooleanAttribute(root, ATTRIBUTES.announceStatus),
		fallbackCopy: readBooleanAttribute(root, ATTRIBUTES.fallbackCopy),
		allowEmpty: readBooleanAttribute(root, ATTRIBUTES.allowEmpty)
	};
}
function readStringAttribute(root, name) {
	const normalized = root.getAttribute(name)?.trim();
	return normalized ? normalized : void 0;
}
function readValueAttribute(root, name) {
	if (!root.hasAttribute(name)) return;
	return root.getAttribute(name) ?? "";
}
function readIntegerAttribute(root, name) {
	const normalized = root.getAttribute(name)?.trim();
	if (!normalized || !/^\d+$/.test(normalized)) return;
	const parsed = Number(normalized);
	return Number.isSafeInteger(parsed) ? parsed : void 0;
}
function readBooleanAttribute(root, name) {
	const value = root.getAttribute(name);
	if (value === null) return;
	const normalized = value.trim().toLowerCase();
	if (normalized === "" || normalized === "true") return true;
	if (normalized === "false") return false;
}
function normalizeCopyMode(value) {
	if (value === "value" || value === "text" || value === "attribute" || value === "custom") return value;
	return DEFAULT_OPTIONS.copyMode;
}
function findButton(root) {
	if (root instanceof HTMLButtonElement) return root;
	return root.querySelector(SELECTORS.button);
}
function safeQuery(root, selector) {
	try {
		return root.querySelector(selector);
	} catch {
		return null;
	}
}
function restoreAttribute(element, name, value) {
	if (value === null) {
		element.removeAttribute(name);
		return;
	}
	element.setAttribute(name, value);
}
function hasAccessibleName(button) {
	return (button.getAttribute("aria-label") ?? button.getAttribute("title") ?? button.textContent ?? "").trim().length > 0;
}
function getText(element) {
	return element.textContent?.trim() ?? "";
}
function getElementValue(element) {
	if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) return element.value;
	return getText(element);
}
function stringifyValue(value) {
	return value === void 0 || value === null ? "" : String(value);
}
async function fallbackWriteText(value) {
	if (typeof document === "undefined" || !document.body || typeof document.execCommand !== "function") throw new Error("Fallback copy is unavailable.");
	const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
	const textarea = document.createElement("textarea");
	textarea.value = value;
	textarea.setAttribute("readonly", "");
	textarea.style.position = "fixed";
	textarea.style.insetBlockStart = "0";
	textarea.style.insetInlineStart = "-9999px";
	textarea.style.opacity = "0";
	document.body.append(textarea);
	textarea.focus();
	textarea.select();
	try {
		if (!document.execCommand("copy")) throw new Error("Fallback copy failed.");
	} finally {
		textarea.remove();
		activeElement?.focus();
	}
}
//#endregion
export { A11yCopyButton, COPY_BUTTON_EVENTS, addCopyButtonEventListener, createCopyButton, initCopyButtonAll };

//# sourceMappingURL=index.js.map