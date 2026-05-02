#!/usr/bin/env tsx

/**
 * Production Clients Seeding Script
 * 
 * This script safely seeds clients (Party) data to the production database.
 * It uses upsert logic to prevent duplicates and can be safely run multiple times.
 * 
 * Usage:
 * - npm run db:seed:clients:production
 * - Or directly: tsx scripts/seed-clients-production.ts
 */

import { PrismaClient } from '@prisma/client';

// Sample clients data - same as local mock data
const clients = [
  { name: 'Rajesh Kumar', phone: '9876543210', cityCode: 'CGR', address: 'Shop No. 15, C.G. Road' },
  { name: 'Amit Patel', phone: '9876543211', cityCode: 'RAT', address: 'Gala No. 8, Ratanpole Market' },
  { name: 'Vijay Shah', phone: '9876543212', cityCode: 'BAP', address: 'Unit 102, Bapunagar Complex' },
  { name: 'Sanjay Mehta', phone: '9876543213', cityCode: 'BOP', address: 'Shop 45, Bopal Plaza' },
  { name: 'Nitin Joshi', phone: '9876543214', cityCode: 'GOT', address: 'Office 12, Gota Commercial' },
  { name: 'Manoj Singh', phone: '9876543215', cityCode: 'GUR', address: 'Shop 3, Gurukul Center' },
  { name: 'Rakesh Gupta', phone: '9876543216', cityCode: 'KAL', address: 'Unit 7, Kalupur Market' },
  { name: 'Anil Sharma', phone: '9876543217', cityCode: 'MAD', address: 'Shop 22, Madhupura Bazaar' },
  { name: 'Deepak Verma', phone: '9876543218', cityCode: 'NAR', address: 'Gala 15, Naroda Industrial' },
  { name: 'Pankaj Agarwal', phone: '9876543219', cityCode: 'NA1', address: 'Shop 8, Narol Highway' },
  { name: 'Suresh Chauhan', phone: '9876543220', cityCode: 'ODH', address: 'Unit 5, Odhav Complex' },
  { name: 'Mahesh Kumar', phone: '9876543221', cityCode: 'ASH', address: 'Shop 18, Ashram Road' },
  { name: 'Rohit Patel', phone: '9876543222', cityCode: 'RAK', address: 'Office 9, Rakhiyal Plaza' },
  { name: 'Karan Shah', phone: '9876543223', cityCode: 'CHA', address: 'Shop 11, Changodar Market' },
  { name: 'Ajay Kumar', phone: '9876543224', cityCode: 'SAT', address: 'Unit 6, Satellite Center' }
];

const BATCH_SIZE = 10;

interface ClientStats {
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
}

const prisma = new PrismaClient();

async function seedClients() {
  console.log('==========================================');
  console.log('    PRODUCTION CLIENTS SEEDING STARTED    ');
  console.log('==========================================');
  
  const stats: ClientStats = {
    total: clients.length,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: 0
  };

  console.log(`\nProcessing ${stats.total} clients in batches of ${BATCH_SIZE}...`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

  try {
    // First, verify all cities exist
    console.log('\nVerifying cities exist...');
    const existingCities = await prisma.city.findMany({
      where: { isActive: true, isDeleted: false },
      select: { code: true, id: true, name: true }
    });
    
    const cityMap = new Map(existingCities.map(city => [city.code, city.id]));
    console.log(`Found ${existingCities.length} active cities in database`);

    // Process clients in batches
    for (let i = 0; i < clients.length; i += BATCH_SIZE) {
      const batch = clients.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(clients.length / BATCH_SIZE);
      
      console.log(`\nProcessing batch ${batchNumber}/${totalBatches} (${batch.length} clients)...`);

      for (const client of batch) {
        try {
          const cityId = cityMap.get(client.cityCode);
          
          if (!cityId) {
            console.error(`  ! ERROR: City code '${client.cityCode}' not found for client '${client.name}'`);
            stats.errors++;
            continue;
          }

          // Check if client already exists (by phone number as unique identifier)
          const existingClient = await prisma.party.findFirst({
            where: { 
              phone: client.phone,
              isActive: true,
              isDeleted: false 
            }
          });

          let result;
          if (existingClient) {
            // Update existing client
            result = await prisma.party.update({
              where: { id: existingClient.id },
              data: {
                name: client.name,
                phone: client.phone,
                address: client.address,
                cityId: cityId,
                updatedAt: new Date(),
              }
            });
            stats.updated++;
            console.log(`  ~ UPDATED: ${client.name} (${client.phone})`);
          } else {
            // Create new client
            result = await prisma.party.create({
              data: {
                name: client.name,
                phone: client.phone,
                address: client.address,
                cityId: cityId,
                isActive: true,
                isDeleted: false,
              }
            });
            stats.inserted++;
            console.log(`  + INSERTED: ${client.name} (${client.phone})`);
          }

        } catch (error) {
          stats.errors++;
          console.error(`  ! ERROR: ${client.name} (${client.phone}) - ${error}`);
          
          // Continue processing other clients even if one fails
          continue;
        }
      }

      // Add small delay between batches to prevent DB overload
      if (i + BATCH_SIZE < clients.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Final statistics
    console.log('\n==========================================');
    console.log('              SEEDING COMPLETE             ');
    console.log('==========================================');
    console.log(`Total processed: ${stats.total}`);
    console.log(`Inserted: ${stats.inserted}`);
    console.log(`Updated: ${stats.updated}`);
    console.log(`Skipped: ${stats.skipped}`);
    console.log(`Errors: ${stats.errors}`);
    console.log('==========================================');

    if (stats.errors > 0) {
      console.warn(`\nWarning: ${stats.errors} clients failed to process. Check logs above.`);
    }

    if (stats.inserted > 0 || stats.updated > 0) {
      console.log(`\nSuccess: ${stats.inserted + stats.updated} clients successfully processed.`);
    } else {
      console.log('\nInfo: All clients were already up to date.');
    }

    // Verify final count
    const finalCount = await prisma.party.count({
      where: { isActive: true, isDeleted: false }
    });
    console.log(`\nFinal database count: ${finalCount} active clients`);

  } catch (error) {
    console.error('\nFATAL ERROR during seeding:', error);
    throw error;
  }
}

// Run the seeding function
seedClients()
  .then(() => {
    console.log('\nClients seeding completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nClients seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
