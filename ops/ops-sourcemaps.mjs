import { copyFileSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync, mkdtempSync, rmSync, realpathSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, relative, resolve, posix } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { request } from 'node:http';

const SHA = /^[a-f0-9]{40}$/;
const UUID = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const MAX_FILE = 64 * 1024 * 1024;
const MAX_TOTAL = 1024 * 1024 * 1024;
const MAX_PAIRS = 10000;
const hash = value => createHash('sha256').update(value).digest('hex');

function requireRelease(release) {
  if (typeof release !== 'string' || !SHA.test(release)) throw new Error('A full immutable release is required');
}

function normalizedPath(value, absolute = false) {
  if (typeof value !== 'string' || value.length > 1024 || /[\\\x00-\x1f\x7f]/.test(value) || value.startsWith('/') !== absolute) return false;
  return (absolute ? value.slice(1) : value).split('/').every(part => part && part !== '.' && part !== '..');
}

function files(root) {
  if (!existsSync(root)) throw new Error('Missing build artifact root');
  if (lstatSync(root).isSymbolicLink()) throw new Error('Artifact roots cannot be symbolic links');
  const found = [];
  function visit(directory, depth = 0) {
    if (depth > 40) throw new Error('Build artifact nesting exceeds the limit');
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isSymbolicLink()) throw new Error('Build artifacts cannot contain symbolic links');
      if (entry.isDirectory()) visit(path, depth + 1);
      else if (entry.isFile()) found.push(path);
      else throw new Error('Build artifacts must be ordinary files');
      if (found.length > MAX_PAIRS * 10) throw new Error('Too many build artifacts');
    }
  }
  visit(root);
  return found.sort();
}

function read(path) {
  if (!existsSync(path)) throw new Error('Missing build artifact');
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > MAX_FILE) throw new Error('Invalid or oversized build artifact');
  return readFileSync(path);
}

function validatePair(javascript, sourcemap) {
  const map = JSON.parse(sourcemap);
  const debugId = map.debug_id || map.debugId;
  if (!UUID.test(debugId || '') || !javascript.toString().includes(debugId)) throw new Error('Missing or mismatched debug ID');
  if (map.version !== 3 || !Array.isArray(map.sources) || !Array.isArray(map.sourcesContent) ||
      map.sources.length !== map.sourcesContent.length || !map.sourcesContent.some(value => typeof value === 'string' && value.length > 0)) {
    throw new Error('Source map must contain original source context');
  }
  return debugId;
}

function rememberDebugId(seen, entry) {
  const identity = `${entry.js_sha256}:${entry.map_sha256}`;
  if (seen.has(entry.debug_id) && seen.get(entry.debug_id) !== identity) throw new Error('Conflicting artifacts share a debug ID');
  seen.set(entry.debug_id, identity);
}

/** Copy final bundles privately before removing the served maps and compressed variants. */
export function collect({ roots, output, release }) {
  requireRelease(release);
  if (existsSync(output)) throw new Error('Private artifact directory already exists');
  if (!roots || !Object.keys(roots).length) throw new Error('Source map roots are required');
  const entries = [], copies = [], removals = [], seen = new Map();
  let total = 0;
  for (const [name, configuration] of Object.entries(roots)) {
    if (!/^[a-z][a-z0-9-]*$/.test(name)) throw new Error('Invalid runtime name');
    const { path: root, runtimePath } = configuration || {};
    if (!normalizedPath(runtimePath, true)) throw new Error('Invalid runtime root path');
    if (typeof root !== 'string') throw new Error('Build artifact root path is required');
    if (resolve(output).startsWith(`${resolve(root)}/`) || resolve(output) === resolve(root)) throw new Error('Private output must be outside every runtime root');
    const artifacts = files(root), maps = artifacts.filter(path => /\.[cm]?js\.map$/.test(path));
    if (!maps.length) throw new Error(`${name} has no source maps`);
    for (const path of maps) {
      const jsPath = path.slice(0, -4);
      if (!existsSync(jsPath)) throw new Error('Source map has no matching JavaScript');
      const javascript = read(jsPath), sourcemap = read(path), debugId = validatePair(javascript, sourcemap);
      const suffix = relative(root, jsPath).split('\\').join('/');
      if (!normalizedPath(suffix)) throw new Error('Invalid artifact path');
      const entry = { js_path: `${name}/${suffix}`, map_path: `${name}/${suffix}.map`,
        runtime_path: posix.join(runtimePath, suffix), js_sha256: hash(javascript), map_sha256: hash(sourcemap), debug_id: debugId };
      rememberDebugId(seen, entry);
      entries.push(entry);
      copies.push([jsPath, entry.js_path], [path, entry.map_path]);
      total += javascript.length + sourcemap.length;
      if (entries.length > MAX_PAIRS || total > MAX_TOTAL) throw new Error('Source map artifact exceeds the limit');
    }
    removals.push(...artifacts.filter(path => /\.map(?:\.(?:gz|br))?$/.test(path)));
  }
  mkdirSync(join(output, 'files'), { recursive: true, mode: 0o700 });
  for (const [source, name] of copies) {
    mkdirSync(dirname(join(output, 'files', name)), { recursive: true, mode: 0o700 });
    copyFileSync(source, join(output, 'files', name));
  }
  const manifest = { version: 1, release, entries };
  writeFileSync(join(output, 'manifest.json'), JSON.stringify(manifest), { mode: 0o600 });
  verify({ output, release });
  for (const source of removals) unlinkSync(source);
  return manifest;
}

/** Validate the private copy independently of where it was extracted. */
export function verify({ output, release }) {
  requireRelease(release);
  // Walk first, before reading a manifest path through a possible directory symlink.
  const actual = files(output).map(path => relative(output, path).split('\\').join('/'));
  const manifest = JSON.parse(read(join(output, 'manifest.json')));
  if (manifest.version !== 1 || manifest.release !== release) throw new Error('Artifact release does not match the deployment');
  if (!Array.isArray(manifest.entries) || !manifest.entries.length || manifest.entries.length > MAX_PAIRS) throw new Error('Invalid source map manifest');
  const expected = new Set(['manifest.json']), runtimePaths = new Set(), seen = new Map();
  let total = 0;
  for (const entry of manifest.entries) {
    if (!entry || !normalizedPath(entry.runtime_path, true) || !/\.[cm]?js$/.test(entry.runtime_path) || runtimePaths.has(entry.runtime_path)) throw new Error('Invalid or duplicate runtime path');
    runtimePaths.add(entry.runtime_path);
    const content = {};
    for (const kind of ['js', 'map']) {
      const name = entry[`${kind}_path`], fullName = `files/${name}`;
      if (!normalizedPath(name) || expected.has(fullName)) throw new Error('Invalid or duplicate artifact path');
      expected.add(fullName);
      content[kind] = read(join(output, fullName));
      total += content[kind].length;
      if (total > MAX_TOTAL) throw new Error('Source map artifact exceeds the limit');
      if (hash(content[kind]) !== entry[`${kind}_sha256`]) throw new Error('Artifact checksum mismatch');
    }
    if (entry.map_path !== `${entry.js_path}.map` || validatePair(content.js, content.map) !== entry.debug_id) throw new Error('Artifact debug ID or map path mismatch');
    rememberDebugId(seen, entry);
  }
  if (actual.length !== expected.size || actual.some(name => !expected.has(name))) throw new Error('Unexpected artifact files');
  return manifest;
}

/** Compare the private bundle with files copied from the final deployment image. */
export function verifyRuntime({ output, release, root }) {
  const manifest = verify({ output, release });
  if (!root || lstatSync(root).isSymbolicLink()) throw new Error('Runtime root cannot be a symbolic link');
  for (const entry of manifest.entries) {
    let path = resolve(root);
    for (const part of entry.runtime_path.slice(1).split('/')) {
      path = join(path, part);
      if (!existsSync(path)) throw new Error('Missing runtime artifact');
      if (lstatSync(path).isSymbolicLink()) throw new Error('Runtime paths cannot contain symbolic links');
    }
    if (hash(read(path)) !== entry.js_sha256) throw new Error('Runtime JavaScript checksum mismatch');
    for (const suffix of ['.map', '.map.gz', '.map.br']) {
      if (existsSync(`${path}${suffix}`)) throw new Error('Runtime still contains a served source map');
    }
  }
  return manifest;
}

/** Resolve the same local Docker endpoint for metadata and subsequent copies. */
export function dockerSocket({ run = spawnSync, env = process.env } = {}) {
  let endpoint = env.DOCKER_HOST;
  if (env.DOCKER_CONTEXT || !endpoint) {
    const result = run('docker', ['context', 'inspect', '--format', '{{json .Endpoints.docker.Host}}'], { env, timeout: 10000, encoding: 'utf8', maxBuffer: 4096, stdio: 'pipe' });
    if (result.status !== 0 || result.error || typeof result.stdout !== 'string' || result.stdout.length > 4096) throw new Error('Cannot resolve the local Docker endpoint');
    try { endpoint = JSON.parse(result.stdout); } catch { throw new Error('Invalid local Docker endpoint'); }
  }
  if (typeof endpoint !== 'string' || !endpoint.startsWith('unix:///') || endpoint.length > 1031 || /[?#%]/.test(endpoint) || !normalizedPath(endpoint.slice(7), true)) throw new Error('A local Unix Docker endpoint is required');
  const socketPath = realpathSync(endpoint.slice(7));
  if (!normalizedPath(socketPath, true) || !lstatSync(socketPath).isSocket()) throw new Error('A local Docker socket is required');
  return socketPath;
}

/** HEAD preserves the original path's symlink metadata; copying alone does not. */
export function dockerArchiveStat({ socketPath, container, path, timeout = 5000 }) {
  if (!/^[a-f0-9]{12,64}$/.test(container || '') || (path !== '/' && !normalizedPath(path, true)) || !normalizedPath(socketPath, true) || !Number.isInteger(timeout) || timeout < 1 || timeout > 5000) throw new Error('Invalid Docker metadata request');
  return new Promise((accept, reject) => {
    let timer;
    const fail = () => { clearTimeout(timer); reject(new Error('Cannot inspect original runtime path')); };
    const req = request({ socketPath, method: 'HEAD', path: `/containers/${container}/archive?path=${encodeURIComponent(path)}`, maxHeaderSize: 16384, agent: false }, response => {
      clearTimeout(timer);
      try {
        const header = response.headers['x-docker-container-path-stat'];
        if (response.statusCode !== 200 || typeof header !== 'string' || header.length > 8192 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(header)) throw new Error();
        const decoded = Buffer.from(header, 'base64');
        if (!decoded.length || decoded.length > 6144 || decoded.toString('base64') !== header) throw new Error();
        accept(JSON.parse(decoded.toString('utf8')));
      } catch { fail(); }
      finally { response.destroy(); }
    });
    timer = setTimeout(() => { req.destroy(); fail(); }, timeout);
    req.once('error', fail);
    req.end();
  });
}

function requireOriginalPath(stat, path, directory) {
  // Go FileMode's high bits describe file types and special permissions.
  // Accept only ordinary files/directories with ordinary permission bits.
  if (!stat || stat.name !== (path === '/' ? '/' : posix.basename(path)) || stat.linkTarget !== '' ||
      !Number.isSafeInteger(stat.size) || stat.size < 0 || (!directory && stat.size > MAX_FILE) ||
      !Number.isInteger(stat.mode) || stat.mode < 0 || stat.mode > 0xffffffff ||
      Math.floor(stat.mode / 512) !== (directory ? 0x80000000 / 512 : 0)) {
    throw new Error('Invalid original runtime path; ordinary directories and files are required');
  }
}

/** Check original ancestors, then copy each tree without executing the image. */
export async function verifyImage({ output, release, container, run = spawnSync, stat }) {
  if (!/^[a-f0-9]{12,64}$/.test(container || '')) throw new Error('An existing container ID is required');
  const manifest = verify({ output, release }), root = mkdtempSync(join(tmpdir(), 'ops-image-map-check-'));
  try {
    const socketPath = stat ? null : dockerSocket({ run });
    const inspect = stat || (path => dockerArchiveStat({ socketPath, container, path }));
    const paths = new Map([['/', true]]);
    for (const entry of manifest.entries) {
      const parts = entry.runtime_path.slice(1).split('/');
      if (parts.length > 80) throw new Error('Runtime path nesting exceeds the limit');
      let path = '';
      for (let index = 0; index < parts.length; index++) {
        path += `/${parts[index]}`;
        const directory = index < parts.length - 1;
        if (paths.has(path) && paths.get(path) !== directory) throw new Error('Conflicting runtime paths');
        paths.set(path, directory);
        if (paths.size > MAX_PAIRS * 4) throw new Error('Too many original runtime paths');
      }
    }
    const deadline = Date.now() + 120000;
    for (const [path, directory] of paths) {
      if (Date.now() > deadline) throw new Error('Original runtime inspection exceeded the limit');
      requireOriginalPath(await inspect(path), path, directory);
    }
    const directories = new Set(manifest.entries.map(entry => posix.dirname(entry.runtime_path)));
    const roots = [...directories].filter(directory => {
      for (let parent = posix.dirname(directory); parent !== '/'; parent = posix.dirname(parent)) {
        if (directories.has(parent)) return false;
      }
      return true;
    });
    for (const directory of roots) {
      const parts = directory.slice(1).split('/');
      const destination = join(root, ...parts);
      mkdirSync(destination, { recursive: true, mode: 0o700 });
      const endpointArgs = socketPath ? ['--host', `unix://${socketPath}`] : [];
      const result = run('docker', [...endpointArgs, 'cp', `${container}:/${parts.join('/')}/.`, destination], { env: { ...process.env, DOCKER_CONTEXT: '', DOCKER_HOST: socketPath ? `unix://${socketPath}` : '' }, timeout: 300000, encoding: 'utf8', maxBuffer: 1024 * 1024, stdio: 'pipe' });
      if (result.status !== 0 || result.error) throw new Error('Cannot read runtime files from the deployment image');
    }
    return verifyRuntime({ output, release, root });
  } finally { rmSync(root, { recursive: true, force: true }); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  try {
    const [command, output, release, ...rest] = process.argv.slice(2);
    let result;
    if (command === 'collect') {
      const roots = {};
      if (!rest.length || rest.length % 3) throw new Error('Use a name, build directory, and absolute runtime directory for each root');
      for (let index = 0; index < rest.length; index += 3) {
        if (Object.hasOwn(roots, rest[index])) throw new Error('Duplicate runtime root name');
        roots[rest[index]] = { path: rest[index + 1], runtimePath: rest[index + 2] };
      }
      result = collect({ output, release, roots });
    } else if (command === 'verify') result = verify({ output, release });
    else if (command === 'verify-image') result = await verifyImage({ output, release, container: rest[0] });
    else throw new Error('Use collect, verify, or verify-image');
    console.log(JSON.stringify({ release: result.release, entries: result.entries.length }));
  } catch {
    console.error('Private source-map validation failed; deployment is blocked.');
    process.exitCode = 1;
  }
}
