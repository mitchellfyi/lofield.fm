const test = require("node:test");
const assert = require("node:assert/strict");

const {
  normalizeContent,
  getMessageContent,
} = require("../app/api/chat/utils.ts");

test("getMessageContent: prefers content field", () => {
  const msg = { content: "text", parts: [{ type: "text", text: "ignore" }] };
  assert.equal(getMessageContent(msg), "text");
});

test("getMessageContent: falls back to parts", () => {
  const msg = { parts: [{ type: "text", text: "hello" }] };
  const content = getMessageContent(msg);
  assert.deepEqual(content, [{ type: "text", text: "hello" }]);
});

test("getMessageContent: returns empty string if neither", () => {
  const msg = { role: "user" };
  assert.equal(getMessageContent(msg), "");
});

test("normalizeContent: handles parts array from getMessageContent", () => {
  const parts = [{ type: "text", text: "hello world" }];
  const normalized = normalizeContent(parts);
  assert.equal(normalized, "hello world");
});

