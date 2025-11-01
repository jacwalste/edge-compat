import { Project, SourceFile, SyntaxKind, Node, ImportDeclaration, CallExpression, VariableDeclaration, Identifier, StringLiteral, Expression, NewExpression, PropertyAccessExpression } from 'ts-morph';

/**
 * AST context with ts-morph source file
 */
export interface ASTContext {
  sourceFile: SourceFile;
  filePath: string;
  fileContent: string;
}

/**
 * Create an AST context from file content
 */
export function createASTContext(filePath: string, fileContent: string): ASTContext | null {
  try {
    const project = new Project({
      useInMemoryFileSystem: true,
      skipLoadingLibFiles: true,
      compilerOptions: {
        allowJs: true,
        skipLibCheck: true,
      },
    });

    // Determine language based on extension
    const isTypeScript = /\.(ts|tsx|mts|cts)$/.test(filePath);
    const isJavaScript = /\.(js|jsx|mjs|cjs)$/.test(filePath);

    if (!isTypeScript && !isJavaScript) {
      return null;
    }

    const sourceFile = project.createSourceFile(filePath, fileContent);

    return {
      sourceFile,
      filePath,
      fileContent,
    };
  } catch (error) {
    // If AST parsing fails, return null (fallback to regex)
    return null;
  }
}

/**
 * Get all import declarations from AST
 */
export function getImportDeclarations(ast: ASTContext): ImportDeclaration[] {
  return ast.sourceFile.getImportDeclarations();
}

/**
 * Get all dynamic imports (import() expressions)
 */
export function getDynamicImports(ast: ASTContext): CallExpression[] {
  const dynamicImports: CallExpression[] = [];

  ast.sourceFile.forEachDescendant((node) => {
    if (Node.isCallExpression(node)) {
      const expression = node.getExpression();
      
      // Check if it's an import() call
      if (Node.isIdentifier(expression) && expression.getText() === 'import') {
        dynamicImports.push(node);
      }
    }
  });

  return dynamicImports;
}

/**
 * Get all require() calls
 */
export function getRequireCalls(ast: ASTContext): CallExpression[] {
  const requireCalls: CallExpression[] = [];

  ast.sourceFile.forEachDescendant((node) => {
    if (Node.isCallExpression(node)) {
      const expression = node.getExpression();
      
      // Check if it's a require() call
      if (Node.isIdentifier(expression) && expression.getText() === 'require') {
        requireCalls.push(node);
      }
    }
  });

  return requireCalls;
}

/**
 * Get module name from import declaration
 */
export function getModuleNameFromImport(importDecl: ImportDeclaration): string | null {
  const moduleSpecifier = importDecl.getModuleSpecifier();
  
  if (Node.isStringLiteral(moduleSpecifier)) {
    return moduleSpecifier.getLiteralValue();
  }
  
  return null;
}

/**
 * Get module name from require() call
 */
export function getModuleNameFromRequire(requireCall: CallExpression): string | null {
  const args = requireCall.getArguments();
  
  if (args.length > 0) {
    const firstArg = args[0];
    
    if (Node.isStringLiteral(firstArg)) {
      return firstArg.getLiteralValue();
    }
  }
  
  return null;
}

/**
 * Get module name from dynamic import
 */
export function getModuleNameFromDynamicImport(dynamicImport: CallExpression): string | null {
  const args = dynamicImport.getArguments();
  
  if (args.length > 0) {
    const firstArg = args[0];
    
    if (Node.isStringLiteral(firstArg)) {
      return firstArg.getLiteralValue();
    }
  }
  
  return null;
}

/**
 * Get location information from a Node
 */
export function getNodeLocation(node: Node, filePath: string): {
  file: string;
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
} {
  const start = node.getStart();
  const end = node.getEnd();
  
  const sourceFile = node.getSourceFile();
  const lineAndColumn = sourceFile.getLineAndColumnAtPos(start);
  const endLineAndColumn = sourceFile.getLineAndColumnAtPos(end);
  
  return {
    file: filePath,
    line: lineAndColumn.line,
    column: lineAndColumn.column,
    endLine: endLineAndColumn.line,
    endColumn: endLineAndColumn.column,
  };
}

/**
 * Get all call expressions matching a pattern
 */
export function getCallExpressions(
  ast: ASTContext,
  matcher: (node: CallExpression) => boolean,
): CallExpression[] {
  const matches: CallExpression[] = [];

  ast.sourceFile.forEachDescendant((node) => {
    if (Node.isCallExpression(node) && matcher(node)) {
      matches.push(node);
    }
  });

  return matches;
}

/**
 * Check if a module name matches a forbidden pattern
 */
export function isForbiddenModule(moduleName: string, forbiddenModule: string): boolean {
  // Handle exact matches
  if (moduleName === forbiddenModule || moduleName === `node:${forbiddenModule}`) {
    return true;
  }

  // Handle submodules (e.g., 'fs/promises', 'net/stream')
  if (moduleName.startsWith(`${forbiddenModule}/`) || 
      moduleName.startsWith(`node:${forbiddenModule}/`)) {
    return true;
  }

  return false;
}

/**
 * Find all eval() and new Function() calls
 */
export function findEvalCalls(ast: ASTContext): CallExpression[] {
  const evalCalls: CallExpression[] = [];

  ast.sourceFile.forEachDescendant((node) => {
    if (Node.isCallExpression(node)) {
      const expression = node.getExpression();
      
      // Check for eval()
      if (Node.isIdentifier(expression) && expression.getText() === 'eval') {
        evalCalls.push(node);
      }
    }
    
    // Check for new Function()
    if (Node.isNewExpression(node)) {
      const expression = node.getExpression();
      
      if (Node.isIdentifier(expression) && expression.getText() === 'Function') {
        // Convert to CallExpression-like structure for compatibility
        evalCalls.push(node as unknown as CallExpression);
      }
    }
  });

  return evalCalls;
}

/**
 * Find setTimeout/setInterval calls with large delays
 */
export function findLongTimers(ast: ASTContext, maxDelay: number = 30000): CallExpression[] {
  const longTimers: CallExpression[] = [];

  ast.sourceFile.forEachDescendant((node) => {
    if (Node.isCallExpression(node)) {
      const expression = node.getExpression();
      
      if (Node.isIdentifier(expression)) {
        const name = expression.getText();
        
        if (name === 'setTimeout' || name === 'setInterval') {
          const args = node.getArguments();
          
          if (args.length >= 2) {
            const delayArg = args[1];
            
            // Try to extract numeric value
            if (Node.isNumericLiteral(delayArg)) {
              const delay = parseInt(delayArg.getLiteralValue(), 10);
              
              if (delay > maxDelay) {
                longTimers.push(node);
              }
            }
          }
        }
      }
    }
  });

  return longTimers;
}

/**
 * Find WebAssembly synchronous instantiation
 */
export function findWasmSyncCalls(ast: ASTContext): CallExpression[] {
  const wasmCalls: CallExpression[] = [];

  ast.sourceFile.forEachDescendant((node) => {
    if (Node.isNewExpression(node)) {
      const expression = node.getExpression();
      
      if (Node.isPropertyAccessExpression(expression)) {
        const object = expression.getExpression();
        const name = expression.getName();
        
        if (Node.isIdentifier(object) && object.getText() === 'WebAssembly') {
          if (name === 'Instance' || name === 'Module') {
            wasmCalls.push(node as unknown as CallExpression);
          }
        }
      }
    }
  });

  return wasmCalls;
}

