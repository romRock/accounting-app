#!/usr/bin/env tsx

/**
 * Live Client Seeding Script
 * 
 * This script seeds the live database with the same client data
 * that exists in the local database.
 */

const LIVE_API_URL = 'https://accounting-app-ttqe.onrender.com';

// Real clients data from local database - same structure as working local
const clients = [
  { name: 'BHEDA BHAI', mobileNumber: '9099916132', city: 'AHMEDABAD', notes: null },
  { name: 'NAYAN BHAI', mobileNumber: '9915528280', city: 'RAJKOT', notes: null },
  { name: 'PM 5 MADHURAM', mobileNumber: '9099967152', city: 'JND', notes: null },
  { name: 'PM 4 ZANZARDA ROAD', mobileNumber: '9099916352', city: 'JUNAGADH', notes: null },
  { name: 'PM 3 YARD', mobileNumber: '8780670096', city: 'JUNAGADH', notes: null }
];

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
      console.log('✅ Authentication successful');
      return result.token;
    } else {
      throw new Error('Failed to authenticate');
    }
  } catch (error) {
    console.error('❌ Authentication failed:', error);
    return null;
  }
}

async function seedLiveClients() {
  console.log('=== SEEDING LIVE CLIENTS DATABASE ===');
  console.log(`Target: ${LIVE_API_URL}`);
  console.log(`Clients to seed: ${clients.length}`);
  
  // Get authentication token
  const token = await getAuthToken();
  if (!token) {
    console.log('❌ Cannot proceed without authentication token');
    return;
  }
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const client of clients) {
    try {
      console.log(`\n🔄 Adding client: ${client.name} (${client.mobileNumber})`);
      
      const response = await fetch(`${LIVE_API_URL}/api/clients/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: client.name,
          mobileNumber: client.mobileNumber,
          city: client.city,
          notes: client.notes || ''
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Successfully added: ${client.name}`);
        successCount++;
      } else {
        const error = await response.json();
        console.log(`❌ Failed to add ${client.name}:`, error.message || error);
        errorCount++;
      }
    } catch (error) {
      console.error(`❌ Error adding ${client.name}:`, error);
      errorCount++;
    }
  }
  
  console.log('\n=== SEEDING COMPLETE ===');
  console.log(`✅ Successfully added: ${successCount} clients`);
  console.log(`❌ Failed to add: ${errorCount} clients`);
  console.log(`📊 Total clients processed: ${clients.length}`);
  
  if (successCount > 0) {
    console.log('\n🎉 Live database seeded successfully!');
    console.log('🔗 Check: https://accounting-app-ttqe.onrender.com/api/clients');
  }
}

// Run the seeding
seedLiveClients();
