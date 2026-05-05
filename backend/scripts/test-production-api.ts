// Test production API directly to identify the issue
const PRODUCTION_API_URL = 'https://accounting-app-ttqe.onrender.com';

async function testProductionAPI() {
  console.log('🌐 Testing production API directly...');
  
  try {
    // Test 1: Check API health
    console.log('🏥 Testing API health...');
    const healthResponse = await fetch(`${PRODUCTION_API_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (healthResponse.ok) {
      console.log('✅ API health check passed');
    } else {
      console.log('❌ API health check failed:', healthResponse.status);
    }
    
    // Test 2: Test transaction creation via API
    console.log('🧪 Testing transaction creation via API...');
    
    const transactionData = {
      date: '2026-05-05',
      time: '17:49:00',
      centerId: 'cmosli3a00000u81n7a8k6h',
      amount: 1000,
      amountType: 'CASH',
      commission: 10,
      bookingCommission: 4,
      centerCommission: 6,
      autoCommission: true,
      receiverName: 'Test Receiver',
      senderName: 'Test Sender',
      type: 'OUTWARD',
      branchId: 'cmosli3a00000u81n7a8k6h',
    };
    
    // First, try without auth to see if it's an auth issue
    console.log('📋 Testing without authentication...');
    const noAuthResponse = await fetch(`${PRODUCTION_API_URL}/api/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transactionData),
    });
    
    console.log('📊 No auth response:', noAuthResponse.status);
    const noAuthData = await noAuthResponse.json();
    console.log('📊 No auth response body:', noAuthData);
    
    // Test 3: Try with auth token
    console.log('📋 Testing with authentication...');
    
    // Get auth token first
    const loginResponse = await fetch(`${PRODUCTION_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@admin.com',
        password: 'admin123',
      }),
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      const token = loginData.accessToken;
      console.log('✅ Got auth token');
      
      const authResponse = await fetch(`${PRODUCTION_API_URL}/api/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(transactionData),
      });
      
      console.log('📊 Auth response status:', authResponse.status);
      const authData = await authResponse.json();
      console.log('📊 Auth response body:', authData);
      
      if (authResponse.ok) {
        console.log('✅ Transaction creation successful with auth!');
      } else {
        console.log('❌ Transaction creation failed with auth');
        console.log('🔍 Error details:', authData);
      }
      
    } else {
      console.log('❌ Failed to get auth token');
    }
    
    // Test 4: Check what tables API thinks it's using
    console.log('🔍 Checking API table mapping...');
    const tablesResponse = await fetch(`${PRODUCTION_API_URL}/api/debug/tables`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (tablesResponse.ok) {
      const tablesData = await tablesResponse.json();
      console.log('📊 API table info:', tablesData);
    }
    
    console.log('🎉 Production API testing completed!');
    
  } catch (error) {
    console.error('❌ Error testing production API:', error);
  }
}

// Run the test
testProductionAPI();
