'use server';

/**
 * @fileOverview This file defines a Genkit flow for explaining a selected clause in a legal document.
 *
 * - explainSelectedClause - A function that takes a clause and document and returns a plain language explanation.
 * - ExplainSelectedClauseInput - The input type for the explainSelectedClause function.
 * - ExplainSelectedClauseOutput - The return type for the explainSelectedClause function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExplainSelectedClauseInputSchema = z.object({
  clause: z
    .string()
    .describe('The specific clause from the legal document to be explained.'),
  documentContext: z
    .string()
    .describe('The surrounding context of the clause within the legal document.'),
});
export type ExplainSelectedClauseInput = z.infer<
  typeof ExplainSelectedClauseInputSchema
>;

const ExplainSelectedClauseOutputSchema = z.object({
  explanation: z
    .string()
    .describe('A plain language explanation of the selected clause.'),
});
export type ExplainSelectedClauseOutput = z.infer<
  typeof ExplainSelectedClauseOutputSchema
>;

export async function explainSelectedClause(
  input: ExplainSelectedClauseInput
): Promise<ExplainSelectedClauseOutput> {
  return explainSelectedClauseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainSelectedClausePrompt',
  input: {schema: ExplainSelectedClauseInputSchema},
  output: {schema: ExplainSelectedClauseOutputSchema},
  prompt: `You are a legal expert who specializes in explaining complex legal jargon in plain language. Given the following clause and its surrounding context from a legal document, provide a clear and concise explanation of the clause's meaning.

Clause: {{{clause}}}

Context: {{{documentContext}}}

Explanation:`,
});

const explainSelectedClauseFlow = ai.defineFlow(
  {
    name: 'explainSelectedClauseFlow',
    inputSchema: ExplainSelectedClauseInputSchema,
    outputSchema: ExplainSelectedClauseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
