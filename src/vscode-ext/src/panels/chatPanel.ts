import * as vscode from 'vscode';
import { ApiClient } from '../utils/apiClient';

/**
 * Chat Panel for codebase conversations
 */
export class ChatPanel {
  public static readonly viewType = 'synapseChat';
  private _panel: vscode.WebviewPanel | undefined;
  private _disposables: vscode.Disposable[] = [];

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly apiClient: ApiClient
  ) {}

  /**
   * Show or reveal chat panel
   */
  public show() {
    if (this._panel) {
      this._panel.reveal();
      return;
    }

    this._panel = vscode.window.createWebviewPanel(
      ChatPanel.viewType,
      'Synapse Chat',
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        localResourceRoots: [this._extensionUri],
      }
    );

    this._panel.webview.html = this._getHtmlForWebview();

    // Handle messages from webview
    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'sendMessage':
            await this.handleMessage(message.text);
            break;
        }
      },
      null,
      this._disposables
    );

    this._panel.onDidDispose(() => {
      this._panel = undefined;
    }, null, this._disposables);
  }

  /**
   * Handle chat message
   */
  private async handleMessage(message: string) {
    if (!this._panel) return;

    try {
      // Get current file context
      const activeEditor = vscode.window.activeTextEditor;
      const context = activeEditor
        ? { files: [activeEditor.document.uri.fsPath] }
        : undefined;

      const reply = await this.apiClient.chat(message, context);

      // Send reply to webview
      this._panel.webview.postMessage({
        command: 'receiveMessage',
        reply,
      });
    } catch (error: any) {
      this._panel.webview.postMessage({
        command: 'error',
        message: error.message,
      });
    }
  }

  /**
   * Get HTML for webview
   */
  private _getHtmlForWebview(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Synapse Chat</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        #messages {
            height: calc(100vh - 120px);
            overflow-y: auto;
            margin-bottom: 20px;
        }
        .message {
            margin-bottom: 15px;
            padding: 10px;
            border-radius: 5px;
        }
        .user-message {
            background: var(--vscode-input-background);
            text-align: right;
        }
        .assistant-message {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-input-border);
        }
        #input-container {
            display: flex;
            gap: 10px;
        }
        #message-input {
            flex: 1;
            padding: 10px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 3px;
        }
        button {
            padding: 10px 20px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 3px;
            cursor: pointer;
        }
        button:hover {
            background: var(--vscode-button-hoverBackground);
        }
    </style>
</head>
<body>
    <div id="messages"></div>
    <div id="input-container">
        <input type="text" id="message-input" placeholder="Ask about your codebase...">
        <button id="send-button">Send</button>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const messagesDiv = document.getElementById('messages');
        const input = document.getElementById('message-input');
        const sendButton = document.getElementById('send-button');

        function addMessage(text, isUser) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message ' + (isUser ? 'user-message' : 'assistant-message');
            messageDiv.textContent = text;
            messagesDiv.appendChild(messageDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        sendButton.addEventListener('click', () => {
            const message = input.value.trim();
            if (message) {
                addMessage(message, true);
                input.value = '';
                vscode.postMessage({ command: 'sendMessage', text: message });
            }
        });

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendButton.click();
            }
        });

        window.addEventListener('message', (event) => {
            const message = event.data;
            switch (message.command) {
                case 'receiveMessage':
                    addMessage(message.reply, false);
                    break;
                case 'error':
                    addMessage('Error: ' + message.message, false);
                    break;
            }
        });
    </script>
</body>
</html>`;
  }

  /**
   * Dispose resources
   */
  public dispose() {
    this._panel?.dispose();
    this._disposables.forEach(d => d.dispose());
  }
}

