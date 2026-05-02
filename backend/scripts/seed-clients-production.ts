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

// Real clients data from local database
const clients = [
  { name: 'PM 3 YARD', phone: '9099916309', cityCode: 'JND95V', address: 'YARD ' },
  { name: 'PM 4 ZANZARDA', phone: '9099967152', cityCode: 'JND95V', address: 'JND' },
  { name: 'MADHURAM', phone: '9099912345', cityCode: 'JND95V', address: 'JND' },
  { name: 'NAYAN BHAI', phone: '8787874040', cityCode: 'RAJDXL', address: '' },
  { name: 'BHEDA BHAI', phone: '9090901212', cityCode: 'JND95V', address: '' }
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
