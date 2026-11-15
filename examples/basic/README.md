# A11yCopyButton Basic Example

This example demonstrates six common patterns:

- Copying a static URL from `data-a11y-copy-button-value`.
- Copying visible text from another element.
- Copying a displayed code command with `sourceSelector`.
- Copying an attribution string from a source attribute.
- Copying a semantic HTML table as Markdown with the optional table adapter.
- Showing success and error status messages without moving focus.

From the repository root, install dependencies, build the package, and serve the example over HTTP:

```bash
npm install
npm run build
python3 -m http.server 8000
```

Open `http://localhost:8000/examples/basic/`. Serving over HTTP lets the browser load the example's ES modules from `dist/` and use the clipboard API in the localhost secure context.

To try the keyboard behavior, Tab to a copy button and activate it with Enter or Space. Check that focus remains on the button and the visible status appears beside it. With a screen reader, inspect the polite status announcement and confirm the button name stays unchanged after copying. Clipboard permission and announcement behavior can vary by browser and assistive technology, so verify them in your target setup.

After copying, paste into the labeled textarea below the examples to inspect the result.

The page also includes copyable HTML and JavaScript setup snippets, an API table, keyboard steps, and accessibility notes.

The table example imports `tableToMarkdown` from `a11y-copy-button/adapters/table-markdown` and supplies it through `getValue`. The callback runs on activation, so it includes current table edits. The formatter supports a single header row and rectangular data rows; missing headers, uneven rows, and spanning cells fail through the copy button's visible error status without writing to the clipboard.
