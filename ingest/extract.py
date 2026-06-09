"""
extract.py - first-pass HAL Navigator video -> draft events JSON.

Usage:
    python3 ingest/extract.py <video.mp4> <day_number> [opts]

Strategy:
    1. ffmpeg fps=1 (default) -> frames/dayN/f%04d.jpg
    2. For each frame: ONE pytesseract.image_to_data pass to get
       word-level positions; group words into rows (by Y) and
       columns (by X). Left column (x<340) carries time + duration;
       right column carries title + venue/deck.
    3. Pair each time marker with the surrounding right-column rows
       to recover (time, duration, name, venue, deck).
    4. Dedupe across frames by (time, normalized title), sort, save.

Then run verify.py + retry_ocr.py.
"""

import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path

import pytesseract
from PIL import Image

# Layout for HAL Navigator on iPhone screen-recording (1180 x 2556)
CARD_X0, CARD_X1     = 100, 1100
CONTENT_Y0, CONTENT_Y1 = 400, 2300
LEFT_X_END           = 340     # right edge of the time/duration column

TIME_RE  = re.compile(r'^(\d{1,2}):(\d{2})$')
TIME_AP_RE = re.compile(r'^(\d{1,2}):(\d{2})\s*(AM|PM)$', re.I)
AP_RE    = re.compile(r'^(AM|PM)$', re.I)
DUR_NUM_RE = re.compile(r'^(\d+(?:\.\d+)?)$')
DUR_UNIT_RE = re.compile(r'^(hour|hr|hours|min|mins|minute|minutes)$', re.I)
DECK_RE  = re.compile(r'Deck\s*(\d+)\b', re.I)
JUNK     = {'view', 'more', '@', '@)', '@®', '(@)', '(+)', '+', '|'}


def extract_frames(video, frames_dir, fps=1):
    os.makedirs(frames_dir, exist_ok=True)
    pattern = os.path.join(frames_dir, 'f%04d.jpg')
    proc = subprocess.run(
        ['ffmpeg', '-y', '-i', video, '-vf', f'fps={fps}', '-q:v', '2', pattern],
        capture_output=True, text=True)
    if proc.returncode != 0:
        print(proc.stderr, file=sys.stderr)
        raise SystemExit(f'ffmpeg failed (exit {proc.returncode})')
    return sorted(Path(frames_dir).glob('f*.jpg'))


def words_from_frame(fp):
    """Return list of (text, x, y) for words in the content area."""
    img = Image.open(fp)
    crop = img.crop((CARD_X0, CONTENT_Y0, CARD_X1, CONTENT_Y1))
    data = pytesseract.image_to_data(crop, output_type=pytesseract.Output.DICT,
                                     config='--psm 6')
    words = []
    for i, t in enumerate(data['text']):
        t = (t or '').strip()
        if not t:
            continue
        if int(data['conf'][i]) < 30:
            continue
        if t.lower() in JUNK:
            continue
        x = int(data['left'][i])
        y = int(data['top'][i])
        words.append((t, x, y))
    return words


def group_rows(words, y_tol=15):
    """Group words by Y position into rows; each row sorted by X."""
    if not words:
        return []
    words = sorted(words, key=lambda w: w[2])
    rows = []
    current_y = words[0][2]
    current = []
    for w in words:
        if abs(w[2] - current_y) <= y_tol:
            current.append(w)
        else:
            rows.append(sorted(current, key=lambda x: x[1]))
            current = [w]
            current_y = w[2]
    if current:
        rows.append(sorted(current, key=lambda x: x[1]))
    return rows


def row_split(row):
    """Split a row into (left_text, right_text) by x position."""
    left = [w for w in row if w[1] < LEFT_X_END - CARD_X0]
    right = [w for w in row if w[1] >= LEFT_X_END - CARD_X0]
    return (' '.join(w[0] for w in left).strip(),
            ' '.join(w[0] for w in right).strip())


def parse_events(rows):
    """Walk rows; at each row containing a time, harvest the surrounding right-column lines."""
    events = []
    n = len(rows)
    i = 0
    while i < n:
        l, r = row_split(rows[i])
        time_str = None
        m = TIME_AP_RE.match(l)
        if m:
            h, mi, ap = int(m.group(1)), int(m.group(2)), m.group(3).upper()
            time_str = f'{h}:{mi:02d} {ap}'
        else:
            m = TIME_RE.match(l)
            if m and i + 1 < n:
                # AM/PM might be on the next row's left column
                _, nl = i + 1, rows[i + 1]
                nl_l, _ = row_split(nl)
                if AP_RE.match(nl_l):
                    h, mi = int(m.group(1)), int(m.group(2))
                    ap = nl_l.upper()
                    time_str = f'{h}:{mi:02d} {ap}'
        if not time_str:
            i += 1
            continue
        # gather subsequent right-column text + left-column duration
        title_parts = []
        if r:
            title_parts.append(r)
        venue = None
        deck = None
        duration = None
        j = i + 1
        scanned = 0
        while j < n and scanned < 8:
            lj, rj = row_split(rows[j])
            # bail out if we hit the NEXT event's time marker
            if TIME_AP_RE.match(lj) or TIME_RE.match(lj):
                if j > i + 1:
                    break
            # duration in left column: "N" + "unit" possibly across rows
            if duration is None:
                dn = DUR_NUM_RE.match(lj)
                if dn:
                    # check this row's right OR next row's left for unit
                    if j + 1 < n:
                        nlj, _ = row_split(rows[j + 1])
                        if DUR_UNIT_RE.match(nlj):
                            duration = f'{dn.group(1)} {nlj.lower()}'
            # venue line "..., Deck N" in right column
            if venue is None and rj:
                dm = DECK_RE.search(rj)
                if dm:
                    venue = rj[:dm.start()].rstrip(' ,.').strip()
                    deck = dm.group(1)
                    j += 1; scanned += 1
                    continue
            # treat right column as title continuation
            if rj and venue is None:
                title_parts.append(rj)
            j += 1
            scanned += 1
        title = ' '.join(title_parts).strip()
        title = re.sub(r'\s{2,}', ' ', title).strip(' -,.')
        if title and venue:
            events.append({
                'time': time_str,
                'duration': duration,
                'name': title,
                'venue': venue,
                'deck': deck,
            })
        i = max(j, i + 1)
    return events


def normalize_title(t):
    return re.sub(r'[^a-z0-9 ]', '', (t or '').lower()).strip()


def time_sort_key(t):
    m = TIME_AP_RE.match(t or '')
    if not m:
        return 9999
    h, mi, ap = int(m.group(1)), int(m.group(2)), m.group(3).upper()
    if ap == 'PM' and h != 12:
        h += 12
    if ap == 'AM' and h == 12:
        h = 0
    return h * 60 + mi


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('video')
    ap.add_argument('day', type=int)
    ap.add_argument('--out')
    ap.add_argument('--frames-dir')
    ap.add_argument('--fps', type=float, default=1.0)
    ap.add_argument('--limit-frames', type=int, default=0)
    ap.add_argument('--start-frame', type=int, default=0)
    ap.add_argument('-v', '--verbose', action='store_true')
    args = ap.parse_args()

    out_path = args.out or f'day{args.day}_events.json'
    frames_dir = args.frames_dir or f'frames-day{args.day}'

    print(f'[1/3] ffmpeg fps={args.fps} -> {frames_dir}/')
    frames = extract_frames(args.video, frames_dir, fps=args.fps)
    if args.start_frame:
        frames = frames[args.start_frame:]
    if args.limit_frames:
        frames = frames[:args.limit_frames]
    print(f'      {len(frames)} frames to scan')

    print(f'[2/3] OCR + parse')
    seen = {}
    for idx, fp in enumerate(frames):
        try:
            words = words_from_frame(fp)
        except Exception as e:
            print(f'      ! {fp.name}: {e}')
            continue
        rows = group_rows(words)
        events = parse_events(rows)
        for e in events:
            key = (e['time'], normalize_title(e['name']))
            if key in seen:
                continue
            e['day'] = args.day
            e['source'] = 'hal-navigator'
            e['_frame'] = fp.name
            seen[key] = e
        if args.verbose and (idx + 1) % 25 == 0:
            print(f'      ...{idx+1}/{len(frames)} ({len(seen)} events)')

    events = list(seen.values())
    events.sort(key=lambda e: time_sort_key(e['time']))
    print(f'      kept {len(events)} unique events')

    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(events, f, indent=2)
    print(f'[3/3] wrote {out_path}')
    print()
    here = os.path.dirname(os.path.abspath(__file__))
    print('Next steps:')
    print(f'  python3 {here}/verify.py {out_path}')
    print(f'  python3 {here}/retry_ocr.py {out_path} {frames_dir}/')


if __name__ == '__main__':
    main()
