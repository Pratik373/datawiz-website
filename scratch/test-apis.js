const http = require('http');

function post(url, data) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const bodyStr = JSON.stringify(data);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, text: body });
        }
      });
    });
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

async function run() {
  console.log('--- Testing validate-coupon API ---');
  try {
    const r1 = await post('http://localhost:3000/api/validate-coupon', {
      couponCode: 'SAVE100',
      plan: 'pro'
    });
    console.log('Result for SAVE100 on pro:', r1);

    const r2 = await post('http://localhost:3000/api/validate-coupon', {
      couponCode: 'SAVE100',
      plan: 'upgrade'
    });
    console.log('Result for SAVE100 on upgrade:', r2);
  } catch (err) {
    console.error('Error during validate-coupon test:', err.message);
  }

  console.log('\n--- Testing create-order API ---');
  try {
    const r3 = await post('http://localhost:3000/api/create-order', {
      plan: 'pro',
      couponCode: 'SAVE100',
      user_id: 'd9b7f5e3-4f2a-4638-9e1c-a3c0e12d45e6' // Dummy user ID
    });
    console.log('Result for create-order with SAVE100:', r3);
  } catch (err) {
    console.error('Error during create-order test:', err.message);
  }
}

run();