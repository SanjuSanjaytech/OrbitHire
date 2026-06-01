#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const files = [
  ['backend/.env.example', 'backend/.env'],
  ['frontend/.env.local.example', 'frontend/.env.local'],
];

console.log('\n🚀 OrbitHire AI — Setup\n');

files.forEach(([src, dest]) => {
  const srcPath = path.join(__dirname, '..', src);
  const destPath = path.join(__dirname, '..', dest);
  if (!fs.existsSync(destPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`✅ Created ${dest}`);
  } else {
    console.log(`⏭  Skipping ${dest} (already exists)`);
  }
});

console.log('\n📋 Next steps:');
console.log('  1. Edit backend/.env — add your MongoDB URI, JWT secret, Apify token, Anthropic key');
console.log('  2. Edit frontend/.env.local — set NEXT_PUBLIC_API_URL');
console.log('  3. Run: npm run dev\n');
