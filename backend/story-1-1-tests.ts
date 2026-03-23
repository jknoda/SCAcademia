import http from 'http';

const API_URL = 'http://localhost:3000';
let academyId: string;
let accessToken: string;

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

const makeRequest = (method: string, path: string, body?: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    const options = {
      hostname: url.hostname,
      port: 3000,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (accessToken) {
      (options.headers as any)['Authorization'] = `Bearer ${accessToken}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: data ? JSON.parse(data) : {},
            headers: res.headers,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            body: data,
            headers: res.headers,
          });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const test = async (name: string, fn: () => Promise<boolean>) => {
  try {
    const passed = await fn();
    results.push({ name, passed });
    console.log(`${passed ? '✓' : '✗'} ${name}`);
  } catch (error: any) {
    results.push({ name, passed: false, error: error.message });
    console.log(`✗ ${name} - ${error.message}`);
  }
};

const main = async () => {
  console.log('🧪 Running Story 1-1 Acceptance Tests\n');

  // Reset in-memory database to ensure clean state
  await makeRequest('POST', '/api/auth/test/reset');

  // AC1: Check setup needed
  await test('AC1: Check setup needed (needsSetup = true)', async () => {
    const res = await makeRequest('GET', '/api/auth/setup/init');
    return res.status === 200 && res.body.needsSetup === true;
  });

  // AC2: Create Academy
  await test('AC2: Create Academy with valid data', async () => {
    const res = await makeRequest('POST', '/api/auth/academies', {
      name: 'Academia Judo Rei',
      location: 'São Paulo, SP',
      email: 'admin@judobrei.com',
      phone: '11999999999',
    });

    if (res.status === 201 && res.body.academyId) {
      academyId = res.body.academyId;
      return true;
    }
    throw new Error(`Status ${res.status}: ${JSON.stringify(res.body)}`);
  });

  // AC2: Validate academy already exists
  await test('AC2: Academy creation prevents duplicates', async () => {
    const res = await makeRequest('POST', '/api/auth/academies', {
      name: 'Another Academy',
      location: 'Rio, RJ',
      email: 'admin@another.com',
      phone: '21999999999',
    });
    return res.status === 409;
  });

  // AC3: Admin Registration
  await test('AC3: Register first admin with strong password', async () => {
    const res = await makeRequest('POST', `/api/auth/academies/${academyId}/init-admin`, {
      email: 'admin@judobrei.com',
      password: 'Abc@1234',
      fullName: 'João Silva',
    });

    return res.status === 201 && res.body.userId;
  });

  // AC4: Password Validation - Weak password
  await test('AC4: Password validation rejects weak password', async () => {
    const res = await makeRequest('POST', `/api/auth/academies/${academyId}/init-admin`, {
      email: 'another@judobrei.com',
      password: 'weak',
      fullName: 'Maria Silva',
    });

    return res.status === 400 && res.body.details && res.body.details.length > 0;
  });

  // AC6: JWT Authentication - Login
  await test('AC6: Login with correct credentials returns JWT tokens', async () => {
    const res = await makeRequest('POST', '/api/auth/login', {
      email: 'admin@judobrei.com',
      password: 'Abc@1234',
    });

    if (res.status === 200 && res.body.accessToken && res.body.user) {
      accessToken = res.body.accessToken;
      return true;
    }
    throw new Error(`Status ${res.status}: ${JSON.stringify(res.body)}`);
  });

  // AC6: Login with wrong password
  await test('AC6: Login rejects wrong password', async () => {
    const res = await makeRequest('POST', '/api/auth/login', {
      email: 'admin@judobrei.com',
      password: 'WrongPassword123!',
    });

    return res.status === 401;
  });

  // AC7: Get Current User (Protected endpoint)
  await test('AC7: Get current user profile with valid token', async () => {
    const res = await makeRequest('GET', '/api/auth/users/@me');
    return res.status === 200 && res.body.id && res.body.academy && res.body.academy.name;
  });

  // AC7: Get Current User without token
  await test('AC7: Protected endpoint rejects missing token', async () => {
    const savedToken = accessToken;
    accessToken = ''; // Clear token
    const res = await makeRequest('GET', '/api/auth/users/@me');
    accessToken = savedToken; // Restore token
    return res.status === 401;
  });

  console.log('\n📊 Test Summary:');
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  console.log(
    `${passed}/${total} tests passed (${Math.floor((passed / total) * 100)}%)`
  );

  if (passed === total) {
    console.log('✅ All Acceptance Criteria PASSED!');
    process.exit(0);
  } else {
    console.log('⚠️ Some tests failed');
    process.exit(1);
  }
};

main().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
