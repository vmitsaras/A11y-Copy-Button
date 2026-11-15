# A11yCopyButton

Accessible copy-to-clipboard button with localized status messages, fallback behavior, and addon hooks.

A11yCopyButton is a framework-agnostic TypeScript plugin for enhancing real buttons that copy a configured value. It is designed for media cards, dialogs, metadata panels, share panels, and standalone content.

## Installation

```bash
npm install a11y-copy-button
```

```bash
pnpm add a11y-copy-button
```

```bash
yarn add a11y-copy-button
```

## Usage

```ts
import { createCopyButton } from "a11y-copy-button";
import "a11y-copy-button/styles.css";

const root = document.querySelector<HTMLElement>("[data-a11y-copy-button]");

if (root) {
  createCopyButton(root, {
    value: "https://example.com/media/42"
  });
}
```

No instance is created on import. Use `createCopyButton()` for one button or `initCopyButtonAll()` for all `[data-a11y-copy-button]` roots in the current document.

## CSS

Import the default CSS when you want the bundled layout, visible focus, and status styling:

```ts
import "a11y-copy-button/styles.css";
```

Public custom properties:

- `--a11y-copy-button-background`
- `--a11y-copy-button-color`
- `--a11y-copy-button-border`
- `--a11y-copy-button-focus-ring`
- `--a11y-copy-button-success-color`
- `--a11y-copy-button-error-color`

The root uses `.a11y-copy-button`; optional label and status elements use `.a11y-copy-button__label` and `.a11y-copy-button__status`. The `a11y-copy-button--copying`, `a11y-copy-button--success`, and `a11y-copy-button--error` classes identify feedback states, while `.is-disabled` identifies the disabled state. The stylesheet adds a visible `:focus-visible` indicator and reduces its transition duration for users who prefer reduced motion.

## HTML Structure

The root can be the real button:

```html
<button
  type="button"
  data-a11y-copy-button
  data-a11y-copy-button-value="https://example.com/media/42"
>
  <span data-a11y-copy-button-label>Copy link</span>
</button>
<span data-a11y-copy-button-status></span>
```

The root can also contain a real button:

```html
<div data-a11y-copy-button data-a11y-copy-button-source-selector="#caption">
  <p id="caption" data-a11y-copy-button-source>Harbor sunrise with boats.</p>
  <button type="button">
    <span data-a11y-copy-button-label>Copy caption</span>
  </button>
  <span data-a11y-copy-button-status></span>
</div>
```

## API

```ts
import {
  A11yCopyButton,
  COPY_BUTTON_EVENTS,
  addCopyButtonEventListener,
  createCopyButton,
  initCopyButtonAll,
  type CopyButtonAddon,
  type CopyButtonAddonContext,
  type CopyButtonAddonErrorEventDetail,
  type CopyButtonCopyContext,
  type CopyButtonCopyEventDetail,
  type CopyButtonCopyMode,
  type CopyButtonErrorContext,
  type CopyButtonErrorEventDetail,
  type CopyButtonEvent,
  type CopyButtonEventDetail,
  type CopyButtonEventMap,
  type CopyButtonEventName,
  type CopyButtonEventListener,
  type CopyButtonInstance,
  type CopyButtonMessages,
  type CopyButtonOptions,
  type CopyButtonResolveValueContext,
  type CopyButtonResolvedValueContext,
  type CopyButtonStatus,
  type CopyButtonStatusEventDetail,
  type CopyButtonValueSource
} from "a11y-copy-button";
```

### Functions

- `createCopyButton(root, options?)`: creates or returns the existing instance for one root.
- `initCopyButtonAll(options?)`: initializes every `[data-a11y-copy-button]` root in the document.
- `addCopyButtonEventListener(target, name, listener, options?)`: adds a typed event listener and returns an idempotent unsubscribe function. Use the component root for one instance or an ancestor for delegated observation.

### Instance Methods

- `init(): void`
- `destroy(): void`
- `copy(value?: string): Promise<void>`
- `setValue(value: string): void`
- `getValue(): string`
- `setLabel(label: string): void`
- `setStatus(status: CopyButtonStatus, message?: string): void`
- `reset(): void`
- `enable(): void`
- `disable(): void`
- `setLocale(locale: string, messages?: Partial<CopyButtonMessages>): void`
- `t(key: string, params?: Record<string, unknown>): string`
- `registerAddon(addon: CopyButtonAddon): void`
- `unregisterAddon(name: string): void`
- `getAddon(name: string): CopyButtonAddon | undefined`
- `getAddons(): CopyButtonAddon[]`

`getValue()` returns the last successfully copied value or the value supplied to `setValue()`, including an empty string. Before either operation, it returns the configured value or an empty string.

After `destroy()`, explicit `init()` registers the same instance again, so `createCopyButton(root)` continues to reuse it. If a different instance has already initialized that root, reinitializing the old instance throws an error. Cleanup restores authored status text and attributes and removes component classes only from the elements where the plugin added them. Root state classes (`is-initialized`, `is-disabled`, and the copying/success/error classes) follow the current state while active and are restored to their pre-initialization membership on destroy. Each explicit `init()` captures that membership again.

### Options

```ts
interface CopyButtonOptions {
  value?: string;
  sourceSelector?: string;
  sourceAttribute?: string;
  copyMode?: "value" | "text" | "attribute" | "custom";
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
```

`fallbackCopy` defaults to `false`. When set to `true`, the plugin may use the deprecated hidden-textarea fallback if `navigator.clipboard.writeText()` is unavailable or fails.

`allowEmpty` defaults to `false`. Empty and whitespace-only values are rejected unless this option is enabled.

### Format a share string with `getValue`

Use `getValue` when the text to copy combines values from your page. The callback runs when the button is activated, so it can use the current values. No formatting option or addon is needed.

```html
<button type="button" data-a11y-copy-button
  data-share-title="Accessible media guide"
  data-share-url="https://example.com/accessible-media">
  <span data-a11y-copy-button-label>Copy title and link</span>
</button>
<span data-a11y-copy-button-status></span>
```

```ts
const button = document.querySelector<HTMLElement>("[data-share-url]");

if (button) {
  createCopyButton(button, {
    getValue: (root) => `${root.dataset.shareTitle ?? ""} — ${root.dataset.shareUrl ?? ""}`
  });
}
```

This copies `Accessible media guide — https://example.com/accessible-media`. Validate required data in your application before enabling the button; the plugin rejects only empty or whitespace-only results by default.

### Copy a table as Markdown

The optional table adapter converts a native table to a Markdown table. It supports one header row in `<thead>` or an all-`<th>` first row, followed by rows with the same number of cells. Cell whitespace is collapsed, `<br>` becomes a space, and Markdown control characters are escaped. A nonempty caption is included as plain text above the table.

Tables without a header, with uneven rows, or with spanning cells throw an error. When used by the copy button, that error is shown through its normal error status and nothing is written to the clipboard.

```ts
import { createCopyButton } from "a11y-copy-button";
import { tableToMarkdown } from "a11y-copy-button/adapters/table-markdown";

const button = document.querySelector<HTMLElement>("#copy-table");
const table = document.querySelector<HTMLTableElement>("#results");

if (button && table) {
  createCopyButton(button, {
    getValue: () => tableToMarkdown(table)
  });
}
```

`getValue` runs for each activation, so edits made to the table after initialization are included.

When copies overlap, the most recently started attempt controls status, announcements, and copy result events. An older attempt that is still resolving a value will not start a clipboard write after a newer attempt begins. A write already in progress cannot be canceled, but its late result does not replace newer feedback. Disabling or destroying the instance also invalidates pending attempts; a started `copy()` promise still reflects a clipboard rejection to its caller without announcing that stale failure. Disabling uses the native button state.

Equivalent data attributes can be placed on the root element:

- `data-a11y-copy-button-value`
- `data-a11y-copy-button-source-selector`
- `data-a11y-copy-button-source-attribute`
- `data-a11y-copy-button-copy-mode`
- `data-a11y-copy-button-reset-delay`
- `data-a11y-copy-button-disabled`
- `data-a11y-copy-button-locale`
- `data-a11y-copy-button-announce-status`
- `data-a11y-copy-button-fallback-copy`
- `data-a11y-copy-button-allow-empty`

Boolean data attributes accept an empty value, `true`, or `false` with surrounding whitespace ignored. `data-a11y-copy-button-reset-delay` must be a non-negative integer; malformed values are ignored and the default delay is used.

### Lifecycle Events

All events dispatch from the component root, bubble, are non-cancelable, and are not composed across Shadow DOM boundaries. Each detail includes `instance`.

| Event | Additional detail | Trigger |
| --- | --- | --- |
| `a11y-copy-button:init` | — | Initialization begins, before root setup. |
| `a11y-copy-button:ready` | — | Synchronous initialization setup has completed. Async addon hooks are not awaited. |
| `a11y-copy-button:before-copy` | `value`, `source`, `trigger?` | A non-empty value resolved and copying status was set, before the clipboard write. |
| `a11y-copy-button:copy` | `value`, `source`, `trigger?` | Clipboard write succeeded, before success status is set. |
| `a11y-copy-button:success` | `value`, `source`, `trigger?` | Successful write and success status update. |
| `a11y-copy-button:error` | `error`, `value?`, `source?`, `trigger?` | The current copy attempt failed. |
| `a11y-copy-button:reset` | `status` | Explicit reset or configured success/error reset timer. |
| `a11y-copy-button:disabled` | `status` | `disable()` was called. |
| `a11y-copy-button:enabled` | `status` | `enable()` was called. |
| `a11y-copy-button:addon-error` | `addon`, `hook`, `error` | An addon hook failed during the current lifecycle. |
| `a11y-copy-button:destroy` | — | Cleanup completed. A later explicit `init()` starts a new lifecycle. |

Use `COPY_BUTTON_EVENTS` to avoid string literals. `addCopyButtonEventListener()` types the event detail and returns cleanup:

```ts
const unsubscribe = addCopyButtonEventListener(
  root,
  COPY_BUTTON_EVENTS.success,
  (event) => console.log(event.detail.value, event.detail.source)
);

unsubscribe();
```

`destroy` is terminal for its lifecycle: pending copy work and late addon-hook failures do not emit events after it. Lifecycle addon hooks remain non-blocking; `ready` does not mean async `afterInit` work has completed.

## Addons

Addons are small hook objects. Hook errors are isolated and reported through `a11y-copy-button:addon-error`.
Addon names are trimmed and must be non-empty. If multiple addons use the same normalized name, the later addon replaces the earlier one.

```ts
const addon = {
  name: "analytics",
  onSuccess({ value }) {
    console.log("Copied", value);
  }
};

const instance = createCopyButton(root, { addons: [addon] });
```

Supported hooks:

- `beforeInit`
- `afterInit`
- `beforeResolveValue`
- `afterResolveValue`
- `beforeCopy`
- `afterCopy`
- `onSuccess`
- `onError`
- `beforeReset`
- `afterReset`
- `beforeDestroy`
- `afterDestroy`

## Selectors

- `[data-a11y-copy-button]`: root button or container.
- `[data-a11y-copy-button-label]`: optional label element.
- `[data-a11y-copy-button-status]`: optional status element.
- `[data-a11y-copy-button-source]`: optional source element.

When a source selector initially matches nothing, or a previously matched source is removed, the plugin checks again during copy so late-rendered content can still be copied.

## Accessibility Notes

- Use a real `<button type="button">` for activation.
- The button must have an accessible name.
- The plugin does not use `aria-pressed`; copying is a momentary action, not a toggle.
- When `announceStatus` is `true`, status messages use `role="status"` and `aria-live="polite"`.
- Place the status element outside the button so changing feedback does not change the button's accessible name. Existing status elements inside a button are moved beside it during initialization and restored on destroy.
- For a parentless button, feedback is kept detached until the button gains a parent. Insertion into the document is observed; status updates also retry placement. Destroying the instance cancels pending placement.
- Focus stays on the copy button after success or failure.
- Disabled state uses the native `disabled` attribute when possible.
- Success and error states include status text and visible border treatment, not color alone.
- Test with your target browsers and assistive technologies, especially if you enable fallback copy behavior.

## Keyboard Behavior

The plugin relies on native button behavior:

- `Tab` moves focus to and away from the button in document order.
- `Enter` and `Space` activate the button.

## Limitations

Clipboard writes usually require a secure context and user activation. The fallback path is opt-in because it relies on deprecated browser behavior. The plugin reports failures with an error event and localized status message instead of silently failing.

## Examples

See [`examples/basic`](./examples/basic/README.md) for static value, source text, code block, source attribute, table-to-Markdown, and error-status examples. The optional, locally run [`A11y-Notify integration example`](./examples/a11y-notify/README.md) demonstrates native `document.ariaNotify()` and live-region announcement transports while keeping visible copy feedback. It also opts into the copy button's separate clipboard fallback.

## Docs Metadata

```ts
import { docs } from "a11y-copy-button/docs";
```
