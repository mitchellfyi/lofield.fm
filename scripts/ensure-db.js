#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */
const { spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");
const { URL } = require("url");
const os = require("os");

function loadEnv() {
  // Prefer .env.local (Next.js convention), fall back to .env
  const envFiles = [".env.local", ".env"];
  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      dotenv.config({ path: fullPath });
      return;
    }
  }
  // If no env file present, still rely on process.env (CI / injected)
}

loadEnv();

const REQUIRED_TABLES = [
  "profiles",
  "user_settings",
  "user_secrets",
  "chats",
  "chat_messages",
  "tracks",
];

function isMissingTableError(error) {
  if (!error) return false;
  const code = error.code;
  const message =
    typeof error.message === "string" ? error.message.toLowerCase() : "";

  return (
    code === "PGRST205" || // PostgREST missing relation
    code === "42P01" || // Postgres undefined table
    message.includes("not found") ||
    message.includes("does not exist") ||
    (message.includes("relation") && message.includes("does not exist"))
  );
}

async function collectMissingTables(supabase) {
  const missing = [];

  for (const table of REQUIRED_TABLES) {
    const builder = supabase.from(table).select("*");
    const { error } =
      typeof builder.limit === "function"
        ? await builder.limit(1)
        : await builder;
    if (error && isMissingTableError(error)) {
      missing.push(table);
    }
  }

  return missing;
}

function hasSupabaseCLI() {
  const result = spawnSync("supabase", ["--version"], {
    stdio: "ignore",
    shell: process.platform === "win32",
  });
  return result.status === 0;
}

function runSupabaseMigrations(dbUrl) {
  const args = ["db", "push", "--db-url", dbUrl];
  console.log(
    `Running Supabase migrations via CLI: supabase ${args.join(" ")}`
  );
  const result = spawnSync("supabase", args, {
    stdio: "inherit",
    cwd: path.resolve(__dirname, ".."),
    shell: process.platform === "win32",
  });
  return result.status === 0;
}

function runRemoteMigrations(projectRef, accessToken) {
  // Ensure linked to the project before pushing
  console.log(
    `Linking Supabase project: supabase link --project-ref ${projectRef}`
  );
  const linkResult = spawnSync(
    "supabase",
    ["link", "--project-ref", projectRef],
    {
      stdio: "inherit",
      cwd: path.resolve(__dirname, ".."),
      shell: process.platform === "win32",
      env: { ...process.env, SUPABASE_ACCESS_TOKEN: accessToken || "" },
    }
  );

  if (linkResult.status !== 0) {
    return false;
  }

  const args = ["db", "push", "--linked"];
  console.log(
    `Running Supabase migrations via CLI (remote linked): supabase ${args.join(
      " "
    )}`
  );
  const result = spawnSync("supabase", args, {
    stdio: "inherit",
    cwd: path.resolve(__dirname, ".."),
    shell: process.platform === "win32",
    env: { ...process.env, SUPABASE_ACCESS_TOKEN: accessToken || "" },
  });
  return result.status === 0;
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const dbUrl = process.env.SUPABASE_DB_URL;
  const projectRef =
    process.env.SUPABASE_PROJECT_REF ||
    process.env.SUPABASE_REF ||
    process.env.SUPABASE_PROJECT_ID;
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "[db:ensure] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set these before running dev or migrations."
    );
    process.exitCode = 1;
    return;
  }

  let parsedDbUrl;
  let isPooler = false;
  if (dbUrl) {
    try {
      parsedDbUrl = new URL(dbUrl);
      const host = parsedDbUrl.hostname || "";
      isPooler =
        host.includes("pooler.supabase.com") ||
        parsedDbUrl.searchParams.get("pgbouncer") === "true" ||
        parsedDbUrl.port === "6543";
    } catch (err) {
      console.error("[db:ensure] SUPABASE_DB_URL is not a valid URL.");
      process.exitCode = 1;
      return;
    }
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const missing = await collectMissingTables(supabase);
  if (missing.length === 0) {
    console.log("[db:ensure] Supabase schema OK.");
    return;
  }

  console.warn(
    `[db:ensure] Missing tables detected: ${missing.join(
      ", "
    )}. Will attempt to run migrations.`
  );

  if (!hasSupabaseCLI()) {
    console.error(
      "[db:ensure] Supabase CLI not found. Install it (https://supabase.com/docs/guides/cli) and run `pnpm db:migrate`."
    );
    process.exitCode = 1;
    return;
  }

  const canRemotePush = !!(projectRef && accessToken);

  if (isPooler || !dbUrl) {
    if (!canRemotePush) {
      console.error(
        "[db:ensure] SUPABASE_DB_URL is missing or points to the pooler. Set SUPABASE_PROJECT_REF and SUPABASE_ACCESS_TOKEN, then re-run so we can push migrations remotely."
      );
      process.exitCode = 1;
      return;
    }
    const okRemote = runRemoteMigrations(projectRef);
    if (!okRemote) {
      console.error(
        "[db:ensure] Remote migration command failed. Please retry `supabase db push --project-ref <ref> --remote` after ensuring the project is linked and the access token is valid."
      );
      process.exitCode = 1;
      return;
    }
  } else {
    const ok = runSupabaseMigrations(dbUrl);
    if (!ok) {
      console.error(
        "[db:ensure] Migration command failed. Please run it manually and check your SUPABASE_DB_URL."
      );
      process.exitCode = 1;
      return;
    }
  }

  const missingAfter = await collectMissingTables(supabase);
  if (missingAfter.length === 0) {
    console.log("[db:ensure] Migrations applied and schema is now present.");
    return;
  }

  console.error(
    `[db:ensure] Tables still missing after migration: ${missingAfter.join(
      ", "
    )}.`
  );
  process.exitCode = 1;
}

if (require.main === module) {
  main().catch((err) => {
    console.error("[db:ensure] Unexpected error", err);
    process.exitCode = 1;
  });
}

module.exports = {
  isMissingTableError,
  collectMissingTables,
  hasSupabaseCLI,
  runSupabaseMigrations,
};
