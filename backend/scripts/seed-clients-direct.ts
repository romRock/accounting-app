#!/usr/bin/env tsx

/**
 * Direct Client Seeding Script
 * 
 * This script seeds client data directly using the API endpoints
 * when the seeding endpoint is not available.
 */

const clients = [
  { name: 'PM 3 YARD', phone: '9099916309', address: 'YARD ', city: 'JND95V' },
  { name: 'PM 4 ZANZARDA', phone: '9099967152', address: 'JND', city: 'JND95V' },
  { name: 'MADHURAM', phone: '9099912345', address: 'JND', city: 'JND95V' },
  { name: 'NAYAN BHAI', phone: '8787874040', address: '', city: 'RAJDXL' },
  { name: 'BHEDA BHAI', phone: '9090901212', address: '', city: 'JND95V' }
];

const LIVE_API_URL = 'https://accounting-app-ttqe.onrender.com';

async function getAuthToken() {
  try {
    const response = await fetch(`${LIVE_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@mail.com',
        password: 'admin@1234'
      }),
    });

    if (response.ok) {
      const result = await response.json();
      return result.token; // Get the access token
    } else {
      throw new Error('Failed to authenticate');
    }
  } catch (error) {
    console.error('❌ Authentication failed:', error);
    return null;
  }
}

async function seedClientsDirectly() {
  console.log('=== SEEDING CLIENTS DIRECTLY TO LIVE API ===');
  
  // Get authentication token
  const token = await getAuthToken();
  if (!token) {
    console.log('❌ Cannot proceed without authentication token');
    return;
  }
  
  console.log('✅ Authentication successful');
  
  for (const client of clients) {
    try {
      console.log(`Adding client: ${client.name}`);
      
      const response = await fetch(`${LIVE_API_URL}/api/master/parties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(client),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Successfully added: ${client.name}`);
      } else {
        const error = await response.json();
        console.log(`❌ Failed to add ${client.name}:`, error.message || error);
      }
    } catch (error) {
      console.error(`❌ Error adding ${client.name}:`, error);
    }
  }
  
  console.log('=== SEEDING COMPLETE ===');
}

// Run the seeding
seedClientsDirectly();
