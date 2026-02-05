import path from 'path';

// Tree-sitter imports - optional, will fail gracefully if not available
let Parser, JavaScript, TypeScript, Python;
let treeSitterAvailable = false;

// Initialize tree-sitter on module load
(async () => {
  try {
    const treeSitterModule = await import('tree-sitter');
    Parser = treeSitterModule.default || treeSitterModule.Parser;
    const jsModule = await import('tree-sitter-javascript');
    JavaScript = jsModule.default || jsModule;
    const tsModule = await import('tree-sitter-typescript');
    TypeScript = tsModule.default || tsModule;
    const pyModule = await import('tree-sitter-python');
    Python = pyModule.default || pyModule;
    treeSitterAvailable = true;
    console.log('✅ Tree-sitter AST parsing enabled');
  } catch (error) {
    console.warn('⚠️ Tree-sitter not available, AST parsing disabled. Install tree-sitter packages to enable.');
    treeSitterAvailable = false;
  }
})();

/**
 * AST Parser Service using Tree-sitter
 * Extracts code structure, relationships, and semantic information
 */
export class ASTParserService {
  constructor() {
    this.parsers = new Map();
    this.initializeParsers();
  }

  /**
   * Initialize language parsers
   */
  initializeParsers() {
    // Check periodically if tree-sitter becomes available (async initialization)
    if (!treeSitterAvailable || !Parser) {
      // Retry initialization after a delay
      setTimeout(() => this.initializeParsers(), 1000);
      return;
    }
    
    try {
      const jsParser = new Parser();
      jsParser.setLanguage(JavaScript);
      this.parsers.set('javascript', jsParser);

      const tsParser = new Parser();
      tsParser.setLanguage(TypeScript);
      this.parsers.set('typescript', tsParser);

      const pyParser = new Parser();
      pyParser.setLanguage(Python);
      this.parsers.set('python', pyParser);
      
      console.log('✅ Tree-sitter parsers initialized');
    } catch (error) {
      console.warn('Tree-sitter parsers initialization failed:', error.message);
    }
  }

  /**
   * Detect language from file path
   */
  detectLanguage(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.py': 'python',
    };
    return languageMap[ext] || null;
  }

  /**
   * Parse file and extract code structure
   */
  async parseFile(filePath, content) {
    if (!treeSitterAvailable) {
      return null;
    }
    
    const language = this.detectLanguage(filePath);
    if (!language || !this.parsers.has(language)) {
      return null;
    }

    try {
      const parser = this.parsers.get(language);
      const tree = parser.parse(content);
      const rootNode = tree.rootNode;

      return this.extractStructure(rootNode, filePath, language);
    } catch (error) {
      console.error(`Error parsing ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Extract code structure from AST
   */
  extractStructure(rootNode, filePath, language) {
    const structure = {
      filePath,
      language,
      functions: [],
      classes: [],
      imports: [],
      exports: [],
      variables: [],
      relationships: [],
    };

    this.traverseAST(rootNode, structure, language);
    return structure;
  }

  /**
   * Traverse AST and extract entities
   */
  traverseAST(node, structure, language) {
    if (!node) return;

    // Extract based on language-specific node types
    if (language === 'javascript' || language === 'typescript') {
      this.extractJavaScriptEntities(node, structure);
    } else if (language === 'python') {
      this.extractPythonEntities(node, structure);
    }

    // Recursively traverse children
    for (const child of node.children) {
      this.traverseAST(child, structure, language);
    }
  }

  /**
   * Extract JavaScript/TypeScript entities
   */
  extractJavaScriptEntities(node, structure) {
    const nodeType = node.type;

    // Function declarations
    if (nodeType === 'function_declaration' || nodeType === 'arrow_function' || nodeType === 'function') {
      const name = this.getNodeName(node);
      if (name) {
        structure.functions.push({
          name,
          startLine: node.startPosition.row + 1,
          endLine: node.endPosition.row + 1,
          parameters: this.extractParameters(node),
        });
      }
    }

    // Class declarations
    if (nodeType === 'class_declaration') {
      const name = this.getNodeName(node);
      if (name) {
        structure.classes.push({
          name,
          startLine: node.startPosition.row + 1,
          endLine: node.endPosition.row + 1,
          methods: this.extractClassMethods(node),
        });
      }
    }

    // Import statements
    if (nodeType === 'import_statement' || nodeType === 'import_declaration') {
      const imports = this.extractImports(node);
      structure.imports.push(...imports);
    }

    // Export statements
    if (nodeType === 'export_statement' || nodeType === 'export_declaration') {
      const exports = this.extractExports(node);
      structure.exports.push(...exports);
    }
  }

  /**
   * Extract Python entities
   */
  extractPythonEntities(node, structure) {
    const nodeType = node.type;

    // Function definitions
    if (nodeType === 'function_definition') {
      const name = this.getNodeName(node);
      if (name) {
        structure.functions.push({
          name,
          startLine: node.startPosition.row + 1,
          endLine: node.endPosition.row + 1,
          parameters: this.extractParameters(node),
        });
      }
    }

    // Class definitions
    if (nodeType === 'class_definition') {
      const name = this.getNodeName(node);
      if (name) {
        structure.classes.push({
          name,
          startLine: node.startPosition.row + 1,
          endLine: node.endPosition.row + 1,
          methods: this.extractClassMethods(node),
        });
      }
    }

    // Import statements
    if (nodeType === 'import_statement' || nodeType === 'import_from_statement') {
      const imports = this.extractImports(node);
      structure.imports.push(...imports);
    }
  }

  /**
   * Get node name
   */
  getNodeName(node) {
    for (const child of node.children) {
      if (child.type === 'identifier' || child.type === 'property_identifier') {
        return child.text;
      }
    }
    return null;
  }

  /**
   * Extract function parameters
   */
  extractParameters(node) {
    const params = [];
    for (const child of node.children) {
      if (child.type === 'formal_parameters' || child.type === 'parameters') {
        for (const param of child.children) {
          if (param.type === 'identifier' || param.type === 'typed_parameter') {
            params.push(param.text);
          }
        }
      }
    }
    return params;
  }

  /**
   * Extract class methods
   */
  extractClassMethods(node) {
    const methods = [];
    for (const child of node.children) {
      if (child.type === 'class_body' || child.type === 'statement_block') {
        for (const method of child.children) {
          if (method.type === 'method_definition' || method.type === 'function_declaration' || method.type === 'function_definition') {
            const name = this.getNodeName(method);
            if (name) {
              methods.push({
                name,
                startLine: method.startPosition.row + 1,
                endLine: method.endPosition.row + 1,
              });
            }
          }
        }
      }
    }
    return methods;
  }

  /**
   * Extract imports
   */
  extractImports(node) {
    const imports = [];
    // Simplified import extraction - can be enhanced
    const importText = node.text;
    const importMatch = importText.match(/import\s+(?:.*?\s+from\s+)?['"]([^'"]+)['"]/);
    if (importMatch) {
      imports.push(importMatch[1]);
    }
    return imports;
  }

  /**
   * Extract exports
   */
  extractExports(node) {
    const exports = [];
    const exportText = node.text;
    // Simplified export extraction
    if (exportText.includes('export')) {
      const name = this.getNodeName(node);
      if (name) {
        exports.push(name);
      }
    }
    return exports;
  }

  /**
   * Build code relationship graph
   */
  buildRelationshipGraph(structures) {
    const graph = {
      nodes: [],
      edges: [],
    };

    structures.forEach((structure, index) => {
      // Add file as node
      graph.nodes.push({
        id: `file-${index}`,
        type: 'file',
        label: path.basename(structure.filePath),
        path: structure.filePath,
      });

      // Add functions/classes as nodes
      structure.functions.forEach((func, funcIndex) => {
        graph.nodes.push({
          id: `func-${index}-${funcIndex}`,
          type: 'function',
          label: func.name,
          file: structure.filePath,
        });
        graph.edges.push({
          from: `file-${index}`,
          to: `func-${index}-${funcIndex}`,
          type: 'contains',
        });
      });

      structure.classes.forEach((cls, clsIndex) => {
        graph.nodes.push({
          id: `class-${index}-${clsIndex}`,
          type: 'class',
          label: cls.name,
          file: structure.filePath,
        });
        graph.edges.push({
          from: `file-${index}`,
          to: `class-${index}-${clsIndex}`,
          type: 'contains',
        });
      });

      // Add import relationships
      structure.imports.forEach((importPath) => {
        // Find if imported file exists in structures
        const importedFile = structures.find(s => s.filePath.includes(importPath));
        if (importedFile) {
          const importedIndex = structures.indexOf(importedFile);
          graph.edges.push({
            from: `file-${index}`,
            to: `file-${importedIndex}`,
            type: 'imports',
          });
        }
      });
    });

    return graph;
  }
}

export const astParser = new ASTParserService();

