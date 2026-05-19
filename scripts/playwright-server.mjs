import { rmSync } from 'node:fs';
import { spawn } from 'node:child_process';

const port = process.argv[2] ?? '3001';

function commandParts(command) {
  if (process.platform !== 'win32') {
    return { command: command[0], args: command.slice(1) };
  }

  return {
    command: process.env.ComSpec ?? 'cmd.exe',
    args: ['/d', '/s', '/c', command.join(' ')],
  };
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const parts = commandParts([command, ...args]);
    const child = spawn(parts.command, parts.args, { stdio: 'inherit', shell: false });
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
      }
    });
    child.on('error', reject);
  });
}

if (process.env.PLAYWRIGHT_SKIP_BUILD !== '1') {
  rmSync('.next', { recursive: true, force: true });
  await run('npm', ['run', 'build']);
}

const serverParts = commandParts(['npx', 'next', 'start', '-p', port]);
const server = spawn(serverParts.command, serverParts.args, { stdio: 'inherit', shell: false });

function stopServer() {
  server.kill('SIGTERM');
}

process.on('SIGTERM', stopServer);
process.on('SIGINT', stopServer);

server.on('exit', (code) => {
  process.exit(code ?? 0);
});