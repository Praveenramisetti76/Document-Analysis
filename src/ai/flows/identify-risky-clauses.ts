'use server';

/**
 * @fileOverview Identifies risky clauses in a legal document and suggests improvements.
 *
 * - identifyRiskyClauses - A function that analyzes a document for risky clauses.
 * - IdentifyRiskyClausesInput - The input type for the identifyRiskyClauses function.
 * - IdentifyRiskyClausesOutput - The return type for the identifyRiskyClauses function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IdentifyRiskyClausesInputSchema = z.object({
  documentText: z
    .string()
    .describe('The text content of the legal document to analyze.'),
});
export type IdentifyRiskyClausesInput = z.infer<
  typeof IdentifyRiskyClausesInputSchema
>;

const IdentifyRiskyClausesOutputSchema = z.object({
  riskyClauses: z
    .array(
      z.object({
        clause: z.string().describe('The exact text of the risky clause.'),
        location: z
          .string()
          .describe(
            'The location of the clause in the document (e.g., section number or paragraph).'
          ),
        suggestions: z
          .array(z.string())
          .length(3)
          .describe('An array of exactly three suggestions for improving the clause.'),
      })
    )
    .describe('An array of risky clauses found in the document.'),
});
export type IdentifyRiskyClausesOutput = z.infer<
  typeof IdentifyRiskyClausesOutputSchema
>;

export async function identifyRiskyClauses(
  input: IdentifyRiskyClausesInput
): Promise<IdentifyRiskyClausesOutput> {
  return identifyRiskyClausesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'identifyRiskyClausesPrompt',
  input: {schema: IdentifyRiskyClausesInputSchema},
  output: {schema: IdentifyRiskyClausesOutputSchema},
  prompt: `You are an expert legal analyst. Your task is to identify potentially risky or ambiguous clauses within a given legal document.

  Document Text: {{{documentText}}}

  For each risky clause you identify, you must:
  1. Extract the exact text of the clause.
  2. Specify its location within the document (e.g., "Section 3" or "Paragraph 2").
  3. Provide exactly three distinct and actionable suggestions for how to rephrase or improve the clause to mitigate the risk.

  Return the result as a JSON object containing an array of 'riskyClauses'. Each object in the array should have "clause", "location", and "suggestions" (as an array of three strings) keys.
  If no risky clauses are found, return an empty array.
  The output must be a valid JSON.`,
});

const identifyRiskyClausesFlow = ai.defineFlow(
  {
    name: 'identifyRiskyClausesFlow',
    inputSchema: IdentifyRiskyClausesInputSchema,
    outputSchema: IdentifyRiskyClausesOutputSchema,
  },
  async input => {
    const maxRetries = 3;
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        const {output} = await prompt(input);
        return output!;
      } catch (error: any) {
        attempt++;
        if (attempt >= maxRetries) {
          throw error; // Rethrow the last error
        }
        console.log(`Attempt ${attempt} failed. Retrying in ${attempt * 2} seconds...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
      }
    }
    // This part should not be reachable, but typescript needs a return path.
    throw new Error('identifyRiskyClausesFlow failed after multiple retries.');
  }
);