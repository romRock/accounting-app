-- Migration: Fix permissions field type in roles table
-- This migration safely converts permissions field to JSON type while preserving data

-- Step 1: Create a temporary backup of existing permissions data
CREATE TABLE IF NOT EXISTS roles_permissions_backup AS 
SELECT id, permissions FROM roles WHERE permissions IS NOT NULL;

-- Step 2: Drop the existing permissions column (data is backed up)
ALTER TABLE roles DROP COLUMN IF EXISTS permissions;

-- Step 3: Add the permissions column back with JSON type
ALTER TABLE roles ADD COLUMN permissions JSON;

-- Step 4: Restore data from backup, converting to JSON format
UPDATE roles 
SET permissions = (SELECT permissions::json FROM roles_permissions_backup WHERE roles_permissions_backup.id = roles.id)
WHERE id IN (SELECT id FROM roles_permissions_backup);

-- Step 5: Clean up the backup table
DROP TABLE IF EXISTS roles_permissions_backup;

-- Step 6: Update any NULL permissions to default empty JSON object
UPDATE roles 
SET permissions = '{}'::json 
WHERE permissions IS NULL;

-- Step 7: Add constraint to ensure permissions is not null
ALTER TABLE roles ALTER COLUMN permissions SET NOT NULL;
