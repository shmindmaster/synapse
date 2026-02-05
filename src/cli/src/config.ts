import { readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export interface Config {
  apiUrl: string;
}

const DEFAULT_CONFIG: Config = {
  apiUrl: 'http://localhost:3001',
};

/**
 * Load configuration from file or environment
 */
export function loadConfig(): Config {
  // Try to load from config file
  const configPath = join(homedir(), '.synapse', 'config.json');
  try {
    const configFile = readFileSync(configPath, 'utf-8');
    const fileConfig = JSON.parse(configFile);
    return { ...DEFAULT_CONFIG, ...fileConfig };
  } catch (error) {
    // Config file doesn't exist, use defaults + environment
  }

  // Override with environment variables
  return {
    ...DEFAULT_CONFIG,
    apiUrl: process.env.SYNAPSE_API_URL || DEFAULT_CONFIG.apiUrl,
  };
}

