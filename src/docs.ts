export interface PluginDocs {
  slug: string;
  name: string;
  packageName: string;
  description: string;
  repo: string;
  npm: string;
  install: {
    npm: string;
    pnpm: string;
    yarn: string;
  };
  usage: {
    html: string;
    js: string;
    css: string;
  };
  selectors: Array<{
    name: string;
    selector: string;
    description: string;
  }>;
  keyboard: Array<{
    key: string;
    behavior: string;
  }>;
  api: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  events: Array<{
    name: string;
    detail: string;
    trigger?: string;
    target?: string;
    bubbles?: boolean;
    composed?: boolean;
    cancelable?: boolean;
  }>;
  examples: Array<{
    name: string;
    path: string;
    description: string;
  }>;
  accessibility: string[];
}

export const docs: PluginDocs = {
  slug: "a11y-copy-button",
  name: "A11yCopyButton",
  packageName: "a11y-copy-button",
  description:
    "Accessible copy-to-clipboard button with localized status messages, fallback behavior, and addon hooks.",
  repo: "https://github.com/vmitsaras/A11y-Copy-Button",
  npm: "https://www.npmjs.com/package/a11y-copy-button",
  install: {
    npm: "npm install a11y-copy-button",
    pnpm: "pnpm add a11y-copy-button",
    yarn: "yarn add a11y-copy-button"
  },
  usage: {
    html: `<button type="button" data-a11y-copy-button data-a11y-copy-button-value="https://example.com">
  <span data-a11y-copy-button-label>Copy link</span>
</button>
<span data-a11y-copy-button-status></span>`,
    js: `import { createCopyButton } from "a11y-copy-button";
import "a11y-copy-button/styles.css";

const root = document.querySelector("[data-a11y-copy-button]");
if (root instanceof HTMLElement) createCopyButton(root);`,
    css: `@import "a11y-copy-button/styles.css";`
  },
  selectors: [
    {
      name: "root",
      selector: "[data-a11y-copy-button]",
      description: "Root button or container enhanced by the plugin."
    },
    {
      name: "label",
      selector: "[data-a11y-copy-button-label]",
      description: "Optional label element updated through setLabel()."
    },
    {
      name: "status",
      selector: "[data-a11y-copy-button-status]",
      description: "Optional status element used for visible and polite status messages."
    },
    {
      name: "source",
      selector: "[data-a11y-copy-button-source]",
      description:
        "Optional source element used when no static value is configured; missing or removed sources are checked again during copy."
    },
    {
      name: "root options",
      selector: "[data-a11y-copy-button-value], [data-a11y-copy-button-source-selector], [data-a11y-copy-button-source-attribute], [data-a11y-copy-button-copy-mode], [data-a11y-copy-button-reset-delay], [data-a11y-copy-button-disabled], [data-a11y-copy-button-locale], [data-a11y-copy-button-announce-status], [data-a11y-copy-button-fallback-copy], [data-a11y-copy-button-allow-empty]",
      description: "Optional root data attributes for copy value/source, mode, reset delay, disabled state, locale, announcements, clipboard fallback, and empty-value handling."
    }
  ],
  keyboard: [
    {
      key: "Tab",
      behavior: "Moves focus to and from the real button in normal page order."
    },
    {
      key: "Enter or Space",
      behavior: "Activates the native button and starts the copy action."
    }
  ],
  api: [
    {
      name: "A11yCopyButton",
      type: "class",
      description: "Creates an accessible copy button instance for one root element."
    },
    {
      name: "createCopyButton(root, options?)",
      type: "function",
      description: "Creates or returns the existing instance for a root element."
    },
    {
      name: "CopyButtonOptions",
      type: "interface",
      description: "Options configure the value source, copy mode, locale and messages, reset delay, disabled state, announcements, fallback behavior, empty-value handling, and addons."
    },
    {
      name: "CopyButtonInstance",
      type: "interface",
      description: "Instance interface for initialization, copying, value and status updates, locale changes, enable/disable, reset, destruction, and addon management."
    },
    {
      name: "initCopyButtonAll(options?)",
      type: "function",
      description: "Initializes every [data-a11y-copy-button] root in the current document."
    },
    {
      name: "COPY_BUTTON_EVENTS",
      type: "constant",
      description: "Event-name constants for the component lifecycle, copy results, status changes, and addon errors."
    },
    {
      name: "CopyButtonStatus, CopyButtonCopyMode, CopyButtonValueSource, CopyButtonMessages",
      type: "types",
      description: "Types for instance status, value resolution modes and sources, and localized status messages."
    },
    {
      name: "CopyButtonAddon",
      type: "interface",
      description: "Named optional hooks for initialization, value resolution, copying, reset, destruction, success, and error handling."
    },
    {
      name: "CopyButtonAddonContext, CopyButtonResolveValueContext, CopyButtonResolvedValueContext, CopyButtonCopyContext, CopyButtonErrorContext",
      type: "interfaces",
      description: "Context types supplied to addon hooks, including the instance, root, button, normalized options, and phase-specific values or errors."
    },
    {
      name: "CopyButtonEvent, CopyButtonEventMap, CopyButtonEventName, CopyButtonEventListener",
      type: "types",
      description: "Types for the public custom-event names, payload map, and typed event listeners."
    },
    {
      name: "CopyButtonEventDetail, CopyButtonStatusEventDetail, CopyButtonCopyEventDetail, CopyButtonErrorEventDetail, CopyButtonAddonErrorEventDetail",
      type: "interfaces",
      description: "Payload interfaces for lifecycle, status, copy, error, and addon-error events."
    },
    {
      name: "copy(value?)",
      type: "instance method",
      description: "Copies an explicit or lazily resolved value. The newest attempt controls status and result events; disable or destroy invalidates pending feedback."
    },
    {
      name: "setLocale(locale, messages?)",
      type: "instance method",
      description: "Switches localized messages without reinitializing the instance."
    },
    {
      name: "setValue(value), getValue()",
      type: "instance methods",
      description: "Sets the configured value or reads the most recently copied/set value, preserving empty strings; before either operation, reads the configured value."
    },
    {
      name: "setLabel(label), setStatus(status, message?)",
      type: "instance methods",
      description: "Updates the button label or its visible status feedback."
    },
    {
      name: "init(), reset(), enable(), disable(), destroy()",
      type: "instance methods",
      description: "Controls initialization, feedback reset, disabled state, and lifecycle cleanup. Reinitialization reuses the registry; an old instance cannot reclaim a root owned by another instance."
    },
    {
      name: "t(key, params?)",
      type: "instance method",
      description: "Resolves a localized message and interpolates named parameters."
    },
    {
      name: "registerAddon(addon)",
      type: "instance method",
      description: "Registers a named addon; names are trimmed, must be non-empty, and later duplicates replace earlier addons."
    },
    {
      name: "unregisterAddon(name), getAddon(name), getAddons()",
      type: "instance methods",
      description: "Removes an addon or reads registered addons; getAddons() returns a new array."
    },
    {
      name: "addCopyButtonEventListener(target, name, listener, options?)",
      type: "function",
      description: "Adds a typed copy-button event listener and returns an idempotent unsubscribe function."
    },
    {
      name: "tableToMarkdown(table)",
      type: "adapter function",
      description: "Converts a simple HTML table to Markdown. It requires one header row and rectangular rows, and rejects multiple header rows or spanning cells. Import from a11y-copy-button/adapters/table-markdown."
    }
  ],
  events: [
    {
      name: "a11y-copy-button:init",
      detail: "{ instance }",
      trigger: "Initialization begins, before the root is enhanced.",
      target: "component root",
      bubbles: true,
      composed: false,
      cancelable: false
    },
    {
      name: "a11y-copy-button:ready",
      detail: "{ instance }",
      trigger: "Synchronous initialization setup is complete.",
      target: "component root",
      bubbles: true,
      composed: false,
      cancelable: false
    },
    {
      name: "a11y-copy-button:before-copy",
      detail: "{ instance, value, source, trigger? }",
      trigger: "A non-empty value has resolved and copying status has been set, before the clipboard write.",
      target: "component root",
      bubbles: true,
      composed: false,
      cancelable: false
    },
    {
      name: "a11y-copy-button:copy",
      detail: "{ instance, value, source, trigger? }",
      trigger: "The clipboard write succeeds, before success status is set.",
      target: "component root",
      bubbles: true,
      composed: false,
      cancelable: false
    },
    {
      name: "a11y-copy-button:success",
      detail: "{ instance, value, source, trigger? }",
      trigger: "After a successful clipboard write and success status update.",
      target: "component root",
      bubbles: true,
      composed: false,
      cancelable: false
    },
    {
      name: "a11y-copy-button:error",
      detail: "{ instance, error, value?, source?, trigger? }",
      trigger: "A current copy attempt fails, including disabled, empty, value resolution, or clipboard failures.",
      target: "component root",
      bubbles: true,
      composed: false,
      cancelable: false
    },
    {
      name: "a11y-copy-button:reset",
      detail: "{ instance, status }",
      trigger: "An explicit reset or the configured success/error reset timer runs.",
      target: "component root",
      bubbles: true,
      composed: false,
      cancelable: false
    },
    {
      name: "a11y-copy-button:disabled",
      detail: "{ instance, status }",
      trigger: "disable() is called.",
      target: "component root",
      bubbles: true,
      composed: false,
      cancelable: false
    },
    {
      name: "a11y-copy-button:enabled",
      detail: "{ instance, status }",
      trigger: "enable() is called.",
      target: "component root",
      bubbles: true,
      composed: false,
      cancelable: false
    },
    {
      name: "a11y-copy-button:addon-error",
      detail: "{ instance, addon, hook, error }",
      trigger: "An addon hook fails during the current lifecycle; failures after destruction are suppressed.",
      target: "component root",
      bubbles: true,
      composed: false,
      cancelable: false
    },
    {
      name: "a11y-copy-button:destroy",
      detail: "{ instance }",
      trigger: "Cleanup completes; a later init() starts a new lifecycle.",
      target: "component root",
      bubbles: true,
      composed: false,
      cancelable: false
    }
  ],
  examples: [
    {
      name: "Basic",
      path: "examples/basic/index.html",
      description: "Static URL, source text, code block, attribution, table-to-Markdown, and visible success/error status examples."
    },
    {
      name: "A11y-Notify integration",
      path: "examples/a11y-notify/index.html",
      description: "Optional copy-result announcement integration with automatic or live-region transport and visible status feedback."
    }
  ],
  accessibility: [
    "Uses a real button for activation.",
    "Does not use aria-pressed because copying is a momentary action.",
    "Keeps focus in place after copy attempts.",
    "Uses native disabled where possible.",
    "With announceStatus enabled (the default), uses a polite, atomic status region for feedback.",
    "Shows status text so success and failure are not conveyed by color alone.",
    "Public CSS variables support background, text, border, focus-ring, success, and error colors.",
    "The bundled stylesheet provides a visible focus indicator and reduces transition duration when prefers-reduced-motion is enabled."
  ]
};
