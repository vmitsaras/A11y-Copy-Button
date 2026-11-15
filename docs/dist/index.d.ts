//#region src/index.d.ts
type CopyButtonStatus = "idle" | "copying" | "success" | "error" | "disabled";
type CopyButtonCopyMode = "value" | "text" | "attribute" | "custom";
type CopyButtonValueSource = "explicit" | "custom" | "option" | "source-attribute" | "source-text" | "source-value" | "root-attribute" | "root-text";
interface CopyButtonMessages {
  copy: string;
  copying: string;
  copied: string;
  failed: string;
  unavailable: string;
  reset: string;
  disabled: string;
}
interface CopyButtonOptions {
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
interface CopyButtonInstance {
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
interface CopyButtonAddonContext {
  instance: CopyButtonInstance;
  root: HTMLElement;
  button: HTMLButtonElement;
  options: Readonly<NormalizedCopyButtonOptions>;
}
interface CopyButtonResolveValueContext extends CopyButtonAddonContext {
  explicitValue?: string;
}
interface CopyButtonResolvedValueContext extends CopyButtonAddonContext {
  value: string;
  source: CopyButtonValueSource;
}
interface CopyButtonCopyContext extends CopyButtonResolvedValueContext {
  trigger?: Event;
}
interface CopyButtonErrorContext extends CopyButtonAddonContext {
  error: unknown;
  value?: string;
  source?: CopyButtonValueSource;
  trigger?: Event;
}
interface CopyButtonAddon {
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
interface CopyButtonEventDetail {
  instance: CopyButtonInstance;
}
interface CopyButtonStatusEventDetail extends CopyButtonEventDetail {
  status: CopyButtonStatus;
}
interface CopyButtonCopyEventDetail extends CopyButtonEventDetail {
  value: string;
  source: CopyButtonValueSource;
  trigger?: Event;
}
interface CopyButtonErrorEventDetail extends CopyButtonEventDetail {
  error: unknown;
  value?: string;
  source?: CopyButtonValueSource;
  trigger?: Event;
}
interface CopyButtonAddonErrorEventDetail extends CopyButtonEventDetail {
  addon: string;
  hook: string;
  error: unknown;
}
interface CopyButtonEventMap {
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
type CopyButtonEventName = keyof CopyButtonEventMap;
type CopyButtonEvent<K extends CopyButtonEventName> = CustomEvent<CopyButtonEventMap[K]>;
type CopyButtonEventListener<K extends CopyButtonEventName> = (event: CopyButtonEvent<K>) => void;
/** Subscribe to a copy-button event and return an idempotent unsubscribe function. */
declare function addCopyButtonEventListener<K extends CopyButtonEventName>(target: EventTarget, name: K, listener: CopyButtonEventListener<K>, options?: boolean | AddEventListenerOptions): () => void;
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
declare const COPY_BUTTON_EVENTS: Readonly<{
  init: "a11y-copy-button:init";
  ready: "a11y-copy-button:ready";
  beforeCopy: "a11y-copy-button:before-copy";
  copy: "a11y-copy-button:copy";
  success: "a11y-copy-button:success";
  error: "a11y-copy-button:error";
  reset: "a11y-copy-button:reset";
  disabled: "a11y-copy-button:disabled";
  enabled: "a11y-copy-button:enabled";
  addonError: "a11y-copy-button:addon-error";
  destroy: "a11y-copy-button:destroy";
}>;
declare class A11yCopyButton implements CopyButtonInstance {
  private static readonly instances;
  readonly root: HTMLElement;
  private readonly button;
  private readonly options;
  private readonly messagesByLocale;
  private readonly addedClasses;
  private originalRootStateClasses;
  private readonly addons;
  private readonly originalState;
  private labelElement;
  private statusElement;
  private generatedStatusElement;
  private statusOriginalParent;
  private statusOriginalNextSibling;
  private statusPlacementObserver;
  private sourceElement;
  private resetTimer;
  private initialized;
  private destroyed;
  private lifecycleGeneration;
  private currentValue;
  private currentStatus;
  private copyGeneration;
  private setAriaLabel;
  private readonly handleClick;
  constructor(root: HTMLElement, options?: CopyButtonOptions);
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
  private copyFromTrigger;
  private copyInternal;
  private resolveValue;
  private resolveFromSource;
  private writeText;
  private handleCopyError;
  private isCurrentCopy;
  private applyDisabled;
  private scheduleReset;
  private clearResetTimer;
  private findLabelElement;
  private findStatusElement;
  private findSourceElement;
  private createStatusElement;
  private placeStatusElement;
  private configureStatusElement;
  private configureButton;
  private addClass;
  private runAddonHook;
  private dispatch;
}
declare function createCopyButton(root: HTMLElement, options?: CopyButtonOptions): CopyButtonInstance;
declare function initCopyButtonAll(options?: CopyButtonOptions): CopyButtonInstance[];
//#endregion
export { A11yCopyButton, COPY_BUTTON_EVENTS, CopyButtonAddon, CopyButtonAddonContext, CopyButtonAddonErrorEventDetail, CopyButtonCopyContext, CopyButtonCopyEventDetail, CopyButtonCopyMode, CopyButtonErrorContext, CopyButtonErrorEventDetail, CopyButtonEvent, CopyButtonEventDetail, CopyButtonEventListener, CopyButtonEventMap, CopyButtonEventName, CopyButtonInstance, CopyButtonMessages, CopyButtonOptions, CopyButtonResolveValueContext, CopyButtonResolvedValueContext, CopyButtonStatus, CopyButtonStatusEventDetail, CopyButtonValueSource, addCopyButtonEventListener, createCopyButton, initCopyButtonAll };
//# sourceMappingURL=index.d.ts.map