import { config } from 'dotenv';
config();

import '@/ai/flows/explain-selected-clause.ts';
import '@/ai/flows/answer-document-query.ts';
import '@/ai/flows/summarize-document.ts';
import '@/ai/flows/identify-risky-clauses.ts';