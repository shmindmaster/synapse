/**
 * Mock file content definitions for testing
 * These match the test plan requirements (MF-1, MF-2, MF-3)
 */

export const MOCK_FILES = {
  'Q3_Budget_Contract.txt': {
    content: 'Project Delta revenue target is $50,000. Client contract includes a penalty clause.',
    description: 'MF-1: Contains financial and contract information',
  },
  'Vacation_Policy.txt': {
    content: 'Maximum allowed vacation time is 15 business days per year.',
    description: 'MF-2: Contains HR policy information',
  },
  'Legacy_Code_Snippet.txt': {
    content: 'This is legacy code, do not modify the main loop. PII: user_id=12345.',
    description: 'MF-3: Contains PII and should trigger High sensitivity',
  },
} as const;

export type MockFileName = keyof typeof MOCK_FILES;

