// Update Boston hotel booking — Boston Harbor Hotel, 2 rooms, Karen as cardmember.
const fs = require('fs');
const dir = 'C:/Users/mondr/Documents/Claude/Projects/Cruise/';
const log = [];

/* ---- 1) journey.html — update jun20-hotel + add jun21-checkout ---- */
let j = fs.readFileSync(dir + 'journey.html', 'utf8');

// The current jun20-hotel line — find it and replace whole event.
const oldHotelRe = /\{d:'2026-06-20',k:'jun20-hotel',[^}]+\}/;
const newHotel =
"{d:'2026-06-20',k:'jun20-hotel',w:['jett','laura','sandra','becca','karen'],t:'3:00 PM',e:'',n:'🎂🏨 Boston Harbor Hotel — birthday night',l:'70 Rowes Wharf, Boston MA 02110',o:'BOOKED via Chase Travel. 2 City Superior rooms (1 King each), $689.93/room. Confirmations 26834SG340300 + 26834SG340301. Primary guest: Karen Schaefer. Includes daily breakfast for 2 per room, $100 property credit, welcome amenity, Wi-Fi, possible upgrade/early check-in. Free cancellation until Thu Jun 18 12:00 AM property local time. Check-out Sun 12:00 PM.'}";

if(oldHotelRe.test(j)){
  j = j.replace(oldHotelRe, newHotel);
  log.push("journey.html: jun20-hotel updated with booking details");
} else {
  log.push("journey.html: jun20-hotel pattern NOT found");
}

// Add a check-out event Sunday morning before the flight.
const checkoutLine = "    {d:'2026-06-21',k:'jun21-checkout',w:['jett','laura','sandra','becca','karen'],t:'11:00 AM',e:'12:00 PM',n:'🧳 Check out — Boston Harbor Hotel',l:'70 Rowes Wharf, Boston MA 02110',o:'Hotel check-out by 12:00 PM. Aim for 11:00 to comfortably reach BOS for the 12:32 PM flight.'},";
// Insert right before the existing jun21-bos-phl line
const jun21Flight = "{d:'2026-06-21',k:'jun21-bos-phl'";
if(!j.includes('jun21-checkout') && j.includes(jun21Flight)){
  // Find the line that starts that event and inject before it (preserve indentation pattern)
  j = j.replace(
    new RegExp("(\\s*)\\{d:'2026-06-21',k:'jun21-bos-phl'"),
    "$1" + checkoutLine.trim() + "\n$1{d:'2026-06-21',k:'jun21-bos-phl'"
  );
  log.push("journey.html: jun21-checkout event added");
} else if(j.includes('jun21-checkout')){
  log.push("journey.html: jun21-checkout already present (skip)");
}

fs.writeFileSync(dir + 'journey.html', j);

/* ---- 2) functions/events.js — regenerate from journey.html P array ---- */
const ps = j.indexOf('var P=[');
const pe = j.indexOf('];', ps) + 2;
const pa = j.slice(ps, pe);
const eventsJs = `// Static itinerary events — synced from journey.html P array.
// Edit there first; rerun the scaffold script to refresh this file.
/* eslint-disable */
${pa.replace('var P=[','const EVENTS = [').replace(/];$/,'];')}

module.exports = EVENTS;
`;
fs.writeFileSync(dir + 'functions/events.js', eventsJs);
log.push("functions/events.js regenerated");

/* ---- 3) overview.html — replace Boston "TBD" card with the booking ---- */
let o = fs.readFileSync(dir + 'overview.html', 'utf8');

const oldBostonCard = `    <div class="card">
      <span class="pill">Post-Cruise &bull; Boston</span>
      <h3 style="margin-top:8px;">Boston &mdash; To Be Booked</h3>
      <p style="font-size:.9rem;">One night needed after disembarkation (<strong>June 20&ndash;21</strong>) before the flight home. Flagged as the <strong>birthday hotel</strong> &mdash; still gathering ideas.</p>
    </div>`;
const newBostonCard = `    <div class="card">
      <span class="pill">Post-Cruise &bull; Boston</span>
      <h3 style="margin-top:8px;">Boston Harbor Hotel</h3>
      <p style="font-size:.9rem;">70 Rowes Wharf, Boston MA 02110. Two <strong>City Superior</strong> rooms (1 King each) booked via Chase Travel for the <strong>birthday night</strong> &mdash; Jun 20 to Jun 21.</p>
      <ul class="clean" style="margin-top:6px;font-size:.85rem;">
        <li><strong>Check-in:</strong> Sat Jun 20, 3:00 PM &middot; <strong>Check-out:</strong> Sun Jun 21, 12:00 PM</li>
        <li><strong>Rate:</strong> $689.93 / room (paid via Chase Travel)</li>
        <li><strong>Primary guest:</strong> Karen Schaefer</li>
        <li><strong>Confirmations:</strong> 26834SG340300 + 26834SG340301</li>
        <li><strong>Perks:</strong> daily breakfast for 2, $100 property credit, welcome amenity, Wi-Fi, possible upgrade / early-late check-in</li>
        <li><strong>Free cancellation</strong> until Thu Jun 18, 12:00 AM (property local time)</li>
      </ul>
    </div>`;
if(o.includes(oldBostonCard)){
  o = o.replace(oldBostonCard, newBostonCard);
  log.push("overview.html: Boston hotel card replaced with booking");
} else if(o.includes('Boston Harbor Hotel')){
  log.push("overview.html: already updated (skip)");
} else {
  log.push("overview.html: Boston TBD card NOT found");
}

// Update the lead text + callout that still say "Boston still to arrange / still to sort"
o = o.replace(
  /The Montreal and Quebec City stays are booked; the Boston night after disembarkation is still to be arranged\./,
  "The Montreal, Quebec City, and Boston stays are all booked."
);
o = o.replace(
  /<div class="callout">\s*<strong>Still to sort:<\/strong>[\s\S]*?Both are an easy ride to Logan for the June 21 flight\.\s*<\/div>/,
  '<div class="callout"><strong>Boston: the birthday hotel is locked in.</strong> Boston Harbor Hotel at 70 Rowes Wharf — two City Superior King rooms, daily breakfast for 2 per room, a $100 property credit, and a free cancellation window through Thu Jun 18. Check-out at 12:00 PM Sun gives roughly 30 min of buffer before the 12:32 PM flight from BOS.</div>'
);
log.push("overview.html: lead + callout updated");

fs.writeFileSync(dir + 'overview.html', o);

fs.writeFileSync(dir + '_boston.txt', log.join('\n'));
console.log(log.join('\n'));
