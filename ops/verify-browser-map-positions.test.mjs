import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, test } from "node:test";
import { verifyBrowserMapPositions } from "./verify-browser-map-positions.mjs";

const roots = [];
const javascript =
  "function clone(){const target={};target._breadcrumbs=[...this._breadcrumbs];return target}";
const statement = "newScope._breadcrumbs = [...this._breadcrumbs];";
function fixture({
  source = "sdk/src/scope.ts",
  content = statement,
  map = true,
  code = javascript,
} = {}) {
  const root = mkdtempSync(join(tmpdir(), "native-browser-position-"));
  roots.push(root);
  writeFileSync(join(root, "app.js"), code);
  if (map)
    writeFileSync(
      join(root, "app.js.map"),
      JSON.stringify({
        version: 3,
        sources: [source],
        sourcesContent: [content],
        names: [],
        mappings: "AAAA",
      })
    );
  return root;
}
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

test("verifies the original statement for the actual native throw instruction", () => {
  const [proof] = verifyBrowserMapPositions(fixture());
  assert.equal(proof.original.source, "sdk/src/scope.ts");
  assert.equal(proof.original.line, 1);
  assert.equal(javascript.slice(proof.generated.column).startsWith("_breadcrumbs"), true);
});
test("rejects readable context from the wrong module", () => {
  assert.throws(
    () => verifyBrowserMapPositions(fixture({ source: "sdk/src/utils/normalize.ts" })),
    /position is incorrect/
  );
});
test("rejects the right source file at the wrong statement", () => {
  assert.throws(
    () => verifyBrowserMapPositions(fixture({ content: "return this;" })),
    /position is incorrect/
  );
});
test("rejects a missing map instead of accepting an empty check", () => {
  assert.throws(() => verifyBrowserMapPositions(fixture({ map: false })), /has no source map/);
});
test("rejects a build with no native probe instead of silently passing", () => {
  assert.throws(
    () => verifyBrowserMapPositions(fixture({ code: "console.log(1)" })),
    /probe is missing/
  );
});

test("resolves original content when a valid map has a sourceRoot", () => {
  const root = fixture({ source: "scope.ts" });
  const mapPath = join(root, "app.js.map");
  const map = JSON.parse(readFileSync(mapPath, "utf8"));
  map.sourceRoot = "sdk/src/";
  writeFileSync(mapPath, JSON.stringify(map));
  const [proof] = verifyBrowserMapPositions(root);
  assert.equal(proof.original.source, "sdk/src/scope.ts");
});

test("accepts a source name without a parent directory", () => {
  const [proof] = verifyBrowserMapPositions(fixture({ source: "scope.ts" }));
  assert.equal(proof.original.source, "scope.ts");
});
