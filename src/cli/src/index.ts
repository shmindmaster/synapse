#!/usr/bin/env node

import { Command } from 'commander';
import { indexCommand } from './commands/index.js';
import { searchCommand } from './commands/search.js';
import { chatCommand } from './commands/chat.js';
import { statusCommand } from './commands/status.js';
import { loadConfig } from './config.js';

const program = new Command();

program
  .name('synapse')
  .description('Synapse CLI - Local-first codebase indexing and search')
  .version('0.1.0');

// Load configuration
const config = loadConfig();

// Index command
program
  .command('index')
  .description('Index a directory for semantic search')
  .argument('<directory>', 'Directory path to index')
  .option('-w, --watch', 'Enable file watching for incremental updates', false)
  .action(async (directory, options) => {
    await indexCommand(directory, { watch: options.watch }, config);
  });

// Search command
program
  .command('search')
  .description('Search the indexed codebase')
  .argument('<query>', 'Search query')
  .option('-l, --limit <number>', 'Maximum number of results', '10')
  .action(async (query, options) => {
    await searchCommand(query, { limit: parseInt(options.limit) }, config);
  });

// Chat command
program
  .command('chat')
  .description('Chat with your codebase')
  .argument('<message>', 'Your question or message')
  .action(async (message) => {
    await chatCommand(message, config);
  });

// Status command
program
  .command('status')
  .description('Show indexing status')
  .action(async () => {
    await statusCommand(config);
  });

program.parse();

