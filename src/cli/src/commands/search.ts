import axios from 'axios';
import { Config } from '../config.js';

export async function searchCommand(
  query: string,
  options: { limit: number },
  config: Config
) {
  console.log(`🔍 Searching: "${query}"\n`);

  try {
    const response = await axios.post(`${config.apiUrl}/api/semantic-search`, {
      query,
    });

    const results = (response.data.results || []).slice(0, options.limit);

    if (results.length === 0) {
      console.log('No results found.');
      return;
    }

    console.log(`Found ${results.length} result(s):\n`);

    results.forEach((result: any, index: number) => {
      console.log(`${index + 1}. ${result.name}`);
      console.log(`   Path: ${result.path}`);
      if (result.analysis?.summary) {
        console.log(`   Summary: ${result.analysis.summary}`);
      }
      if (result.keywords && result.keywords.length > 0) {
        console.log(`   Match: ${result.keywords[0]}`);
      }
      console.log('');
    });
  } catch (error: any) {
    console.error(`❌ Search failed: ${error.message}`);
    process.exit(1);
  }
}

