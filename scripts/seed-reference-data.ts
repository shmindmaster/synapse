/**
 * Reference Data Seeding Script
 * Loads and processes reference data from JSON files into database with embeddings
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface DocumentTypeData {
  typeName: string;
  category?: string;
  schema?: object;
  analysisRules?: object;
  sourceUrl?: string;
}

interface AnalysisTemplateData {
  templateName: string;
  documentType: string;
  analysisType: string;
  prompt: string;
  outputSchema?: object;
  sourceUrl?: string;
}

interface KnowledgePatternData {
  patternName: string;
  organizationType: string;
  structure: object;
  sourceUrl?: string;
}

async function seedDocumentTypes(): Promise<number> {
  const dataDir = path.join(__dirname, '../data/document_types');
  if (!fs.existsSync(dataDir)) {
    console.log('No document_types directory found, skipping...');
    return 0;
  }

  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
  let count = 0;

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(dataDir, file), 'utf-8');
      const data: DocumentTypeData = JSON.parse(content);
      
      await prisma.documentType.upsert({
        where: { typeName: data.typeName },
        update: {
          category: data.category,
          schema: data.schema,
          analysisRules: data.analysisRules,
        },
        create: {
          typeName: data.typeName,
          category: data.category,
          schema: data.schema,
          analysisRules: data.analysisRules,
        },
      });
      count++;
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
    }
  }

  return count;
}

async function seedAnalysisTemplates(): Promise<number> {
  const dataDir = path.join(__dirname, '../data/analysis_templates');
  if (!fs.existsSync(dataDir)) {
    console.log('No analysis_templates directory found, skipping...');
    return 0;
  }

  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
  let count = 0;

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(dataDir, file), 'utf-8');
      const data: AnalysisTemplateData = JSON.parse(content);
      
      await prisma.analysisTemplate.create({
        data: {
          templateName: data.templateName,
          documentType: data.documentType,
          analysisType: data.analysisType,
          prompt: data.prompt,
          outputSchema: data.outputSchema,
        },
      });
      count++;
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
    }
  }

  return count;
}

async function seedKnowledgePatterns(): Promise<number> {
  const dataDir = path.join(__dirname, '../data/knowledge_organization_patterns');
  if (!fs.existsSync(dataDir)) {
    console.log('No knowledge_organization_patterns directory found, skipping...');
    return 0;
  }

  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
  let count = 0;

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(dataDir, file), 'utf-8');
      const data: KnowledgePatternData = JSON.parse(content);
      
      await prisma.knowledgeOrganizationPattern.create({
        data: {
          patternName: data.patternName,
          organizationType: data.organizationType,
          structure: data.structure,
        },
      });
      count++;
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
    }
  }

  return count;
}

async function main() {
  console.log('Starting reference data seeding...');
  
  const docTypes = await seedDocumentTypes();
  console.log(`Seeded ${docTypes} document types`);
  
  const templates = await seedAnalysisTemplates();
  console.log(`Seeded ${templates} analysis templates`);
  
  const patterns = await seedKnowledgePatterns();
  console.log(`Seeded ${patterns} knowledge organization patterns`);
  
  console.log('Reference data seeding complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
