const fs = require('fs');
const path = require('path');

function escapeString(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${str.toString().replace(/'/g, "''")}'`;
}

function escapeBoolean(bool) {
  return bool ? 'true' : 'false';
}

function generateRolesSQL() {
  const roles = JSON.parse(fs.readFileSync(path.join(__dirname, 'export-roles.json'), 'utf8'));
  let sql = '-- Roles\n';
  sql += 'INSERT INTO "roles" (id, name, description, permissions, "isActive", "isDeleted", "createdAt", "updatedAt") VALUES\n';
  
  const values = roles.map(role => {
    return `('${role.id}', ${escapeString(role.name)}, ${escapeString(role.description)}, ${escapeString(role.permissions)}, ${escapeBoolean(role.isActive)}, ${escapeBoolean(role.isDeleted)}, '${role.createdAt}', '${role.updatedAt}')`;
  });
  
  sql += values.join(',\n');
  sql += ';\n\n';
  return sql;
}

function generateCitiesSQL() {
  const cities = JSON.parse(fs.readFileSync(path.join(__dirname, 'export-cities.json'), 'utf8'));
  let sql = '-- Cities\n';
  sql += 'INSERT INTO "cities" (id, name, code, state, address, number, "isActive", "isDeleted", "createdAt", "updatedAt") VALUES\n';
  
  const values = cities.map(city => {
    return `('${city.id}', ${escapeString(city.name)}, ${escapeString(city.code)}, ${escapeString(city.state)}, ${escapeString(city.address)}, ${escapeString(city.number)}, ${escapeBoolean(city.isActive)}, ${escapeBoolean(city.isDeleted)}, '${city.createdAt}', '${city.updatedAt}')`;
  });
  
  sql += values.join(',\n');
  sql += ';\n\n';
  return sql;
}

function generateAccountCategoriesSQL() {
  const categories = JSON.parse(fs.readFileSync(path.join(__dirname, 'export-account-categories.json'), 'utf8'));
  let sql = '-- Account Categories\n';
  sql += 'INSERT INTO "account_categories" (id, name, type, description, "parentId", "gstApplicable", "tdsApplicable", "isActive", "isDeleted", "createdAt", "updatedAt") VALUES\n';
  
  const values = categories.map(cat => {
    return `('${cat.id}', ${escapeString(cat.name)}, ${escapeString(cat.type)}, ${escapeString(cat.description)}, ${escapeString(cat.parentId)}, ${escapeBoolean(cat.gstApplicable)}, ${escapeBoolean(cat.tdsApplicable)}, ${escapeBoolean(cat.isActive)}, ${escapeBoolean(cat.isDeleted)}, '${cat.createdAt}', '${cat.updatedAt}')`;
  });
  
  sql += values.join(',\n');
  sql += ';\n\n';
  return sql;
}

function generateUsersSQL() {
  const users = JSON.parse(fs.readFileSync(path.join(__dirname, 'export-users.json'), 'utf8'));
  let sql = '-- Users\n';
  sql += 'INSERT INTO "users" (id, email, username, password, "firstName", "lastName", phone, "isActive", "isDeleted", "roleId", "branchId", "createdAt", "updatedAt") VALUES\n';
  
  const values = users.map(user => {
    return `('${user.id}', ${escapeString(user.email)}, ${escapeString(user.username)}, ${escapeString(user.password)}, ${escapeString(user.firstName)}, ${escapeString(user.lastName)}, ${escapeString(user.phone)}, ${escapeBoolean(user.isActive)}, ${escapeBoolean(user.isDeleted)}, '${user.roleId}', ${escapeString(user.branchId)}, '${user.createdAt}', '${user.updatedAt}')`;
  });
  
  sql += values.join(',\n');
  sql += ';\n\n';
  return sql;
}

function generateAllSQL() {
  let sql = '-- Data Import SQL for Supabase\n';
  sql += '-- Run this in Supabase SQL Editor\n\n';
  
  sql += generateRolesSQL();
  sql += generateCitiesSQL();
  sql += generateAccountCategoriesSQL();
  sql += generateUsersSQL();
  
  fs.writeFileSync(path.join(__dirname, 'import-data.sql'), sql);
  console.log('✅ SQL file generated: import-data.sql');
}

generateAllSQL();
