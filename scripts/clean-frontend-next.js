/**
 * Removes frontend/.next safely (Windows + OneDrive friendly).
 * Use when dev server hits EBUSY on react-loadable-manifest.json etc.
 */
const fs = require('fs');
const path = require('path');

const nextDir = path.join(__dirname, '..', 'frontend', '.next');

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function removeNextDir(maxAttempts = 5) {
  if (!fs.existsSync(nextDir)) {
    console.log('frontend/.next — already clean');
    return;
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      fs.rmSync(nextDir, {
        recursive: true,
        force: true,
        maxRetries: 5,
        retryDelay: 300,
      });
      console.log('frontend/.next — removed');
      return;
    } catch (error) {
      const code = error && typeof error === 'object' ? error.code : '';
      if (attempt === maxAttempts) {
        console.error(
          'Could not remove frontend/.next (file may be locked by OneDrive or the dev server).'
        );
        console.error('Stop npm run dev, then run: npm run clean:next');
        process.exit(1);
      }
      if (code === 'EBUSY' || code === 'EPERM' || code === 'ENOTEMPTY') {
        sleep(400 * attempt);
        continue;
      }
      throw error;
    }
  }
}

removeNextDir();
