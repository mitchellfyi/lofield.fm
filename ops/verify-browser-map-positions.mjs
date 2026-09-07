import { pathToFileURL } from "node:url";
import { realpathSync } from "node:fs";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { AnyMap, originalPositionFor } from "@jridgewell/trace-mapping";

// Turbopack scope hoisting can map this native throw to a different module.
export function verifyBrowserMapPositions(root) {
  const results = [];
  for (const name of readdirSync(root, { recursive: true })) {
    if (!name.endsWith(".js")) continue;
    const path = join(root, name);
    const javascript = readFileSync(path, "utf8");
    const probes = [
      ...javascript.matchAll(/_breadcrumbs\s*=\s*\[\s*\.\.\.this\._breadcrumbs\s*\]/g),
    ];
    if (!probes.length) continue;
    if (!existsSync(`${path}.map`)) throw new Error("Native browser probe has no source map");
    const map = new AnyMap(JSON.parse(readFileSync(`${path}.map`, "utf8")));
    for (const probe of probes) {
      const offset = probe.index + probe[0].indexOf("this._breadcrumbs") + "this.".length;
      const prefix = javascript.slice(0, offset).split("\n");
      const generated = { line: prefix.length, column: prefix.at(-1).length };
      const original = originalPositionFor(map, generated);
      const content = map.sourcesContent?.[map.sources.indexOf(original.source)];
      const statement = content?.split("\n")[original.line - 1];
      if (
        !/\/scope\.[jt]s$/.test(original.source || "") ||
        !/_breadcrumbs\s*=\s*\[\s*\.\.\.this\._breadcrumbs\s*\]/.test(statement || "")
      ) {
        throw new Error(
          `Native browser source position is incorrect: ${name}:${generated.line}:${generated.column + 1}`
        );
      }
      results.push({ bundle: name, generated, original });
    }
  }
  if (!results.length) throw new Error("Native browser source-position probe is missing");
  return results;
}

if (
  process.argv[1] &&
  existsSync(process.argv[1]) &&
  import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href
) {
  const proofs = verifyBrowserMapPositions(process.argv[2] || ".next/static");
  console.log(JSON.stringify({ native_browser_positions: proofs.length }));
}
