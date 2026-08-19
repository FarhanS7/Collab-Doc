import { describe, it, expect } from '@jest/globals';
import { getPromptTemplate, PROMPT_TEMPLATES, SYSTEM_PROMPT_V1 } from './prompts.js';

describe('AI Prompt Template Manager Module', () => {
  it('should return valid v1.0.0 templates for continue, rewrite, and summarize', () => {
    expect(PROMPT_TEMPLATES.continue.version).toBe('v1.0.0');
    expect(PROMPT_TEMPLATES.rewrite.version).toBe('v1.0.0');
    expect(PROMPT_TEMPLATES.summarize.version).toBe('v1.0.0');
  });

  it('should fallback to continue template when unknown mode is provided', () => {
    const template = getPromptTemplate('unknown-mode');
    expect(template).toEqual(PROMPT_TEMPLATES.continue);
  });

  it('should compile continue prompt with variables and default fallback', () => {
    const template = getPromptTemplate('continue');
    const compiled = template.compileUserPrompt({ docContext: 'Hello world' });
    expect(compiled).toContain('Hello world');
    expect(compiled).toContain('Continue writing naturally');
  });

  it('should compile rewrite prompt incorporating selected text', () => {
    const template = getPromptTemplate('rewrite');
    const compiled = template.compileUserPrompt({
      docContext: 'Context here',
      selectionText: 'Text to rewrite',
      prompt: 'Make concise',
    });
    expect(compiled).toContain('Text to rewrite');
    expect(compiled).toContain('Make concise');
  });

  it('should enforce strict anti-filler instructions in system prompt', () => {
    expect(SYSTEM_PROMPT_V1).toContain('Never output conversational filler');
    expect(SYSTEM_PROMPT_V1).toContain('Return ONLY the raw requested text content');
  });
});
