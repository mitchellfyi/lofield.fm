import { describe, it, expect, beforeEach } from 'vitest';
import { validateStrudelCode, buildRetryPrompt } from './llmContract';

/**
 * Integration tests for the validation + retry workflow
 * These tests verify the end-to-end validation and retry logic
 */
describe('LLM Contract Integration', () => {
  describe('Retry workflow', () => {
    it('should create correct retry prompt for missing tempo', () => {
      const invalidCode = '```js\ns("bd sd").play()\n```';
      const validation = validateStrudelCode(invalidCode);
      
      expect(validation.valid).toBe(false);
      
      const retryPrompt = buildRetryPrompt(validation.errors);
      
      expect(retryPrompt).toContain('validation errors');
      expect(retryPrompt).toContain('tempo');
      expect(retryPrompt).toContain('COMPLETE program');
    });
    
    it('should create correct retry prompt for missing playback', () => {
      const invalidCode = '```js\nsetcps(1.5)\ns("bd sd")\n```';
      const validation = validateStrudelCode(invalidCode);
      
      expect(validation.valid).toBe(false);
      
      const retryPrompt = buildRetryPrompt(validation.errors);
      
      expect(retryPrompt).toContain('validation errors');
      expect(retryPrompt).toContain('.play()');
      expect(retryPrompt).toContain('COMPLETE program');
    });
    
    it('should create correct retry prompt for multiple code blocks', () => {
      const invalidCode = '```js\nsetcps(1.5)\n```\n```js\ns("bd").play()\n```';
      const validation = validateStrudelCode(invalidCode);
      
      expect(validation.valid).toBe(false);
      
      const retryPrompt = buildRetryPrompt(validation.errors);
      
      expect(retryPrompt).toContain('validation errors');
      expect(retryPrompt).toContain('EXACTLY ONE');
    });
    
    it('should handle compound errors', () => {
      const invalidCode = '```js\ns("bd")\n```';
      const validation = validateStrudelCode(invalidCode);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(1);
      
      const retryPrompt = buildRetryPrompt(validation.errors);
      
      // Should contain all error messages
      validation.errors.forEach(error => {
        expect(retryPrompt).toContain(error.message);
      });
    });
  });
  
  describe('Valid code scenarios', () => {
    it('should pass validation for complete Strudel code', () => {
      const validCode = `Notes:
- Lofi beat at 85 BPM

Code:
\`\`\`js
setcps(85/60/4)
stack(
  s("bd sd:1 bd sd:2").slow(2),
  s("hh*8").gain(0.4)
).play()
\`\`\``;
      
      const validation = validateStrudelCode(validCode);
      
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.code).toBeDefined();
      expect(validation.code).toContain('setcps');
      expect(validation.code).toContain('play()');
    });
    
    it('should pass validation with cpm instead of setcps', () => {
      const validCode = `\`\`\`js
s("bd sd").cpm(120).play()
\`\`\``;
      
      const validation = validateStrudelCode(validCode);
      
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
    
    it('should pass validation with complex Strudel patterns', () => {
      const validCode = `\`\`\`js
setcps(90/60/4)
stack(
  s("bd sd:1 bd sd:2").slow(2).room(0.5),
  s("hh*8").gain(0.4).delay(0.1),
  note("c3 eb3 g3 bb3")
    .s("piano")
    .slow(4)
    .delay(0.3)
    .lpf(800)
).play()
\`\`\``;
      
      const validation = validateStrudelCode(validCode);
      
      expect(validation.valid).toBe(true);
      expect(validation.code).toContain('room');
      expect(validation.code).toContain('delay');
      expect(validation.code).toContain('lpf');
    });
  });
});
