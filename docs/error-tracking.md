# Error tracking

This app reports production browser and server exceptions to the Ops-hosted
GlitchTip instance at https://errors.m12n.org. Keep Umami for traffic analytics.

Ops owns the GlitchTip project and supplies `SENTRY_DSN`,
`NEXT_PUBLIC_SENTRY_DSN`, `OPS_PROJECT_ID`, and
`NEXT_PUBLIC_OPS_PROJECT_ID`. Deployments supply `SENTRY_RELEASE` and
`NEXT_PUBLIC_SENTRY_RELEASE` with the same immutable Git SHA. Do not create
another project, copy a DSN from another app, or use Sentry Cloud.

Keep the browser, Node, and edge instrumentation together. Report caught React
boundary errors with `Sentry.captureException(error)`; do not report expected
validation, authorization, or not-found results as exceptions.

The shared before-send filter drops user details, breadcrumbs, request bodies,
cookies, headers, and URL query strings. Never attach customer content, tokens,
provider payloads, prompts, or files. Tracing, replay, and client-session reports
are disabled. Extend the privacy tests before adding context.

Open this project's Errors section in Ops and choose **View errors**. An
authenticated Ops owner is signed into GlitchTip through the Ops identity
provider; there is no shared admin password in the link.

For verification, trigger one harmless uniquely named browser exception on the
deployed site and confirm its hostname, project, release, and stack in GlitchTip.
A successful page request alone does not prove error delivery. Do not add a
public crash endpoint.

Production builds use `.github/workflows/platform-deploy.yml`. It waits for the
exact revision's CI, confirms the repository's GHCR package is private, then
publishes one image with its immutable source revision. It exports no build
cache or map artifact. SDK uploads are disabled; the upload credential remains
in encrypted Ops provider settings and never enters a build or runtime image.

The Docker build requires `OPS_PRIVATE_SOURCE_MAPS=1` and the same full commit
SHA in `SOURCE_COMMIT`, `SENTRY_RELEASE` and `NEXT_PUBLIC_SENTRY_RELEASE`. Next
16 generates native Turbopack debug IDs and browser/server maps. The preparation
helper derives each final debug ID from both JavaScript and map content.
Missing application source contents fail the build. The unmapped compiler stubs
listed below may retain null content; only source-free wrapper maps may be omitted.

The helper originates from Sense `64c7fffa67ddff1204574bd0313093f2593f7e56`, with
the stricter normalization from Umami `0929b14` and per-source checks from
Simbox `4de73e9`. The unchanged Ops collector is
checksum-pinned in `ops/ops-sourcemaps.provenance.json`; its bytes were compared
with the deployed `/install/ops-sourcemaps.mjs` before this integration.

The image runs as `nextjs` on port 3000. `/opt/ops-sourcemaps` is created as a
root-owned `0700` directory before the private artifact is copied in the final
filesystem layer. The runtime user cannot traverse it. Browser and server maps,
including compressed variants, are removed from runtime serving directories.
Ops verifies hashes against the published container without executing it, then
uploads the private maps through a short-lived GitHub OIDC handoff. Digest
deployment waits for a verified upload and remains gated by `publish_only` and
`OPS_IMAGE_DEPLOY_ENABLED`.

Private releases serve Next assets at `/_assets/<full SHA>/_next/static/`.
Only that exact static path bypasses session middleware; ordinary authenticated
routes keep their checks. OAuth and email confirmation return to the configured
`NEXT_PUBLIC_APP_URL`, preserving safe local destinations. Chat's Markdown
prompts are included in the standalone server trace, outside every public root.

Preserve the existing private Supabase endpoint, auth provider flags and callback
allowlist, encryption/service keys, Umami website ID, GlitchTip DSNs, media and
signed R2 backup/restore policy during image cutover. Do not restore old Cloud
data or create verification accounts. Runtime secrets remain in the existing
Ops workload configuration; only public values and release identifiers are
build inputs.

Run `npm run test:ops` for artifact/identity contracts. `npm run quality:full`
and CI include those tests alongside the unit suite. Stage Ops image-build and
source-map settings while the existing provider application continues to serve
its source deployment. Run a publish-only workflow and verify the private package
binding, stored map bytes, exact image hashes and public map denial. Convert the
same provider application to the approved immutable image, preserving its identity
and configuration, then enable image deployment. Verify public HTTPS and live
native browser/server stacks with their original source context. A local image
does not prove production symbolication. Follow
[Ops' private source-map runbook](https://github.com/m12n-org/ops.m12n.org/blob/main/docs/runbooks/private-source-maps.md)
and retain the live verification work in
[Ops issue 16](https://github.com/m12n-org/ops.m12n.org/issues/16).

Map preparation rejects missing content in partially populated maps as well as
maps with no originals. The only nullable entries are unmapped Webpack startup,
anonymous, extracted-CSS and Next `server-only/empty.js` stubs. A mapping to any
of those entries requires its original content. Every private image publication
verifies and uploads its maps, including publish-only runs. Deployment also
requires that step to finish successfully.
