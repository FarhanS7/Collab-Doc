import { describe, it, expect } from '@jest/globals';
import { calculateFillerScore, calculateLengthScore } from './evalRunner.js';

describe('AI Offline Eval Runner Metric Pipeline', () => {
  it('should return 1.0 filler score for clean text without conversational preamble', () => {
    const cleanOutput = 'Vector clocks maintain causal ordering across distributed nodes.';
    expect(calculateFillerScore(cleanOutput)).toBe(1.0);
  });

  it('should return 0.0 filler score when output contains forbidden conversational filler', () => {
    const fillerOutput1 = 'Here is your completion: Vector clocks maintain causal ordering.';
    const fillerOutput2 = "Sure, I'd be happy to write a summary for you.";
    expect(calculateFillerScore(fillerOutput1)).toBe(0.0);
    expect(calculateFillerScore(fillerOutput2)).toBe(0.0);
  });

  it('should return 1.0 length score when output word count falls within bounds', () => {
    const sampleOutput = 'Word one two three four five six seven eight nine ten.';
    expect(calculateLengthScore(sampleOutput, 5, 20)).toBe(1.0);
  });

  it('should return scaled score when output word count is outside bounds', () => {
    const shortOutput = 'Too short';
    expect(calculateLengthScore(shortOutput, 10, 50)).toBeLessThan(1.0);
  });
});
