import http from 'http';

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/health',
  method: 'GET',
};

const req = http.request(options, (res) => {
  console.log(`Test 1 - Health Check: Status ${res.statusCode}`);
  res.on('data', (d) => {
    process.stdout.write(d);
  });
  res.on('end', () => {
    console.log('\n✓ Backend is running and responding!');
    process.exit(0);
  });
});

req.on('error', (error) => {
  console.error('✗ Backend is NOT running:', error.message);
  process.exit(1);
});

req.end();
