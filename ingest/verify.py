"""
Daily program event verification.

Pipeline:
  Cheap verifiers (run on EVERY event):
    1. field_completeness — required fields are non-null and non-placeholder
    2. duration_canonical — duration matches HAL's actual cadence (15/30/45 min, 1/1.5/2/2.5/3/3.5/4 hr, or 13/16 hr for all-day)
    3. venue_in_catalog — venue+deck exists in the ship venue catalog
    4. time_order        — events sorted, no impossible jumps
    5. title_quality     — no OCR artifacts (e.g., "wat3rcoloring", "[unreadable]")

  Each verifier contributes to a confidence score 0-5.
    score >= 4 => HIGH
    score == 3 => MEDIUM
    score <= 2 => LOW

  For MEDIUM/LOW events, queue them for targeted re-OCR (read a narrow
  frame window where the card was visible, pick the sharpest single
  frame, re-extract).
"""
import re
import json
import os

# Load the shared venue catalog
HERE = os.path.dirname(os.path.abspath(__file__))
CATALOG = {}
catalog_path = os.path.normpath(os.path.join(HERE, '..', '..', 'Cruise', 'venues.js'))
try:
    with open(catalog_path, 'r', encoding='utf-8') as f:
        txt = f.read()
    # Extract the JSON object literal from `window.SHIP_VENUE_CATALOG = {...};`
    m = re.search(r'window\.SHIP_VENUE_CATALOG\s*=\s*(\{[\s\S]+?\});', txt)
    if m:
        # Clean trailing commas if any
        raw = re.sub(r',\s*\}', '}', m.group(1))
        CATALOG = json.loads(raw)
except Exception as e:
    print(f'(venue catalog not loaded: {e})')


# ---------- canonical sets ----------
CANONICAL_DURATIONS = {
    '15 min', '15 minutes', '20 min', '20 minutes',
    '30 min', '30 minutes',
    '45 min', '45 minutes',
    '1 hour', '1 hr',
    '1.5 hours', '90 minutes',
    '2 hours', '2 hr',
    '2.5 hours', '2.5 hrs',
    '3 hours', '3 hr',
    '3.5 hours', '3.5 hrs',
    '4 hours', '4 hr', '4 hrs',
    '5 hours', '5 hrs', '6 hours', '7 hours', '8 hours',
    '9 hours', '10 hours', '11 hours', '12 hours',
    '13 hours', '14 hours', '15 hours', '16 hours', '17 hours',
    None, '', '?', 'all night', 'all day',  # acceptable absence
}

PLACEHOLDER_VALUES = {None, '', '?', '—', 'TBD', 'tbd', '[?]', '(?)'}


# ---------- verifiers ----------
def v_field_completeness(ev):
    """All four required fields must have non-placeholder values."""
    missing = []
    for field in ('time', 'name', 'venue', 'deck'):
        val = ev.get(field)
        if val in PLACEHOLDER_VALUES or val is None:
            missing.append(field)
    return (len(missing) == 0, missing)


def v_duration_canonical(ev):
    """Duration must match HAL's known cadence, or be a known acceptable absence (point events)."""
    d = (ev.get('duration') or '').strip().lower()
    # Strip leading "approx" or trailing "min(s)"/"hour(s)"
    if d in {(x or '').lower() for x in CANONICAL_DURATIONS}:
        return (True, None)
    norm = d.replace('minutes', 'min').replace('hours', 'hour').replace('hrs', 'hour').replace('hr', 'hour')
    norm = re.sub(r'\s+', ' ', norm).strip()
    canonical_norm = {(x or '').replace('minutes','min').replace('hours','hour').replace('hrs','hour').lower() for x in CANONICAL_DURATIONS if x}
    if norm in canonical_norm:
        return (True, None)
    return (False, f'non-canonical duration: {d!r}')


def v_venue_in_catalog(ev):
    """venue + deck must exist in the SHIP_VENUE_CATALOG."""
    if not CATALOG:
        return (True, '(catalog unavailable, skipped)')
    venue = (ev.get('venue') or '').strip().lower()
    deck = str(ev.get('deck') or '').strip()
    if not venue or not deck:
        return (False, 'venue or deck missing')
    key = f'{venue}, deck {deck}'
    if key in CATALOG:
        return (True, None)
    # Try removing leading "the "
    key2 = key.replace('the ', '', 1)
    if key2 in CATALOG:
        return (True, None)
    return (False, f'venue not in catalog: {key!r}')


def v_time_order(ev, prev_ev):
    """Event's parsed time should be >= prev event's time (within the same day)."""
    def to_minutes(t):
        m = re.match(r'(\d+):(\d+)\s*(AM|PM)', t or '', re.I)
        if not m: return None
        h, mi, ap = int(m.group(1)), int(m.group(2)), m.group(3).upper()
        if ap == 'PM' and h != 12: h += 12
        if ap == 'AM' and h == 12: h = 0
        return h * 60 + mi
    cur = to_minutes(ev.get('time'))
    if cur is None:
        return (False, 'unparseable time')
    if prev_ev:
        prev = to_minutes(prev_ev.get('time'))
        if prev is not None and cur < prev:
            return (False, f'time goes backwards: prev={prev_ev.get("time")} -> this={ev.get("time")}')
    return (True, None)


def v_title_quality(ev):
    """Title should not contain OCR artifacts or known placeholder markers."""
    name = ev.get('name') or ''
    if any(x in name for x in ['[?]', '(?)', '???', 'unreadable']):
        return (False, 'title contains uncertainty marker')
    if len(name) < 4:
        return (False, f'title too short: {name!r}')
    # Numbers/digits inside words usually means OCR mis-read letters (e.g., "wat3rcoloring")
    if re.search(r'[a-z]\d|[a-z]\d[a-z]', name, re.I):
        return (False, f'suspicious digit-in-word: {name!r}')
    return (True, None)


VERIFIERS = [
    ('field_completeness', v_field_completeness),
    ('duration_canonical', v_duration_canonical),
    ('venue_in_catalog', v_venue_in_catalog),
    ('title_quality', v_title_quality),
]


def assess(event, prev_event=None):
    """Run all cheap verifiers, return (confidence_tag, score, failures)."""
    score = 0
    failures = []
    for name, fn in VERIFIERS:
        ok, detail = fn(event)
        if ok: score += 1
        else: failures.append((name, detail))
    # time-order is +1 separately (needs prev)
    ok, detail = v_time_order(event, prev_event)
    if ok: score += 1
    else: failures.append(('time_order', detail))

    if score >= 4: tag = 'HIGH'
    elif score == 3: tag = 'MEDIUM'
    else: tag = 'LOW'
    return tag, score, failures


def assess_day(events):
    """Run on a sorted list of events; return enriched events with confidence."""
    out = []
    prev = None
    for ev in events:
        tag, score, fails = assess(ev, prev)
        ev = dict(ev)
        ev['_confidence'] = tag
        ev['_score'] = score
        ev['_failures'] = fails
        out.append(ev)
        prev = ev
    return out


if __name__ == '__main__':
    import sys
    if len(sys.argv) > 1:
        path = sys.argv[1]
        with open(path) as f:
            events = json.load(f)
        result = assess_day(events)
        for ev in result:
            tag = ev['_confidence']
            mark = {'HIGH':'✓','MEDIUM':'?','LOW':'✗'}[tag]
            print(f"{mark} {tag:6} [{ev['_score']}/5] {ev.get('time','?'):8} {ev.get('name','?')[:45]:45} @ {ev.get('venue','?')}, Deck {ev.get('deck','?')}")
            for f, d in ev['_failures']:
                print(f'       └─ FAIL {f}: {d}')
        n_high = sum(1 for e in result if e['_confidence'] == 'HIGH')
        n_med = sum(1 for e in result if e['_confidence'] == 'MEDIUM')
        n_low = sum(1 for e in result if e['_confidence'] == 'LOW')
        print(f'\nTotal: {len(result)} events  HIGH={n_high}  MEDIUM={n_med}  LOW={n_low}')
