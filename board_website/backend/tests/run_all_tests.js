/**
 * Master Test Aggregator Runner
 * Automatically discovers and sequentially executes all unit, integration,
 * security, and regression test suites in the tests/ directory.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

async function runMasterTestSuite() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 JOB TRACKER BACKEND: UNIFIED TEST SUITE RUNNER');
  console.log('='.repeat(70));

  const testsDir = __dirname;
  const testFiles = fs.readdirSync(testsDir)
    .filter(f => f.startsWith('test_') && f.endsWith('.js'))
    .sort();

  console.log(`Discovered ${testFiles.length} test suites in ${testsDir}\n`);

  const results = [];
  const suiteStartTime = Date.now();

  for (let i = 0; i < testFiles.length; i++) {
    const file = testFiles[i];
    const filePath = path.join(testsDir, file);
    const testNum = `[${String(i + 1).padStart(2, '0')}/${testFiles.length}]`;

    process.stdout.write(`⏳ ${testNum} Running ${file} ... `);
    const startTime = Date.now();

    const result = await new Promise((resolve) => {
      const child = spawn(process.execPath, [filePath], {
        cwd: path.resolve(__dirname, '../'),
        env: {
          ...process.env,
          NODE_ENV: 'test',
          TURSO_DATABASE_URL: '' // Force local offline mode
        },
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', chunk => { stdout += chunk; });
      child.stderr.on('data', chunk => { stderr += chunk; });

      // 30-second timeout per test suite to prevent hangs
      const timeout = setTimeout(() => {
        child.kill('SIGKILL');
        resolve({
          file,
          passed: false,
          exitCode: -1,
          duration: Date.now() - startTime,
          output: stdout + '\n' + stderr + '\n[TIMEOUT] Test execution exceeded 30 seconds.'
        });
      }, 30000);

      child.on('close', (code) => {
        clearTimeout(timeout);
        resolve({
          file,
          passed: code === 0,
          exitCode: code,
          duration: Date.now() - startTime,
          output: stdout + '\n' + stderr
        });
      });
    });

    results.push(result);

    if (result.passed) {
      console.log(`✅ PASSED (${result.duration}ms)`);
    } else {
      console.log(`❌ FAILED (exit code: ${result.exitCode}, ${result.duration}ms)`);
    }
  }

  const totalDuration = ((Date.now() - suiteStartTime) / 1000).toFixed(2);
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  console.log('\n' + '='.repeat(70));
  console.log('📊 TEST EXECUTION SUMMARY REPORT');
  console.log('='.repeat(70));
  console.log(`Total Suites Run : ${results.length}`);
  console.log(`Passed Suites    : ${passedCount} (🎉 ${((passedCount / results.length) * 100).toFixed(1)}%)`);
  console.log(`Failed Suites    : ${failedCount}`);
  console.log(`Total Duration   : ${totalDuration}s`);
  console.log('='.repeat(70));

  if (failedCount > 0) {
    console.log('\n❌ FAILED SUITE DETAILS:');
    for (const fail of results.filter(r => !r.passed)) {
      console.log(`\n--- [FAILED] ${fail.file} ---`);
      console.log(fail.output.trim());
      console.log('-'.repeat(50));
    }
    process.exit(1);
  } else {
    console.log('\n🎉 ALL BACKEND TEST SUITES COMPLETED WITH 100% PASS RATE!\n');
    process.exit(0);
  }
}

runMasterTestSuite().catch(err => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});

