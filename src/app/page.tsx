
"use client";

import * as React from "react";
import type { AnswerDocumentQueryOutput } from "@/ai/flows/answer-document-query";
import type { IdentifyRiskyClausesOutput } from "@/ai/flows/identify-risky-clauses";
import type { ExplainSelectedClauseOutput } from "@/ai/flows/explain-selected-clause";
import type { SummarizeDocumentOutput } from "@/ai/flows/summarize-document";
import {
  answerDocumentQueryAction,
  identifyRiskyClausesAction,
  explainSelectedClauseAction,
  summarizeDocumentAction,
} from "./actions";
import { sampleDocument } from "@/lib/sample-document";

import {
  BookText,
  FileText,
  HelpCircle,
  Lightbulb,
  ListTodo,
  MessageSquare,
  Scale,
  Search,
  Sparkles,
  ChevronRight,
  AlertTriangle,
  Upload,
  ShieldAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";

type ViewState = "initial" | "loading" | "analyzed";
type DocumentType = "text" | "pdf";
type PopoverPosition = { top: number; left: number };

const SUPPORTED_FILE_TYPES = ["text/plain", "text/markdown", "application/pdf"];

// A simple utility to extract text from a PDF file.
async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // Use a reliable CDN for the worker script
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const typedarray = new Uint8Array(arrayBuffer);
  const pdf = await pdfjs.getDocument(typedarray).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item: any) => item.str).join(" ");
  }
  return text;
}


export default function Home() {
  const [viewState, setViewState] = React.useState<ViewState>("initial");
  const [documentText, setDocumentText] = React.useState("");
  const [documentUrl, setDocumentUrl] = React.useState<string | null>(null);

  const [summary, setSummary] = React.useState<SummarizeDocumentOutput | null>(
    null
  );
  const [riskyClauses, setRiskyClauses] =
    React.useState<IdentifyRiskyClausesOutput | null>(null);
  const [qaResponse, setQaResponse] =
    React.useState<AnswerDocumentQueryOutput | null>(null);
  const [explanation, setExplanation] =
    React.useState<ExplainSelectedClauseOutput | null>(null);

  const [isLoading, setIsLoading] = React.useState({
    initialAnalysis: false,
    qa: false,
    explanation: false,
  });

  const [analysisTimer, setAnalysisTimer] = React.useState(0);

  const [question, setQuestion] = React.useState("");
  const [selectedText, setSelectedText] = React.useState("");
  const [popoverPosition, setPopoverPosition] =
    React.useState<PopoverPosition | null>(null);
  const [isExplanationDialogOpen, setIsExplanationDialogOpen] =
    React.useState(false);
  const [pastedText, setPastedText] = React.useState("");

  const { toast } = useToast();
  const documentRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const analyzeDocument = async (docText: string, docUrl: string | null) => {
    setViewState("loading");
    setIsLoading((prev) => ({ ...prev, initialAnalysis: true }));
    setDocumentText(docText);
    setDocumentUrl(docUrl);
    setAnalysisTimer(0);

    // Start timer
    const timerInterval = setInterval(() => {
      setAnalysisTimer((prev) => prev + 1);
    }, 1000);

    try {
      const [summaryResult, riskyClausesResult] = await Promise.all([
        summarizeDocumentAction({ documentText: docText }),
        identifyRiskyClausesAction({ documentText: docText }),
      ]);
      setSummary(summaryResult);
      setRiskyClauses(riskyClausesResult);
      setViewState("analyzed");
    } catch (error) {
      console.error("Analysis failed:", error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "Could not analyze the document. Please try again.",
      });
      setViewState("initial");
    } finally {
      clearInterval(timerInterval);
      setIsLoading((prev) => ({ ...prev, initialAnalysis: false }));
    }
  };

  const handleAnalyzeSample = () => {
    analyzeDocument(sampleDocument, null);
  };

  const handleAnalyzePastedText = () => {
    if (!pastedText.trim()) {
      toast({
        variant: "destructive",
        title: "No Text Provided",
        description: "Please paste some document text to analyze.",
      });
      return;
    }
    analyzeDocument(pastedText.trim(), null);
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Unsupported File Type",
        description: "Please upload a .txt, .md, or .pdf file.",
      });
      return;
    }
    
    // Revoke previous object URL if it exists
    if (documentUrl) {
      URL.revokeObjectURL(documentUrl);
    }
    
    let text = "";
    let fileUrl: string | null = null;
    
    try {
      if (file.type === "application/pdf") {
        text = await extractTextFromPdf(file);
        fileUrl = URL.createObjectURL(file);
      } else {
        text = await file.text();
      }
      analyzeDocument(text, fileUrl);
    } catch (error) {
       console.error("File processing error:", error);
        toast({
          variant: "destructive",
          title: "File Processing Error",
          description: "Could not read the content of the file.",
        });
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim() ?? "";
    if (text.length > 10 && documentRef.current && !documentUrl) { // Only allow text selection for non-PDFs
      const range = selection!.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect = documentRef.current.getBoundingClientRect();

      setSelectedText(text);
      setPopoverPosition({
        top: rect.bottom - containerRect.top + window.scrollY,
        left: rect.left - containerRect.left + window.scrollX + rect.width / 2,
      });
    } else {
      setSelectedText("");
      setPopoverPosition(null);
    }
  };

  const handleExplainClause = async () => {
    if (!selectedText) return;

    setPopoverPosition(null);
    setIsExplanationDialogOpen(true);
    setIsLoading((prev) => ({ ...prev, explanation: true }));

    try {
      const result = await explainSelectedClauseAction({
        clause: selectedText,
        documentContext: documentText,
      });
      setExplanation(result);
    } catch (error) {
      console.error("Explanation failed:", error);
      toast({
        variant: "destructive",
        title: "Explanation Failed",
        description: "Could not explain the selected clause.",
      });
      setExplanation({ explanation: "Error fetching explanation." });
    } finally {
      setIsLoading((prev) => ({ ...prev, explanation: false }));
    }
  };

  const handleAskQuestion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsLoading((prev) => ({ ...prev, qa: true }));
    setQaResponse(null);

    try {
      const result = await answerDocumentQueryAction({
        documentText,
        question,
      });
      setQaResponse(result);
    } catch (error) {
      console.error("Q&A failed:", error);
      toast({
        variant: "destructive",
        title: "Question Failed",
        description: "Could not get an answer. Please try again.",
      });
    } finally {
      setIsLoading((prev) => ({ ...prev, qa: false }));
    }
  };
  
  React.useEffect(() => {
    // Clean up the object URL when the component unmounts
    return () => {
      if (documentUrl) {
        URL.revokeObjectURL(documentUrl);
      }
    };
  }, [documentUrl]);

  if (viewState === "initial") {
    return (
      <main className="relative flex flex-col items-center justify-center min-h-screen p-4 sm:p-8 text-center bg-gradient-to-b from-background via-background/95 to-background/90">
        <div className="absolute inset-0 bg-grid-white/10 bg-[size:20px_20px] [mask-image:radial-gradient(white,transparent_85%)]" />
        <Card className="max-w-2xl w-full shadow-2xl animate-fade-up backdrop-blur-sm bg-background/95 border-primary/10">
          <CardHeader className="space-y-6">
            <div className="flex justify-center items-center gap-3">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary-foreground rounded-full blur opacity-30"></div>
                <Scale className="w-12 h-12 text-primary relative animate-pulse" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-br from-primary to-primary-foreground bg-clip-text text-transparent">
                ClauseGuard
              </h1>
              <div className="absolute top-4 right-4">
                <ThemeToggle />
              </div>
            </div>
            <div className="space-y-3">
              <CardTitle className="text-2xl sm:text-3xl font-semibold leading-tight">
                AI-Powered Legal Document Analysis
              </CardTitle>
              <CardDescription className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
                Upload your legal documents to get instant summaries, explanations, and
                answers in plain English, powered by advanced AI.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">Upload File</TabsTrigger>
                <TabsTrigger value="paste">Paste Text</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="space-y-6">
                <div className="group relative overflow-hidden rounded-lg border border-dashed border-primary/50 p-8 transition-all hover:border-primary">
                  <Input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".txt,.md,.pdf"
                  />
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="rounded-full bg-primary/10 p-4 transition-colors group-hover:bg-primary/20">
                      <Upload className="h-8 w-8 text-primary transition-transform group-hover:scale-110" />
                    </div>
                    <div className="space-y-2 text-center">
                      <h3 className="text-lg font-semibold">Drop your document here or</h3>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button
                          size="lg"
                          className="relative overflow-hidden group/btn"
                          onClick={handleUploadClick}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0 translate-x-[-100%] animate-shimmer group-hover/btn:translate-x-[100%]" />
                          <Upload className="mr-2 h-5 w-5" />
                          Upload Document
                        </Button>
                        <Button
                          size="lg"
                          variant="secondary"
                          className="group/sample"
                          onClick={handleAnalyzeSample}
                        >
                          <Sparkles className="mr-2 h-5 w-5 transition-transform group-hover/sample:scale-110" />
                          Use Sample
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Supports .txt, .md, or .pdf files • Try our sample Non-Disclosure Agreement
                    </p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="paste" className="space-y-4">
                <div className="space-y-4">
                  <Textarea
                    placeholder="Paste your legal document text here..."
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    className="min-h-[200px] resize-none"
                  />
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handleAnalyzePastedText}
                    disabled={!pastedText.trim()}
                  >
                    <FileText className="mr-2 h-5 w-5" />
                    Analyze Text
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Paste the content of your legal document directly into the text area above.
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="flex items-center h-16 px-6 border-b shrink-0">
        <div className="flex items-center gap-2 font-semibold">
          <Scale className="w-6 h-6 text-primary" />
          <span>ClauseGuard</span>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="flex-1 grid md:grid-cols-2 gap-8 p-6 overflow-hidden max-w-6xl mx-auto">
        <Card
          className="flex flex-col overflow-hidden"
          onMouseUp={handleTextSelection}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText /> Document
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            {documentUrl ? (
              <div className="relative w-full h-full border border-border rounded-md overflow-hidden">
                <iframe
                  src={documentUrl}
                  className="w-full h-full border-0 pdf-viewer"
                  title="Document Viewer"
                  style={{ 
                    minHeight: '500px',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                  }}
                />
              </div>
            ) : (
              <ScrollArea className="h-full pr-4" ref={documentRef}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {documentText}
                </p>
                {popoverPosition && (
                  <Popover
                    open={!!selectedText}
                    onOpenChange={() => setPopoverPosition(null)}
                  >
                    <PopoverTrigger asChild>
                      <div
                        className="absolute"
                        style={{
                          top: popoverPosition.top,
                          left: popoverPosition.left,
                          transform: "translateX(-50%)",
                        }}
                      />
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Button onClick={handleExplainClause}>
                        <Lightbulb className="mr-2 h-4 w-4" /> Explain Clause
                      </Button>
                    </PopoverContent>
                  </Popover>
                )}
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col overflow-hidden">
          <Tabs defaultValue="summary" className="flex flex-col h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles /> AI Analysis
              </CardTitle>
              <TabsList className="grid w-full grid-cols-3 mt-2">
                <TabsTrigger value="summary">
                  <ListTodo className="mr-2 h-4 w-4" /> Summary
                </TabsTrigger>
                <TabsTrigger value="qa">
                  <MessageSquare className="mr-2 h-4 w-4" /> Ask
                </TabsTrigger>
                <TabsTrigger value="risks">
                  <ShieldAlert className="mr-2 h-4 w-4" /> Risky Clauses
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <ScrollArea className="h-full pr-4">
                <TabsContent value="summary">
                  {isLoading.initialAnalysis ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-6">
                      <div className="text-center space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold">Analyzing Document...</h3>
                          <p className="text-sm text-muted-foreground">
                            Processing your document with AI
                          </p>
                          <div className="text-2xl font-mono font-bold text-primary">
                            {Math.floor(analysisTimer / 60)}:{(analysisTimer % 60).toString().padStart(2, '0')}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Estimated time: 30-60 seconds
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    summary && (
                      <div className="space-y-6">
                        <div>
                          <h3 className="font-semibold mb-2 flex items-center">
                            <ChevronRight className="w-4 h-4 mr-1" />
                            Summary
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {summary.summary}
                          </p>
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2 flex items-center">
                            <ChevronRight className="w-4 h-4 mr-1" />
                            Key Points
                          </h3>
                          <ul className="space-y-2 text-sm text-muted-foreground">
                            {summary.keyPoints.map((point, i) => (
                              <li key={i} className="flex items-start">
                                <span className="mr-2 mt-1">&#8226;</span>
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )
                  )}
                </TabsContent>
                <TabsContent value="qa">
                  <form onSubmit={handleAskQuestion} className="space-y-4">
                    <Textarea
                      placeholder="Ask a question about the document..."
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading.qa}
                    >
                      {isLoading.qa ? (
                        "Thinking..."
                      ) : (
                        <>
                          <Search className="mr-2 h-4 w-4" /> Get Answer
                        </>
                      )}
                    </Button>
                  </form>
                  {isLoading.qa && <Skeleton className="h-24 w-full mt-4" />}
                  {qaResponse && !isLoading.qa && (
                    <Card className="mt-4 bg-secondary/50">
                      <CardHeader>
                        <CardTitle className="text-base">Answer</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <p>{qaResponse.answer}</p>
                        {qaResponse.source && (
                          <p className="text-xs text-muted-foreground pt-2 border-t mt-2">
                            <span className="font-semibold">Source:</span> "
                            {qaResponse.source}"
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
                <TabsContent value="risks">
                  {isLoading.initialAnalysis ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-6">
                      <div className="text-center space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold">Analyzing Document...</h3>
                          <p className="text-sm text-muted-foreground">
                            Processing your document with AI
                          </p>
                          <div className="text-2xl font-mono font-bold text-primary">
                            {Math.floor(analysisTimer / 60)}:{(analysisTimer % 60).toString().padStart(2, '0')}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Estimated time: 30-60 seconds
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    riskyClauses && (
                      <Accordion type="single" collapsible className="w-full">
                        {riskyClauses.riskyClauses.map((item, i) => (
                          <AccordionItem value={`item-${i}`} key={i}>
                            <AccordionTrigger>
                              <div className="flex items-center gap-2 text-left">
                                <ShieldAlert className="h-4 w-4 shrink-0 text-destructive" />
                                <span>{item.location}: {item.clause.substring(0, 50)}...</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground space-y-4">
                              <div>
                                <h4 className="font-semibold text-foreground mb-1">Identified Clause:</h4>
                                <blockquote className="border-l-2 pl-3 italic">"{item.clause}"</blockquote>
                              </div>
                              <div>
                                <h4 className="font-semibold text-foreground mb-1">Suggestions:</h4>
                                <ul className="space-y-2 text-sm">
                                  {item.suggestions.map((suggestion, sIdx) => (
                                    <li key={sIdx} className="flex items-start">
                                      <span className="mr-2 mt-1 text-primary">&#10003;</span>
                                      {suggestion}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    )
                  )}
                </TabsContent>
              </ScrollArea>
            </CardContent>
          </Tabs>
        </Card>
      </main>

      <Dialog
        open={isExplanationDialogOpen}
        onOpenChange={setIsExplanationDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb /> Clause Explanation
            </DialogTitle>
          </DialogHeader>
          {isLoading.explanation ? (
            <div className="space-y-2 py-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : (
            <p className="py-4 text-muted-foreground">
              {explanation?.explanation}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

    