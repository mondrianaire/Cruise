# Daily Program ingest pipeline

Each cruise day, a video of the HAL Navigator Daily Program is processed:

1. **Frame extract** — `ffmpeg -i video.mp4 -vf fps=15 frames/f%04d.jpg`
2. **First-pass OCR** — sparse sampling; produces a draft list of events
3. **`verify.py`** — runs five cheap verifiers per event, tags each HIGH/MEDIUM/LOW
4. **`retry_ocr.py`** — for any MEDIUM/LOW event, finds the sharpest frame
   where its card was visible and re-extracts the field values
5. **Output** — JSON of events, all HIGH confidence, with venue deep-links resolved
   via `../venues.js`

## verify.py — five cheap verifiers

| # | Verifier | Catches |
|---|---|---|
| 1 | field_completeness | nulls, "?", placeholder values in time/name/venue/deck |
| 2 | duration_canonical | non-HAL durations like "37 minutes" |
| 3 | venue_in_catalog    | "Library, Deck 10" when Library is on Deck 3 |
| 4 | title_quality       | OCR artifacts like "wat3rcoloring" |
| 5 | time_order          | events going backwards in time |

Score 0-5. >= 4 = HIGH, == 3 = MEDIUM, <= 2 = LOW.

## retry_ocr.py — targeted re-OCR

For each MEDIUM/LOW event:
- Scan frames at 5-frame intervals for the event's title fingerprint
- Score each candidate frame by sharpness (Laplacian std-dev)
- Re-OCR the sharpest match, return field corrections

Run on a JSON file:
```
python3 verify.py dayN_events.json
```
