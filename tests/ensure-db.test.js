const test = require("node:test");
const assert = require("node:assert/strict");

const { isMissingTableError, collectMissingTables } = require("../scripts/ensure-db.js");

test("isMissingTableError detects known codes", () => {
  assert.equal(isMissingTableError({ code: "PGRST205" }), true);
  assert.equal(isMissingTableError({ code: "42P01" }), true);
});

test("isMissingTableError detects message hints", () => {
  assert.equal(
    isMissingTableError({ message: "relation public.chats does not exist" }),
    true
  );
  assert.equal(
    isMissingTableError({ message: "table not found in schema cache" }),
    true
  );
  assert.equal(isMissingTableError(null), false);
});

test("collectMissingTables returns missing table names", async () => {
  const errors = {
    profiles: { code: "PGRST205" },
    chats: { code: "42P01" },
  };

  const supabaseStub = {
    from(table) {
      return {
        select() {
          return {
            limit() {
              return Promise.resolve({ error: errors[table] ?? null });
            },
          };
        },
      };
    },
  };

  const missing = await collectMissingTables(supabaseStub);
  assert.deepEqual(missing.sort(), ["chats", "profiles"]);
});

