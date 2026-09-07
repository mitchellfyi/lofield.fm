import {
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
  realpathSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { AnyMap, decodedMappings, encodedMap } from "@jridgewell/trace-mapping";
import SentryCli from "@sentry/cli";

function files(root) {
  if (!lstatSync(root).isDirectory() || lstatSync(root).isSymbolicLink())
    throw new Error("Invalid source map directory");
  return readdirSync(root, { recursive: true })
    .map((name) => {
      const path = join(root, name);
      if (lstatSync(path).isSymbolicLink())
        throw new Error("Source map paths cannot be symbolic links");
      return path;
    })
    .filter((path) => lstatSync(path).isFile());
}

function normalize(path) {
  const source = JSON.parse(readFileSync(path, "utf8"));
  if (source.version !== 3) throw new Error("Invalid source map version");
  const map = encodedMap(new AnyMap(source));
  if (!Array.isArray(map.sources) || !map.sources.every((value) => typeof value === "string"))
    throw new Error("Invalid source map sources");
  // Only source-free compiler wrappers may be omitted.
  if (!map.sources.length) return null;
  if (
    !Array.isArray(map.sourcesContent) ||
    map.sourcesContent.length > map.sources.length ||
    !map.sourcesContent.every((value) => value === null || typeof value === "string") ||
    !map.sourcesContent.some((value) => typeof value === "string" && value.length > 0)
  )
    throw new Error("Source map must retain original source context");
  const referenced = new Set(
    decodedMappings(new AnyMap(map)).flatMap((line) =>
      line.filter((segment) => segment.length >= 4).map((segment) => segment[1])
    )
  );
  map.sourcesContent = map.sources.map((name, index) => {
    const content = map.sourcesContent[index];
    if (typeof content === "string" && content.length > 0) return content;
    // Webpack leaves unmapped startup, empty-module and extracted-CSS stubs.
    const stub = [
      /^webpack:\/\/[^/]+\/webpack\/(?:before-startup|startup|after-startup)$/,
      /^webpack:\/\/[^/]+\/(?:\?[a-f0-9]{4})?$/,
      /^webpack:\/\/[^/]+\/\.\/(?:[^?#]+\/)*[^/?#]+\.css$/,
      /^webpack:\/\/[^/]+\/\.\/node_modules\/(?:[^?#]+\/)*next\/dist\/compiled\/server-only\/empty\.js(?:\?[a-f0-9]{4})?$/,
    ].some((pattern) => pattern.test(name));
    if (stub && !referenced.has(index)) return null;
    throw new Error(`Source map must retain original source context: ${name}`);
  });
  return { ...map, debug_id: source.debug_id || source.debugId };
}

function setMapReference(path, source = readFileSync(path, "utf8")) {
  const reference = `//# sourceMappingURL=${basename(path)}.map`;
  writeFileSync(
    path,
    /^\/\/[#@] sourceMappingURL=[^\s]+\r?$/m.test(source)
      ? source.replace(/^\/\/[#@] sourceMappingURL=[^\s]+\r?$/gm, reference)
      : `${source}\n${reference}\n`
  );
}

function prepareBrowser(root) {
  const paths = files(root);
  const javascript = paths
    .filter((path) => /\.[cm]?js$/.test(path))
    .map((path) => ({
      path,
      source: readFileSync(path, "utf8"),
    }));
  const destinations = new Set();
  for (const path of paths.filter((path) => /\.[cm]?js\.map$/.test(path))) {
    const map = normalize(path);
    if (!map) {
      unlinkSync(path);
      continue;
    }
    let matches = javascript.filter((file) =>
      [...file.source.matchAll(/^\/\/[#@] sourceMappingURL=([^\s]+)\r?$/gm)].some(
        (match) => join(dirname(file.path), match[1]) === path
      )
    );
    if (!matches.length && map.debug_id) {
      matches = javascript.filter((file) => file.source.includes(`//# debugId=${map.debug_id}`));
    }
    // Next emits its unchanged legacy polyfill without a map reference or debug ID.
    if (!matches.length && map.sourcesContent?.length === 1) {
      matches = javascript.filter((file) => file.source === map.sourcesContent[0]);
    }
    if (matches.length !== 1) throw new Error("Source map has no unique browser bundle");
    const file = matches[0];
    const destination = `${file.path}.map`;
    if (destinations.has(destination)) throw new Error("Multiple maps target one browser bundle");
    destinations.add(destination);
    setMapReference(file.path, file.source);
    writeFileSync(destination, JSON.stringify(map));
    if (path !== destination) unlinkSync(path);
  }
}

export function prepareNextSourceMaps(root) {
  const browser = join(root, "static");
  const server = join(root, "server");
  const runtime = join(root, "standalone/.next/server");
  prepareBrowser(browser);
  const runtimeFiles = new Set(files(runtime));
  for (const path of files(server).filter((path) => /\.[cm]?js\.map$/.test(path))) {
    const destination = join(runtime, path.slice(server.length + 1));
    // Trace output is the runtime authority; build-only edge wrappers are excluded.
    if (!runtimeFiles.has(destination.slice(0, -4))) continue;
    if (!readFileSync(path.slice(0, -4)).equals(readFileSync(destination.slice(0, -4))))
      throw new Error("Standalone JavaScript differs from the production build");
    const map = normalize(path);
    if (map) {
      writeFileSync(destination, JSON.stringify(map));
      // The CLI does not resolve Turbopack's percent-encoded bracket filenames.
      setMapReference(destination.slice(0, -4));
    } else if (existsSync(destination)) unlinkSync(destination);
  }
}

function replaceDebugId(source, previous, next) {
  let registrations = 0;
  const result = source.replace(
    /^(?:;!function\(\)\{try \{ var e=|!function\(\)\{try\{var e=)[^\r\n]*\}catch\(e\)\{\}\}\(\);\r?$/gm,
    (line) => {
      const registration = line.startsWith(";")
        ? `n&&((e._debugIds|| (e._debugIds={}))[n]="${previous}")`
        : `e._sentryDebugIds[n]="${previous}"`;
      if (!line.includes(registration))
        throw new Error("Debug-ID registration does not match its map");
      registrations++;
      return line.replace(registration, registration.replace(previous, next));
    }
  );
  if (registrations !== 1) throw new Error("Expected one supported runtime debug-ID registration");
  return result.replace(
    new RegExp(`^//# debugId=${previous}(\\r?)$`, "gm"),
    `//# debugId=${next}$1`
  );
}

export function injectDebugIds(root) {
  const targets = [join(root, "static"), join(root, "standalone/.next/server")]
    .flatMap((directory) => files(directory))
    .filter((path) => /\.[cm]?js\.map$/.test(path))
    .map((path) => path.slice(0, -4));
  const missing = [];
  const neutralId = "00000000-0000-0000-0000-000000000000";
  for (const path of targets) {
    const map = JSON.parse(readFileSync(`${path}.map`, "utf8"));
    if (!map.debug_id && !map.debugId) {
      map.debug_id = neutralId;
      writeFileSync(`${path}.map`, JSON.stringify(map));
      missing.push(path);
    }
  }
  if (missing.length)
    execFileSync(
      SentryCli.getPath(),
      ["sourcemaps", "inject", "--quiet", ...missing.flatMap((path) => [path, `${path}.map`])],
      {
        env: { PATH: process.env.PATH, SENTRY_DISABLE_UPDATE_CHECK: "true" },
        stdio: "pipe",
      }
    );
  for (const path of targets) {
    const map = JSON.parse(readFileSync(`${path}.map`, "utf8"));
    const previous = map.debug_id || map.debugId;
    const javascript = readFileSync(path, "utf8");
    if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(previous || ""))
      throw new Error("Invalid existing debug ID");
    delete map.debug_id;
    delete map.debugId;
    const neutral = replaceDebugId(javascript, previous, neutralId);
    // Native JS-only IDs also collide when source comments or positions change.
    const identity = createHash("sha256")
      .update(createHash("sha256").update(neutral).digest())
      .update(createHash("sha256").update(JSON.stringify(map)).digest())
      .digest()
      .subarray(0, 16);
    identity[6] = (identity[6] & 0x0f) | 0x80;
    identity[8] = (identity[8] & 0x3f) | 0x80;
    const hex = identity.toString("hex");
    map.debug_id = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    writeFileSync(`${path}.map`, JSON.stringify(map));
    writeFileSync(path, replaceDebugId(javascript, previous, map.debug_id));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  prepareNextSourceMaps(process.argv[2] || ".next");
  injectDebugIds(process.argv[2] || ".next");
}
