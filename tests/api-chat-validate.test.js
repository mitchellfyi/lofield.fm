const test = require("node:test");
const assert = require("node:assert/strict");

const {
  normalizeContent,
  hasAnyContent,
  firstEmptyMessageIndex,
} = require("../app/api/chat/utils.ts");

test("chat validation: rejects empty message", () => {
  const emptyIndex = firstEmptyMessageIndex([{ role: "user", content: "" }]);
  assert.equal(emptyIndex, 0);
  assert.equal(hasAnyContent([{ role: "user", content: "" }]), false);
});

test("chat validation: accepts text message", () => {
  const emptyIndex = firstEmptyMessageIndex([{ role: "user", content: "hi" }]);
  assert.equal(emptyIndex, null);
  assert.equal(hasAnyContent([{ role: "user", content: "hi" }]), true);
});

test("chat validation: accepts rich text parts", () => {
  const parts = [{ type: "text", text: "hello" }];
  const emptyIndex = firstEmptyMessageIndex([{ role: "user", content: parts }]);
  assert.equal(emptyIndex, null);
  assert.equal(hasAnyContent([{ role: "user", content: parts }]), true);
  assert.equal(normalizeContent(parts), "hello");
});

test("chat validation: detects empty rich parts", () => {
  const parts = [{ type: "text", text: "" }];
  const emptyIndex = firstEmptyMessageIndex([{ role: "user", content: parts }]);
  assert.equal(emptyIndex, 0);
  assert.equal(hasAnyContent([{ role: "user", content: parts }]), false);
});

test("chat validation: accepts parts with value field", () => {
  const parts = [{ type: "input_text", value: "hello" }];
  const emptyIndex = firstEmptyMessageIndex([{ role: "user", content: parts }]);
  assert.equal(emptyIndex, null);
  assert.equal(hasAnyContent([{ role: "user", content: parts }]), true);
  assert.equal(normalizeContent(parts), "hello");
});

