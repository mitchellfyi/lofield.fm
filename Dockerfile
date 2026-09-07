FROM node:24-alpine@sha256:e67514e5d0f6c46656005e1b693b2ec9d52e80b641307de684d4a015ba7a4eaf AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN HUSKY=0 npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SUPABASE_AUTH_GITHUB_ENABLED
ARG NEXT_PUBLIC_SUPABASE_AUTH_GOOGLE_ENABLED
ARG NEXT_PUBLIC_SENTRY_DSN
ARG NEXT_PUBLIC_OPS_PROJECT_ID
ARG NEXT_PUBLIC_SENTRY_RELEASE
ARG SENTRY_RELEASE
ARG SOURCE_COMMIT
ARG OPS_PRIVATE_SOURCE_MAPS
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_AUTH_GITHUB_ENABLED=$NEXT_PUBLIC_SUPABASE_AUTH_GITHUB_ENABLED
ENV NEXT_PUBLIC_SUPABASE_AUTH_GOOGLE_ENABLED=$NEXT_PUBLIC_SUPABASE_AUTH_GOOGLE_ENABLED
ENV NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN
ENV NEXT_PUBLIC_OPS_PROJECT_ID=$NEXT_PUBLIC_OPS_PROJECT_ID
ENV NEXT_PUBLIC_SENTRY_RELEASE=$NEXT_PUBLIC_SENTRY_RELEASE
ENV SENTRY_RELEASE=$SENTRY_RELEASE
ENV SOURCE_COMMIT=$SOURCE_COMMIT
ENV OPS_PRIVATE_SOURCE_MAPS=$OPS_PRIVATE_SOURCE_MAPS
ENV NEXT_TELEMETRY_DISABLED=1

RUN test "$OPS_PRIVATE_SOURCE_MAPS" = "1" && npm run build \
    && node ops/prepare-next-sourcemaps.mjs .next \
    && node ops/verify-browser-map-positions.mjs .next/static \
    && node ops/ops-sourcemaps.mjs collect /opt/ops-sourcemaps "$NEXT_PUBLIC_SENTRY_RELEASE" \
       browser .next/static /app/.next/static \
       server .next/standalone/.next/server /app/.next/server

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ARG SENTRY_RELEASE
ARG SOURCE_COMMIT
ENV SENTRY_RELEASE=$SENTRY_RELEASE
ENV SOURCE_COMMIT=$SOURCE_COMMIT
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
RUN mkdir .next && chown nextjs:nodejs .next \
    && mkdir -m 0700 /opt/ops-sourcemaps
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Ops extracts only this final filesystem layer; the runtime user cannot read it.
COPY --from=builder /opt/ops-sourcemaps /opt/ops-sourcemaps
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
