import * as vscode from 'vscode';
import { SemanticSearchProvider } from './providers/semanticSearchProvider';
import { WorkspaceSymbolProvider } from './providers/workspaceSymbolProvider';
import { ChatPanel } from './panels/chatPanel';
import { IndexingStatusView } from './views/indexingStatusView';
import { ApiClient } from './utils/apiClient';

let semanticSearchProvider: SemanticSearchProvider;
let workspaceSymbolProvider: WorkspaceSymbolProvider;
let chatPanel: ChatPanel;
let indexingStatusView: IndexingStatusView;

/**
 * Extension activation
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('Synapse extension is now active!');

  const config = vscode.workspace.getConfiguration('synapse');
  const apiUrl = config.get<string>('apiUrl', 'http://localhost:3001');
  const apiClient = new ApiClient(apiUrl);

  // Initialize providers
  semanticSearchProvider = new SemanticSearchProvider(apiClient);
  workspaceSymbolProvider = new WorkspaceSymbolProvider(apiClient);
  chatPanel = new ChatPanel(context.extensionUri, apiClient);
  indexingStatusView = new IndexingStatusView(context, apiClient);

  // Register workspace symbol provider
  context.subscriptions.push(
    vscode.languages.registerWorkspaceSymbolProvider(workspaceSymbolProvider)
  );

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('synapse.searchCodebase', async () => {
      const query = await vscode.window.showInputBox({
        prompt: 'Enter your search query',
        placeHolder: 'e.g., "How does authentication work?"',
      });

      if (query) {
        await semanticSearchProvider.search(query);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('synapse.chatWithCodebase', () => {
      chatPanel.show();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('synapse.indexCodebase', async () => {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
      }

      const selectedFolder = await vscode.window.showQuickPick(
        workspaceFolders.map(f => ({ label: f.name, folder: f })),
        { placeHolder: 'Select folder to index' }
      );

      if (selectedFolder) {
        await indexingStatusView.indexWorkspace(selectedFolder.folder);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('synapse.showIndexStatus', () => {
      indexingStatusView.show();
    })
  );

  // Auto-index if enabled
  if (config.get<boolean>('autoIndex', false)) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      indexingStatusView.indexWorkspace(workspaceFolders[0]);
    }
  }

  // Start file watcher if enabled
  if (config.get<boolean>('watchFiles', true)) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    workspaceFolders?.forEach(folder => {
      apiClient.watchDirectory(folder.uri.fsPath).catch(err => {
        console.error('Failed to start file watcher:', err);
      });
    });
  }

  // Update status bar
  updateStatusBar(context, apiClient);
}

/**
 * Update status bar with index status
 */
async function updateStatusBar(context: vscode.ExtensionContext, apiClient: ApiClient) {
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = 'synapse.showIndexStatus';
  context.subscriptions.push(statusBarItem);

  const updateStatus = async () => {
    try {
      const status = await apiClient.getIndexStatus();
      if (status.hasIndex) {
        statusBarItem.text = `$(search) Synapse: ${status.count} indexed`;
        statusBarItem.tooltip = `Synapse has indexed ${status.count} files`;
        statusBarItem.show();
      } else {
        statusBarItem.text = `$(search) Synapse: Not indexed`;
        statusBarItem.tooltip = 'Click to index your codebase';
        statusBarItem.show();
      }
    } catch (error) {
      statusBarItem.text = `$(search) Synapse: Offline`;
      statusBarItem.tooltip = 'Synapse backend is not available';
      statusBarItem.show();
    }
  };

  // Update immediately and then every 30 seconds
  await updateStatus();
  setInterval(updateStatus, 30000);
}

/**
 * Extension deactivation
 */
export function deactivate() {
  chatPanel?.dispose();
  indexingStatusView?.dispose();
}

