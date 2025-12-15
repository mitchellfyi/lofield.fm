const test = require("node:test");
const assert = require("node:assert/strict");

const {
  normalizeContent,
  hasAnyContent,
  firstEmptyMessageIndex,
} = require("../app/api/chat/utils.ts");

test("firstEmptyMessageIndex finds empty string", () => {
  const msgs = [
    { role: "user", content: "" },
    { role: "assistant", content: "hi" },
  ];
  assert.equal(firstEmptyMessageIndex(msgs), 0);
});

test("firstEmptyMessageIndex returns null when none empty", () => {
  const msgs = [
    { role: "user", content: "hey" },
    { role: "assistant", content: "hi" },
  ];
  assert.equal(firstEmptyMessageIndex(msgs), null);
});

test("hasAnyContent false when all empty", () => {
  const msgs = [
    { role: "user", content: "" },
    { role: "assistant", content: "" },
  ];
  assert.equal(hasAnyContent(msgs), false);
});

test("hasAnyContent true when one non-empty", () => {
  const msgs = [
    { role: "user", content: "" },
    { role: "assistant", content: "ok" },
  ];
  assert.equal(hasAnyContent(msgs), true);
});

test("normalizeContent returns empty string for unknown object", () => {
  assert.equal(normalizeContent({ foo: "bar" }), JSON.stringify({ foo: "bar" }));
});

