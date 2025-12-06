const { exec } = require('child_process');
const os = require('os');

const PORT = process.env.PORT || 4000;

function killPort(port) {
  return new Promise((resolve, reject) => {
    const platform = os.platform();
    let command;

    if (platform === 'win32') {
      // Windows command
      command = `powershell -Command "$connections = netstat -ano | Select-String ':${port}'; if ($connections) { $connections | ForEach-Object { $line = $_.Line; $parts = $line -split '\\s+'; $pid = $parts[-1]; Write-Host 'Killing process' $pid 'on port ${port}'; Stop-Process -Id $pid -Force } } else { Write-Host 'No process found on port ${port}' }"`;
    } else {
      // Mac/Linux command
      command = `lsof -ti:${port} | xargs kill -9 2>/dev/null || echo "No process found on port ${port}"`;
    }

    exec(command, (error, stdout, stderr) => {
      if (error && !stdout.includes('No process found')) {
        console.log(`⚠️  Could not kill process on port ${port}`);
      } else {
        console.log(stdout.trim());
      }
      resolve();
    });
  });
}

killPort(PORT).then(() => {
  console.log(`✅ Port ${PORT} is ready`);
  process.exit(0);
}).catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
