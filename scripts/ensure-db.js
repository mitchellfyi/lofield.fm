#!/usr/bin/env node
/* eslint-disable no-console */
const { spawnSync } = require("child_process");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

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
    message.includes("does not exist")
  );
}

async function collectMissingTables(supabase) {
  const missing = [];

  for (const table of REQUIRED_TABLES) {
    const builder = supabase.from(table).select("id");
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
  const args = dbUrl ? ["db", "push", "--db-url", dbUrl] : ["migration", "up"];
  console.log(
    `Running Supabase migrations via CLI: supabase ${args.join(" ")}${
      dbUrl ? "" : " (using local Supabase CLI db)"
    }`
  );
  const result = spawnSync("supabase", args, {
    stdio: "inherit",
    cwd: path.resolve(__dirname, ".."),
    shell: process.platform === "win32",
  });
  return result.status === 0;
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn(
      "[db:ensure] Skipping check: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing."
    );
    return;
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

  const dbUrl = process.env.SUPABASE_DB_URL;
  const ok = runSupabaseMigrations(dbUrl);
  if (!ok) {
    console.error(
      "[db:ensure] Migration command failed. Please run it manually and check your SUPABASE_DB_URL."
    );
    process.exitCode = 1;
    return;
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

