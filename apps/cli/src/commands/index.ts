import axios from 'axios';
import { Config } from '../config.js';

export async function indexCommand(
  directory: string,
  options: { watch: boolean },
  config: Config
) {
  console.log(`📦 Indexing directory: ${directory}`);
  console.log(`   Watching: ${options.watch ? 'enabled' : 'disabled'}`);

  try {
    const response = await axios.post(
      `${config.apiUrl}/api/index-files`,
      {
        baseDirectories: [{ path: directory }],
        enableWatching: options.watch,
      },
      {
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.event?.target) {
            const data = progressEvent.event.target.responseText;
            const lines = data.split('\n').filter(Boolean);
            const lastLine = lines[lines.length - 1];
            if (lastLine) {
              try {
                const status = JSON.parse(lastLine);
                if (status.status === 'indexing') {
                  process.stdout.write(
                    `\r   Progress: ${status.filesProcessed}/${status.totalFiles} files`
                  );
                } else if (status.status === 'complete') {
                  console.log(`\n✅ Indexing complete! ${status.count} chunks indexed.`);
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        },
        responseType: 'stream',
      }
    );

    if (options.watch) {
      await axios.post(`${config.apiUrl}/api/watch-directory`, {
        directoryPath: directory,
      });
      console.log('👀 File watcher started');
    }
  } catch (error: any) {
    console.error(`❌ Indexing failed: ${error.message}`);
    process.exit(1);
  }
}

