/**
 * Knowledge Base Types
 * TypeScript types for knowledge base features
 */

// Document Type Schema
export interface DocumentType {
  id: string;
  typeName: string;
  category?: string;
  schema?: Record<string, unknown>;
  analysisRules?: Record<string, unknown>;
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

// Analysis Template
export interface AnalysisTemplate {
  id: string;
  templateName: string;
  documentType: string;
  analysisType: 'summary' | 'extraction' | 'classification';
  prompt: string;
  outputSchema?: Record<string, unknown>;
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

// Knowledge Organization Pattern
export interface KnowledgeOrganizationPattern {
  id: string;
  patternName: string;
  organizationType: 'hierarchical' | 'tag_based' | 'semantic';
  structure: Record<string, unknown>;
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

// Document Status
export type DocumentStatus = 'indexed' | 'analyzing' | 'error' | 'sensitive';

// Document Classification Result
export interface DocumentClassification {
  documentType: string;
  category: string;
  confidence: number;
  reasoning: string;
  alternativeTypes: Array<{
    type: string;
    confidence: number;
  }>;
}

// Analysis Result
export interface AnalysisResult {
  templateName: string;
  analysisType: AnalysisType;
  output: Record<string, unknown>;
  confidence: number;
  promptUsed: string;
}

// Organization Recommendation
export interface OrganizationRecommendation {
  patternName: string;
  organizationType: OrganizationType;
  suggestedLocation: string;
  relatedDocuments: string[];
}

// Full Document Analysis Output
export interface DocumentAnalysisOutput {
  classification: DocumentClassification;
  analysis: AnalysisResult;
  organization: OrganizationRecommendation;
  processingTime: number;
}

// Document Categories
export type DocumentCategory = 'contract' | 'report' | 'email' | 'presentation' | 'other';

// Analysis Types
export type AnalysisType = 'summary' | 'extraction' | 'classification';

// Organization Types
export type OrganizationType = 'hierarchical' | 'tag_based' | 'semantic';
