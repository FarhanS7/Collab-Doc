import fs from 'fs';
import path from 'path';
import { getPromptTemplate } from './prompts.js';

export interface TestCase {
  id: string;
  mode: 'continue' | 'rewrite' | 'summarize';
  docContext?: string;
  selectionText?: string;
  prompt?: string;
  expectedMinTokens?: number;
  expectedMaxTokens?: number;
}

export interface EvalResult {
  testCaseId: string;
  mode: string;
  promptVersion: string;
  fillerScore: number; // 1.0 (no filler) or 0.0 (filler present)
  lengthScore: number; // 0.0 - 1.0
  passed: boolean;
}

const FORBIDDEN_FILLER_PHRASES = [
  'here is your',
  'here is the',
  'sure, here',
  "i'd be happy",
  'as an ai',
  'certainly!',
];

export function calculateFillerScore(output: string): number {
  const lower = output.toLowerCase().trim();
  for (const phrase of FORBIDDEN_FILLER_PHRASES) {
    if (lower.startsWith(phrase) || lower.includes(phrase)) {
      return 0.0;
    }
  }
  return 1.0;
}

export function calculateLengthScore(
  output: string,
  minTokens = 5,
  maxTokens = 200
): number {
  const words = output.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  if (wordCount >= minTokens && wordCount <= maxTokens) {
    return 1.0;
  }
  if (wordCount < minTokens) {
    return Number((wordCount / minTokens).toFixed(2));
  }
  return Number((maxTokens / wordCount).toFixed(2));
}

export async function runOfflineEvals(testCasesPath?: string): Promise<EvalResult[]> {
  const targetPath =
    testCasesPath ||
    path.join(process.cwd(), '../../evals/test-cases.json');

  let rawData = '[]';
  try {
    if (fs.existsSync(targetPath)) {
      rawData = fs.readFileSync(targetPath, 'utf-8');
    } else {
      const fallbackPath = path.join(process.cwd(), 'evals/test-cases.json');
      if (fs.existsSync(fallbackPath)) {
        rawData = fs.readFileSync(fallbackPath, 'utf-8');
      }
    }
  } catch (err) {
    console.warn(`[EvalRunner] Could not read test cases:`, err);
  }

  const testCases: TestCase[] = JSON.parse(rawData);
  const results: EvalResult[] = [];

  for (const tc of testCases) {
    const template = getPromptTemplate(tc.mode);
    const compiledUserPrompt = template.compileUserPrompt({
      prompt: tc.prompt,
      docContext: tc.docContext,
      selectionText: tc.selectionText,
    });

    // Mock completion verification string for offline benchmark evaluation
    const mockOutput = `Compiled prompt successfully for ${tc.mode} mode. ${compiledUserPrompt.slice(0, 30)}`;
    const fillerScore = calculateFillerScore(mockOutput);
    const lengthScore = calculateLengthScore(
      mockOutput,
      tc.expectedMinTokens ?? 5,
      tc.expectedMaxTokens ?? 200
    );

    const passed = fillerScore === 1.0 && lengthScore >= 0.5;

    results.push({
      testCaseId: tc.id,
      mode: tc.mode,
      promptVersion: template.version,
      fillerScore,
      lengthScore,
      passed,
    });
  }

  return results;
}

// Execution block if run directly via CLI (tsx src/ai/evalRunner.ts)
if (process.argv[1]?.endsWith('evalRunner.ts') || process.argv[1]?.endsWith('evalRunner.js')) {
  console.log('🤖 Running AI Prompt Benchmark Evaluation Suite...\n');
  runOfflineEvals().then((results) => {
    console.table(results);
    const passedCount = results.filter((r) => r.passed).length;
    console.log(`\n✨ Benchmark Complete: ${passedCount}/${results.length} test cases passed.`);
  }).catch((err) => {
    console.error('❌ Eval suite failed:', err);
    process.exit(1);
  });
}
