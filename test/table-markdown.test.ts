import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { tableToMarkdown } from "../src/adapters/table-markdown";
import { createCopyButton } from "../src/index";

const writeText = vi.fn<(value: string) => Promise<void>>();

function makeTable(markup: string): HTMLTableElement {
  const container = document.createElement("div");
  container.innerHTML = markup;
  const table = container.querySelector("table");
  if (!table) throw new Error("Test markup must include a table.");
  return table;
}

function makeCopyRoot(table: HTMLTableElement): HTMLElement {
  const root = document.createElement("div");
  root.setAttribute("data-a11y-copy-button", "");
  root.innerHTML = '<button type="button"><span data-a11y-copy-button-label>Copy as Markdown</span></button><span data-a11y-copy-button-status></span>';
  root.prepend(table);
  document.body.append(root);
  return root;
}

async function settleClick(): Promise<void> {
  for (let index = 0; index < 30; index += 1) await Promise.resolve();
}

beforeEach(() => {
  document.body.innerHTML = "";
  vi.useFakeTimers();
  writeText.mockReset().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText }
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("tableToMarkdown", () => {
  it("converts a thead table and normalizes cell whitespace and line breaks", () => {
    const table = makeTable("<table><thead><tr><th>Name</th><th>Details</th></tr></thead><tbody><tr><td> Ada   Lovelace </td><td><span>First<br>programmer</span></td></tr></tbody></table>");

    expect(tableToMarkdown(table)).toBe("| Name | Details |\n| --- | --- |\n| Ada Lovelace | First programmer |");
  });

  it("accepts an all-th first row as headers and escapes Markdown characters", () => {
    const table = makeTable("<table><tr><th>Feature</th><th>Value</th></tr><tr><td>*bold* | `code`</td><td>[link](url) &amp; more</td></tr></table>");

    expect(tableToMarkdown(table)).toBe("| Feature | Value |\n| --- | --- |\n| \\*bold\\* \\| \\`code\\` | \\[link\\]\\(url\\) & more |");
  });

  it("places a nonempty caption above the Markdown table", () => {
    const table = makeTable("<table><caption>  Quarterly   results </caption><tr><th>Quarter</th></tr><tr><td>Q1</td></tr></table>");

    expect(tableToMarkdown(table)).toBe("Quarterly results\n\n| Quarter |\n| --- |\n| Q1 |");
  });

  it("escapes Markdown control characters in the plain-text caption", () => {
    const table = makeTable("<table><caption>Plan | *draft*</caption><tr><th>Quarter</th></tr></table>");

    expect(tableToMarkdown(table)).toBe("Plan \\| \\*draft\\*\n\n| Quarter |\n| --- |");
  });

  it.each([
    ["missing headers", "<table><tr><td>Name</td></tr></table>", /header row/],
    ["uneven rows", "<table><tr><th>A</th><th>B</th></tr><tr><td>one</td></tr></table>", /same number of cells/],
    ["rowspan", "<table><tr><th>A</th></tr><tr><td rowspan='2'>one</td></tr></table>", /rowspan or colspan/],
    ["rowspan zero", "<table><tr><th>A</th></tr><tr><td rowspan='0'>one</td></tr></table>", /rowspan or colspan/],
    ["multiple thead rows", "<table><thead><tr><th>A</th></tr><tr><th>B</th></tr></thead></table>", /more than one header row/],
    ["colspan", "<table><tr><th>A</th></tr><tr><td colspan='2'>one</td></tr></table>", /rowspan or colspan/]
  ])("rejects %s", (_name, markup, message) => {
    expect(() => tableToMarkdown(makeTable(markup))).toThrow(message);
  });

  it("reads edits made after initialization when copying", async () => {
    const table = makeTable("<table><tr><th>Item</th></tr><tr><td>Old</td></tr></table>");
    const root = makeCopyRoot(table);
    const instance = createCopyButton(root, { getValue: (element) => tableToMarkdown(element.querySelector("table")!) });
    table.rows[1]!.cells[0]!.textContent = "Updated";

    root.querySelector("button")!.click();
    await settleClick();

    expect(writeText).toHaveBeenCalledWith("| Item |\n| --- |\n| Updated |");
    expect(root.querySelector("[data-a11y-copy-button-status]")?.textContent).toBe("Copied");
    instance.destroy();
  });

  it("reports invalid tables through copy button error status without writing", async () => {
    const table = makeTable("<table><tr><th>A</th><th>B</th></tr><tr><td>one</td><td>two</td></tr></table>");
    const root = makeCopyRoot(table);
    createCopyButton(root, { getValue: (element) => tableToMarkdown(element.querySelector("table")!) });
    table.rows[1]!.deleteCell(1);

    root.querySelector("button")!.click();
    await settleClick();

    expect(writeText).not.toHaveBeenCalled();
    expect(root.querySelector("[data-a11y-copy-button-status]")?.textContent).toBe("Copy failed");
  });
});
