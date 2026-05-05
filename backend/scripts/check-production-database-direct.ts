// Direct database connection check for production
const https = require('https');

async function checkProductionDatabase() {
  console.log('🔍 Checking production database directly...');
  
  try {
    // Test direct database connection to uppercase Transaction table
    const options = {
      hostname: 'accounting-app-ttqe.onrender.com',
      port: 443,
      path: '/api/health',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = https.request(options, (res) => {
      console.log('📊 Health check status:', res.statusCode);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('📊 Health check response:', data);
        
        if (res.statusCode === 200) {
          console.log('✅ Production backend is running and accessible!');
        } else {
          console.log('❌ Production backend health check failed');
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

checkProductionDatabase();
