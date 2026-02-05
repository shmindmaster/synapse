import axios from 'axios';

/**
 * API Client for Synapse backend
 */
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  /**
   * Get index status
   */
  async getIndexStatus(): Promise<{ hasIndex: boolean; count: number }> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/index-status`);
      return response.data;
    } catch (error) {
      console.error('Failed to get index status:', error);
      return { hasIndex: false, count: 0 };
    }
  }

  /**
   * Search codebase
   */
  async search(query: string): Promise<any[]> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/semantic-search`, { query });
      return response.data.results || [];
    } catch (error) {
      console.error('Search failed:', error);
      throw error;
    }
  }

  /**
   * Chat with codebase
   */
  async chat(message: string, context?: { files?: string[] }): Promise<string> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/chat`, {
        message,
        context,
      });
      return response.data.reply || '';
    } catch (error) {
      console.error('Chat failed:', error);
      throw error;
    }
  }

  /**
   * Index workspace
   */
  async indexWorkspace(workspacePath: string, enableWatching = true): Promise<void> {
    try {
      await axios.post(`${this.baseUrl}/api/index-files`, {
        baseDirectories: [{ path: workspacePath }],
        enableWatching,
      });
    } catch (error) {
      console.error('Indexing failed:', error);
      throw error;
    }
  }

  /**
   * Watch directory for changes
   */
  async watchDirectory(directoryPath: string): Promise<void> {
    try {
      await axios.post(`${this.baseUrl}/api/watch-directory`, {
        directoryPath,
      });
    } catch (error) {
      console.error('Failed to watch directory:', error);
      throw error;
    }
  }

  /**
   * Get watcher status
   */
  async getWatcherStatus(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/watcher-status`);
      return response.data;
    } catch (error) {
      console.error('Failed to get watcher status:', error);
      return { watching: [], queueSize: 0, isProcessing: false };
    }
  }
}

