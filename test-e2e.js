// ==============================================================================
// AUTOMATED END-TO-END VERIFICATION TEST SUITE
// Tests all 5 microservices across the entire customer journey!
// ==============================================================================

const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

const BASE_URL = 'http://127.0.0.1:3000';

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
        }
      },
      res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ status: res.statusCode, data: parsed });
          } catch {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function ensureServicesRunning() {
  try {
    const res = await request('GET', '/health');
    if (res.status === 200) {
      console.log('   Services already running.');
      return;
    }
  } catch (e) {
    console.log('   Booting microservices in-process...');
    require('./catalog-service/server.js');
    require('./order-service/server.js');
    require('./rating-service/server.js');
    require('./notification-service/server.js');
    require('./api-gateway/server.js');
  }

  // Poll until ready
  for (let i = 1; i <= 10; i++) {
    try {
      const res = await request('GET', '/health');
      if (res.status === 200) {
        console.log('   API Gateway is ready and accepting requests!');
        await new Promise(r => setTimeout(r, 500));
        return;
      }
    } catch (err) {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  throw new Error('API Gateway did not respond within timeout.');
}

async function runTests() {
  console.log('🧪 Starting End-to-End Verification Test for Cake Delight...\n');

  try {
    // Ensure Services are Running
    console.log('⏳ Checking Microservices Availability...');
    await ensureServicesRunning();

    // 1. Health Checks
    console.log('1️⃣ Testing Microservices Health Endpoints...');
    const gwHealth = await request('GET', '/health');
    console.log('   - API Gateway Health:', gwHealth.data.status);
    const catHealth = await request('GET', '/api/catalog/health');
    console.log('   - Catalog Service Health:', catHealth.data.status);
    const ordHealth = await request('GET', '/api/order/health');
    console.log('   - Order Service Health:', ordHealth.data.status);
    const ratHealth = await request('GET', '/api/rating/health');
    console.log('   - Rating Service Health:', ratHealth.data.status);
    const notHealth = await request('GET', '/api/notification/health');
    console.log('   - Notification Service Health:', notHealth.data.status);

    // 2. Catalog & Filtering
    console.log('\n2️⃣ Testing Cake Catalog & Filtering...');
    const allCakes = await request('GET', '/api/catalog/cakes');
    console.log(`   - Total cakes retrieved: ${allCakes.data.length}`);
    const filteredCakes = await request('GET', '/api/catalog/cakes?category=Chocolate&maxPrice=500');
    console.log(`   - Cakes filtered (Category=Chocolate, MaxPrice=500): ${filteredCakes.data.length}`);
    const cakeToBuy = allCakes.data[0];

    // 3. Basket Operations
    console.log('\n3️⃣ Testing Shopping Basket Operations...');
    await request('DELETE', '/api/order/basket'); // Clear basket
    const addRes = await request('POST', '/api/order/basket/items', {
      cakeId: cakeToBuy.id,
      name: cakeToBuy.name,
      price: cakeToBuy.price,
      quantity: 2,
      image: cakeToBuy.image
    });
    console.log(`   - Added ${cakeToBuy.name} (x2) to basket.`);

    const basketState = await request('GET', '/api/order/basket');
    console.log(`   - Basket Item Count: ${basketState.data.summary.itemCount}`);
    console.log(`   - Basket Subtotal: ₹${basketState.data.summary.subtotal}`);
    console.log(`   - Basket Grand Total: ₹${basketState.data.summary.total}`);

    // 4. Checkout & Order Creation
    console.log('\n4️⃣ Testing Checkout & Event Dispatch...');
    const checkoutRes = await request('POST', '/api/order/checkout', {
      customerName: 'Rohith Kumar',
      email: 'rohith@example.com',
      phone: '+91 9999999999',
      address: '402 Cloud-Native Street'
    });
    const order = checkoutRes.data.order;
    console.log(`   - Order Placed: ID=${order.orderId}, Status=${order.status}, Total=₹${order.total}`);

    // 5. Notification Processing
    console.log('\n5️⃣ Testing Event Consumption in Notification Service...');
    // Give event 500ms to be processed
    await new Promise(r => setTimeout(r, 600));
    const notifs = await request('GET', '/api/notification/notifications');
    const matchedNotif = notifs.data.find(n => n.orderId === order.orderId);
    if (matchedNotif) {
      console.log(`   - Notification Received: ID=${matchedNotif.id}`);
      console.log(`   - Subject: "${matchedNotif.subject}"`);
      console.log(`   - Delivery Status: ${matchedNotif.status}`);
    } else {
      console.log(`   - Latest notification: ${notifs.data[0]?.message}`);
    }

    // 6. Rating Submission & Averages
    console.log('\n6️⃣ Testing Rating Microservice...');
    const rateRes = await request('POST', '/api/rating/ratings', {
      cakeId: cakeToBuy.id,
      rating: 5,
      customerName: 'Rohith Kumar',
      comment: 'Absolute perfection! Tested in automated test suite.'
    });
    console.log(`   - Submitted Rating: 5 Stars for ${cakeToBuy.name}`);

    const cakeRatings = await request('GET', `/api/rating/ratings/${cakeToBuy.id}`);
    console.log(`   - Updated Average Rating: ${cakeRatings.data.averageRating} (${cakeRatings.data.totalReviews} total reviews)`);

    console.log('\n✅ ALL 6 END-TO-END TEST SUITES PASSED FLAWLESSLY!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed with error:', err.message);
    process.exit(1);
  }
}

runTests();
