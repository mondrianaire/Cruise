#!/usr/bin/env python3
"""
v.215 — atomic cache-buster + truncation guard.

Pre-flight check: every .html must end with </html> (no null padding,
no mid-statement clip). If ANY file fails the check, the run aborts
without touching the disk — preventing a half-written cache bump from
making a borderline file worse.

All writes go through tools/safe_write.py's safe_write() which:
- Writes to <path>.tmp opened O_WRONLY|O_CREAT|O_TRUNC.
- ftruncate's to the EXACT byte length (kills sparse-file holes).
- fsync's before close so the kernel commits the size.
- Verifies temp size matches expected.
- os.replace's atomically.

Usage:
    python3 tools/bump-cache.py 215           # bump every page to ?v=215
    python3 tools/bump-cache.py 215 --check   # validate only, don't write
"""
import os, re, sys, argparse
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from safe_write import safe_write

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

VERSION_KEYS = [
    'styles.css', 'app.js', 'events.js', 'venues.js',
    'schedule.js', 'events-drawer.js',
]

def file_is_healthy(path):
    try:
        size = os.path.getsize(path)
    except OSError:
        return False, 'cannot stat'
    if size == 0:
        return False, 'empty'
    with open(path, 'rb') as f:
        f.seek(max(0, size - 64))
        tail_raw = f.read()
    if b'\x00' in tail_raw:
        return False, f'null bytes in tail: {tail_raw!r}'
    tail = tail_raw.decode('utf-8', errors='replace').rstrip()
    if not tail.endswith('</html>'):
        return False, f'tail does not end with </html>: ...{tail[-40:]!r}'
    return True, 'ok'

def bump(version, check_only=False):
    html_files = sorted(f for f in os.listdir(ROOT) if f.endswith('.html'))
    unhealthy = [(f, why) for f in html_files
                 for ok, why in [file_is_healthy(os.path.join(ROOT, f))]
                 if not ok]
    if unhealthy:
        print('REFUSING TO BUMP — pre-existing truncation detected:')
        for fn, why in unhealthy:
            print(f'  {fn}: {why}')
        print('Run tools/repair-tails.py to strip null padding, OR')
        print('git checkout HEAD -- <file> for a real source truncation.')
        return 1
    if check_only:
        print(f'OK: {len(html_files)} files pass the tail check.')
        return 0
    pattern = re.compile(
        r'(' + '|'.join(re.escape(k) for k in VERSION_KEYS) + r')\?v=[\d\.]+'
    )
    bumped = 0
    for fn in html_files:
        path = os.path.join(ROOT, fn)
        with open(path, 'r', encoding='utf-8') as f:
            old = f.read()
        new = pattern.sub(lambda m: f'{m.group(1)}?v={version}', old)
        if new != old:
            safe_write(path, new)
            # Post-write paranoia: re-stat and confirm.
            ok, why = file_is_healthy(path)
            if not ok:
                print(f'POST-WRITE CHECK FAILED on {fn}: {why}')
                return 2
            bumped += 1
    # Bump SITE_VERSION in app.js too.
    app = os.path.join(ROOT, 'app.js')
    with open(app, 'r', encoding='utf-8') as f:
        old = f.read()
    new = re.sub(
        r"window\.SITE_VERSION\s*=\s*'v\.[\d\.]+'",
        f"window.SITE_VERSION = 'v.{version}'",
        old,
    )
    if new != old:
        safe_write(app, new)
    print(f'OK: bumped {bumped} HTML files + app.js to v.{version}')
    return 0

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('version')
    ap.add_argument('--check', action='store_true')
    a = ap.parse_args()
    sys.exit(bump(a.version, a.check))
