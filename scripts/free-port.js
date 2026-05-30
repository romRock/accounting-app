/**
 * Free a TCP port before starting dev (Windows-friendly).
 * Usage: node scripts/free-port.js 3001
 */
const { execSync } = require('child_process');

const port = process.argv[2] || '3001';

function freePortWindows() {
  try {
    const out = execSync(`netstat -ano | findstr ":${port}"`, { encoding: 'utf8' });
    const pids = new Set();
    for (const line of out.split(/\r?\n/)) {
      if (!line.includes('LISTENING')) continue;
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0') pids.add(pid);
    }
    for (const pid of pids) {
      try {
        execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
        console.log(`Freed port ${port} (stopped PID ${pid})`);
      } catch {
        /* ignore */
      }
    }
    if (pids.size === 0) {
      console.log(`Port ${port} is already free`);
    }
  } catch {
    console.log(`Port ${port} is already free`);
  }
}

function freePortUnix() {
  try {
    execSync(`lsof -ti:${port} | xargs -r kill -9`, { stdio: 'inherit', shell: true });
    console.log(`Freed port ${port}`);
  } catch {
    console.log(`Port ${port} is already free`);
  }
}

if (process.platform === 'win32') {
  freePortWindows();
} else {
  freePortUnix();
}
