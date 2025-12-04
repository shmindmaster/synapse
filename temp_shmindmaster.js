import * as https from 'https';

const token = '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';
const username = 'shmindmaster';

const options = {
  hostname: 'api.github.com',
  path: `/users/${username}/repos`,
  headers: {
    'Authorization': `token ${token}`,
    'User-Agent': 'Node.js'
  }
};

https.get(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const repos = JSON.parse(data);
      if (Array.isArray(repos)) {
        repos.forEach(repo => console.log(repo.name));
      } else {
        console.log('No repos or error:', data);
      }
    } catch (e) {
      console.error('Parse error:', e);
    }
  });
}).on('error', (err) => console.error('Request error:', err));
