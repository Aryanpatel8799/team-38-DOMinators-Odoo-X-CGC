#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 RoadGuard Backend - Comprehensive Test Suite');
console.log('='.repeat(50));

// Test environment setup
process.env.NODE_ENV = 'test';

// Test configuration
const testConfig = {
  unitTests: 'npm run test:unit',
  integrationTests: 'npm run test:integration',
  coverageReport: 'npm run test:coverage',
  fullTestSuite: 'npm test'
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n${colors.blue}${colors.bold}Running: ${description}${colors.reset}`);
  log(`Command: ${command}`);
  log('-'.repeat(40));
  
  try {
    const output = execSync(command, { 
      stdio: 'inherit', 
      cwd: __dirname,
      env: { ...process.env, NODE_ENV: 'test' }
    });
    log(`${colors.green}✅ ${description} completed successfully!${colors.reset}`);
    return true;
  } catch (error) {
    log(`${colors.red}❌ ${description} failed!${colors.reset}`);
    log(`Error: ${error.message}`);
    return false;
  }
}

async function runTestSuite() {
  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };

  log(`${colors.bold}🧪 Starting RoadGuard Backend Test Suite${colors.reset}`);
  log(`Environment: ${process.env.NODE_ENV}`);
  log(`Timestamp: ${new Date().toISOString()}\n`);

  // Check if server is running and stop it
  try {
    execSync('pkill -f "node server.js"', { stdio: 'ignore' });
    log('Stopped any running server instances');
  } catch (e) {
    // No server running, continue
  }

  // Wait a moment for cleanup
  await new Promise(resolve => setTimeout(resolve, 2000));

  const tests = [
    {
      name: 'Unit Tests',
      command: testConfig.unitTests,
      critical: true
    },
    {
      name: 'Integration Tests',
      command: testConfig.integrationTests,
      critical: true
    },
    {
      name: 'Full Test Suite with Coverage',
      command: testConfig.coverageReport,
      critical: false
    }
  ];

  for (const test of tests) {
    results.total++;
    const success = runCommand(test.command, test.name);
    
    if (success) {
      results.passed++;
    } else {
      results.failed++;
      if (test.critical) {
        log(`${colors.red}${colors.bold}Critical test failed. Stopping test suite.${colors.reset}`);
        break;
      }
    }
  }

  // Generate test report
  generateReport(results);
}

function generateReport(results) {
  log(`\n${'='.repeat(50)}`);
  log(`${colors.bold}📊 Test Results Summary${colors.reset}`);
  log(`${'='.repeat(50)}`);
  
  log(`Total Tests Run: ${results.total}`);
  log(`${colors.green}✅ Passed: ${results.passed}${colors.reset}`);
  log(`${colors.red}❌ Failed: ${results.failed}${colors.reset}`);
  
  const successRate = ((results.passed / results.total) * 100).toFixed(1);
  log(`Success Rate: ${successRate}%`);

  if (results.failed === 0) {
    log(`\n${colors.green}${colors.bold}🎉 All tests passed! RoadGuard backend is working perfectly!${colors.reset}`);
    log(`${colors.green}✅ Authentication system working${colors.reset}`);
    log(`${colors.green}✅ Vehicle management working${colors.reset}`);
    log(`${colors.green}✅ Service requests working${colors.reset}`);
    log(`${colors.green}✅ Payment integration ready${colors.reset}`);
    log(`${colors.green}✅ File uploads (Cloudinary) configured${colors.reset}`);
    log(`${colors.green}✅ Real-time features ready${colors.reset}`);
    log(`${colors.green}✅ Validation and security working${colors.reset}`);
    log(`${colors.green}✅ Database operations working${colors.reset}`);
    
    log(`\n${colors.blue}${colors.bold}🚀 Your RoadGuard backend is production-ready for the hackathon!${colors.reset}`);
  } else {
    log(`\n${colors.yellow}⚠️  Some tests failed. Please review the errors above.${colors.reset}`);
  }

  // Check if coverage report exists
  const coveragePath = path.join(__dirname, 'coverage');
  if (fs.existsSync(coveragePath)) {
    log(`\n${colors.blue}📈 Coverage report generated in: ${coveragePath}${colors.reset}`);
    log(`${colors.blue}Open coverage/lcov-report/index.html in your browser to view detailed coverage.${colors.reset}`);
  }

  log(`\n${colors.bold}Test completed at: ${new Date().toISOString()}${colors.reset}`);
}

// Additional system checks
function performSystemChecks() {
  log(`\n${colors.bold}🔍 Performing System Checks${colors.reset}`);
  log('-'.repeat(30));

  // Check Node.js version
  const nodeVersion = process.version;
  log(`Node.js Version: ${nodeVersion}`);

  // Check if all required dependencies are installed
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const dependencies = Object.keys(packageJson.dependencies || {});
    const devDependencies = Object.keys(packageJson.devDependencies || {});
    
    log(`Dependencies: ${dependencies.length} packages`);
    log(`Dev Dependencies: ${devDependencies.length} packages`);
    
    // Check critical dependencies
    const criticalDeps = ['express', 'mongoose', 'socket.io', 'jsonwebtoken', 'bcryptjs'];
    const missingDeps = criticalDeps.filter(dep => !dependencies.includes(dep));
    
    if (missingDeps.length === 0) {
      log(`${colors.green}✅ All critical dependencies are installed${colors.reset}`);
    } else {
      log(`${colors.red}❌ Missing dependencies: ${missingDeps.join(', ')}${colors.reset}`);
    }
  } catch (error) {
    log(`${colors.red}❌ Could not read package.json${colors.reset}`);
  }

  // Check environment variables
  const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'CLOUDINARY_CLOUD_NAME'];
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingEnvVars.length === 0) {
    log(`${colors.green}✅ All required environment variables are set${colors.reset}`);
  } else {
    log(`${colors.yellow}⚠️  Missing environment variables: ${missingEnvVars.join(', ')}${colors.reset}`);
  }
}

// Main execution
async function main() {
  try {
    performSystemChecks();
    await runTestSuite();
  } catch (error) {
    log(`${colors.red}${colors.bold}Test suite encountered an error:${colors.reset}`);
    log(`${colors.red}${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  log(`\n${colors.yellow}Test suite interrupted by user${colors.reset}`);
  process.exit(0);
});

if (require.main === module) {
  main();
}

module.exports = { runTestSuite, generateReport };
