import textract from 'textract';
import path from 'path';

/**
 * Normalize file path for consistent storage
 */
export function normalizePath(filePath) {
  return path.normalize(filePath).replace(/\\/g, '/');
}

/**
 * Extract text content from various file types
 */
export async function extractText(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  // For text files, read directly
  if (['.txt', '.md', '.js', '.ts', '.jsx', '.tsx', '.json', '.py', '.java', '.cpp', '.c', '.h', '.cs', '.go', '.rs', '.rb', '.php', '.swift', '.kt', '.scala', '.sh', '.yaml', '.yml', '.xml', '.html', '.css', '.scss', '.less', '.sql', '.r', '.m', '.pl', '.lua', '.vim', '.clj', '.hs', '.elm', '.ex', '.exs', '.ml', '.fs', '.vb', '.dart', '.pas', '.asm'].includes(ext)) {
    const { promises: fs } = await import('fs');
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      return '';
    }
  }
  
  // For other files, use textract
  return new Promise((resolve, reject) => {
    textract.fromFileWithPath(filePath, (error, text) => {
      if (error) {
        resolve('');
      } else {
        resolve(text || '');
      }
    });
  });
}

/**
 * Chunk text into overlapping segments for better embedding
 */
export function chunkText(text, chunkSize = 1000, overlap = 200) {
  if (!text || text.length === 0) return [];
  
  const chunks = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.substring(start, end).trim();
    
    if (chunk.length > 50) { // Only add meaningful chunks
      chunks.push(chunk);
    }
    
    start += chunkSize - overlap; // Overlap for context
  }
  
  return chunks;
}

