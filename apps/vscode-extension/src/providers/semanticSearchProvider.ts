import * as vscode from 'vscode';
import { ApiClient } from '../utils/apiClient';

/**
 * Semantic Search Provider
 * Provides codebase search results in VS Code
 */
export class SemanticSearchProvider {
  constructor(private apiClient: ApiClient) {}

  /**
   * Perform semantic search and display results
   */
  async search(query: string) {
    try {
      const results = await this.apiClient.search(query);

      if (results.length === 0) {
        vscode.window.showInformationMessage('No results found');
        return;
      }

      // Show results in quick pick
      const items = results.map((result, index) => ({
        label: `$(file) ${result.name}`,
        description: result.path,
        detail: result.analysis?.summary || '',
        result,
      }));

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: `Found ${results.length} results`,
      });

      if (selected) {
        // Open file and highlight
        await this.openFile(selected.result.path);
      }
    } catch (error: any) {
      vscode.window.showErrorMessage(`Search failed: ${error.message}`);
    }
  }

  /**
   * Open file in editor
   */
  private async openFile(filePath: string) {
    try {
      const uri = vscode.Uri.file(filePath);
      const document = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(document);
    } catch (error: any) {
      vscode.window.showErrorMessage(`Failed to open file: ${error.message}`);
    }
  }
}

