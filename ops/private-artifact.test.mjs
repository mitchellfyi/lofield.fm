import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, test } from "node:test";
import { AnyMap, originalPositionFor } from "@jridgewell/trace-mapping";
import { collect, verify, verifyRuntime } from "./ops-sourcemaps.mjs";
import { injectDebugIds, prepareNextSourceMaps } from "./prepare-next-sourcemaps.mjs";

const roots = [];
const release = "a".repeat(40);
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "lofield-private-artifact-"));
  roots.push(root);
  const build = join(root, "app/.next");
  for (const path of ["static", "server", "standalone/.next/server"])
    mkdirSync(join(build, path), { recursive: true });
  for (const [name, id] of [
    ["browser", "11111111-2222-4333-8444-555555555555"],
    ["server", "22222222-2222-4333-8444-555555555555"],
  ]) {
    const directory = name === "browser" ? "static" : "server";
    const javascript = `;!function(){try { var e=globalThis,n=(new e.Error).stack;n&&((e._debugIds|| (e._debugIds={}))[n]="${id}")}catch(e){}}();\nthrow new Error('${name}');\n//# debugId=${id}\n`;
    const map = {
      version: 3,
      sources: [`${name}.ts`],
      sourcesContent: [javascript],
      names: [],
      mappings: "AAAA",
      debug_id: id,
    };
    writeFileSync(join(build, directory, `${name}.js`), javascript);
    writeFileSync(join(build, directory, `${name}.js.map`), JSON.stringify(map));
    if (name === "server")
      writeFileSync(join(build, "standalone/.next/server/server.js"), javascript);
  }
  const output = join(root, "private");
  prepareNextSourceMaps(build);
  const settings = {
    output,
    release,
    roots: {
      browser: {
        path: join(build, "static"),
        runtimePath: "/app/.next/static",
      },
      server: {
        path: join(build, "standalone/.next/server"),
        runtimePath: "/app/.next/standalone/.next/server",
      },
    },
  };
  return { root, build, output, settings };
}
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

test("the vendored collector matches its pinned Ops source checksum", () => {
  const provenance = JSON.parse(
    readFileSync(new URL("./ops-sourcemaps.provenance.json", import.meta.url))
  );
  assert.equal(
    createHash("sha256")
      .update(readFileSync(new URL("./ops-sourcemaps.mjs", import.meta.url)))
      .digest("hex"),
    provenance.sha256
  );
  assert.match(provenance.commit, /^[a-f0-9]{40}$/);
});
test("collects both runtimes privately and removes served maps and compressed variants", () => {
  const { root, build, output, settings } = fixture();
  writeFileSync(join(build, "static/browser.js.map.gz"), "compressed fixture");
  writeFileSync(join(build, "static/browser.js.map.br"), "compressed fixture");
  const manifest = collect(settings);
  assert.equal(manifest.entries.length, 2);
  assert.deepEqual(
    new Set(manifest.entries.map((entry) => entry.js_path.split("/")[0])),
    new Set(["browser", "server"])
  );
  for (const suffix of [".map", ".map.gz", ".map.br"])
    assert.equal(existsSync(join(build, `static/browser.js${suffix}`)), false);
  assert.equal(verifyRuntime({ output, release, root }).entries.length, 2);
});
test("rejects a mutable or different release", () => {
  const { output, settings } = fixture();
  assert.throws(() => collect({ ...settings, release: "main" }), /immutable release/);
  collect(settings);
  assert.throws(() => verify({ output, release: "b".repeat(40) }), /release does not match/);
});
test("detects JavaScript changes after packaging", () => {
  const { root, build, output, settings } = fixture();
  collect(settings);
  writeFileSync(join(build, "static/browser.js"), "tampered runtime");
  assert.throws(() => verifyRuntime({ output, release, root }), /checksum mismatch/);
});
test("detects a reintroduced public map after packaging", () => {
  const { root, build, output, settings } = fixture();
  collect(settings);
  writeFileSync(join(build, "static/browser.js.map"), "exposed");
  assert.throws(() => verifyRuntime({ output, release, root }), /served source map/);
});
test("does not remove runtime maps when collection fails", () => {
  const { build, settings } = fixture();
  writeFileSync(join(build, "static/browser.js"), "missing debug ID");
  assert.throws(() => collect(settings), /debug ID/);
  assert.equal(existsSync(join(build, "static/browser.js.map")), true);
});

test("offline CLI injection adds a missing debug ID and preserves source positions", () => {
  const { root, build, output, settings } = fixture();
  const path = join(build, "standalone/.next/server/server.js");
  writeFileSync(path, "throw new Error('server');\n//# sourceMappingURL=server.js.map\n");
  const map = JSON.parse(readFileSync(`${path}.map`));
  delete map.debug_id;
  writeFileSync(`${path}.map`, JSON.stringify(map));
  injectDebugIds(build);
  const javascript = readFileSync(path, "utf8");
  const injected = JSON.parse(readFileSync(`${path}.map`));
  const prefix = javascript.slice(0, javascript.indexOf("throw new Error('server')"));
  const lines = prefix.split("\n");
  assert.deepEqual(
    originalPositionFor(new AnyMap(injected), {
      line: lines.length,
      column: lines.at(-1).length,
    }),
    { source: "server.ts", line: 1, column: 0, name: null }
  );
  assert.match(injected.debug_id, /^[a-f0-9-]{36}$/);
  collect(settings);
  assert.equal(verifyRuntime({ output, release, root }).entries.length, 2);
});

test("identical generated runtimes with different source maps receive distinct debug IDs", () => {
  const { root, build, output, settings } = fixture();
  const directory = join(build, "standalone/.next/server");
  mkdirSync(join(directory, "ssr"));
  for (const name of ["server", "ssr/server"]) {
    writeFileSync(
      join(directory, `${name}.js`),
      "throw new Error('runtime');\n//# sourceMappingURL=server.js.map\n"
    );
    writeFileSync(
      join(directory, `${name}.js.map`),
      JSON.stringify({
        version: 3,
        names: [],
        sources: [`${name}.ts`],
        sourcesContent: ["throw new Error('runtime');"],
        mappings: "AAAA",
      })
    );
  }
  injectDebugIds(build);
  const ids = ["server", "ssr/server"].map(
    (name) => JSON.parse(readFileSync(join(directory, `${name}.js.map`))).debug_id
  );
  assert.notEqual(ids[0], ids[1]);
  collect(settings);
  assert.equal(verifyRuntime({ output, release, root }).entries.length, 3);
});

test("different generated runtimes sharing one original map receive distinct debug IDs", () => {
  const { root, build, output, settings } = fixture();
  const directory = join(build, "standalone/.next/server");
  mkdirSync(join(directory, "ssr"));
  const map = {
    version: 3,
    names: [],
    sources: ["runtime.ts"],
    sourcesContent: ["throw new Error('runtime');"],
    mappings: "AAAA",
  };
  for (const name of ["server", "ssr/server"]) {
    writeFileSync(
      join(directory, `${name}.js`),
      `throw new Error('runtime');\n// Generated runtime ${name}\n//# sourceMappingURL=server.js.map\n`
    );
    writeFileSync(join(directory, `${name}.js.map`), JSON.stringify(map));
  }
  injectDebugIds(build);
  const ids = ["server", "ssr/server"].map(
    (name) => JSON.parse(readFileSync(join(directory, `${name}.js.map`))).debug_id
  );
  assert.notEqual(ids[0], ids[1]);
  collect(settings);
  assert.equal(verifyRuntime({ output, release, root }).entries.length, 3);
});

test("reprocessing a CLI-injected pair preserves its final ID, bytes and source positions", () => {
  const { build } = fixture();
  const path = join(build, "standalone/.next/server/server.js");
  writeFileSync(path, "throw new Error('runtime');\n//# sourceMappingURL=server.js.map\n");
  writeFileSync(
    `${path}.map`,
    JSON.stringify({
      version: 3,
      sources: ["runtime.ts"],
      sourcesContent: ["throw new Error('runtime');"],
      names: [],
      mappings: "AAAA",
    })
  );
  injectDebugIds(build);
  const javascript = readFileSync(path),
    map = readFileSync(`${path}.map`);
  injectDebugIds(build);
  assert.deepEqual(readFileSync(path), javascript);
  assert.deepEqual(readFileSync(`${path}.map`), map);
});
