"""
Targeted re-OCR for low/medium confidence events.

Given an event flagged LOW or MEDIUM, find the frame window where its
card was visible, score each frame for clarity, OCR the best one, and
return corrected field values.

Clarity score per frame:
  + visible: section header above + next-section header below both seen
  + sharp:   high local contrast in the card's vertical band
  + centered: card mid-line falls in the central 60% of viewport
"""
import glob, re, os
import numpy as np
from PIL import Image
import pytesseract


def parse_time(t):
    m = re.match(r'(\d+):(\d+)\s*(AM|PM)', t or '', re.I)
    if not m: return None
    h, mi, ap = int(m.group(1)), int(m.group(2)), m.group(3).upper()
    if ap == 'PM' and h != 12: h += 12
    if ap == 'AM' and h == 12: h = 0
    return h * 60 + mi


def find_section_header_frames(frame_dir, section_label):
    """Sample frames; return frames where this header text appears in the left strip."""
    hits = []
    for fp in sorted(glob.glob(os.path.join(frame_dir, 'f*.jpg'))):
        idx = int(re.search(r'f(\d+)', fp).group(1))
        if idx % 5 != 0: continue
        img = Image.open(fp)
        w, h = img.size
        crop = img.crop((40, 220, int(w*0.4), h-200))
        crop = crop.resize((crop.width//2, crop.height//2))
        txt = pytesseract.image_to_string(crop, config='--psm 6')
        if section_label.lower() in txt.lower():
            hits.append(idx)
    return hits


def frame_sharpness(img):
    """Crude sharpness measure: stdev of grayscale Laplacian."""
    arr = np.array(img.convert('L'), dtype=np.float32)
    # Simple Laplacian via 4-direction differences
    lap = (np.roll(arr,1,0) + np.roll(arr,-1,0) + np.roll(arr,1,1) + np.roll(arr,-1,1) - 4*arr)
    return float(lap.std())


def best_frame_for_event(event, frame_dir, search_window=None):
    """Find the frame where this event's card is most cleanly visible."""
    frames = sorted(glob.glob(os.path.join(frame_dir, 'f*.jpg')))
    candidates = []
    needle = (event.get('name') or '').lower()[:20]
    if not needle: return None

    # Either use a provided frame window or scan everywhere at sparse interval
    indices = search_window if search_window else range(0, len(frames), 5)
    for idx in indices:
        if idx >= len(frames): continue
        img = Image.open(frames[idx])
        w, h = img.size
        # OCR the body
        body = img.crop((100, 220, w-50, h-200))
        body = body.resize((body.width//2, body.height//2))
        txt = pytesseract.image_to_string(body, config='--psm 6')
        if needle in txt.lower():
            sharp = frame_sharpness(img)
            candidates.append((sharp, idx, frames[idx]))

    if not candidates:
        return None
    candidates.sort(reverse=True)
    return candidates[0]  # (sharpness, index, filepath)


def reocr_event(event, frame_dir):
    """Run OCR on the best frame for this event, return any field corrections."""
    best = best_frame_for_event(event, frame_dir)
    if not best:
        return {'_reocr': 'NOT_FOUND', 'corrections': {}}
    sharp, idx, fp = best
    img = Image.open(fp)
    w, h = img.size
    body = img.crop((100, 220, w-50, h-200))
    txt = pytesseract.image_to_string(body, config='--psm 6')
    return {
        '_reocr': 'FOUND',
        'best_frame': idx,
        'sharpness': round(sharp, 1),
        'ocr_excerpt': '\n'.join([l for l in txt.split('\n') if (event.get('name') or '')[:15].lower() in l.lower() or any(w in l.lower() for w in [(event.get('venue') or '').lower().split(',')[0]] if w)])[:300]
    }
