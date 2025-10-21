"use server";

import {
  answerDocumentQuery,
  type AnswerDocumentQueryInput,
} from "@/ai/flows/answer-document-query";
import {
  explainSelectedClause,
  type ExplainSelectedClauseInput,
} from "@/ai/flows/explain-selected-clause";
import {
  identifyRiskyClauses,
  type IdentifyRiskyClausesInput,
} from "@/ai/flows/identify-risky-clauses";
import {
  summarizeDocument,
  type SummarizeDocumentInput,
} from "@/ai/flows/summarize-document";

export async function summarizeDocumentAction(input: SummarizeDocumentInput) {
  return summarizeDocument(input);
}

export async function explainSelectedClauseAction(
  input: ExplainSelectedClauseInput
) {
  return explainSelectedClause(input);
}

export async function answerDocumentQueryAction(
  input: AnswerDocumentQueryInput
) {
  return answerDocumentQuery(input);
}

export async function identifyRiskyClausesAction(
  input: IdentifyRiskyClausesInput
) {
  return identifyRiskyClauses(input);
}
