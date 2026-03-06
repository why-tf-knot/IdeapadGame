#!/usr/bin/env node

/**
 * Pre-flight Check Script for BuildPaper Backend
 * Verifies system requirements before starting the server
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkMark() {
  return `${colors.green}✓${colors.reset}`;
}

function crossMark() {
  return `${colors.red}✗${colors.reset}`;
}

function warningMark() {
  return `${colors.yellow}⚠${colors.reset}`;
}

async function checkNodeVersion() {
  log('\n📦 Checking Node.js version...', colors.cyan);
  
  try {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
    
    if (majorVersion >= 18) {
      log(`${checkMark()} Node.js ${nodeVersion} detected (requirement: 18+)`, colors.green);
      return true;
    } else {
      log(`${crossMark()} Node.js ${nodeVersion} detected (requirement: 18+)`, colors.red);
      log(`   Please upgrade Node.js to version 18 or higher`, colors.yellow);
      return false;
    }
  } catch (error) {
    log(`${crossMark()} Failed to check Node.js version`, colors.red);
    return false;
  }
}

async function checkDependencies() {
  log('\n📚 Checking dependencies...', colors.cyan);
  
  const packageJsonPath = path.join(__dirname, 'package.json');
  const nodeModulesPath = path.join(__dirname, 'node_modules');
  
  if (!fs.existsSync(packageJsonPath)) {
    log(`${crossMark()} package.json not found`, colors.red);
    return false;
  }
  
  if (!fs.existsSync(nodeModulesPath)) {
    log(`${crossMark()} node_modules not found. Run: npm install`, colors.red);
    return false;
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const requiredDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };
    
    let missingDeps = [];
    
    for (const dep in requiredDeps) {
      const depPath = path.join(nodeModulesPath, dep);
      if (!fs.existsSync(depPath)) {
        missingDeps.push(dep);
      }
    }
    
    if (missingDeps.length > 0) {
      log(`${crossMark()} Missing dependencies:`, colors.red);
      missingDeps.forEach(dep => log(`   - ${dep}`, colors.yellow));
      log(`   Run: npm install`, colors.yellow);
      return false;
    }
    
    log(`${checkMark()} All dependencies installed`, colors.green);
    return true;
  } catch (error) {
    log(`${crossMark()} Error checking dependencies: ${error.message}`, colors.red);
    return false;
  }
}

async function checkEnvFile() {
  log('\n🔐 Checking environment configuration...', colors.cyan);
  
  const envPath = path.join(__dirname, '.env');
  const envExamplePath = path.join(__dirname, '.env.example');
  
  if (!fs.existsSync(envPath)) {
    log(`${warningMark()} .env file not found`, colors.yellow);
    
    if (fs.existsSync(envExamplePath)) {
      log(`   Copy .env.example to .env: cp .env.example .env`, colors.yellow);
    } else {
      log(`   Create a .env file with required variables`, colors.yellow);
    }
    return false;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = ['MONGODB_URI', 'JWT_SECRET'];
  const missingVars = [];
  
  requiredVars.forEach(varName => {
    if (!envContent.includes(varName)) {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    log(`${warningMark()} Missing environment variables in .env:`, colors.yellow);
    missingVars.forEach(varName => log(`   - ${varName}`, colors.yellow));
    return false;
  }
  
  log(`${checkMark()} .env file configured`, colors.green);
  return true;
}

async function checkMongoDBConnection() {
  log('\n🗄️  Checking MongoDB accessibility...', colors.cyan);
  
  try {
    // Load environment variables
    require('dotenv').config();
    
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/buildpaper';
    
    // Try to connect using mongoose
    const mongoose = require('mongoose');
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
    
    log(`${checkMark()} MongoDB is accessible at ${mongoUri}`, colors.green);
    await mongoose.disconnect();
    return true;
  } catch (error) {
    log(`${crossMark()} Cannot connect to MongoDB`, colors.red);
    log(`   Error: ${error.message}`, colors.yellow);
    log(`   Make sure MongoDB is running or check your MONGODB_URI`, colors.yellow);
    return false;
  }
}

async function checkPort() {
  log('\n🔌 Checking port availability...', colors.cyan);
  
  try {
    require('dotenv').config();
    const port = process.env.PORT || 3000;
    
    // Try to check if port is in use (Unix-like systems)
    try {
      const output = execSync(`lsof -ti:${port} 2>&1`, { encoding: 'utf8' });
      if (output.trim()) {
        log(`${warningMark()} Port ${port} is already in use`, colors.yellow);
        log(`   Kill the process: lsof -ti:${port} | xargs kill`, colors.yellow);
        log(`   Or change PORT in .env file`, colors.yellow);
        return false;
      }
    } catch (error) {
      // lsof command not found or port is free
    }
    
    log(`${checkMark()} Port ${port} is available`, colors.green);
    return true;
  } catch (error) {
    log(`${warningMark()} Could not check port status`, colors.yellow);
    return true; // Non-critical
  }
}

async function checkTypescript() {
  log('\n📘 Checking TypeScript configuration...', colors.cyan);
  
  const tsconfigPath = path.join(__dirname, 'tsconfig.json');
  
  if (!fs.existsSync(tsconfigPath)) {
    log(`${crossMark()} tsconfig.json not found`, colors.red);
    return false;
  }
  
  log(`${checkMark()} TypeScript configuration found`, colors.green);
  return true;
}

async function runChecks() {
  log('\n' + '='.repeat(60), colors.blue);
  log('  BuildPaper Backend - Pre-flight Check', colors.blue);
  log('='.repeat(60), colors.blue);
  
  const results = {
    nodeVersion: await checkNodeVersion(),
    dependencies: await checkDependencies(),
    envFile: await checkEnvFile(),
    typescript: await checkTypescript(),
    port: await checkPort(),
    mongodb: false
  };
  
  // Only check MongoDB if other checks pass
  if (results.nodeVersion && results.dependencies && results.envFile) {
    results.mongodb = await checkMongoDBConnection();
  }
  
  log('\n' + '='.repeat(60), colors.blue);
  log('  Summary', colors.blue);
  log('='.repeat(60), colors.blue);
  
  const allPassed = Object.values(results).every(r => r === true);
  
  if (allPassed) {
    log(`\n${checkMark()} All checks passed! You're ready to start the server.`, colors.green);
    log(`\nRun: npm run dev`, colors.cyan);
  } else {
    log(`\n${crossMark()} Some checks failed. Please fix the issues above.`, colors.red);
    
    if (!results.dependencies) {
      log(`\n💡 Quick fix: npm install`, colors.cyan);
    }
    if (!results.envFile) {
      log(`💡 Quick fix: cp .env.example .env`, colors.cyan);
    }
  }
  
  log('');
  
  process.exit(allPassed ? 0 : 1);
}

// Run the checks
runChecks().catch(error => {
  log(`\n${crossMark()} Unexpected error: ${error.message}`, colors.red);
  process.exit(1);
});
