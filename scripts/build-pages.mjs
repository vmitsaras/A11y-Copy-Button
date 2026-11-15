import { access, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const output = new URL("docs/", root);
const packageInfo = JSON.parse(await readFile(new URL("package.json", root), "utf8"));
const repository = packageInfo.repository.url.replace(/^git\+/, "").replace(/\.git$/, "");
const readme = `${repository}/blob/main/README.md`;

// Validate inputs before replacing the generated publish folder.
for (const path of [
  "dist/index.js", "dist/styles.css", "dist/adapters/table-markdown.js",
  "node_modules/a11y-notify/dist/index.js", "node_modules/a11y-notify/LICENSE"
]) {
  await access(new URL(path, root));
}

const home = (await readFile(new URL("examples/basic/index.html", root), "utf8"))
  .replaceAll("../../dist/", "./dist/")
  .replaceAll("../../README.md", readme)
  .replaceAll("../a11y-notify/", "./a11y-notify/")
  .replace(
    "These paths match this example in <code>examples/basic/</code> after <code>npm run build</code>.",
    "These relative paths match this published demo."
  );
const integration = (await readFile(new URL("examples/a11y-notify/index.html", root), "utf8"))
  .replaceAll("../../dist/", "../dist/")
  .replaceAll("../../node_modules/a11y-notify/dist/", "../vendor/a11y-notify/")
  .replaceAll("../basic/", "../");

await rm(output, { recursive: true, force: true });
await mkdir(new URL("a11y-notify/", output), { recursive: true });
await mkdir(new URL("vendor/a11y-notify/", output), { recursive: true });
await cp(new URL("dist/", root), new URL("dist/", output), { recursive: true });
for (const file of ["index.js", "index.js.map"]) {
  await cp(new URL(`node_modules/a11y-notify/dist/${file}`, root), new URL(`vendor/a11y-notify/${file}`, output));
}
await cp(new URL("node_modules/a11y-notify/LICENSE", root), new URL("vendor/a11y-notify/LICENSE", output));
await writeFile(new URL("index.html", output), home);
await writeFile(new URL("a11y-notify/index.html", output), integration);
await writeFile(new URL(".nojekyll", output), "");
await access(new URL("index.html", output));
console.log(`Generated GitHub Pages site in ${fileURLToPath(output)}`);
