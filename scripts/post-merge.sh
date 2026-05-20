#!/bin/bash
set -e
npm install
python3 -c "
import subprocess, time, os, pty, select

master, slave = pty.openpty()
p = subprocess.Popen(
    ['npx', 'drizzle-kit', 'push', '--force'],
    stdin=slave, stdout=slave, stderr=slave,
    close_fds=True
)
os.close(slave)
output = b''
deadline = time.time() + 60
while time.time() < deadline:
    r, _, _ = select.select([master], [], [], 0.5)
    if r:
        try:
            chunk = os.read(master, 4096)
            output += chunk
            if b'create table' in output and b'rename table' in output:
                time.sleep(0.3)
                os.write(master, b'\r')
                time.sleep(3)
                break
        except OSError:
            break
p.wait(timeout=30)
print(output.decode('utf-8', errors='replace'))
if p.returncode != 0:
    raise SystemExit(p.returncode)
"
