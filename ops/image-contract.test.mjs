import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

const release = "a".repeat(40);
function config(environment = {}) {
  return spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      "const {default:c}=await import('./next.config.ts'); console.log(JSON.stringify({browser:c.productionBrowserSourceMaps,server:c.experimental?.serverSourceMaps,debugIds:c.turbopack?.debugIds,output:c.output,prefix:c.assetPrefix,routes:await c.rewrites?.(),traces:c.outputFileTracingIncludes}));",
    ],
    {
      cwd: new URL("../", import.meta.url),
      env: { PATH: process.env.PATH, ...environment },
      encoding: "utf8",
    }
  );
}
const privateEnv = {
  OPS_PRIVATE_SOURCE_MAPS: "1",
  NEXT_PUBLIC_SENTRY_RELEASE: release,
  SENTRY_RELEASE: release,
  SOURCE_COMMIT: release,
};
test("private builds generate browser and server maps without an upload credential", () => {
  const result = config(privateEnv);
  assert.equal(result.status, 0, result.stderr);
  const settings = JSON.parse(result.stdout);
  assert.equal(settings.browser, true);
  assert.equal(settings.server, true);
  assert.equal(settings.debugIds, true);
  assert.equal(settings.output, "standalone");
});
test("private builds reject missing, mutable and inconsistent release identities", () => {
  for (const environment of [
    { ...privateEnv, NEXT_PUBLIC_SENTRY_RELEASE: "main" },
    { ...privateEnv, NEXT_PUBLIC_SENTRY_RELEASE: "" },
    { ...privateEnv, SOURCE_COMMIT: "b".repeat(40) },
    { ...privateEnv, SENTRY_RELEASE: "" },
  ])
    assert.notEqual(config(environment).status, 0);
});
test("each private production release has its own assets while chat prompt files stay in the server trace", () => {
  for (const value of ["a", "b"]) {
    const sha = value.repeat(40);
    const result = config({
      ...privateEnv,
      NODE_ENV: "production",
      SOURCE_COMMIT: sha,
      SENTRY_RELEASE: sha,
      NEXT_PUBLIC_SENTRY_RELEASE: sha,
    });
    assert.equal(result.status, 0, result.stderr);
    const settings = JSON.parse(result.stdout);
    assert.equal(settings.prefix, `/_assets/${sha}`);
    assert.ok(
      settings.routes.some(
        (route) =>
          route.source === `/_assets/${sha}/_next/static/:path*` &&
          route.destination === "/_next/static/:path*"
      )
    );
    assert.deepEqual(settings.traces["/api/chat"], ["./prompts/**/*.md"]);
  }
});
test("ordinary builds keep their existing asset URLs and do not publish browser maps", () => {
  const result = config({ NODE_ENV: "production" });
  assert.equal(result.status, 0, result.stderr);
  const settings = JSON.parse(result.stdout);
  assert.equal(settings.browser, false);
  assert.equal(settings.prefix, undefined);
});
test("the container builds once and ends with the root-owned private artifact layer", () => {
  const source = readFileSync(new URL("../Dockerfile", import.meta.url), "utf8");
  const instructions = source
    .replace(/\\\n/g, " ")
    .split("\n")
    .filter((line) => /^(RUN|COPY|ADD|WORKDIR|VOLUME)\s/i.test(line));
  assert.equal(instructions.at(-1), "COPY --from=builder /opt/ops-sourcemaps /opt/ops-sourcemaps");
  assert.equal(source.match(/npm run build/g)?.length, 1);
  assert.match(source, /USER nextjs/);
  assert.match(source, /browser \.next\/static \/app\/\.next\/static/);
  assert.match(source, /server \.next\/standalone\/\.next\/server \/app\/\.next\/server/);
  assert.doesNotMatch(source, /SENTRY_AUTH_TOKEN|--mount=type=secret/);
  const guard = source.match(/^RUN (test "\$OPS_PRIVATE_SOURCE_MAPS" = "1") && /m)?.[1];
  assert.ok(guard);
  for (const value of ["", "0", "true", "1"]) {
    assert.equal(
      spawnSync("sh", ["-c", guard], { env: { OPS_PRIVATE_SOURCE_MAPS: value } }).status,
      value === "1" ? 0 : 1
    );
  }
});
test("one private image workflow waits for quality and stored artifacts before deployment", () => {
  assert.equal(existsSync(new URL("../.github/workflows/deploy-ops.yml", import.meta.url)), false);
  const workflow = readFileSync(
    new URL("../.github/workflows/platform-deploy.yml", import.meta.url),
    "utf8"
  );
  for (const value of [
    "ffb8f879-7546-4ce5-af9c-d6c52f32f582",
    'VERIFY_WORKFLOW: "ci.yml"',
    "private_registry",
    "verify-image",
    "/api/v1/source_map_uploads",
    "SOURCE_MAP_TOOL_SHA256",
    "OPS_IMAGE_DEPLOY_ENABLED",
    "publish_only",
  ])
    assert.ok(workflow.includes(value), value);
  assert.doesNotMatch(workflow, /cache-to:|upload-artifact@|SENTRY_AUTH_TOKEN/);
  assert.ok(
    workflow.indexOf("Verify private maps from the image") < workflow.indexOf("Deploy the digest")
  );
});

test("deployment requires verified source maps, an enabled cutover and a non-publish-only run", () => {
  const workflow = readFileSync(
    new URL("../.github/workflows/platform-deploy.yml", import.meta.url),
    "utf8"
  );
  const condition = workflow.match(/name: Deploy the digest[^\n]*\n\s+if: \$\{\{ (.+) \}\}/)?.[1];
  assert.ok(condition);
  const verification = workflow.slice(
    workflow.indexOf("- name: Verify private maps"),
    workflow.indexOf("- name: Deploy the digest")
  );
  assert.doesNotMatch(
    verification,
    /^\s+if:/m,
    "private image publication must always verify source maps"
  );
  for (const outcome of ["success", "skipped", "failure", "cancelled", undefined]) {
    for (const enabled of ["true", "false", undefined]) {
      for (const publishOnly of [true, false, undefined]) {
        const actual = runInNewContext(condition, {
          steps: { source_maps: { outcome } },
          vars: { OPS_IMAGE_DEPLOY_ENABLED: enabled },
          inputs: { publish_only: publishOnly },
        });
        assert.equal(Boolean(actual), outcome === "success" && enabled === "true" && !publishOnly);
      }
    }
  }
});
