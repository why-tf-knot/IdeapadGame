#!/usr/bin/env node

/**
 * Pre-flight Check Script for BuildPaper Backend
 * Verifies the environment is ready to run the server
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n🔍 BuildPaper Backend - Pre-flight Check\n');

let hasErrors = false;
let hasWarnings = false;

// Check 1: Node.js version
console.log('1️⃣  Checking Node.js version...');
try {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion >= 18) {
    console.log(`   ✅ Node.js ${nodeVersion} (OK)\n`);
  } else {
    console.log(`   ⚠️  Node.js ${nodeVersion} (Recommended: 18+)\n`);
    hasWarnings = true;
  }
} catch (error) {
  console.log(`   ❌ Error checking Node.js: ${error.message}\n`);
  hasErrors = true;
}

// Check 2: package.json exists
console.log('2️⃣  Checking package.json...');
const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  console.log('   ✅ package.json found\n');
} else {
  console.log('   ❌ package.json not found\n');
  hasErrors = true;
}

// Check 3: node_modules directory (dependencies installed)
console.log('3️⃣  Checking dependencies...');
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  console.log('   ✅ node_modules found (dependencies installed)\n');
  
  // Check for key dependencies
  const requiredDeps = ['express', 'mongoose', 'dotenv', 'cors', 'jsonwebtoken'];
  const missingDeps = [];
  
  for (const dep of requiredDeps) {
    const depPath = path.join(nodeModulesPath, dep);
    if (!fs.existsSync(depPath)) {
      missingDeps.push(dep);
    }
  }
  
  if (missingDeps.length > 0) {
    console.log(`   ⚠️  Missing dependencies: ${missingDeps.join(', ')}`);
    console.log('   💡 Run: npm install\n');
    hasWarnings = true;
  }
} else {
  console.log('   ⚠️  node_modules not found');
  console.log('   💡 Run: npm install\n');
  hasWarnings = true;
}

// Check 4: .env file
console.log('4️⃣  Checking .env configuration...');
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

if (fs.existsSync(envPath)) {
  console.log('   ✅ .env file found\n');
  
  // Parse .env and check for required variables
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const requiredVars = ['MONGODB_URI', 'JWT_SECRET', 'PORT'];
    const missingVars = [];
    
    for (const varName of requiredVars) {
      if (!envContent.includes(varName + '=')) {
        missingVars.push(varName);
      }
    }
    
    if (missingVars.length > 0) {
      console.log(`   ⚠️  Missing environment variables: ${missingVars.join(', ')}\n`);
      hasWarnings = true;
    }
  } catch (error) {
    console.log(`   ⚠️  Could not read .env file: ${error.message}\n`);
    hasWarnings = true;
  }
} else {
  console.log('   ⚠️  .env file not found');
  if (fs.existsSync(envExamplePath)) {
    console.log('   💡 Run: cp .env.example .env\n');
  } else {
    console.log('   💡 Create .env file with MONGODB_URI, JWT_SECRET, and PORT\n');
  }
  hasWarnings = true;
}

// Check 5: TypeScript configuration
console.log('5️⃣  Checking TypeScript setup...');
const tsconfigPath = path.join(__dirname, 'tsconfig.json');
if (fs.existsSync(tsconfigPath)) {
  console.log('   ✅ tsconfig.json found\n');
} else {
  console.log('   ⚠️  tsconfig.json not found\n');
  hasWarnings = true;
}

// Check 6: Source files
console.log('6️⃣  Checking source files...');
const serverPath = path.join(__dirname, 'src', 'server.ts');
if (fs.existsSync(serverPath)) {
  console.log('   ✅ src/server.ts found\n');
} else {
  console.log('   ❌ src/server.ts not found\n');
  hasErrors = true;
}

// Check 7: MongoDB connectivity (optional check)
console.log('7️⃣  Checking MongoDB...');
try {
  // Try to check if MongoDB is installed (not running, just available)
  const mongoOutput = execSync('mongod --version 2>&1 || mongo --version 2>&1 || mongosh --version 2>&1', { 
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  if (mongoOutput) {
    console.log('   ✅ MongoDB CLI found');
    console.log('   💡 Make sure MongoDB server is running\n');
  }
} catch (error) {
  console.log('   ⚠️  MongoDB CLI not found in PATH');
  console.log('   💡 Install MongoDB or use MongoDB Atlas (cloud)\n');
  hasWarnings = true;
}

// Summary
console.log('=' .repeat(50));
if (hasErrors) {
  console.log('\n❌ Pre-flight check FAILED');
  console.log('   Please fix the errors above before starting the server.\n');
  process.exit(1);
} else if (hasWarnings) {
  console.log('\n⚠️  Pre-flight check completed with warnings');
  console.log('   Review the warnings above. The server may still work.\n');
  process.exit(0);
} else {
  console.log('\n✅ Pre-flight check PASSED');
  console.log('   Your environment is ready!\n');
  console.log('🚀 Start the server with: npm run dev\n');
  process.exit(0);
}
