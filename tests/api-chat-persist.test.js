const test = require("node:test");
const assert = require("node:assert/strict");

const {
  firstEmptyMessageIndex,
  normalizeContent,
} = require("../app/api/chat/utils.ts");

test("normalizeContent extracts text/value/content", () => {
  const parts = [
    { type: "text", text: "a" },
    { type: "input_text", value: "b" },
    { type: "other", content: "c" },
  ];
  assert.equal(normalizeContent(parts), "abc");
  assert.equal(firstEmptyMessageIndex([{ role: "user", content: parts }]), null);
});

