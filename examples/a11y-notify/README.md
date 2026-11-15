# A11y-Notify integration example

This optional example uses [A11y-Notify](https://github.com/vmitsaras/A11y-Notify) for copy-result announcements. A11yCopyButton still owns the visible status text. `announceStatus: false` prevents its status element from becoming a second live region. If you supply your own status element, leave off any existing `role="status"` or `aria-live` attributes.

From the repository root, run:

```bash
npm install
npm run build
python3 -m http.server 8000
```

Open `http://localhost:8000/examples/a11y-notify/`. The first button uses A11y-Notify's automatic transport (`document.ariaNotify()` when available, otherwise a hidden live region). The second forces the live-region transport. The third exercises the error hook with an empty value. The transport result shown on the page confirms which browser action A11y-Notify took; it does not prove that assistive technology spoke the message.

The example opts into `fallbackCopy: true` so the copy button can use its deprecated `execCommand("copy")` path when the Clipboard API is unavailable or rejects. Clipboard and announcement fallbacks are independent. Both copy paths invoke the same `onSuccess` or `onError` addon hook, so they need only one announcement integration.

For an installed application, import `createCopyButton` from `a11y-copy-button` and `a11yNotify` from `a11y-notify` through its bundler. A11y-Notify is a development dependency for this example, not a runtime dependency of the copy-button package.
