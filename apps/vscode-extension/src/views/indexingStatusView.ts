import * as vscode from 'vscode';
import { ApiClient } from '../utils/apiClient';

/**
 * Indexing Status View
 * Shows indexed files and indexing progress
 */
export class IndexingStatusView {
  private _treeView: vscode.TreeView<IndexedFileItem>;
  private _treeDataProvider: IndexedFilesProvider;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly apiClient: ApiClient
  ) {
    this._treeDataProvider = new IndexedFilesProvider(apiClient);
    this._treeView = vscode.window.createTreeView('synapseIndexedFiles', {
      treeDataProvider: this._treeDataProvider,
    });

    context.subscriptions.push(this._treeView);

    // Refresh every 30 seconds
    setInterval(() => {
      this._treeDataProvider.refresh();
    }, 30000);
  }

  /**
   * Show the view
   */
  public show() {
    // Refresh the tree view to show it
    this._treeDataProvider.refresh();
    // Focus the view
    vscode.commands.executeCommand('synapseIndexedFiles.focus');
  }

  /**
   * Index workspace
   */
  public async indexWorkspace(workspaceFolder: vscode.WorkspaceFolder) {
    const progressOptions: vscode.ProgressOptions = {
      location: vscode.ProgressLocation.Notification,
      title: 'Indexing codebase...',
      cancellable: false,
    };

    await vscode.window.withProgress(progressOptions, async (progress) => {
      try {
        progress.report({ increment: 0, message: 'Starting indexing...' });
        await this.apiClient.indexWorkspace(workspaceFolder.uri.fsPath, true);
        progress.report({ increment: 100, message: 'Indexing complete!' });
        
        vscode.window.showInformationMessage('Codebase indexed successfully!');
        this._treeDataProvider.refresh();
      } catch (error: any) {
        vscode.window.showErrorMessage(`Indexing failed: ${error.message}`);
      }
    });
  }

  /**
   * Dispose resources
   */
  public dispose() {
    this._treeView.dispose();
  }
}

/**
 * Tree data provider for indexed files
 */
class IndexedFilesProvider implements vscode.TreeDataProvider<IndexedFileItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<IndexedFileItem | undefined> = new vscode.EventEmitter<IndexedFileItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<IndexedFileItem | undefined> = this._onDidChangeTreeData.event;

  constructor(private apiClient: ApiClient) {}

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: IndexedFileItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: IndexedFileItem): Promise<IndexedFileItem[]> {
    if (element) {
      // Return children if needed
      return [];
    }

    try {
      const status = await this.apiClient.getIndexStatus();
      if (!status.hasIndex) {
        return [new IndexedFileItem('No files indexed yet', vscode.TreeItemCollapsibleState.None)];
      }

      // Get indexed files summary
      // For now, return a simple status item
      return [
        new IndexedFileItem(
          `${status.count} files indexed`,
          vscode.TreeItemCollapsibleState.None
        ),
      ];
    } catch (error) {
      return [new IndexedFileItem('Error loading index status', vscode.TreeItemCollapsibleState.None)];
    }
  }
}

/**
 * Tree item for indexed files
 */
class IndexedFileItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.tooltip = label;
    this.contextValue = 'indexedFile';
  }
}

