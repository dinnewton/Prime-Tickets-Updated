#!/usr/bin/env node
/**
 * Create an admin account, or reset its password if the email exists.
 * Prints a generated password once. Stop the app first — it keeps
 * data.json in memory and would overwrite this change on its next save:
 *
 *   pm2 stop primetickets
 *   node backend/scripts/create-admin.js you@example.com "Your Name"
 *   pm2 start primetickets
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const DATA_FILE = path.join(__dirname, '..', 'db', 'data.json');
const [email, name = 'Admin'] = process.argv.slice(2);

if (!email || !email.includes('@')) {
  console.error('Usage: node backend/scripts/create-admin.js EMAIL ["Name"]');
  process.exit(1);
}
if (!fs.existsSync(DATA_FILE)) {
  console.error(`No data file at ${DATA_FILE}. Start the app once so it creates one.`);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const password = crypto.randomBytes(12).toString('base64url');
const hash = bcrypt.hashSync(password, 10);

let user = data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
if (user) {
  Object.assign(user, { password: hash, role: 'admin', status: 'active' });
} else {
  user = {
    id: uuidv4(),
    name,
    email,
    password: hash,
    role: 'admin',
    avatar: null,
    joinedAt: new Date().toISOString().split('T')[0],
    status: 'active',
  };
  data.users.push(user);
}

fs.writeFileSync(DATA_FILE + '.tmp', JSON.stringify(data, null, 2));
fs.renameSync(DATA_FILE + '.tmp', DATA_FILE);

console.log(`Admin ready: ${user.email}`);
console.log(`Password:    ${password}`);
console.log('Save this password now — it is not stored anywhere in plain text.');
