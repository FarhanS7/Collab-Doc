export interface PromptTemplate {
  version: string;
  systemPrompt: string;
  compileUserPrompt: (vars: {
    prompt?: string;
    docContext?: string;
    selectionText?: string;
    style?: string;
  }) => string;
}

export const SYSTEM_PROMPT_V1 =
  'You are an expert writing assistant integrated into a collaborative rich-text editor. ' +
  'Your goal is to generate text that inserts seamlessly into the editor at the cursor position. ' +
  'You MUST follow these strict rules:\n' +
  '1. Never output conversational filler (e.g. "Sure, here is...", "Here is the continuation:", "I\'d be happy to help", etc.).\n' +
  '2. Never explain your output or write notes.\n' +
  '3. Return ONLY the raw requested text content to be inserted directly into the document.\n' +
  '4. Match the tone, styling, and vocabulary of the surrounding context.\n' +
  '5. Do not wrap the output in markdown code blocks unless explicitly requested.';

export const PROMPT_TEMPLATES: Record<string, PromptTemplate> = {
  continue: {
    version: 'v1.0.0',
    systemPrompt: SYSTEM_PROMPT_V1,
    compileUserPrompt: ({ prompt, docContext }) =>
      `Surrounding Document Context:\n"""\n${docContext || ''}\n"""\n\n` +
      `User instruction or direction: "${prompt || 'Continue writing naturally'}"\n\n` +
      `Generate a continuation of the document from the cursor position. Do not repeat the context. Output ONLY the continuation.`,
  },
  rewrite: {
    version: 'v1.0.0',
    systemPrompt: SYSTEM_PROMPT_V1,
    compileUserPrompt: ({ prompt, docContext, selectionText }) =>
      `Surrounding Document Context:\n"""\n${docContext || ''}\n"""\n\n` +
      `Text selected by user to rewrite:\n"""\n${selectionText || ''}\n"""\n\n` +
      `Instruction for rewriting: "${prompt || 'Rewrite for clarity and flow'}"\n\n` +
      `Rewrite the selected text to satisfy the instruction. Output ONLY the rewritten text.`,
  },
  summarize: {
    version: 'v1.0.0',
    systemPrompt: SYSTEM_PROMPT_V1,
    compileUserPrompt: ({ docContext, selectionText }) =>
      `Surrounding Document Context:\n"""\n${docContext || selectionText || ''}\n"""\n\n` +
      `Summarize the document context clearly and concisely. Output ONLY the summary.`,
  },
};

export function getPromptTemplate(mode: string): PromptTemplate {
  const template = PROMPT_TEMPLATES[mode];
  if (!template) {
    return PROMPT_TEMPLATES.continue;
  }
  return template;
}
