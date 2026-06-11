#!/usr/bin/env bash
# v.215 — fast truncation sweep. Pass --strict to also validate every
# <script type="module"> body with new Function() via node.
set -e
cd "$(dirname "$0")/.."
fail=0
for f in *.html; do
  size=$(stat -c %s "$f")
  if [ "$size" -eq 0 ]; then echo "EMPTY  $f"; fail=1; continue; fi
  tail=$(tail -c 16 "$f" | tr -d '[:space:]')
  case "$tail" in
    *"</html>") ;;
    *) echo "BAD-TAIL  $f  ...$(tail -c 60 "$f" | tr -d '\r\n')"; fail=1 ;;
  esac
done
if [ "${1:-}" = "--strict" ]; then
  for f in *.html; do
    node -e "
      const fs=require('fs'); const s=fs.readFileSync('$f','utf8');
      const re=/<script type=\"module\">([\s\S]*?)<\/script>/g;
      let m,idx=0,bad=0;
      while((m=re.exec(s))){idx++;
        const body=m[1].replace(/^\s*import\s+[^;]*;?\s*$/gm,'// imp');
        try{new Function(body);}catch(e){bad++;console.log('PARSE-FAIL  $f  mod '+idx+': '+e.message);}
      }
      process.exit(bad);
    " || fail=1
  done
fi
if [ $fail -eq 0 ]; then echo "OK: every .html closes with </html>"; else exit 1; fi
