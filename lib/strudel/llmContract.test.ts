import { describe, it, expect } from 'vitest';
import {
  extractCodeBlocks,
  parseResponse,
  validateStrudelCode,
  buildRetryPrompt,
  extractLatestCode,
} from './llmContract';

describe('extractCodeBlocks', () => {
  it('should extract single code block', () => {
    const text = 'Some text\n```js\nsetcps(1)\nstack().play()\n```\nMore text';
    const blocks = extractCodeBlocks(text);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toBe('setcps(1)\nstack().play()');
  });

  it('should extract multiple code blocks', () => {
    const text = '```js\ncode1\n```\nText\n```js\ncode2\n```';
    const blocks = extractCodeBlocks(text);
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toBe('code1');
    expect(blocks[1]).toBe('code2');
  });

  it('should handle code blocks without language specifier', () => {
    const text = '```\nsetcps(1)\n```';
    const blocks = extractCodeBlocks(text);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toBe('setcps(1)');
  });

  it('should handle javascript language specifier', () => {
    const text = '```javascript\nsetcps(1)\n```';
    const blocks = extractCodeBlocks(text);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toBe('setcps(1)');
  });

  it('should return empty array when no code blocks', () => {
    const text = 'Just some text without code blocks';
    const blocks = extractCodeBlocks(text);
    expect(blocks).toHaveLength(0);
  });

  it('should trim whitespace from code blocks', () => {
    const text = '```js\n  \nsetcps(1)\n  \n```';
    const blocks = extractCodeBlocks(text);
    expect(blocks[0]).toBe('setcps(1)');
  });
});

describe('parseResponse', () => {
  it('should extract notes and code', () => {
    const text = `Notes:
- Beat at 90 BPM
- Added drums

Code:
\`\`\`js
setcps(1.5)
s("bd").play()
\`\`\``;
    const parsed = parseResponse(text);
    expect(parsed.notes).toContain('Beat at 90 BPM');
    expect(parsed.codeBlocks).toHaveLength(1);
  });

  it('should handle response without notes', () => {
    const text = 'Code:\n```js\nsetcps(1)\n```';
    const parsed = parseResponse(text);
    expect(parsed.codeBlocks).toHaveLength(1);
  });

  it('should handle case-insensitive notes label', () => {
    const text = 'Note:\n- Something\nCode:\n```js\nsetcps(1)\n```';
    const parsed = parseResponse(text);
    expect(parsed.notes).toBeDefined();
  });
});

describe('validateStrudelCode', () => {
  it('should validate correct Strudel code', () => {
    const text = `Notes:
- Test beat

Code:
\`\`\`js
setcps(90/60/4)
stack(
  s("bd sd"),
  s("hh*8")
).play()
\`\`\``;
    const result = validateStrudelCode(text);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.code).toBeDefined();
  });

  it('should fail when no code block present', () => {
    const text = 'Just some text without code';
    const result = validateStrudelCode(text);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].type).toBe('no_code_block');
  });

  it('should fail when multiple code blocks present', () => {
    const text = '```js\nsetcps(1)\n```\n```js\ns("bd").play()\n```';
    const result = validateStrudelCode(text);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].type).toBe('multiple_code_blocks');
  });

  it('should fail when tempo directive missing', () => {
    const text = '```js\ns("bd sd").play()\n```';
    const result = validateStrudelCode(text);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.type === 'missing_tempo')).toBe(true);
  });

  it('should fail when playback call missing', () => {
    const text = '```js\nsetcps(1.5)\ns("bd sd")\n```';
    const result = validateStrudelCode(text);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.type === 'missing_playback')).toBe(true);
  });

  it('should accept setcps as tempo directive', () => {
    const text = '```js\nsetcps(90/60/4)\ns("bd").play()\n```';
    const result = validateStrudelCode(text);
    expect(result.errors.some(e => e.type === 'missing_tempo')).toBe(false);
  });

  it('should accept cpm as tempo directive', () => {
    const text = '```js\ns("bd").cpm(120).play()\n```';
    const result = validateStrudelCode(text);
    expect(result.errors.some(e => e.type === 'missing_tempo')).toBe(false);
  });

  it('should accept play() with no arguments', () => {
    const text = '```js\nsetcps(1.5)\ns("bd").play()\n```';
    const result = validateStrudelCode(text);
    expect(result.errors.some(e => e.type === 'missing_playback')).toBe(false);
  });

  it('should accept play with arguments', () => {
    const text = '```js\nsetcps(1.5)\ns("bd").play({ fadeTime: 0.5 })\n```';
    const result = validateStrudelCode(text);
    expect(result.errors.some(e => e.type === 'missing_playback')).toBe(false);
  });

  it('should accumulate multiple validation errors', () => {
    const text = '```js\ns("bd sd")\n```';
    const result = validateStrudelCode(text);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
  });
});

describe('buildRetryPrompt', () => {
  it('should build retry prompt from validation errors', () => {
    const errors = [
      { type: 'missing_tempo' as const, message: 'Code must include tempo' },
      { type: 'missing_playback' as const, message: 'Code must call .play()' },
    ];
    const prompt = buildRetryPrompt(errors);
    expect(prompt).toContain('validation errors');
    expect(prompt).toContain('Code must include tempo');
    expect(prompt).toContain('Code must call .play()');
    expect(prompt).toContain('COMPLETE program');
  });

  it('should request full program output', () => {
    const errors = [
      { type: 'missing_tempo' as const, message: 'Missing tempo' },
    ];
    const prompt = buildRetryPrompt(errors);
    expect(prompt).toContain('COMPLETE');
    expect(prompt).toContain('not a diff');
  });
});

describe('extractLatestCode', () => {
  it('should extract code from valid message', () => {
    const message = '```js\nsetcps(1.5)\ns("bd").play()\n```';
    const code = extractLatestCode(message);
    expect(code).toBeDefined();
    expect(code).toContain('setcps');
  });

  it('should return null when no valid code', () => {
    const message = 'Just text without code';
    const code = extractLatestCode(message);
    expect(code).toBeNull();
  });

  it('should return code even if validation fails', () => {
    const message = '```js\ns("bd")\n```';
    const code = extractLatestCode(message);
    expect(code).toBeDefined();
    expect(code).toContain('s("bd")');
  });
});
