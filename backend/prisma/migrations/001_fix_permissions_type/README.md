# Migration: Fix permissions field type

## Problem
The `permissions` field in the `roles` table had a type mismatch between the schema and the production database.

## Solution
This migration safely converts the permissions field to JSON type while preserving all existing data.

## Steps
1. Backup existing permissions data
2. Drop existing permissions column
3. Add permissions column with JSON type
4. Restore data from backup
5. Clean up backup table
6. Set default empty JSON for NULL values
7. Add NOT NULL constraint

## Data Safety
- All existing role permissions are preserved
- No data loss during migration
- Handles NULL values gracefully
