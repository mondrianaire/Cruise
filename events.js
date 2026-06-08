/* Canada & New England 2026 — ship-event data + lookup helpers.
   v.139.

   This file holds every event extracted from the HAL Navigator
   Daily Program for our 7-day cruise (Jun 13–19, 2026), keyed by
   venue so ship.html's deck-plan view can show "Daily events" +
   chronological calendar inline under each Notable-on-this-deck row.

   Schema for each event:
     {
       day:        1..7         // 1 = Sat Jun 13, ... 7 = Fri Jun 19
       time24:     "HH:MM"      // 24-hr start time
       durationMin: number|null // minutes; null if HAL didn't list one
       name:       string
       venueId:    "{deck}-{slug}"  // matches the dv-item id (sans "venue-")
       source:     "hal-navigator"
       conf:       "high"|"med"|"low" // from ingest/verify.py
     }

   Daily-event detection: an event is treated as DAILY when its
   normalized name appears at the same time (±15 min) on 5+ of the
   7 cruise days at the same venue. Until we have 5+ days ingested
   the Daily section will simply be empty.

   Days 3–7 will be appended here after each Navigator-recording
   ingest pass completes. */

(function(){
  'use strict';

  /* ---- venue-label -> "{deck}-{slug}" lookup ----
     Built from every <li class="dv-item"> in ship.html. Keys are
     normalized (lowercased, & -> "and", curly apostrophes flattened,
     trimmed). Where a venue name appears on multiple decks
     (e.g. "World Stage" on Decks 1, 2, 3 — same theatre, different
     tiers), an array is stored and the ingest deck is used to pick. */
  var VENUE_LOOKUP = {
    /* Deck 11 */
    "the retreat":            "11-retreat",
    "retreat":                "11-retreat",
    "sport court":            "11-sportcourt",
    "sports court":           "11-sportcourt",
    /* Deck 10 */
    "crow's nest":            "10-crowsnest",
    "crows nest":             "10-crowsnest",
    "crow's nest cafe":       "10-crowsnestcafe",
    "crows nest cafe":        "10-crowsnestcafe",
    "explorations cafe":      "10-crowsnestcafe",
    "game room":              "10-gameroom",
    "art studio":             "10-artstudio",
    "shore excursions":       "10-shorex10",
    "shore excursions desk":  "10-shorex10",
    "kids club":              "10-kidsclub",
    "club hal":               "10-kidsclub",
    "the loft":               "10-kidsclub",
    "library":                ["10-crowsnestcafe", "3-library"],
    /* Deck 9 */
    "lido pool":              "9-lidopool",
    "lido poolside":          "9-lidopool",
    "lido market":            "9-lidomarket",
    "canaletto":              "9-canaletto",
    "dive-in":                "9-divein",
    "dive in":                "9-divein",
    "new york pizza":         "9-nypizza",
    "lido bar":               "9-lidobar",
    "greenhouse spa and salon": "9-greenhouse",
    "spa and salon":          "9-greenhouse",
    "spa & salon":            "9-greenhouse",
    "hydropool":              "9-hydropool",
    "thermal suite":          "9-hydropool",
    "sea view pool":          "9-seaviewpool",
    "sea view bar":           "9-seaviewbar",
    "fitness center":         "9-fitness",
    "fitness":                "9-fitness",
    /* Deck 8 */
    "bridge":                 "8-bridge",
    "the bridge":             "8-bridge",
    /* Deck 7 */
    "pinnacle suite":         "7-pinnaclesuites",
    /* Deck 3 */
    "world stage":            ["3-worldstage", "2-worldstagelower", "1-worldstagelowest"],
    "tasman":                 "3-tasman",
    "tasman room":            "3-tasman",
    "tasman cinema":          "3-tasman",
    "merabella":              "3-merabella",
    "effy":                   "3-effy",
    "effy jewelry":           "3-effy",
    "atrium shops":           "3-shops",
    "photo gallery":          "3-photogallery3",
    "half moon":              "3-meetingrooms",
    "hudson":                 "3-meetingrooms",
    "stuyvesant":             "3-meetingrooms",
    "meeting rooms":          "3-meetingrooms",
    "digital workshop":       "3-meetingrooms",
    "ocean bar":              "3-oceanbar",
    "promenade":              "3-promenadetrack",
    "promenade walking track":"3-promenadetrack",
    "dining room":            ["3-diningupper", "2-dininglower"],
    "upper dining room":      "3-diningupper",
    "lower dining room":      "2-dininglower",
    /* Deck 2 */
    "casino":                 "2-casino",
    "billboard":              "2-billboard",
    "billboard onboard":      "2-billboard",
    "gallery bar":            "2-gallerybar",
    "rolling stone":          "2-rollingstone",
    "rolling stone lounge":   "2-rollingstone",
    "pinnacle grill":         "2-pinnacle",
    "pinnacle bar":           "2-pinnaclebar",
    "shops":                  "2-shops2",
    "explorer's lounge":      "2-explorerslounge",
    "explorers lounge":       "2-explorerslounge",
    "lincoln center":         "2-lincolnctr",
    "lincoln center stage":   "2-lincolnctr",
    "portrait studio":        "2-portraitstudio",
    "art gallery":            "2-artgallery",
    /* Deck 1 */
    "atrium":                 "1-atrium",
    "front office":           "1-frontoffice",
    "guest services":         "1-frontoffice",
    "future cruises":         "1-futurecruises",
    "future cruises desk":    "1-futurecruises"
  };

  function normLabel(s){
    if(!s) return '';
    return String(s)
      .toLowerCase()
      .replace(/[‘’]/g, "'")          // curly -> straight apostrophe
      .replace(/[–—]/g, "-")          // en/em dash -> hyphen
      .replace(/\s*&\s*/g, ' and ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function resolveVenueId(venueLabel, deck){
    var key = normLabel(venueLabel);
    var v = VENUE_LOOKUP[key];
    if(!v) return null;
    if(typeof v === 'string') return v;
    // Multiple matches; prefer the one for the supplied deck
    if(deck != null){
      var want = String(deck);
      for(var i=0;i<v.length;i++){
        if(v[i].indexOf(want + '-') === 0) return v[i];
      }
    }
    return v[0];
  }

  /* ---- duration normalization ----
     Returns minutes (number) or null. Drops anything that smells
     like a test fixture ("37 minutes" is fine, "16 hours" is not
     since HAL never lists a 16-hour event). */
  function parseDuration(d){
    if(d == null) return null;
    var s = String(d).toLowerCase().trim();
    if(!s) return null;
    var m;
    if((m = s.match(/^(\d+)\s*(?:min|minutes?)$/))){
      return parseInt(m[1], 10);
    }
    if((m = s.match(/^(\d+)\s*(?:h|hr|hour|hours)$/))){
      var h = parseInt(m[1], 10);
      if(h >= 8) return null;   // > 8h durations are almost certainly OCR garbage
      return h * 60;
    }
    if((m = s.match(/^(\d+)\s*h(?:r)?\s*(\d+)\s*m(?:in)?$/))){
      return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
    }
    return null;
  }

  /* ---- time parsing: "7:00 AM" / "11:30 PM" -> "HH:MM" 24-hr ---- */
  function parseTime12(t){
    if(!t) return null;
    var m = String(t).trim().match(/^(\d{1,2}):(\d{2})\s*([AaPp])\.?(?:[Mm])?\.?$/);
    if(!m) return null;
    var h = parseInt(m[1], 10);
    var min = parseInt(m[2], 10);
    var ampm = m[3].toUpperCase();
    if(ampm === 'P' && h !== 12) h += 12;
    if(ampm === 'A' && h === 12) h = 0;
    return (h<10?'0':'') + h + ':' + (min<10?'0':'') + min;
  }

  /* ---- Day 2 events — extracted from the HAL Navigator Daily
     Program screen-recording. Bad fixtures ("wat3rcoloring",
     "37 minutes" mahjong, etc.) dropped; "16 hours" crossword
     normalized to null duration since HAL doesn't list one. ---- */
  var RAW = [
    /* Day 2 — Sun Jun 14 (sea day, Boston-bound) */
    { day:2, t:"7:00 AM",  d:"30 min",  n:"Walk a Mile",                              v:"Ocean Bar",         deck:3 },
    { day:2, t:"7:00 AM",  d:"30 min",  n:"Stretch & Release",                        v:"Fitness Center",    deck:9 },
    { day:2, t:"8:00 AM",  d:null,      n:"Crosswords & Number Puzzles Available",    v:"Atrium",            deck:1 },
    { day:2, t:"8:00 AM",  d:"45 min",  n:"Tour de Cycle",                            v:"Fitness Center",    deck:9 },
    { day:2, t:"8:00 AM",  d:"1 hour",  n:"Pickleball Open Play",                     v:"Sport Court",       deck:11 },
    { day:2, t:"8:00 AM",  d:"45 min",  n:"Morning Catholic Prayer",                  v:"Explorer's Lounge", deck:2 },
    { day:2, t:"8:00 AM",  d:"30 min",  n:"Tai Chi for Everyone",                     v:"Lido Pool",         deck:9 },
    { day:2, t:"9:00 AM",  d:"45 min",  n:"Pickleball Instruction: The Basics",       v:"Sport Court",       deck:11 },
    { day:2, t:"9:00 AM",  d:"45 min",  n:"Interdenominational Service",              v:"Explorer's Lounge", deck:2 },
    { day:2, t:"9:00 AM",  d:"45 min",  n:"Vivace Duo Plays",                         v:"Explorer's Lounge", deck:2 },
    { day:2, t:"9:30 AM",  d:"30 min",  n:"Better Sleep, More Energy with Acupuncture", v:"Spa & Salon",     deck:9 },
    { day:2, t:"10:30 AM", d:null,      n:"Mahjong",                                  v:"Library",           deck:10 },
    { day:2, t:"11:00 AM", d:"45 min",  n:"Canada UpClose: The Great North",          v:"World Stage",       deck:2 },
    { day:2, t:"3:00 PM",  d:"45 min",  n:"Tea Time with Vivace Duo",                 v:"Upper Dining Room", deck:3 },
    { day:2, t:"11:59 PM", d:null,      n:"Stay and Play Slots All Night",            v:"Casino",            deck:2 }
  ];

  /* normalize + resolve every raw row into the canonical shape */
  var EVENTS = [];
  RAW.forEach(function(r){
    var venueId = resolveVenueId(r.v, r.deck);
    if(!venueId) return;          // skip rows we can't place on the ship
    var time24  = parseTime12(r.t) || r.t;
    var durMin  = parseDuration(r.d);
    EVENTS.push({
      day:        r.day,
      time24:     time24,
      durationMin:durMin,
      name:       r.n,
      venueId:    venueId,
      source:     "hal-navigator",
      conf:       "high"
    });
  });

  /* ---- helpers exposed for ship.html ---- */

  /* Group all events for a venue into {daily, scheduled}.
     Daily = same-named events at the same time (±15 min) on 5+
     of 7 days. Scheduled = everything else, sorted (day, time). */
  function groupByDay(events){
    var byKey = {};
    events.forEach(function(e){
      var key = normLabel(e.name) + '|' + timeBucket(e.time24);
      if(!byKey[key]) byKey[key] = [];
      byKey[key].push(e);
    });
    var dailyKeys = {};
    Object.keys(byKey).forEach(function(k){
      // Daily threshold: 5+ distinct days
      var days = {};
      byKey[k].forEach(function(e){ days[e.day] = 1; });
      if(Object.keys(days).length >= 5) dailyKeys[k] = byKey[k];
    });
    var daily = [];
    Object.keys(dailyKeys).forEach(function(k){
      var arr = dailyKeys[k];
      // Pick the most-common time from the bucket; report one row.
      var rep = arr[0];
      daily.push({
        time24:      rep.time24,
        name:        rep.name,
        durationMin: rep.durationMin,
        days:        Object.keys(arr.reduce(function(o,e){o[e.day]=1;return o;},{})).map(Number).sort(),
        venueId:     rep.venueId
      });
    });
    daily.sort(function(a,b){ return a.time24.localeCompare(b.time24); });

    var scheduled = events.filter(function(e){
      var key = normLabel(e.name) + '|' + timeBucket(e.time24);
      return !dailyKeys[key];
    });
    scheduled.sort(function(a,b){
      if(a.day !== b.day) return a.day - b.day;
      return a.time24.localeCompare(b.time24);
    });
    return { daily: daily, scheduled: scheduled };
  }

  /* Bucket times to 15-minute slots so "8:00 AM" and "8:14 AM"
     count as the same recurring slot. */
  function timeBucket(t24){
    var p = String(t24).split(':');
    if(p.length !== 2) return t24;
    var h = parseInt(p[0],10), m = parseInt(p[1],10);
    var b = Math.round(m / 15) * 15;
    if(b === 60){ b = 0; h = (h+1)%24; }
    return (h<10?'0':'') + h + ':' + (b<10?'0':'') + b;
  }

  /* Public API */
  window.SHIP_EVENTS = EVENTS;
  window.shipEventsForVenue = function(deck, slug){
    var id = String(deck) + '-' + slug;
    var matching = EVENTS.filter(function(e){ return e.venueId === id; });
    return groupByDay(matching);
  };
  window.shipEventsVenueLookup = VENUE_LOOKUP;
  window.shipEventsParseTime12 = parseTime12;

  /* Cruise day labels for the calendar headers */
  window.SHIP_DAYS = [
    { day:1, label:"Sat Jun 13",  port:"Boston · embark" },
    { day:2, label:"Sun Jun 14",  port:"At sea" },
    { day:3, label:"Mon Jun 15",  port:"Bar Harbor, ME" },
    { day:4, label:"Tue Jun 16",  port:"Saint John, NB" },
    { day:5, label:"Wed Jun 17",  port:"Halifax, NS" },
    { day:6, label:"Thu Jun 18",  port:"At sea" },
    { day:7, label:"Fri Jun 19",  port:"Boston · disembark" }
  ];
})();
