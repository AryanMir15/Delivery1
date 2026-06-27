const { execSync } = require('child_process');

const PORT = process.env.PORT || 4000;

try {
  // Find process using the port
  const result = execSync(`netstat -ano | findstr :${PORT}`, { encoding: 'utf8' });
  const lines = result.split('\n').filter(line => line.includes('LISTENING'));

  if (lines.length === 0) {
    console.log(`✅ No process found on port ${PORT}`);
    process.exit(0);
  }

  // Extract PIDs and kill them
  const pids = [...new Set(lines.map(line => line.trim().split(/\s+/).pop()).filter(pid => pid && !isNaN(pid)))];

  for (const pid of pids) {
    try {
      execSync(`taskkill /F /PID ${pid}`, { encoding: 'utf8' });
      console.log(`✅ Killed process ${pid} on port ${PORT}`);
    } catch (e) {
      console.log(`⚠️  Could not kill process ${pid}: ${e.message}`);
    }
  }
} catch (e) {
  // netstat returns exit code 1 when no matches - that's fine
  console.log(`✅ Port ${PORT} is free`);
}
