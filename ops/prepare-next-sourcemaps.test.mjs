import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  rmSync,
  renameSync,
  symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, test } from "node:test";
import { spawnSync } from "node:child_process";
import { AnyMap, originalPositionFor } from "@jridgewell/trace-mapping";
import { injectDebugIds, prepareNextSourceMaps } from "./prepare-next-sourcemaps.mjs";

const roots = [];
const debugId = "11111111-2222-4333-8444-555555555555";
const sourceMap = () => ({
  version: 3,
  sources: ["input.ts"],
  sourcesContent: ["throw new Error('fixture');"],
  names: [],
  mappings: "AAAA",
  debug_id: debugId,
});
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "lofield-map-test-"));
  roots.push(root);
  for (const directory of ["static/chunks", "server/chunks", "standalone/.next/server/chunks"])
    mkdirSync(join(root, directory), { recursive: true });
  return root;
}
function pair(root, path, map = sourceMap()) {
  writeFileSync(
    join(root, `${path}.js`),
    `;!function(){try { var e=globalThis,n=(new e.Error).stack;n&&((e._debugIds|| (e._debugIds={}))[n]="${debugId}")}catch(e){}}();\nthrow new Error('fixture');\n//# debugId=${debugId}\n`
  );
  writeFileSync(join(root, `${path}.js.map`), JSON.stringify(map));
}
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

test("copies server maps for actual standalone code and sets its adjacent map reference", () => {
  const root = fixture();
  pair(root, "static/chunks/browser");
  pair(root, "server/chunks/server");
  const runtime = join(root, "standalone/.next/server/chunks/server.js");
  const javascript = readFileSync(join(root, "server/chunks/server.js"));
  writeFileSync(runtime, javascript);
  prepareNextSourceMaps(root);
  assert.equal(
    readFileSync(runtime, "utf8"),
    `${javascript.toString()}\n//# sourceMappingURL=server.js.map\n`
  );
  assert.equal(JSON.parse(readFileSync(`${runtime}.map`)).debug_id, debugId);
});
test("flattens indexed maps while retaining original source positions and debug IDs", () => {
  const root = fixture();
  const map = {
    version: 3,
    sections: [{ offset: { line: 2, column: 4 }, map: sourceMap() }],
    debug_id: debugId,
  };
  pair(root, "static/chunks/browser", map);
  prepareNextSourceMaps(root);
  const result = JSON.parse(readFileSync(join(root, "static/chunks/browser.js.map")));
  assert.equal(result.sections, undefined);
  assert.equal(result.debug_id, debugId);
  assert.deepEqual(
    originalPositionFor(new AnyMap(result), { line: 3, column: 4 }),
    originalPositionFor(new AnyMap(map), { line: 3, column: 4 })
  );
  assert.deepEqual(result.sourcesContent, sourceMap().sourcesContent);
});
test("removes source-free generated wrapper maps while retaining their JavaScript", () => {
  const root = fixture();
  pair(root, "static/chunks/wrapper", {
    version: 3,
    sources: [],
    sections: [],
  });
  prepareNextSourceMaps(root);
  assert.equal(existsSync(join(root, "static/chunks/wrapper.js.map")), false);
  assert.equal(existsSync(join(root, "static/chunks/wrapper.js")), true);
});
test("rejects named browser and traced server sources whose original content is missing", () => {
  for (const location of ["static", "server"]) {
    for (const sourcesContent of [undefined, [], [null], [""]]) {
      const root = fixture();
      const path = `${location}/chunks/missing-original`;
      pair(root, path, { ...sourceMap(), sourcesContent });
      if (location === "server") {
        writeFileSync(
          join(root, "standalone/.next/server/chunks/missing-original.js"),
          readFileSync(join(root, `${path}.js`))
        );
      }
      assert.throws(() => prepareNextSourceMaps(root), /original source context/);
      assert.equal(existsSync(join(root, `${path}.js.map`)), true);
    }
  }
});
test("rejects partial original content even when another source has content", () => {
  for (const location of ["static", "server"]) {
    for (const sourcesContent of [
      [null, "present"],
      ["present", null],
      ["present", ""],
      ["present"],
    ]) {
      const root = fixture();
      const path = `${location}/chunks/partial-original`;
      pair(root, path, { ...sourceMap(), sources: ["first.ts", "second.ts"], sourcesContent });
      if (location === "server")
        writeFileSync(
          join(root, "standalone/.next/server/chunks/partial-original.js"),
          readFileSync(join(root, `${path}.js`))
        );
      assert.throws(() => prepareNextSourceMaps(root), /original source context/);
    }
  }
});
test("permits only unmapped compiler stubs with missing content", () => {
  const stubs = [
    "webpack://_N_E/webpack/before-startup",
    "webpack://_N_E/webpack/startup",
    "webpack://_N_E/webpack/after-startup",
    "webpack://app/?a785",
    "webpack://app/",
    "webpack://app/./design-system/globals.css",
    "webpack://app/./node_modules/.pnpm/next@15.5.22/node_modules/next/dist/compiled/server-only/empty.js?a75b",
  ];
  for (const stub of stubs) {
    for (const sourcesContent of [["present", null], ["present"]]) {
      const root = fixture();
      pair(root, "static/chunks/stub", {
        ...sourceMap(),
        sources: ["input.ts", stub],
        sourcesContent,
      });
      prepareNextSourceMaps(root);
      assert.deepEqual(
        JSON.parse(readFileSync(join(root, "static/chunks/stub.js.map"))).sourcesContent,
        ["present", null]
      );
    }
    const root = fixture();
    pair(root, "static/chunks/mapped-stub", {
      ...sourceMap(),
      sources: ["input.ts", stub],
      sourcesContent: ["present", null],
      mappings: "ACAA",
    });
    assert.throws(() => prepareNextSourceMaps(root), /original source context/);
  }
});
test("does not package build-only server bundles omitted by standalone tracing", () => {
  const root = fixture();
  pair(root, "server/chunks/build-only");
  prepareNextSourceMaps(root);
  assert.equal(existsSync(join(root, "standalone/.next/server/chunks/build-only.js.map")), false);
});
test("fails if traced server JavaScript differs from the original build", () => {
  const root = fixture();
  pair(root, "server/chunks/server");
  writeFileSync(join(root, "standalone/.next/server/chunks/server.js"), "different");
  assert.throws(() => prepareNextSourceMaps(root), /JavaScript differs/);
});
test("rejects malformed maps instead of silently excluding them", () => {
  const root = fixture();
  pair(root, "static/chunks/browser", { version: 2 });
  assert.throws(() => prepareNextSourceMaps(root), /source map/);
});

test("pairs a renamed browser chunk through its sourceMappingURL", () => {
  const root = fixture();
  pair(root, "static/chunks/original");
  renameSync(join(root, "static/chunks/original.js"), join(root, "static/chunks/final.js"));
  writeFileSync(
    join(root, "static/chunks/final.js"),
    `throw new Error('fixture');\n//# debugId=${debugId}\n//# sourceMappingURL=original.js.map\n`
  );
  prepareNextSourceMaps(root);
  assert.equal(existsSync(join(root, "static/chunks/original.js.map")), false);
  assert.equal(
    JSON.parse(readFileSync(join(root, "static/chunks/final.js.map"))).debug_id,
    debugId
  );
  assert.match(
    readFileSync(join(root, "static/chunks/final.js"), "utf8"),
    /sourceMappingURL=final.js.map/
  );
});

test("map-reference updates preserve matching text inside JavaScript strings", () => {
  const root = fixture();
  pair(root, "static/chunks/original");
  renameSync(join(root, "static/chunks/original.js"), join(root, "static/chunks/final.js"));
  const statement = "const text = '//# sourceMappingURL=keep.js.map';";
  writeFileSync(
    join(root, "static/chunks/final.js"),
    `${statement}\n//# debugId=${debugId}\n//# sourceMappingURL=original.js.map\n`
  );
  prepareNextSourceMaps(root);
  assert.ok(
    readFileSync(join(root, "static/chunks/final.js"), "utf8").startsWith(`${statement}\n`)
  );
});

test("pairs an unchanged polyfill by exact source bytes when it has no debug ID or map reference", () => {
  const root = fixture();
  const source = "console.log('polyfill');";
  writeFileSync(join(root, "static/chunks/final.js"), source);
  writeFileSync(
    join(root, "static/chunks/old.js.map"),
    JSON.stringify({
      ...sourceMap(),
      debug_id: undefined,
      sourcesContent: [source],
    })
  );
  prepareNextSourceMaps(root);
  assert.equal(existsSync(join(root, "static/chunks/final.js.map")), true);
  assert.match(
    readFileSync(join(root, "static/chunks/final.js"), "utf8"),
    /sourceMappingURL=final.js.map/
  );
});

test("rejects an orphan browser map with no unique matching runtime bundle", () => {
  const root = fixture();
  writeFileSync(join(root, "static/chunks/orphan.js.map"), JSON.stringify(sourceMap()));
  assert.throws(() => prepareNextSourceMaps(root), /unique browser bundle/);
});

test("the CLI executes through a symlink instead of silently returning success", () => {
  const root = fixture();
  pair(root, "static/chunks/wrapper", {
    version: 3,
    sources: [],
    sections: [],
  });
  const alias = join(root, "prepare.mjs");
  symlinkSync(new URL("./prepare-next-sourcemaps.mjs", import.meta.url), alias);
  const result = spawnSync(process.execPath, [alias, root], {
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(existsSync(join(root, "static/chunks/wrapper.js.map")), false);
});

test("encoded server map references still receive debug IDs in the matching map", () => {
  const root = fixture();
  const code = "throw new Error('runtime');\n//# sourceMappingURL=%5Bruntime%5D.js.map\n";
  const map = { ...sourceMap(), debug_id: undefined };
  for (const directory of ["server/chunks", "standalone/.next/server/chunks"]) {
    writeFileSync(join(root, directory, "[runtime].js"), code);
  }
  writeFileSync(join(root, "server/chunks/[runtime].js.map"), JSON.stringify(map));
  prepareNextSourceMaps(root);
  injectDebugIds(root);
  const runtime = join(root, "standalone/.next/server/chunks/[runtime].js");
  const result = JSON.parse(readFileSync(`${runtime}.map`));
  assert.match(result.debug_id, /^[a-f0-9-]{36}$/);
  assert.ok(readFileSync(runtime, "utf8").includes(result.debug_id));
});

test("native IDs change when only original comments or source positions change", () => {
  const ids = [];
  const native = `;!function(){try { var e=globalThis,n=(new e.Error).stack;n&&((e._debugIds|| (e._debugIds={}))[n]="${debugId}")}catch(e){}}();`;
  for (const line of [2, 3]) {
    const root = fixture();
    const path = join(root, "standalone/.next/server/chunks/app.js");
    const compiled = `const marker="${debugId}";throw Error('same compiled code');`;
    const javascript = `${native}\n${compiled}\n//# debugId=${debugId}\n`;
    const map = {
      ...sourceMap(),
      sourcesContent: [
        `${"// original comment\n".repeat(line - 1)}throw Error('same compiled code');`,
      ],
      mappings: line === 2 ? ";AACA" : ";AAEA",
    };
    writeFileSync(path, javascript);
    writeFileSync(`${path}.map`, JSON.stringify(map));
    injectDebugIds(root);
    const result = JSON.parse(readFileSync(`${path}.map`));
    const emitted = readFileSync(path, "utf8");
    ids.push(result.debug_id);
    assert.notEqual(result.debug_id, debugId);
    assert.equal(emitted.length, javascript.length);
    assert.equal(emitted.split("\n")[1], javascript.split("\n")[1]);
    assert.ok(emitted.includes(`)[n]="${result.debug_id}"`));
    assert.deepEqual(
      originalPositionFor(new AnyMap(result), { line: 2, column: 0 }),
      originalPositionFor(new AnyMap(map), { line: 2, column: 0 })
    );
    assert.deepEqual(result.sourcesContent, map.sourcesContent);
  }
  assert.notEqual(ids[0], ids[1]);
});

test("rejects an unsupported runtime registration instead of leaving its old ID active", () => {
  const root = fixture();
  pair(root, "static/chunks/browser");
  const path = join(root, "static/chunks/browser.js");
  writeFileSync(path, readFileSync(path, "utf8").replace("var e=", "let e="));
  assert.throws(() => injectDebugIds(root), /supported runtime debug-ID registration/);
});
