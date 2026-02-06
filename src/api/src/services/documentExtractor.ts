/**
 * Document Extraction Service
 * 
 * Extracts text content from binary document formats:
 * - PDF (using pdf-parse)
 * - DOCX (using mammoth)
 * - XLSX (using xlsx)
 * 
 * Note: These packages need to be installed:
 *   npm install pdf-parse mammoth xlsx
 */

import { config } from '../config/configuration.js';

export interface ExtractionResult {
  success: boolean;
  text: string;
  metadata: {
    pageCount?: number;
    wordCount?: number;
    title?: string;
    author?: string;
    createdDate?: string;
    modifiedDate?: string;
    format: string;
  };
  error?: string;
}

export interface TableData {
  headers: string[];
  rows: string[][];
}

/**
 * Extract text from a PDF buffer
 */
export async function extractPdfText(buffer: Buffer): Promise<ExtractionResult> {
  try {
    // Dynamic import to handle missing package gracefully
    const pdfParse = await import('pdf-parse').then(m => m.default).catch(() => null);

    if (!pdfParse) {
      return {
        success: false,
        text: '',
        metadata: { format: 'pdf' },
        error: 'pdf-parse package not installed. Run: npm install pdf-parse',
      };
    }

    const data = await pdfParse(buffer);

    return {
      success: true,
      text: data.text,
      metadata: {
        pageCount: data.numpages,
        wordCount: data.text.split(/\s+/).length,
        title: data.info?.Title,
        author: data.info?.Author,
        createdDate: data.info?.CreationDate,
        modifiedDate: data.info?.ModDate,
        format: 'pdf',
      },
    };
  } catch (error) {
    console.error('PDF extraction error:', error);
    return {
      success: false,
      text: '',
      metadata: { format: 'pdf' },
      error: `PDF extraction failed: ${(error as Error).message}`,
    };
  }
}

/**
 * Extract text from a DOCX buffer
 */
export async function extractDocxText(buffer: Buffer): Promise<ExtractionResult> {
  try {
    const mammoth = await import('mammoth').then(m => m.default || m).catch(() => null);

    if (!mammoth) {
      return {
        success: false,
        text: '',
        metadata: { format: 'docx' },
        error: 'mammoth package not installed. Run: npm install mammoth',
      };
    }

    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;

    return {
      success: true,
      text,
      metadata: {
        wordCount: text.split(/\s+/).length,
        format: 'docx',
      },
    };
  } catch (error) {
    console.error('DOCX extraction error:', error);
    return {
      success: false,
      text: '',
      metadata: { format: 'docx' },
      error: `DOCX extraction failed: ${(error as Error).message}`,
    };
  }
}

/**
 * Extract text from an XLSX buffer
 */
export async function extractXlsxText(buffer: Buffer): Promise<ExtractionResult & { tables?: TableData[] }> {
  try {
    const XLSX = await import('xlsx').then(m => m.default || m).catch(() => null);

    if (!XLSX) {
      return {
        success: false,
        text: '',
        metadata: { format: 'xlsx' },
        error: 'xlsx package not installed. Run: npm install xlsx',
      };
    }

    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const tables: TableData[] = [];
    const textParts: string[] = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];

      if (jsonData.length > 0) {
        const headers = (jsonData[0] || []).map(String);
        const rows = jsonData.slice(1).map(row => (row || []).map(String));

        tables.push({ headers, rows });

        // Convert to text representation
        textParts.push(`=== Sheet: ${sheetName} ===`);
        textParts.push(headers.join('\t'));
        rows.forEach(row => textParts.push(row.join('\t')));
        textParts.push('');
      }
    }

    const text = textParts.join('\n');

    return {
      success: true,
      text,
      tables,
      metadata: {
        wordCount: text.split(/\s+/).length,
        format: 'xlsx',
      },
    };
  } catch (error) {
    console.error('XLSX extraction error:', error);
    return {
      success: false,
      text: '',
      metadata: { format: 'xlsx' },
      error: `XLSX extraction failed: ${(error as Error).message}`,
    };
  }
}

/**
 * Extract text from any supported document format
 */
export async function extractDocumentText(
  buffer: Buffer,
  filename: string
): Promise<ExtractionResult> {
  const ext = filename.toLowerCase().split('.').pop() || '';

  switch (ext) {
    case 'pdf':
      return extractPdfText(buffer);
    case 'docx':
    case 'doc':
      return extractDocxText(buffer);
    case 'xlsx':
    case 'xls':
      return extractXlsxText(buffer);
    default:
      return {
        success: false,
        text: '',
        metadata: { format: ext },
        error: `Unsupported document format: .${ext}`,
      };
  }
}

/**
 * Check which document extraction packages are available
 */
export async function checkExtractionCapabilities(): Promise<{
  pdf: boolean;
  docx: boolean;
  xlsx: boolean;
}> {
  const [pdfAvailable, docxAvailable, xlsxAvailable] = await Promise.all([
    import('pdf-parse').then(() => true).catch(() => false),
    import('mammoth').then(() => true).catch(() => false),
    import('xlsx').then(() => true).catch(() => false),
  ]);

  return {
    pdf: pdfAvailable,
    docx: docxAvailable,
    xlsx: xlsxAvailable,
  };
}
