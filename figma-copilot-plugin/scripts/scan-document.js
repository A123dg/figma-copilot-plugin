const http = require('http');

const req = http.request(
  { hostname: '127.0.0.1', port: 3000, path: '/scan', method: 'POST' },
  (res) => {
    let body = '';
    res.on('data', (chunk) => (body += chunk));
    res.on('end', () => {
      try {
        console.log(JSON.stringify(JSON.parse(body), null, 2));
      } catch {
        console.log(body);
      }
      process.exit(res.statusCode === 200 ? 0 : 1);
    });
  }
);

req.on('error', (err) => {
  console.error('Request failed:', err.message);
  process.exit(1);
});

req.end();