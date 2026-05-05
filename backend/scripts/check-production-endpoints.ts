// Comprehensive production endpoint check
const PRODUCTION_API_URL = 'https://accounting-app-ttqe.onrender.com';

async function checkProductionEndpoints() {
  console.log('🔍 Checking all production endpoints...');
  
  try {
    // Test common endpoints
    const endpoints = [
      '/api/health',
      '/api/auth/login', 
      '/api/transactions',
      '/api/transactions/create',
      '/api/transactions/list',
      '/api/roles',
      '/api/cities',
      '/api/clients',
      '/api/users'
    ];
    
    for (const endpoint of endpoints) {
      console.log(`🌐 Testing ${endpoint}...`);
      
      try {
        const response = await fetch(`${PRODUCTION_API_URL}${endpoint}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        console.log(`📊 ${endpoint} status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ ${endpoint} working - data:`, data);
        } else {
          const errorText = await response.text();
          console.log(`❌ ${endpoint} failed:`, errorText);
        }
        
      } catch (error) {
        console.log(`❌ ${endpoint} error:`, error.message);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Test POST to transactions specifically
    console.log('🧪 Testing POST to /api/transactions...');
    
    try {
      const postResponse = await fetch(`${PRODUCTION_API_URL}/api/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: '2026-05-05',
          type: 'OUTWARD',
          amount: 1000,
          centerId: 'test-center',
          receiverName: 'Test Receiver',
          senderName: 'Test Sender',
        }),
      });
      
      console.log(`📊 POST /api/transactions status: ${postResponse.status}`);
      
      if (postResponse.ok) {
        const postData = await postResponse.json();
        console.log('✅ POST /api/transactions working:', postData);
      } else {
        const postError = await postResponse.text();
        console.log('❌ POST /api/transactions failed:', postError);
      }
      
    } catch (postError) {
      console.log('❌ POST /api/transactions error:', postError.message);
    }
    
    console.log('🎉 Production endpoint check completed!');
    console.log('💡 Results will show exactly what endpoints are available');
    
  } catch (error) {
    console.error('❌ Error checking endpoints:', error);
  }
}

// Run the check
checkProductionEndpoints();
