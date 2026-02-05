import axios from 'axios';
import { createInterface } from 'readline';
import { Config } from '../config.js';

export async function chatCommand(message: string, config: Config) {
  console.log(`💬 Chatting with codebase...\n`);

  try {
    const response = await axios.post(`${config.apiUrl}/api/chat`, {
      message,
    });

    console.log(`🤖 ${response.data.reply}\n`);

    // Interactive mode
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const askQuestion = () => {
      rl.question('You: ', async (question) => {
        if (question.toLowerCase() === 'exit' || question.toLowerCase() === 'quit') {
          rl.close();
          return;
        }

        try {
          const response = await axios.post(`${config.apiUrl}/api/chat`, {
            message: question,
          });
          console.log(`\n🤖 ${response.data.reply}\n`);
          askQuestion();
        } catch (error: any) {
          console.error(`❌ Error: ${error.message}\n`);
          askQuestion();
        }
      });
    };

    askQuestion();
  } catch (error: any) {
    console.error(`❌ Chat failed: ${error.message}`);
    process.exit(1);
  }
}

