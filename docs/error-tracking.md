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

Source-map upload is configured for the self-hosted URL but stays disabled
without a private `SENTRY_AUTH_TOKEN`. Do not put upload tokens in
`NEXT_PUBLIC_*`, HTML, build arguments, or committed files.
