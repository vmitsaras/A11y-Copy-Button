//#region src/adapters/table-markdown.ts
/** Convert a simple HTML data table to GitHub-flavored Markdown. */
function tableToMarkdown(table) {
	if (table.tagName !== "TABLE") throw new TypeError("tableToMarkdown expects an HTMLTableElement.");
	const rows = Array.from(table.rows);
	if ((table.tHead ? Array.from(table.tHead.children).filter((child) => child.tagName === "TR") : []).length > 1) throw new Error("Tables with more than one header row are not supported.");
	const theadRow = table.tHead ? rows.find((row) => row.parentElement === table.tHead) : void 0;
	const firstRow = rows[0];
	const firstRowIsHeader = firstRow?.cells.length && Array.from(firstRow.cells).every((cell) => cell.tagName === "TH");
	const headerRow = theadRow ?? (firstRowIsHeader ? firstRow : void 0);
	if (!headerRow || headerRow.cells.length === 0 || !Array.from(headerRow.cells).every((cell) => cell.tagName === "TH")) throw new Error("The table must have a header row made of <th> cells in <thead> or as its first row.");
	for (const row of rows) for (const cell of Array.from(row.cells)) if (cell.rowSpan !== 1 || cell.getAttribute("rowspan") === "0" || cell.colSpan > 1) throw new Error("Tables with rowspan or colspan are not supported.");
	const headers = Array.from(headerRow.cells);
	const dataRows = rows.filter((row) => row !== headerRow);
	const width = headers.length;
	if (dataRows.some((row) => row.cells.length !== width)) throw new Error("Every table row must have the same number of cells as the header row.");
	const formatRow = (cells) => `| ${Array.from(cells, formatCell).join(" | ")} |`;
	const lines = [formatRow(headers), `| ${headers.map(() => "---").join(" | ")} |`];
	lines.push(...dataRows.map((row) => formatRow(row.cells)));
	const caption = table.caption ? escapeMarkdown(normalizeText(table.caption)) : "";
	return caption ? `${caption}\n\n${lines.join("\n")}` : lines.join("\n");
}
function formatCell(cell) {
	return escapeMarkdown(normalizeCell(cell));
}
function escapeMarkdown(text) {
	return text.replace(/[\\`*_{}\[\]()#+.!|>~-]/g, "\\$&");
}
function normalizeText(element) {
	return element.textContent?.replace(/\s+/g, " ").trim() ?? "";
}
function normalizeCell(cell) {
	return Array.from(cell.childNodes, readTextNode).join("").replace(/\s+/g, " ").trim();
}
function readTextNode(node) {
	if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
	if (node.nodeType !== Node.ELEMENT_NODE) return "";
	const element = node;
	if (element.tagName === "BR") return " ";
	return Array.from(element.childNodes, readTextNode).join("");
}
//#endregion
export { tableToMarkdown };

//# sourceMappingURL=table-markdown.js.map