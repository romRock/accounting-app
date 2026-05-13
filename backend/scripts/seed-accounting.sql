-- Insert default accounting categories
INSERT INTO "AccountCategory" (id, name, type, description, gst_applicable, tds_applicable, is_active, is_deleted, created_at, updated_at, created_by)
VALUES 
  (gen_random_uuid(), 'Cash', 'INCOME', 'Cash income entries', false, false, true, false, NOW(), NOW(), 'system'),
  (gen_random_uuid(), 'LBL', 'INCOME', 'LBL income entries (Label/Entry/Token)', false, false, true, false, NOW(), NOW(), 'system'),
  (gen_random_uuid(), 'LBL', 'EXPENSE', 'LBL expense entries (Label/Entry/Token)', false, false, true, false, NOW(), NOW(), 'system'),
  (gen_random_uuid(), 'Money Transfer', 'EXPENSE', 'Money transfer expenses', false, false, true, false, NOW(), NOW(), 'system')
ON CONFLICT (name, type) DO NOTHING;

-- Insert sample accounting entries
INSERT INTO "AccountEntry" (id, entry_id, date, category_id, amount, description, payment_method, reference_no, gst_amount, tds_amount, total_amount, type, status, status_time, is_active, is_deleted, branch_id, created_by, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'ACC1', NOW(), (SELECT id FROM "AccountCategory" WHERE name = 'Cash' AND type = 'INCOME' LIMIT 1), 50000, 'Cash payment received from client', 'CASH', NULL, 0, 0, 50000, 'INCOME', 'COMPLETED', NOW(), true, false, NULL, 'system', NOW(), NOW()),
  (gen_random_uuid(), 'ACC2', NOW(), (SELECT id FROM "AccountCategory" WHERE name = 'Money Transfer' AND type = 'EXPENSE' LIMIT 1), 12000, 'Bank transfer charges', 'BANK', NULL, 0, 0, 12000, 'EXPENSE', 'COMPLETED', NOW(), true, false, NULL, 'system', NOW(), NOW()),
  (gen_random_uuid(), 'ACC3', NOW(), (SELECT id FROM "AccountCategory" WHERE name = 'LBL' AND type = 'INCOME' LIMIT 1), 35000, 'LBL transaction income - Token #12345', 'CASH', 'LBL12345', 0, 0, 35000, 'INCOME', 'COMPLETED', NOW(), true, false, NULL, 'system', NOW(), NOW()),
  (gen_random_uuid(), 'ACC4', NOW(), (SELECT id FROM "AccountCategory" WHERE name = 'LBL' AND type = 'EXPENSE' LIMIT 1), 8000, 'LBL transaction expense - Token #12346', 'CASH', 'LBL12346', 0, 0, 8000, 'EXPENSE', 'COMPLETED', NOW(), true, false, NULL, 'system', NOW(), NOW());
