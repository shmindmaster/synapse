import axios from 'axios';
import { Config } from '../config.js';

export async function statusCommand(config: Config) {
  console.log('📊 Synapse Index Status\n');

  try {
    const [indexStatus, watcherStatus] = await Promise.all([
      axios.get(`${config.apiUrl}/api/index-status`),
      axios.get(`${config.apiUrl}/api/watcher-status`).catch(() => ({ data: null })),
    ]);

    const status = indexStatus.data;
    const watcher = watcherStatus.data;

    console.log(`Indexed Files: ${status.count}`);
    console.log(`Status: ${status.hasIndex ? '✅ Indexed' : '❌ Not indexed'}\n`);

    if (watcher) {
      console.log('File Watchers:');
      if (watcher.watching && watcher.watching.length > 0) {
        watcher.watching.forEach((path: string) => {
          console.log(`  👀 ${path}`);
        });
      } else {
        console.log('  No active watchers');
      }
      console.log(`Queue Size: ${watcher.queueSize}`);
      console.log(`Processing: ${watcher.isProcessing ? 'Yes' : 'No'}\n`);
    }

    if (!status.hasIndex) {
      console.log('💡 Tip: Run "synapse index <directory>" to index your codebase');
    }
  } catch (error: any) {
    console.error(`❌ Failed to get status: ${error.message}`);
    console.error(`   Make sure Synapse backend is running at ${config.apiUrl}`);
    process.exit(1);
  }
}

