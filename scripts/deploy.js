#!/usr/bin/env node
/**
 * Deploy PrimeTickets to Digital Ocean droplet via SSH.
 * Uses the petals_do key from ~/.ssh/
 */
const { Client } = require('./node_modules/ssh2');
const fs = require('fs');
const path = require('path');
const os = require('os');

const HOST = process.env.DEPLOY_HOST || '188.166.155.26';
const USER = process.env.DEPLOY_USER || 'root';
const PASSWORD = process.env.DEPLOY_PASSWORD;
const APP_DIR = '/var/www/primetickets';

if (!PASSWORD) {
  console.error('Error: set DEPLOY_PASSWORD environment variable before deploying.');
  console.error('  Example: $env:DEPLOY_PASSWORD="yourpassword"; node scripts/deploy.js');
  process.exit(1);
}

const COMMANDS = [
  `cd ${APP_DIR}`,
  'git stash',
  'git pull origin master',
  'npm install',
  'npm install --prefix backend',
  'VITE_GOOGLE_CLIENT_ID=204776161734-9rps1vulqt0o979mldhl1arf3nrv6gtl.apps.googleusercontent.com npm run build',
  'pm2 restart primetickets',
].join(' && ');

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH connected. Running deploy...\n');
  conn.exec(COMMANDS, { pty: true }, (err, stream) => {
    if (err) { console.error('Exec error:', err); conn.end(); return; }

    stream.on('close', (code) => {
      console.log(`\nDeploy finished with exit code ${code}`);
      conn.end();
    });

    stream.stdout.on('data', (d) => process.stdout.write(d));
    stream.stderr.on('data', (d) => process.stderr.write(d));
  });
});

conn.on('error', (err) => {
  console.error('Connection error:', err.message);
  process.exit(1);
});

conn.connect({
  host: HOST,
  port: 22,
  username: USER,
  password: PASSWORD,
});
