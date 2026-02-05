import * as vscode from 'vscode';
import { ApiClient } from '../utils/apiClient';

/**
 * Workspace Symbol Provider
 * Enables semantic codebase search via VS Code's symbol search (Ctrl+T)
 */
export class WorkspaceSymbolProvider implements vscode.WorkspaceSymbolProvider {
  constructor(private apiClient: ApiClient) {}

  /**
   * Provide workspace symbols for search
   */
  async provideWorkspaceSymbols(
    query: string,
    token: vscode.CancellationToken
  ): Promise<vscode.SymbolInformation[]> {
    if (!query || query.length < 2) {
      return [];
    }

    try {
      const results = await this.apiClient.search(query);

      return results.map((result, index) => {
        const uri = vscode.Uri.file(result.path);
        return new vscode.SymbolInformation(
          result.name,
          vscode.SymbolKind.File,
          result.path,
          new vscode.Location(uri, new vscode.Position(0, 0))
        );
      });
    } catch (error) {
      console.error('Workspace symbol search failed:', error);
      return [];
    }
  }
}

