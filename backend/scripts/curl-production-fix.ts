// Use curl to test production API after database fix
const { execSync } = require('child_process');

console.log('🧪 Testing production API after database fix...');

try {
  // Test GET transactions API
  console.log('📊 Testing GET /api/transactions...');
  const getResult = execSync('curl -s -X GET "https://accounting-app-ttqe.onrender.com/api/transactions?page=1&limit=20&type=OUTWARD" -H "Content-Type: application/json"', {
    encoding: 'utf8',
    stdio: 'inherit'
  });
  
  console.log('📊 GET Response status:', getResult.status);
  console.log('📊 GET Response body:', getResult.stdout);
  
  // Test POST transaction API
  console.log('\n📊 Testing POST /api/transactions...');
  const postResult = execSync('curl -s -X POST "https://accounting-app-ttqe.onrender.com/api/transactions" -H "Content-Type: application/json" -H "Authorization: Bearer test-token" -d \'{"date":"2026-05-05","type":"OUTWARD","amount":1000,"centerId":"test-center","receiverName":"Test Receiver","senderName":"Test Sender"}\'', {
    encoding: 'utf8',
    stdio: 'inherit'
  });
  
  console.log('📊 POST Response status:', postResult.status);
  console.log('📊 POST Response body:', postResult.stdout);
  
  console.log('\n🎉 Production API test completed!');
  
  if (getResult.status === 0 && getResult.stdout.includes('"error"')) {
    console.log('❌ GET API still failing');
  } else {
    console.log('✅ GET API working');
  }
  
  if (postResult.status === 0 && postResult.stdout.includes('"error"')) {
    console.log('❌ POST API still failing');
  } else {
    console.log('✅ POST API working');
  }
  
} catch (error) {
  console.error('❌ Script error:', error.message);
  process.exit(1);
}
