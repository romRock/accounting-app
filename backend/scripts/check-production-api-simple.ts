const https = require('https');

async function checkProductionAPI() {
  console.log('🔍 Checking production API for GET transactions...');
  
  try {
    const options = {
      hostname: 'accounting-app-ttqe.onrender.com',
      port: 443,
      path: '/api/transactions',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'curl/7.68.0'
      }
    };
    
    const req = https.request(options, (res) => {
      console.log('📊 Response status:', res.statusCode);
      console.log('📊 Response headers:', res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('📊 Response body:', data);
        
        if (res.statusCode === 200) {
          console.log('✅ Production API is working!');
          
          try {
            const jsonData = JSON.parse(data);
            console.log('📊 Transaction data:', jsonData);
          } catch (parseError) {
            console.log('⚠️ Could not parse JSON response');
          }
        } else {
          console.log('❌ Production API failed with status:', res.statusCode);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request error:', error.message);
    });
    
    req.end();
    
  } catch (error) {
    console.error('❌ Script error:', error.message);
  }
}

checkProductionAPI();
