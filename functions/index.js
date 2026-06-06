// HTTP Cloud Function: serves dynamic per-user .ics feeds.
// URL: https://us-central1-gto-poker-qui.cloudfunctions.net/calendar?user=becca
// Subscribe URL for iOS: webcal://us-central1-gto-poker-qui.cloudfunctions.net/calendar?user=becca
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const EVENTS = require('./events');

admin.initializeApp();
const db = admin.firestore();

const PEOPLE = [
  {key:'jett',   label:'Jett'},
  {key:'laura',  label:'Laura'},
  {key:'sandra', label:'Sandra'},
  {key:'becca',  label:'Becca'},
  {key:'karen',  label:'Karen'}
];
const ALL = PEOPLE.map(p => p.key);

function pad(n) { return (n < 10 ? '0' : '') + n; }

function fmtTime(date, time) {
  if(!time) return null;
  let t = String(time).trim().toUpperCase();
  // Map vague time strings to defaults so VEVENT doesn't break.
  if(t === 'EVENING') t = '6:00 PM';
  else if(t === 'MORNING') t = '8:00 AM';
  else if(t === 'AFTERNOON') t = '2:00 PM';
  if(!/[0-9]/.test(t)) return null;
  const [y, m, d] = date.split('-').map(Number);
  const ampm = t.endsWith('PM') ? 1 : 0;
  const hm = t.replace(/AM|PM/g, '').trim();
  const [h, mm] = hm.split(':').map(Number);
  let hr = h;
  if(ampm && hr < 12) hr += 12;
  if(!ampm && hr === 12) hr = 0;
  return y + pad(m) + pad(d) + 'T' + pad(hr) + pad(mm || 0) + '00';
}

function escIcs(s) {
  return String(s || '')
    .replace(/\\/g, '\\\\')
    .replace(/[,;]/g, '\\$&')
    .replace(/\n/g, '\\n');
}

function nowStamp() {
  const d = new Date();
  return d.getUTCFullYear() + pad(d.getUTCMonth()+1) + pad(d.getUTCDate())
    + 'T' + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + 'Z';
}

function genIcs(events, person) {
  const meta = PEOPLE.find(p => p.key === person) || { label: person };
  const stamp = nowStamp();
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//mondrianaire//Canada and New England 2026//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Canada & New England — ' + meta.label + ' (live)',
    'X-WR-CALDESC:Personal trip calendar for ' + meta.label + ' — ms Zuiderdam, June 2026. Refreshes from Firestore each time iOS polls.',
    'X-WR-TIMEZONE:America/New_York',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
    'X-PUBLISHED-TTL:PT1H'
  ];
  events.forEach(ev => {
    lines.push('BEGIN:VEVENT');
    lines.push('UID:cnen26-' + ev.k + '@mondrianaire.github.io');
    lines.push('DTSTAMP:' + stamp);
    if(ev.allDay) {
      const [y, m, d] = ev.d.split('-').map(Number);
      const nd = new Date(Date.UTC(y, m-1, d+1));
      lines.push('DTSTART;VALUE=DATE:' + y + pad(m) + pad(d));
      lines.push('DTEND;VALUE=DATE:' + nd.getUTCFullYear() + pad(nd.getUTCMonth()+1) + pad(nd.getUTCDate()));
    } else {
      const s = fmtTime(ev.d, ev.t);
      const e = fmtTime(ev.d, ev.e);
      if(!s) return;
      lines.push('DTSTART:' + s);
      if(e) lines.push('DTEND:' + e);
    }
    if(ev.tent) lines.push('STATUS:TENTATIVE');
    lines.push('SUMMARY:' + escIcs(ev.n));
    if(ev.l) lines.push('LOCATION:' + escIcs(ev.l));
    const descBits = [ev.o, ev._user ? 'Added by ' + (ev.by || 'a traveller') : ''].filter(Boolean);
    if(descBits.length) lines.push('DESCRIPTION:' + escIcs(descBits.join(' \\n')));
    lines.push('END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

exports.calendar = functions
  .region('us-central1')
  .runWith({ memory: '256MB', timeoutSeconds: 30 })
  .https.onRequest(async (req, res) => {
    const user = String(req.query.user || '').toLowerCase();
    if(!ALL.includes(user)) {
      res.status(400).type('text/plain').send(
        'Unknown user. Use ?user=jett|laura|sandra|becca|karen'
      );
      return;
    }

    let userEvents = {}, attendance = {};
    try {
      const snap = await db.collection('cruise').doc('4LMNGG').get();
      if(snap.exists) {
        const data = snap.data() || {};
        userEvents = data.userEvents || {};
        attendance = data.attendance || {};
      }
    } catch(e) {
      console.error('Firestore read failed:', e);
    }

    // Combine static + user-created events
    const merged = EVENTS.slice();
    Object.entries(userEvents).forEach(([k, u]) => {
      if(u && u.d) merged.push(Object.assign({}, u, { k: k, _user: true }));
    });

    // Filter by current attendance (override) or default attendees (w) or all 5
    const mine = merged.filter(ev => {
      const who = (attendance && (ev.k in attendance)) ? attendance[ev.k] : (ev.w || ALL);
      return Array.isArray(who) && who.includes(user);
    });

    const ics = genIcs(mine, user);
    res.set('Content-Type', 'text/calendar; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=300, s-maxage=300');
    res.set('Content-Disposition', `inline; filename="canada-new-england-2026-${user}.ics"`);
    res.status(200).send(ics);
  });
