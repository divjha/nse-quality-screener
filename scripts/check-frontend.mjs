import { readFile } from "node:fs/promises";
import vm from "node:vm";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(match => match[1]).filter(Boolean);
if (scripts.length === 0) throw new Error("No inline application script found.");
for (const [index, source] of scripts.entries()) {
  new vm.Script(source, { filename: "index.html:inline-script-" + (index + 1) });
}
console.log("Validated " + scripts.length + " inline application script(s).");
