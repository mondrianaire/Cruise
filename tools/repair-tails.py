#!/usr/bin/env python3
"""
One-shot repair pass: every .html in the project gets its trailing null
bytes stripped, and is then rewritten via the atomic safe_write so its
on-disk size matches its real content. Run this after a "check for
truncation" sweep flags BAD-TAIL on any file.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from safe_write import safe_write

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def repair(path):
    with open(path, 'rb') as f: data = f.read()
    stripped = data.rstrip(b'\x00').rstrip()
    if stripped.endswith(b'</html>'):
        new = stripped + b'\n'
    else:
        return False, f'no </html> found, refusing to repair (size={len(data)}, last 60 chars: {data[-60:]!r})'
    if new == data:
        return False, 'no padding'
    safe_write(path, new)
    return True, f'stripped {len(data) - len(new)} bytes of trailing padding'

if __name__ == '__main__':
    fail = 0
    for fn in sorted(os.listdir(ROOT)):
        if not fn.endswith('.html'): continue
        path = os.path.join(ROOT, fn)
        changed, why = repair(path)
        marker = 'REPAIR' if changed else 'SKIP  '
        print(f'{marker}  {fn}: {why}')
        if not changed and why.startswith('no </html>'):
            fail = 1
    sys.exit(fail)
