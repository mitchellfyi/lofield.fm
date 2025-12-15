const test = require("node:test");
const assert = require("node:assert/strict");

const {
  normalizeContent,
  hasAnyContent,
} = require("../app/api/chat/utils.ts");

test("normalizeContent handles string", () => {
  assert.equal(normalizeContent("hello"), "hello");
});

test("normalizeContent concatenates text parts", () => {
  const parts = [
    { type: "text", text: "hello" },
    { type: "text", text: " world" },
  ];
  assert.equal(normalizeContent(parts), "hello world");
});

test("normalizeContent falls back to JSON for objects", () => {
  const obj = { foo: "bar" };
  assert.equal(normalizeContent(obj), JSON.stringify(obj));
});

test("hasAnyContent detects non-empty", () => {
  const msgs = [
    { role: "user", content: "" },
    { role: "assistant", content: [{ type: "text", text: "ok" }] },
  ];
  assert.equal(hasAnyContent(msgs), true);
});

test("hasAnyContent returns false for empty content", () => {
  const msgs = [{ role: "user", content: "" }];
  assert.equal(hasAnyContent(msgs), false);
});

