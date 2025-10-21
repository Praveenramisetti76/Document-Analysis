'use server';

/**
 * @fileOverview This file defines a Genkit flow for answering user questions about a legal document.
 *
 * - answerDocumentQuery - A function that takes a document and a question, and returns an answer.
 * - AnswerDocumentQueryInput - The input type for the answerDocumentQuery function.
 * - AnswerDocumentQueryOutput - The return type for the answerDocumentQuery function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerDocumentQueryInputSchema = z.object({
  documentText: z
    .string()
    .describe('The text content of the legal document.'),
  question: z.string().describe('The question to be answered based on the document.'),
});

export type AnswerDocumentQueryInput = z.infer<typeof AnswerDocumentQueryInputSchema>;

const AnswerDocumentQueryOutputSchema = z.object({
  answer: z.string().describe('The answer to the question based on the document.'),
  source: z.string().optional().describe('The source of the answer within the document, if found.'),
});

export type AnswerDocumentQueryOutput = z.infer<typeof AnswerDocumentQueryOutputSchema>;

export async function answerDocumentQuery(input: AnswerDocumentQueryInput): Promise<AnswerDocumentQueryOutput> {
  return answerDocumentQueryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'answerDocumentQueryPrompt',
  input: {schema: AnswerDocumentQueryInputSchema},
  output: {schema: AnswerDocumentQueryOutputSchema},
  prompt: `You are a legal expert who can answer questions about legal documents.

  Given the following legal document:
  {{documentText}}

  Answer the following question:
  {{question}}

  If the answer is explicitly present in the document, please cite the source by including the specific sentence or phrase.
  If the answer cannot be found in the document, respond that you cannot find the answer in the document.
  `,
});

const answerDocumentQueryFlow = ai.defineFlow(
  {
    name: 'answerDocumentQueryFlow',
    inputSchema: AnswerDocumentQueryInputSchema,
    outputSchema: AnswerDocumentQueryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
