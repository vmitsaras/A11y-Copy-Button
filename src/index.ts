export type CopyButtonStatus = "idle" | "copying" | "success" | "error" | "disabled";

export type CopyButtonCopyMode = "value" | "text" | "attribute" | "custom";

export type CopyButtonValueSource =
  | "explicit"
  | "custom"
  | "option"
  | "source-attribute"
  | "source-text"
  | "source-value"
  | "root-attribute"
  | "root-text";

export interface CopyButtonMessages {
  copy: string;
  copying: string;
  copied: string;
  failed: string;
  unavailable: string;
  reset: string;
  disabled: string;
}

export interface CopyButtonOptions {
  value?: string;
  sourceSelector?: string;
  sourceAttribute?: string;
  copyMode?: CopyButtonCopyMode;
  getValue?: (root: HTMLElement) => string | Promise<string>;
  resetDelay?: number;
  disabled?: boolean;
  locale?: string;
  messages?: Partial<CopyButtonMessages>;
  announceStatus?: boolean;
  fallbackCopy?: boolean;
  allowEmpty?: boolean;
  addons?: CopyButtonAddon[];
}

export interface CopyButtonInstance {
  init(): void;
  destroy(): void;
  copy(value?: string): Promise<void>;
  setValue(value: string): void;
  getValue(): string;
  setLabel(label: string): void;
  setStatus(status: CopyButtonStatus, message?: string): void;
  reset(): void;
  enable(): void;
  disable(): void;
  setLocale(locale: string, messages?: Partial<CopyButtonMessages>): void;
  t(key: string, params?: Record<string, unknown>): string;
  registerAddon(addon: CopyButtonAddon): void;
  unregisterAddon(name: string): void;
  getAddon(name: string): CopyButtonAddon | undefined;
  getAddons(): CopyButtonAddon[];
}

export interface CopyButtonAddonContext {
  instance: CopyButtonInstance;
  root: HTMLElement;
  button: HTMLButtonElement;
  options: Readonly<NormalizedCopyButtonOptions>;
}

export interface CopyButtonResolveValueContext extends CopyButtonAddonContext {
  explicitValue?: string;
}

export interface CopyButtonResolvedValueContext extends CopyButtonAddonContext {
  value: string;
  source: CopyButtonValueSource;
}

export interface CopyButtonCopyContext extends CopyButtonResolvedValueContext {
  trigger?: Event;
}

export interface CopyButtonErrorContext extends CopyButtonAddonContext {
  error: unknown;
  value?: string;
  source?: CopyButtonValueSource;
  trigger?: Event;
}

export interface CopyButtonAddon {
  name: string;
  beforeInit?: (context: CopyButtonAddonContext) => void | Promise<void>;
  afterInit?: (context: CopyButtonAddonContext) => void | Promise<void>;
  beforeResolveValue?: (context: CopyButtonResolveValueContext) => void | Promise<void>;
  afterResolveValue?: (context: CopyButtonResolvedValueContext) => void | Promise<void>;
  beforeCopy?: (context: CopyButtonCopyContext) => void | Promise<void>;
  afterCopy?: (context: CopyButtonCopyContext) => void | Promise<void>;
  onSuccess?: (context: CopyButtonCopyContext) => void | Promise<void>;
  onError?: (context: CopyButtonErrorContext) => void | Promise<void>;
  beforeReset?: (context: CopyButtonAddonContext) => void | Promise<void>;
  afterReset?: (context: CopyButtonAddonContext) => void | Promise<void>;
  beforeDestroy?: (context: CopyButtonAddonContext) => void | Promise<void>;
  afterDestroy?: (context: CopyButtonAddonContext) => void | Promise<void>;
}

export interface CopyButtonEventDetail {
  instance: CopyButtonInstance;
}

export interface CopyButtonStatusEventDetail extends CopyButtonEventDetail {
  status: CopyButtonStatus;
}

export interface CopyButtonCopyEventDetail extends CopyButtonEventDetail {
  value: string;
  source: CopyButtonValueSource;
  trigger?: Event;
}

export interface CopyButtonErrorEventDetail extends CopyButtonEventDetail {
  error: unknown;
  value?: string;
  source?: CopyButtonValueSource;
  trigger?: Event;
}

export interface CopyButtonAddonErrorEventDetail extends CopyButtonEventDetail {
  addon: string;
  hook: string;
  error: unknown;
}

export interface CopyButtonEventMap {
  [COPY_BUTTON_EVENTS.init]: CopyButtonEventDetail;
  [COPY_BUTTON_EVENTS.ready]: CopyButtonEventDetail;
  [COPY_BUTTON_EVENTS.beforeCopy]: CopyButtonCopyEventDetail;
  [COPY_BUTTON_EVENTS.copy]: CopyButtonCopyEventDetail;
  [COPY_BUTTON_EVENTS.success]: CopyButtonCopyEventDetail;
  [COPY_BUTTON_EVENTS.error]: CopyButtonErrorEventDetail;
  [COPY_BUTTON_EVENTS.reset]: CopyButtonStatusEventDetail;
  [COPY_BUTTON_EVENTS.disabled]: CopyButtonStatusEventDetail;
  [COPY_BUTTON_EVENTS.enabled]: CopyButtonStatusEventDetail;
  [COPY_BUTTON_EVENTS.addonError]: CopyButtonAddonErrorEventDetail;
  [COPY_BUTTON_EVENTS.destroy]: CopyButtonEventDetail;
}

export type CopyButtonEventName = keyof CopyButtonEventMap;

export type CopyButtonEvent<K extends CopyButtonEventName> = CustomEvent<CopyButtonEventMap[K]>;

export type CopyButtonEventListener<K extends CopyButtonEventName> = (event: CopyButtonEvent<K>) => void;

/** Subscribe to a copy-button event and return an idempotent unsubscribe function. */
export function addCopyButtonEventListener<K extends CopyButtonEventName>(
  target: EventTarget,
  name: K,
  listener: CopyButtonEventListener<K>,
  options?: boolean | AddEventListenerOptions
): () => void {
  const eventListener = listener as EventListener;
  let subscribed = true;

  target.addEventListener(name, eventListener, options);

  return () => {
    if (!subscribed) return;
    subscribed = false;
    target.removeEventListener(name, eventListener, options);
  };
}

type NormalizedCopyButtonOptions = {
  value?: string;
  sourceSelector?: string;
  sourceAttribute?: string;
  copyMode: CopyButtonCopyMode;
  getValue?: (root: HTMLElement) => string | Promise<string>;
  resetDelay: number;
  disabled: boolean;
  locale: string;
  messages: CopyButtonMessages;
  announceStatus: boolean;
  fallbackCopy: boolean;
  allowEmpty: boolean;
  addons: CopyButtonAddon[];
};

type ResolvedCopyValue = {
  value: string;
  source: CopyButtonValueSource;
};

type OriginalState = {
  buttonType: string | null;
  buttonDisabled: boolean;
  buttonAriaLabel: string | null;
  buttonAriaBusy: string | null;
  labelText: string | null;
  statusText: string | null;
  statusRole: string | null;
  statusLive: string | null;
  statusAtomic: string | null;
};

const COMPONENT_NAME = "a11y-copy-button";

const DEFAULT_MESSAGES: CopyButtonMessages = Object.freeze({
  copy: "Copy",
  copying: "Copying",
  copied: "Copied",
  failed: "Copy failed",
  unavailable: "Copy unavailable",
  reset: "Ready to copy",
  disabled: "Copy disabled"
});

const DEFAULT_OPTIONS = Object.freeze({
  copyMode: "text" as CopyButtonCopyMode,
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
} satisfies Record<CopyButtonStatus, keyof CopyButtonMessages>);

const STATUS_CLASSES = Object.freeze([CLASSES.copying, CLASSES.success, CLASSES.error]);
const ROOT_STATE_CLASSES = Object.freeze([CLASSES.initialized, CLASSES.disabled, ...STATUS_CLASSES]);

export const COPY_BUTTON_EVENTS = EVENTS;

export class A11yCopyButton implements CopyButtonInstance {
  private static readonly instances = new WeakMap<HTMLElement, A11yCopyButton>();

  public readonly root!: HTMLElement;

  private readonly button!: HTMLButtonElement;
  private readonly options!: NormalizedCopyButtonOptions;
  private readonly messagesByLocale = new Map<string, CopyButtonMessages>();
  private readonly addedClasses = new Map<HTMLElement, Set<string>>();
  private originalRootStateClasses = new Set<string>();
  private readonly addons: CopyButtonAddon[] = [];
  private readonly originalState!: OriginalState;
  private labelElement: HTMLElement | null = null;
  private statusElement: HTMLElement | null = null;
  private generatedStatusElement: HTMLElement | null = null;
  private statusOriginalParent: Node | null = null;
  private statusOriginalNextSibling: Node | null = null;
  private statusPlacementObserver: MutationObserver | null = null;
  private sourceElement: HTMLElement | undefined;
  private resetTimer: ReturnType<typeof globalThis.setTimeout> | undefined;
  private initialized = false;
  private destroyed = false;
  private lifecycleGeneration = 0;
  private currentValue: string | undefined;
  private currentStatus: CopyButtonStatus = "idle";
  private copyGeneration = 0;
  private setAriaLabel = false;

  private readonly handleClick = (event: Event): void => {
    event.preventDefault();
    void this.copyFromTrigger(event).catch(() => {
      // copyInternal already reports the failure through status and the error event.
    });
  };

  public constructor(root: HTMLElement, options: CopyButtonOptions = {}) {
    const existing = A11yCopyButton.instances.get(root);

    if (existing) {
      return existing;
    }

    if (!(root instanceof HTMLElement)) {
      throw new TypeError("A11yCopyButton requires an HTMLElement root.");
    }

    const button = findButton(root);

    if (!button) {
      throw new TypeError("A11yCopyButton requires a real button root or descendant button.");
    }

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

  public init(): void {
    if (this.initialized) {
      return;
    }

    const existing = A11yCopyButton.instances.get(this.root);
    if (existing && existing !== this) {
      throw new Error("Copy button root is already initialized by another instance.");
    }
    A11yCopyButton.instances.set(this.root, this);

    this.originalRootStateClasses = new Set(
      ROOT_STATE_CLASSES.filter((className) => this.root.classList.contains(className))
    );
    this.lifecycleGeneration += 1;
    this.destroyed = false;
    void this.runAddonHook("beforeInit");
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

    if (this.options.disabled) {
      this.applyDisabled(true, false);
    } else {
      this.setStatus("idle", "");
    }

    this.initialized = true;
    void this.runAddonHook("afterInit");
    this.dispatch(EVENTS.ready, {});
  }

  public destroy(): void {
    if (!this.initialized) {
      return;
    }

    this.lifecycleGeneration += 1;
    this.copyGeneration += 1;
    void this.runAddonHook("beforeDestroy");
    this.clearResetTimer();
    this.statusPlacementObserver?.disconnect();
    this.statusPlacementObserver = null;
    this.button.removeEventListener("click", this.handleClick);
    this.button.disabled = this.originalState.buttonDisabled;
    restoreAttribute(this.button, "type", this.originalState.buttonType);
    restoreAttribute(this.button, "aria-label", this.originalState.buttonAriaLabel);
    restoreAttribute(this.button, "aria-busy", this.originalState.buttonAriaBusy);

    if (this.labelElement && this.originalState.labelText !== null) {
      this.labelElement.textContent = this.originalState.labelText;
    }

    if (this.generatedStatusElement) {
      this.generatedStatusElement.remove();
    } else if (this.statusElement) {
      this.statusElement.textContent = this.originalState.statusText ?? "";
      restoreAttribute(this.statusElement, "role", this.originalState.statusRole);
      restoreAttribute(this.statusElement, "aria-live", this.originalState.statusLive);
      restoreAttribute(this.statusElement, "aria-atomic", this.originalState.statusAtomic);

      if (this.statusOriginalParent) {
        const sibling = this.statusOriginalNextSibling;
        this.statusOriginalParent.insertBefore(
          this.statusElement,
          sibling?.parentNode === this.statusOriginalParent ? sibling : null
        );
      }
    }

    for (const [element, classes] of this.addedClasses) {
      element.classList.remove(...classes);
    }
    this.addedClasses.clear();
    for (const className of ROOT_STATE_CLASSES) {
      this.root.classList.toggle(className, this.originalRootStateClasses.has(className));
    }
    this.generatedStatusElement = null;
    this.statusOriginalParent = null;
    this.statusOriginalNextSibling = null;
    this.setAriaLabel = false;

    this.initialized = false;
    this.sourceElement = undefined;
    A11yCopyButton.instances.delete(this.root);
    this.destroyed = true;
    this.dispatch(EVENTS.destroy, {});
    void this.runAddonHook("afterDestroy", {}, undefined, false);
  }

  public copy(value?: string): Promise<void> {
    return this.copyInternal(value);
  }

  public setValue(value: string): void {
    this.options.value = value;
    this.currentValue = value;
  }

  public getValue(): string {
    return this.currentValue ?? this.options.value ?? "";
  }

  public setLabel(label: string): void {
    if (this.labelElement) {
      this.labelElement.textContent = label;
      return;
    }

    this.button.textContent = label;
  }

  public setStatus(status: CopyButtonStatus, message?: string): void {
    this.placeStatusElement();
    this.currentStatus = status;
    this.root.classList.remove(...STATUS_CLASSES);

    if (status === "copying") {
      this.root.classList.add(CLASSES.copying);
      this.button.setAttribute("aria-busy", "true");
    } else {
      restoreAttribute(this.button, "aria-busy", this.originalState.buttonAriaBusy);
    }

    if (status === "success") {
      this.root.classList.add(CLASSES.success);
    }

    if (status === "error") {
      this.root.classList.add(CLASSES.error);
    }

    if (status === "disabled") {
      this.root.classList.add(CLASSES.disabled);
    } else if (!this.options.disabled) {
      this.root.classList.remove(CLASSES.disabled);
    }

    const resolvedMessage = message ?? this.t(STATUS_MESSAGE_KEYS[status]);

    if (this.statusElement) {
      this.statusElement.textContent = status === "idle" && message === undefined ? "" : resolvedMessage;
    }
  }

  public reset(): void {
    void this.runAddonHook("beforeReset");
    this.clearResetTimer();

    if (this.options.disabled) {
      this.setStatus("disabled");
    } else {
      this.setStatus("idle", "");
    }

    this.dispatch(EVENTS.reset, { status: this.currentStatus });
    void this.runAddonHook("afterReset");
  }

  public enable(): void {
    this.applyDisabled(false, true);
  }

  public disable(): void {
    this.applyDisabled(true, true);
  }

  public setLocale(locale: string, messages: Partial<CopyButtonMessages> = {}): void {
    const currentMessages = this.messagesByLocale.get(locale) ?? DEFAULT_MESSAGES;
    const nextMessages = Object.freeze({
      ...DEFAULT_MESSAGES,
      ...currentMessages,
      ...messages
    });

    this.options.locale = locale;
    this.options.messages = nextMessages;
    this.messagesByLocale.set(locale, nextMessages);

    if (this.setAriaLabel) {
      this.button.setAttribute("aria-label", this.t("copy"));
    }

    if (this.currentStatus !== "idle") {
      this.setStatus(this.currentStatus);
    }
  }

  public t(key: string, params: Record<string, unknown> = {}): string {
    const messages = this.messagesByLocale.get(this.options.locale) ?? DEFAULT_MESSAGES;
    const template = messages[key as keyof CopyButtonMessages] ?? key;

    return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, name: string) => {
      const value = params[name];
      return value === undefined || value === null ? "" : String(value);
    });
  }

  public registerAddon(addon: CopyButtonAddon): void {
    addNormalizedAddon(this.addons, addon);
  }

  public unregisterAddon(name: string): void {
    const index = this.addons.findIndex((addon) => addon.name === name);

    if (index >= 0) {
      this.addons.splice(index, 1);
    }
  }

  public getAddon(name: string): CopyButtonAddon | undefined {
    return this.addons.find((addon) => addon.name === name);
  }

  public getAddons(): CopyButtonAddon[] {
    return [...this.addons];
  }

  private async copyFromTrigger(trigger: Event): Promise<void> {
    await this.copyInternal(undefined, trigger);
  }

  private async copyInternal(explicitValue?: string, trigger?: Event): Promise<void> {
    if (!this.initialized) {
      this.init();
    }

    const generation = ++this.copyGeneration;

    if (this.options.disabled) {
      const error = new Error(this.t("disabled"));
      await this.handleCopyError(error, generation, undefined, undefined, trigger);
      throw error;
    }

    let resolved: ResolvedCopyValue;

    try {
      resolved = await this.resolveValue(explicitValue, generation);
    } catch (error) {
      await this.handleCopyError(error, generation, undefined, undefined, trigger);
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

  private async resolveValue(explicitValue: string | undefined, generation: number): Promise<ResolvedCopyValue> {
    await this.runAddonHook("beforeResolveValue", { explicitValue }, generation);
    if (!this.isCurrentCopy(generation)) return { value: "", source: "custom" };

    let resolved: ResolvedCopyValue;

    if (explicitValue !== undefined) {
      resolved = { value: explicitValue, source: "explicit" };
    } else if (this.options.copyMode === "custom" || this.options.getValue) {
      const value = this.options.getValue ? await this.options.getValue(this.root) : "";
      resolved = { value: stringifyValue(value), source: "custom" };
    } else if (this.options.value !== undefined) {
      resolved = { value: this.options.value, source: "option" };
    } else {
      resolved = this.resolveFromSource();
    }

    if (this.isCurrentCopy(generation)) await this.runAddonHook("afterResolveValue", resolved, generation);
    return resolved;
  }

  private resolveFromSource(): ResolvedCopyValue {
    const source = this.findSourceElement();

    if (!source) {
      return {
        value: getText(this.root),
        source: "root-text"
      };
    }

    if (this.options.sourceAttribute) {
      return {
        value: source.getAttribute(this.options.sourceAttribute) ?? "",
        source: source === this.root ? "root-attribute" : "source-attribute"
      };
    }

    if (this.options.copyMode === "attribute") {
      return {
        value: "",
        source: source === this.root ? "root-attribute" : "source-attribute"
      };
    }

    if (this.options.copyMode === "value") {
      return {
        value: getElementValue(source),
        source: "source-value"
      };
    }

    return {
      value: getText(source),
      source: source === this.root ? "root-text" : "source-text"
    };
  }

  private async writeText(value: string, generation: number): Promise<void> {
    const clipboard = globalThis.navigator?.clipboard;
    const clipboardError = new Error(this.t("unavailable"));

    if (clipboard && typeof clipboard.writeText === "function") {
      try {
        await clipboard.writeText(value);
        return;
      } catch (error) {
        if (!this.options.fallbackCopy || !this.isCurrentCopy(generation)) {
          throw error;
        }
      }
    } else if (!this.options.fallbackCopy) {
      throw clipboardError;
    }

    if (this.isCurrentCopy(generation)) await fallbackWriteText(value);
  }

  private async handleCopyError(
    error: unknown,
    generation: number,
    value?: string,
    source?: CopyButtonValueSource,
    trigger?: Event
  ): Promise<void> {
    if (!this.isCurrentCopy(generation)) return;
    this.setStatus(this.options.disabled ? "disabled" : "error");
    const detail = { error, value, source, trigger };
    this.dispatch(EVENTS.error, detail);
    await this.runAddonHook("onError", detail, generation);
    if (this.isCurrentCopy(generation)) this.scheduleReset();
  }

  private isCurrentCopy(generation: number): boolean {
    return this.initialized && generation === this.copyGeneration;
  }

  private applyDisabled(disabled: boolean, emit: boolean): void {
    this.copyGeneration += 1;
    this.clearResetTimer();
    this.options.disabled = disabled;
    this.button.disabled = disabled;

    if (disabled) {
      this.root.classList.add(CLASSES.disabled);
      this.setStatus("disabled");

      if (emit) {
        this.dispatch(EVENTS.disabled, { status: this.currentStatus });
      }

      return;
    }

    this.root.classList.remove(CLASSES.disabled);
    this.setStatus("idle", "");

    if (emit) {
      this.dispatch(EVENTS.enabled, { status: this.currentStatus });
    }
  }

  private scheduleReset(): void {
    this.clearResetTimer();

    if (this.options.resetDelay <= 0) {
      return;
    }

    this.resetTimer = globalThis.setTimeout(() => {
      this.reset();
    }, this.options.resetDelay);
  }

  private clearResetTimer(): void {
    if (this.resetTimer !== undefined) {
      globalThis.clearTimeout(this.resetTimer);
      this.resetTimer = undefined;
    }
  }

  private findLabelElement(): HTMLElement | null {
    return safeQuery(this.root, SELECTORS.label);
  }

  private findStatusElement(): HTMLElement | null {
    if (this.root === this.button && this.button.nextElementSibling?.matches(SELECTORS.status)) {
      return this.button.nextElementSibling as HTMLElement;
    }

    return safeQuery(this.root, SELECTORS.status);
  }

  private findSourceElement(): HTMLElement | null {
    if (this.sourceElement && (this.root.contains(this.sourceElement) || this.sourceElement.isConnected)) {
      return this.sourceElement;
    }

    this.sourceElement = undefined;

    if (this.options.sourceSelector) {
      const localSource = safeQuery(this.root, this.options.sourceSelector);
      const source = localSource ?? safeQuery(document, this.options.sourceSelector);
      this.sourceElement = source ?? undefined;
      return source;
    }

    const source = safeQuery(this.root, SELECTORS.source);
    this.sourceElement = source ?? undefined;
    return source;
  }

  private createStatusElement(): HTMLElement {
    const statusElement = document.createElement("span");
    statusElement.setAttribute("data-a11y-copy-button-status", "");
    statusElement.className = CLASSES.status;

    if (this.root !== this.button) {
      this.root.append(statusElement);
    }

    return statusElement;
  }

  private placeStatusElement(): void {
    if (!this.statusElement || this.destroyed) {
      return;
    }

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
      this.statusPlacementObserver.observe(this.button.ownerDocument, { childList: true, subtree: true });
    }
  }

  private configureStatusElement(): void {
    if (!this.statusElement || !this.options.announceStatus) {
      return;
    }

    this.statusElement.setAttribute("role", "status");
    this.statusElement.setAttribute("aria-live", "polite");
    this.statusElement.setAttribute("aria-atomic", "true");
  }

  private configureButton(): void {
    if (this.button.getAttribute("type") !== "button") {
      this.button.setAttribute("type", "button");
    }

    if (!hasAccessibleName(this.button)) {
      this.button.setAttribute("aria-label", this.t("copy"));
      this.setAriaLabel = true;
    }
  }

  private addClass(element: HTMLElement, className: string): void {
    if (!element.classList.contains(className)) {
      element.classList.add(className);
      const classes = this.addedClasses.get(element) ?? new Set<string>();
      classes.add(className);
      this.addedClasses.set(element, classes);
    }
  }

  private async runAddonHook(
    hook: keyof CopyButtonAddon,
    data: Record<string, unknown> = {},
    generation?: number,
    reportErrors = true
  ): Promise<void> {
    const lifecycleGeneration = this.lifecycleGeneration;

    for (const addon of this.addons) {
      if (generation !== undefined && !this.isCurrentCopy(generation)) return;
      if (generation === undefined && lifecycleGeneration !== this.lifecycleGeneration) return;
      if (generation === undefined && this.destroyed && hook !== "afterDestroy") return;
      const handler = addon[hook] as ((context: Record<string, unknown>) => void | Promise<void>) | undefined;

      if (typeof handler !== "function") {
        continue;
      }

      try {
        await handler({
          instance: this,
          root: this.root,
          button: this.button,
          options: this.options,
          ...data
        });
      } catch (error) {
        const currentOperation = generation === undefined
          ? lifecycleGeneration === this.lifecycleGeneration && !this.destroyed
          : this.isCurrentCopy(generation);

        if (reportErrors && currentOperation) {
          this.dispatch(EVENTS.addonError, {
            addon: addon.name,
            hook,
            error
          });
        }
      }
    }
  }

  private dispatch(name: string, detail: Record<string, unknown>): void {
    if (this.destroyed && name !== EVENTS.destroy) return;

    this.root.dispatchEvent(
      new CustomEvent(name, {
        bubbles: true,
        composed: false,
        cancelable: false,
        detail: {
          instance: this,
          ...detail
        }
      })
    );
  }
}

export function createCopyButton(root: HTMLElement, options: CopyButtonOptions = {}): CopyButtonInstance {
  return new A11yCopyButton(root, options);
}

export function initCopyButtonAll(options: CopyButtonOptions = {}): CopyButtonInstance[] {
  if (typeof document === "undefined") {
    return [];
  }

  return Array.from(document.querySelectorAll<HTMLElement>(SELECTORS.root), (root) => createCopyButton(root, options));
}

function normalizeOptions(root: HTMLElement, options: CopyButtonOptions): NormalizedCopyButtonOptions {
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

function normalizeAddons(addons: CopyButtonAddon[] = []): CopyButtonAddon[] {
  const normalizedAddons: CopyButtonAddon[] = [];

  for (const addon of addons) {
    addNormalizedAddon(normalizedAddons, addon);
  }

  return normalizedAddons;
}

function addNormalizedAddon(addons: CopyButtonAddon[], addon: CopyButtonAddon): void {
  const normalizedAddon = normalizeAddon(addon);
  const existingIndex = addons.findIndex((item) => item.name === normalizedAddon.name);

  if (existingIndex >= 0) {
    addons.splice(existingIndex, 1);
  }

  addons.push(normalizedAddon);
}

function normalizeAddon(addon: CopyButtonAddon): CopyButtonAddon {
  const name = addon.name.trim();

  if (!name) {
    throw new TypeError("Copy button addons require a non-empty name.");
  }

  return { ...addon, name };
}

function readDataOptions(root: HTMLElement): Partial<NormalizedCopyButtonOptions> {
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

function readStringAttribute(root: HTMLElement, name: string): string | undefined {
  const value = root.getAttribute(name);
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function readValueAttribute(root: HTMLElement, name: string): string | undefined {
  if (!root.hasAttribute(name)) {
    return undefined;
  }

  return root.getAttribute(name) ?? "";
}

function readIntegerAttribute(root: HTMLElement, name: string): number | undefined {
  const value = root.getAttribute(name);
  const normalized = value?.trim();

  if (!normalized || !/^\d+$/.test(normalized)) {
    return undefined;
  }

  const parsed = Number(normalized);
  return Number.isSafeInteger(parsed) ? parsed : undefined;
}

function readBooleanAttribute(root: HTMLElement, name: string): boolean | undefined {
  const value = root.getAttribute(name);

  if (value === null) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "" || normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  return undefined;
}

function normalizeCopyMode(value: string | undefined): CopyButtonCopyMode {
  if (value === "value" || value === "text" || value === "attribute" || value === "custom") {
    return value;
  }

  return DEFAULT_OPTIONS.copyMode;
}

function findButton(root: HTMLElement): HTMLButtonElement | null {
  if (root instanceof HTMLButtonElement) {
    return root;
  }

  return root.querySelector<HTMLButtonElement>(SELECTORS.button);
}

function safeQuery(root: ParentNode, selector: string): HTMLElement | null {
  try {
    return root.querySelector<HTMLElement>(selector);
  } catch {
    return null;
  }
}

function restoreAttribute(element: HTMLElement, name: string, value: string | null): void {
  if (value === null) {
    element.removeAttribute(name);
    return;
  }

  element.setAttribute(name, value);
}

function hasAccessibleName(button: HTMLButtonElement): boolean {
  const name =
    button.getAttribute("aria-label") ??
    button.getAttribute("title") ??
    button.textContent ??
    "";

  return name.trim().length > 0;
}

function getText(element: HTMLElement): string {
  return element.textContent?.trim() ?? "";
}

function getElementValue(element: HTMLElement): string {
  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement
  ) {
    return element.value;
  }

  return getText(element);
}

function stringifyValue(value: string | Promise<string>): string {
  return value === undefined || value === null ? "" : String(value);
}

async function fallbackWriteText(value: string): Promise<void> {
  if (typeof document === "undefined" || !document.body || typeof document.execCommand !== "function") {
    throw new Error("Fallback copy is unavailable.");
  }

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
    const copied = document.execCommand("copy");

    if (!copied) {
      throw new Error("Fallback copy failed.");
    }
  } finally {
    textarea.remove();
    activeElement?.focus();
  }
}
