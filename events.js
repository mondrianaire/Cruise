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
    "the shops":              "3-shops",
    "shops":                  ["3-shops", "2-shops2"],
    "photo gallery":          "3-photogallery3",
    "half moon":              "3-meetingrooms",
    "half moon room":         "3-meetingrooms",
    "hudson":                 "3-meetingrooms",
    "hudson room":            "3-meetingrooms",
    "stuyvesant":             "3-meetingrooms",
    "stuyvesant room":        "3-meetingrooms",
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
    { day:1, t:"11:00 AM" , d:"13 hours"   , n:"Crosswords & Number Puzzles are Available"               , v:"Atrium"                    , deck:"1" },
    { day:1, t:"11:00 AM" , d:"10 hours"   , n:"The Library is Open"                                     , v:"Library"                   , deck:"3" },
    { day:1, t:"11:00 AM" , d:"13 hours"   , n:"Crosswords & Number Puzzles are Available"               , v:"Library"                   , deck:"3" },
    { day:1, t:"11:00 AM" , d:"11 hours"   , n:"The Greenhouse Spa Look & Book Tours"                    , v:"Spa & Salon"               , deck:"9" },
    { day:1, t:"11:30 AM" , d:"4 hours"    , n:"Make Your Dining Reservations"                           , v:"Lido Poolside"             , deck:"9" },
    { day:1, t:"11:30 AM" , d:"4 hours"    , n:"Make Your Dining Reservations"                           , v:"Upper Dining Room"         , deck:"3" },
    { day:1, t:"12:00 PM" , d:"4 hours"    , n:"Live Acupuncture Demonstration"                          , v:"Spa & Salon"               , deck:"9" },
    { day:1, t:"12:00 PM" , d:"4 hours"    , n:"Complimentary Massage Sampler"                           , v:"Spa & Salon"               , deck:"9" },
    { day:1, t:"12:00 PM" , d:"4 hours"    , n:"Complimentary Walk-In Medi-Spa Clinic"                   , v:"Spa & Salon"               , deck:"9" },
    { day:1, t:"1:00 PM"  , d:"2 hours"    , n:"Kids Club Registration until 3:00pm"                     , v:"Kids Club"                 , deck:"10" },
    { day:1, t:"1:00 PM"  , d:"45 min"     , n:"Celtic Instrumentalist Plays"                            , v:"Crow's Nest"               , deck:"10" },
    { day:1, t:"1:30 PM"  , d:"45 min"     , n:"Contemporary Pianist Plays"                              , v:"Ocean Bar"                 , deck:"3" },
    { day:1, t:"2:00 PM"  , d:"45 min"     , n:"Zuiderdam Ship Tour"                                     , v:"Atrium"                    , deck:"1" },
    { day:1, t:"2:00 PM"  , d:"45 min"     , n:"Celtic Instrumentalist Plays"                            , v:"Crow's Nest"               , deck:"10" },
    { day:1, t:"2:30 PM"  , d:"1 hour"     , n:"Art & Craft Open House"                                  , v:"Art Studio"                , deck:"10" },
    { day:1, t:"3:00 PM"  , d:"30 min"     , n:"Footprint and Posture Analysis"                          , v:"Fitness Center"            , deck:"9" },
    { day:1, t:"3:00 PM"  , d:"30 min"     , n:"Today's Trivia: Welcome Onboard"                         , v:"Billboard Onboard"         , deck:"2" },
    { day:1, t:"4:00 PM"  , d:"1 hour"     , n:"Meet Your Travel Guide Bettyann"                         , v:"Atrium"                    , deck:"1" },
    { day:1, t:"4:00 PM"  , d:"30 min"     , n:"The Greenhouse Spa & Salon Raffle Drawing"               , v:"Fitness Center"            , deck:"9" },
    { day:1, t:"4:00 PM"  , d:"45 min"     , n:"Friends of Bill W. Meet"                                 , v:"Explorer's Lounge"         , deck:"2" },
    { day:1, t:"4:15 PM"  , d:"30 min"     , n:"Welcome Aboard Celebration"                              , v:"Lido Poolside"             , deck:"9" },
    { day:1, t:"4:30 PM"  , d:"30 min"     , n:"Live Acupuncture Demonstration"                          , v:"Spa & Salon"               , deck:"9" },
    { day:1, t:"5:00 PM"  , d:"30 min"     , n:"Explore the World of Medi-Spa"                           , v:"Spa & Salon"               , deck:"9" },
    { day:1, t:"5:00 PM"  , d:"3 hours"    , n:"Welcome Aboard Steak and Shrimp Dinner"                  , v:"Lido Market"               , deck:"9" },
    { day:1, t:"5:30 PM"  , d:"30 min"     , n:"Zuiderdam Ship Tour"                                     , v:"Atrium"                    , deck:"1" },
    { day:1, t:"5:30 PM"  , d:"30 min"     , n:"Complimentary Massage Sampler"                           , v:"Spa & Salon"               , deck:"9" },
    { day:1, t:"5:30 PM"  , d:"45 min"     , n:"Evening Catholic Prayer"                                 , v:"Explorer's Lounge"         , deck:"2" },
    { day:1, t:"6:00 PM"  , d:"4 hours"    , n:"Visit the Thermal Suite & Hydropool"                     , v:"Spa & Salon"               , deck:"9" },
    { day:1, t:"6:00 PM"  , d:"45 min"     , n:"Billboard Onboard Plays Cocktail Jazz Instrumental"      , v:"Billboard Onboard"         , deck:"2" },
    { day:1, t:"6:00 PM"  , d:"45 min"     , n:"Singles & Solo Travelers Meetup"                         , v:"Gallery Bar"               , deck:"2" },
    { day:1, t:"6:15 PM"  , d:"45 min"     , n:"The Dam Band Plays"                                      , v:"Ocean Bar"                 , deck:"3" },
    { day:1, t:"6:30 PM"  , d:"45 min"     , n:"Celtic Instrumentalist Plays"                            , v:"Crow's Nest"               , deck:"10" },
    { day:1, t:"7:00 PM"  , d:"30 min"     , n:"Music Trivia: Hits of the 70's"                          , v:"Billboard Onboard"         , deck:"2" },
    { day:1, t:"7:00 PM"  , d:"45 min"     , n:"PRIDE Meetup"                                            , v:"Gallery Bar"               , deck:"2" },
    { day:1, t:"7:15 PM"  , d:"45 min"     , n:"The Dam Band Plays"                                      , v:"Ocean Bar"                 , deck:"3" },
    { day:1, t:"7:30 PM"  , d:"45 min"     , n:"Celtic Instrumentalist Plays"                            , v:"Crow's Nest"               , deck:"10" },
    { day:1, t:"7:30 PM"  , d:"45 min"     , n:"Rolling Stone Lounge Band Plays Classic Rock n Roll"     , v:"Rolling Stone Lounge"      , deck:"2" },
    { day:1, t:"8:00 PM"  , d:"1 hour"     , n:"Teens Meet & Greet"                                      , v:"Art Studio"                , deck:"10" },
    { day:1, t:"8:15 PM"  , d:"45 min"     , n:"Billboard Onboard Plays The Hot 100"                     , v:"Billboard Onboard"         , deck:"2" },
    { day:1, t:"8:30 PM"  , d:"45 min"     , n:"The Dam Band Plays"                                      , v:"Ocean Bar"                 , deck:"3" },
    { day:1, t:"8:30 PM"  , d:"30 min"     , n:"Game Night: Dynamic Duos"                                , v:"Explorer's Lounge"         , deck:"2" },
    { day:1, t:"8:30 PM"  , d:"45 min"     , n:"Rolling Stone Lounge Band Plays Classic Rock n Roll"     , v:"Rolling Stone Lounge"      , deck:"2" },
    { day:1, t:"9:00 PM"  , d:"45 min"     , n:"Young Adult Meetup"                                      , v:"Gallery Bar"               , deck:"2" },
    { day:1, t:"9:15 PM"  , d:"45 min"     , n:"Billboard Onboard Plays Coming to America"               , v:"Billboard Onboard"         , deck:"2" },
    { day:1, t:"9:30 PM"  , d:"45 min"     , n:"Rolling Stone Lounge Band Plays Rock the Yacht"          , v:"Rolling Stone Lounge"      , deck:"2" },
    { day:1, t:"10:15 PM" , d:"45 min"     , n:"Billboard Onboard Plays All Requests"                    , v:"Billboard Onboard"         , deck:"2" },
    { day:1, t:"10:30 PM" , d:"45 min"     , n:"Rolling Stone Lounge Band Plays Liverpool Sounds"        , v:"Rolling Stone Lounge"      , deck:"2" },
    { day:1, t:"11:15 PM" , d:"45 min"     , n:"Dance to the Hits"                                       , v:"Rolling Stone Lounge"      , deck:"2" },
    { day:2, t:"7:00 AM"  , d:"30 min"     , n:"Walk a Mile"                                             , v:"Ocean Bar"                 , deck:"3" },
    { day:2, t:"7:00 AM"  , d:"30 min"     , n:"Stretch & Release"                                       , v:"Fitness Center"            , deck:"9" },
    { day:2, t:"8:00 AM"  , d:"16 hours"   , n:"Crosswords & Number Puzzles are Available"               , v:"Atrium"                    , deck:"1" },
    { day:2, t:"8:00 AM"  , d:"45 min"     , n:"Tour de Cycle ($20)"                                     , v:"Fitness Center"            , deck:"9" },
    { day:2, t:"8:00 AM"  , d:"1 hour"     , n:"Pickleball Open Play"                                    , v:"Sport Court"               , deck:"11" },
    { day:2, t:"8:00 AM"  , d:"45 min"     , n:"Morning Catholic Prayer"                                 , v:"Explorer's Lounge"         , deck:"2" },
    { day:2, t:"8:00 AM"  , d:"30 min"     , n:"Tai Chi for Everyone"                                    , v:"Lido Poolside"             , deck:"9" },
    { day:2, t:"9:00 AM"  , d:"45 min"     , n:"Pickleball Instruction: The Basics"                      , v:"Sport Court"               , deck:"11" },
    { day:2, t:"9:00 AM"  , d:"45 min"     , n:"Interdenominational Service"                             , v:"Explorer's Lounge"         , deck:"2" },
    { day:2, t:"9:30 AM"  , d:"30 min"     , n:"Better Sleep, More Energy with Acupuncture"              , v:"Spa & Salon"               , deck:"9" },
    { day:2, t:"9:30 AM"  , d:"45 min"     , n:"Watercoloring: Flower Bouquet"                           , v:"Art Studio"                , deck:"10" },
    { day:2, t:"10:00 AM" , d:"45 min"     , n:"Explore with Shore Excursions"                           , v:"World Stage"               , deck:"3" },
    { day:2, t:"10:00 AM" , d:"1 hour"     , n:"Merabella Mimosa Mornings with EFFY"                     , v:"Effy Jewelry"              , deck:"3" },
    { day:2, t:"10:00 AM" , d:"30 min"     , n:"Secrets to Tighter, Smoother Looking Skin"               , v:"Spa & Salon"               , deck:"9" },
    { day:2, t:"10:30 AM" , d:"2.5 hours"  , n:"Party Bridge Play until 1:00pm"                          , v:"Upper Dining Room"         , deck:"3" },
    { day:2, t:"10:30 AM" , d:"3.5 hours"  , n:"Mahjong Players Meet until 2:00pm"                       , v:"Game Room"                 , deck:"10" },
    { day:2, t:"11:00 AM" , d:"45 min"     , n:"Canada UpClose: The Great North"                         , v:"World Stage"               , deck:"3" },
    { day:2, t:"11:00 AM" , d:"45 min"     , n:"The Art of Flower Arranging"                             , v:"Ocean Bar"                 , deck:"3" },
    { day:2, t:"11:00 AM" , d:"13 hours"   , n:"Crosswords & Number Puzzles are Available"               , v:"Library"                   , deck:"3" },
    { day:2, t:"11:30 AM" , d:"45 min"     , n:"Watercoloring: Flower Bouquet"                           , v:"Art Studio"                , deck:"10" },
    { day:2, t:"12:00 PM" , d:"1 hour"     , n:"Single & Solo Traveler Lunch"                            , v:"Lower Dining Room"         , deck:"2" },
    { day:2, t:"12:00 PM" , d:"30 min"     , n:"The Shopping Show"                                       , v:"Rolling Stone Lounge"      , deck:"2" },
    { day:2, t:"12:30 PM" , d:"1 hour"     , n:"EFFY Shopping Spree"                                     , v:"Effy Jewelry"              , deck:"3" },
    { day:2, t:"1:00 PM"  , d:"30 min"     , n:"Tech for Travelers: When in Port"                        , v:"Explorer's Lounge"         , deck:"2" },
    { day:2, t:"2:00 PM"  , d:"1 hour"     , n:"Walking in Comfort"                                      , v:"Fitness Center"            , deck:"9" },
    { day:2, t:"2:00 PM"  , d:"45 min"     , n:"Vivace Duo Plays"                                        , v:"Explorer's Lounge"         , deck:"2" },
    { day:2, t:"2:00 PM"  , d:"30 min"     , n:"Guests vs. Officers Cornhole"                            , v:"Lido Poolside"             , deck:"9" },
    { day:2, t:"2:00 PM"  , d:"45 min"     , n:"Celtic Instrumentalist Plays"                            , v:"Crow's Nest"               , deck:"10" },
    { day:2, t:"2:00 PM"  , d:"30 min"     , n:"Port Talk: Charlottetown & Sydney"                       , v:"Rolling Stone Lounge"      , deck:"2" },
    { day:2, t:"2:00 PM"  , d:"1 hour"     , n:"Eco-Drive Watch Extravaganza"                            , v:"The Shops"                 , deck:"3" },
    { day:2, t:"3:00 PM"  , d:"30 min"     , n:"Tighten your Skin with Thermage"                         , v:"Spa & Salon"               , deck:"9" },
    { day:2, t:"3:00 PM"  , d:"30 min"     , n:"Soccer Goal Scoring Competition"                         , v:"Sport Court"               , deck:"11" },
    { day:2, t:"3:00 PM"  , d:"1 hour"     , n:"Over $1,000 Jackpot Bingo: Tickets on Sale at 2:00pm"    , v:"Billboard Onboard"         , deck:"2" },
    { day:2, t:"3:00 PM"  , d:"30 min"     , n:"Diamond & Gemstone Enrichment Seminar"                   , v:"Hudson Room"               , deck:"3" },
    { day:2, t:"3:00 PM"  , d:"45 min"     , n:"Tea Time with Vivace Duo"                                , v:"Upper Dining Room"         , deck:"3" },
    { day:2, t:"4:00 PM"  , d:null         , n:"Over $625,000 Paradise Lotto Jackpot Drawing"            , v:"Casino"                    , deck:"2" },
    { day:2, t:"4:00 PM"  , d:"45 min"     , n:"Friends of Bill W. Meet"                                 , v:"Explorer's Lounge"         , deck:"2" },
    { day:2, t:"4:00 PM"  , d:"45 min"     , n:"Team Trivia Challenge"                                   , v:"Billboard Onboard"         , deck:"2" },
    { day:2, t:"4:00 PM"  , d:"30 min"     , n:"Natural Relief for Arthritis, Back and Knee Pain"        , v:"Hudson Room"               , deck:"3" },
    { day:2, t:"4:15 PM"  , d:"45 min"     , n:"Contemporary Guitarist Plays"                            , v:"Crow's Nest"               , deck:"10" },
    { day:2, t:"4:30 PM"  , d:"1 hour"     , n:"Pure Form Yoga ($20)"                                    , v:"Fitness Center"            , deck:"9" },
    { day:2, t:"4:30 PM"  , d:"45 min"     , n:"Origami Folding: 3D Heart"                               , v:"Art Studio"                , deck:"10" },
    { day:2, t:"5:00 PM"  , d:"1 hour"     , n:"Pickleball Open Play"                                    , v:"Sport Court"               , deck:"11" },
    { day:2, t:"5:00 PM"  , d:"4 hours"    , n:"ViaMar Fashion Rings: 3 for $55"                         , v:"The Shops"                 , deck:"3" },
    { day:2, t:"5:15 PM"  , d:"45 min"     , n:"Contemporary Pianist Plays"                              , v:"Crow's Nest"               , deck:"10" },
    { day:2, t:"6:00 PM"  , d:"30 min"     , n:"Evening Stretch"                                         , v:"Fitness Center"            , deck:"9" },
    { day:2, t:"6:00 PM"  , d:"45 min"     , n:"Billboard Onboard Plays Cocktail Jazz Instrumental"      , v:"Billboard Onboard"         , deck:"2" },
    { day:2, t:"6:00 PM"  , d:"45 min"     , n:"Singles & Solo Travelers Meetup"                         , v:"Gallery Bar"               , deck:"2" },
    { day:2, t:"6:30 PM"  , d:"45 min"     , n:"Celtic Instrumentalist Plays"                            , v:"Crow's Nest"               , deck:"10" },
    { day:2, t:"7:00 PM"  , d:"45 min"     , n:"Vivace Duo Plays"                                        , v:"Explorer's Lounge"         , deck:"2" },
    { day:2, t:"7:00 PM"  , d:"30 min"     , n:"Music Trivia: 50s & 60s"                                 , v:"Billboard Onboard"         , deck:"2" },
    { day:2, t:"7:00 PM"  , d:"45 min"     , n:"PRIDE Meetup"                                            , v:"Gallery Bar"               , deck:"2" },
    { day:2, t:"7:30 PM"  , d:"45 min"     , n:"The Dam Band Plays"                                      , v:"Ocean Bar"                 , deck:"3" },
    { day:2, t:"7:30 PM"  , d:"45 min"     , n:"Celtic Instrumentalist Plays"                            , v:"Crow's Nest"               , deck:"10" },
    { day:2, t:"8:15 PM"  , d:"45 min"     , n:"Billboard Onboard Plays The 1960s"                       , v:"Billboard Onboard"         , deck:"2" },
    { day:2, t:"8:30 PM"  , d:"1 hour"     , n:"REVERIE Diamond Collection Showcase"                     , v:"Effy Jewelry"              , deck:"3" },
    { day:2, t:"8:30 PM"  , d:"45 min"     , n:"The Dam Band Plays"                                      , v:"Ocean Bar"                 , deck:"3" },
    { day:2, t:"8:30 PM"  , d:"45 min"     , n:"Game Night: Don't Look Now"                              , v:"Explorer's Lounge"         , deck:"2" },
    { day:2, t:"8:30 PM"  , d:"45 min"     , n:"Rolling Stone Lounge Band Plays Liverpool Sounds"        , v:"Rolling Stone Lounge"      , deck:"2" },
    { day:2, t:"9:00 PM"  , d:"45 min"     , n:"Young Adult Meetup"                                      , v:"Gallery Bar"               , deck:"2" },
    { day:2, t:"9:15 PM"  , d:"45 min"     , n:"Billboard Onboard Plays One-Hit Wonders"                 , v:"Billboard Onboard"         , deck:"2" },
    { day:2, t:"9:30 PM"  , d:"45 min"     , n:"Rolling Stone Lounge Band Plays Classic Rock n Roll"     , v:"Rolling Stone Lounge"      , deck:"2" },
    { day:2, t:"10:15 PM" , d:"45 min"     , n:"Billboard Onboard Plays All Requests"                    , v:"Billboard Onboard"         , deck:"2" },
    { day:2, t:"10:30 PM" , d:"45 min"     , n:"Rolling Stone Lounge Band Plays Rock the Yacht"          , v:"Rolling Stone Lounge"      , deck:"2" },
    { day:2, t:"11:00 PM" , d:null         , n:"Over $625,000 Paradise Lotto Jackpot Drawing"            , v:"Casino"                    , deck:"2" },
    { day:2, t:"11:15 PM" , d:"45 min"     , n:"Dance to the Hits"                                       , v:"Rolling Stone Lounge"      , deck:"2" },
    { day:2, t:"11:59 PM" , d:null         , n:"Stay and Play Slots All Night"                           , v:"Casino"                    , deck:"2" },
    { day:3, t:"7:00 AM"  , d:"30 min"     , n:"Walk a Mile"                                             , v:"Ocean Bar"                 , deck:"3" },
    { day:3, t:"7:00 AM"  , d:"30 min"     , n:"Abs Class"                                               , v:"Fitness Center"            , deck:"9" },
    { day:3, t:"8:00 AM"  , d:"16 hours"   , n:"Crosswords & Number Puzzles are Available"               , v:"Atrium"                    , deck:"1" },
    { day:3, t:"8:00 AM"  , d:"45 min"     , n:"Tour de Cycle ($20)"                                     , v:"Fitness Center"            , deck:"9" },
    { day:3, t:"8:00 AM"  , d:"1 hour"     , n:"Pickleball Open Play"                                    , v:"Sport Court"               , deck:"11" },
    { day:3, t:"8:00 AM"  , d:"45 min"     , n:"Morning Catholic Prayer"                                 , v:"Explorer's Lounge"         , deck:"2" },
    { day:3, t:"8:00 AM"  , d:"30 min"     , n:"Tai Chi for Everyone"                                    , v:"Lido Poolside"             , deck:"9" },
    { day:3, t:"9:00 AM"  , d:"3 hours"    , n:"Zuiderdam Marketplace"                                   , v:"The Shops"                 , deck:"3" },
    { day:3, t:"9:30 AM"  , d:"30 min"     , n:"Stretch & Release"                                       , v:"Fitness Center"            , deck:"9" },
    { day:3, t:"9:30 AM"  , d:"45 min"     , n:"Watercoloring: Birds"                                    , v:"Art Studio"                , deck:"10" },
    { day:3, t:"9:30 AM"  , d:"30 min"     , n:"Learn to Line Dance"                                     , v:"Rolling Stone Lounge"      , deck:"2" },
    { day:3, t:"10:00 AM" , d:"45 min"     , n:"Holland America Line's Origin Story"                     , v:"World Stage"               , deck:"3" },
    { day:3, t:"10:00 AM" , d:"1 hour"     , n:"Merabella Mimosa Mornings with EFFY"                     , v:"Effy Jewelry"              , deck:"3" },
    { day:3, t:"10:00 AM" , d:"30 min"     , n:"Pain Management with Acupuncture"                        , v:"Hudson Room"               , deck:"3" },
    { day:3, t:"10:30 AM" , d:"1 hour"     , n:"Sweet Luxuries: Le Vian Experience"                      , v:"Effy Jewelry"              , deck:"3" },
    { day:3, t:"10:30 AM" , d:"30 min"     , n:"Look 10 Years Younger"                                   , v:"Hudson Room"               , deck:"3" },
    { day:3, t:"10:30 AM" , d:"2.5 hours"  , n:"Party Bridge Play until 1:00pm"                          , v:"Upper Dining Room"         , deck:"3" },
    { day:3, t:"11:00 AM" , d:"1 hour"     , n:"Increase Your Metabolism Seminar"                        , v:"Fitness Center"            , deck:"9" },
    { day:3, t:"11:00 AM" , d:"45 min"     , n:"Win a Cruise Bingo: Tickets On Sale at 10:00am"          , v:"Billboard Onboard"         , deck:"2" },
    { day:3, t:"12:00 PM" , d:"1 hour"     , n:"Deal or No Deal Card Sales"                              , v:"Rolling Stone Lounge"      , deck:"2" },
    { day:3, t:"12:30 PM" , d:"30 min"     , n:"Complimentary Massage Sampler"                           , v:"Spa & Salon"               , deck:"9" },
    { day:3, t:"1:00 PM"  , d:"45 min"     , n:"Celtic Instrumentalist Plays"                            , v:"Ocean Bar"                 , deck:"3" },
    { day:3, t:"1:00 PM"  , d:"30 min"     , n:"Towel Folding Demonstration"                             , v:"Explorer's Lounge"         , deck:"2" },
    { day:3, t:"1:00 PM"  , d:"45 min"     , n:"Knitter's Meetup"                                        , v:"Art Studio"                , deck:"10" },
    { day:3, t:"1:30 PM"  , d:"1 hour"     , n:"The Lido Fair"                                           , v:"Lido Poolside"             , deck:"9" },
    { day:3, t:"1:30 PM"  , d:"2.5 hours"  , n:"Time is Running Out Watch Sale"                          , v:"The Shops"                 , deck:"3" },
    { day:3, t:"2:00 PM"  , d:"30 min"     , n:"Live EFFY Jewelry Auction"                               , v:"Effy Jewelry"              , deck:"3" },
    { day:3, t:"2:00 PM"  , d:"45 min"     , n:"Celtic Instrumentalist Plays"                            , v:"Ocean Bar"                 , deck:"3" },
    { day:3, t:"2:00 PM"  , d:"1 hour"     , n:"Relieving Back Pain"                                     , v:"Fitness Center"            , deck:"9" },
    { day:3, t:"2:00 PM"  , d:"30 min"     , n:"Port Talk: Halifax & Portland"                           , v:"Rolling Stone Lounge"      , deck:"2" },
    { day:3, t:"3:00 PM"  , d:"2 hours"    , n:"Ask Your Travel Guide"                                   , v:"Atrium"                    , deck:"1" },
    { day:3, t:"3:00 PM"  , d:"45 min"     , n:"Friends of Bill W. Meet"                                 , v:"Explorer's Lounge"         , deck:"2" },
    { day:3, t:"3:00 PM"  , d:"1 hour"     , n:"Final Jackpot Bingo & Win A Cruise Lottery"              , v:"Billboard Onboard"         , deck:"2" },
    { day:3, t:"3:00 PM"  , d:"45 min"     , n:"Tea Time with Vivace Duo"                                , v:"Upper Dining Room"         , deck:"3" },
    { day:3, t:"3:00 PM"  , d:"45 min"     , n:"English Afternoon Tea"                                   , v:"Upper Dining Room"         , deck:"3" },
    { day:3, t:"3:00 PM"  , d:"2.75 hours" , n:"Today's Movie: F1: The Movie"                            , v:"Rolling Stone Lounge"      , deck:"2" },
    { day:3, t:"3:30 PM"  , d:"45 min"     , n:"Ship Scavenger Hunt"                                     , v:"Atrium"                    , deck:"1" },
    { day:3, t:"3:30 PM"  , d:"45 min"     , n:"Creating Doodle Designs: Corner Point"                   , v:"Art Studio"                , deck:"10" },
    { day:3, t:"3:30 PM"  , d:"30 min"     , n:"Advanced Facial Rejuvenation"                            , v:"Hudson Room"               , deck:"3" },
    { day:3, t:"4:00 PM"  , d:null         , n:"Over $625,000 Paradise Lotto Jackpot Drawing"            , v:"Casino"                    , deck:"2" },
    { day:3, t:"4:00 PM"  , d:"45 min"     , n:"Vivace Pianist Plays"                                    , v:"Explorer's Lounge"         , deck:"2" },
    { day:3, t:"4:00 PM"  , d:"30 min"     , n:"Diabetes, Weight Loss and Chinese Herbs"                 , v:"Hudson Room"               , deck:"3" },
    { day:3, t:"4:00 PM"  , d:"45 min"     , n:"Ping Pong Tournament"                                    , v:"Lido Poolside"             , deck:"9" },
    { day:3, t:"4:30 PM"  , d:"45 min"     , n:"Modern Calligraphy: Doorhangers"                         , v:"Art Studio"                , deck:"10" },
    { day:3, t:"4:30 PM"  , d:"45 min"     , n:"Vivace Cellist Plays"                                    , v:"Ocean Bar"                 , deck:"3" },
    { day:3, t:"5:00 PM"  , d:"1 hour"     , n:"Pure Form Pilates ($20)"                                 , v:"Fitness Center"            , deck:"9" },
    { day:3, t:"5:00 PM"  , d:"1 hour"     , n:"Pickleball Open Play"                                    , v:"Sport Court"               , deck:"11" },
    { day:3, t:"5:00 PM"  , d:"2 hours"    , n:"Effy Beauty: Gift with Purchase"                         , v:"The Shops"                 , deck:"3" },
    { day:3, t:"6:00 PM"  , d:"45 min"     , n:"Singles & Solo Travelers Meetup"                         , v:"Gallery Bar"               , deck:"2" },
    { day:3, t:"6:00 PM"  , d:"1 hour"     , n:"Ballroom Dance Hour"                                     , v:"Rolling Stone Lounge"      , deck:"2" },
    { day:3, t:"6:30 PM"  , d:"45 min"     , n:"Celtic Instrumentalist Plays"                            , v:"Ocean Bar"                 , deck:"3" },
    { day:3, t:"7:00 PM"  , d:"30 min"     , n:"Music Trivia: Country"                                   , v:"Billboard Onboard"         , deck:"2" },
    { day:3, t:"7:00 PM"  , d:"45 min"     , n:"PRIDE Meetup"                                            , v:"Gallery Bar"               , deck:"2" },
    { day:3, t:"7:00 PM"  , d:"2 hours"    , n:"Save 10% On Swarovski Jewelry"                           , v:"The Shops"                 , deck:"3" },
    { day:3, t:"7:15 PM"  , d:"45 min"     , n:"Rolling Stone Lounge Band Plays Liverpool Sounds"        , v:"Rolling Stone Lounge"      , deck:"2" },
    { day:3, t:"7:30 PM"  , d:"45 min"     , n:"Celtic Instrumentalist Plays"                            , v:"Ocean Bar"                 , deck:"3" },
    { day:3, t:"8:15 PM"  , d:"45 min"     , n:"Rolling Stone Lounge Band Plays Classic Rock n Roll"     , v:"Rolling Stone Lounge"      , deck:"2" },
    { day:3, t:"8:30 PM"  , d:"1 hour"     , n:"Ladies Sip and Save"                                     , v:"Effy Jewelry"              , deck:"3" },
    { day:3, t:"8:30 PM"  , d:"45 min"     , n:"Vivace Cellist Plays"                                    , v:"Ocean Bar"                 , deck:"3" },
    { day:3, t:"8:30 PM"  , d:"45 min"     , n:"Game Show: Majority Rules"                               , v:"Billboard Onboard"         , deck:"2" },
    { day:3, t:"9:00 PM"  , d:"45 min"     , n:"Young Adult Meetup"                                      , v:"Gallery Bar"               , deck:"2" },
    { day:3, t:"9:45 PM"  , d:"45 min"     , n:"Rolling Stone Lounge Band Plays Rock the Yacht"          , v:"Rolling Stone Lounge"      , deck:"2" },
    { day:3, t:"10:45 PM" , d:"45 min"     , n:"Rolling Stone Lounge Band Plays Liverpool Sounds"        , v:"Rolling Stone Lounge"      , deck:"2" },
    { day:4, t:"7:00 AM"  , d:"30 min"     , n:"Stretch & Release"                                       , v:"Fitness Center"            , deck:"9" },
    { day:4, t:"8:00 AM"  , d:"16 hours"   , n:"Crosswords & Number Puzzles are Available"               , v:"Atrium"                    , deck:"1" },
    { day:4, t:"8:00 AM"  , d:"1 hour"     , n:"Pickleball Open Play"                                    , v:"Sport Court"               , deck:"11" },
    { day:4, t:"8:00 AM"  , d:"30 min"     , n:"Tai Chi for Everyone"                                    , v:"Lido Poolside"             , deck:"9" },
    { day:4, t:"9:00 AM"  , d:"30 min"     , n:"Golf Putting"                                            , v:"Lido Poolside"             , deck:"9" },
    { day:4, t:"9:30 AM"  , d:"45 min"     , n:"Coloring for Adults"                                     , v:"Art Studio"                , deck:"10" },
    { day:4, t:"10:00 AM" , d:"30 min"     , n:"Around the World Basketball"                             , v:"Sport Court"               , deck:"11" },
    { day:4, t:"11:00 AM" , d:"30 min"     , n:"All about Eyes"                                          , v:"Spa & Salon"               , deck:"9" },
    { day:4, t:"11:30 AM" , d:"30 min"     , n:"Complimentary Massage Sampler"                           , v:"Spa & Salon"               , deck:"9" },
    { day:4, t:"1:00 PM"  , d:"30 min"     , n:"Today's Trivia: Flags"                                   , v:"Billboard Onboard"         , deck:"2" },
    { day:4, t:"1:00 PM"  , d:"45 min"     , n:"Knitter's Meetup"                                        , v:"Art Studio"                , deck:"10" },
    { day:4, t:"1:00 PM"  , d:"3 hours"    , n:"Mahjong Players Meet until 4:00pm"                       , v:"Game Room"                 , deck:"10" },
    { day:4, t:"1:00 PM"  , d:"2.5 hours"  , n:"Today's Movie: Wuthering Heights"                        , v:"Rolling Stone Lounge"      , deck:"2" },
    { day:4, t:"2:00 PM"  , d:"45 min"     , n:"Celtic Instrumentalist Plays"                            , v:"Ocean Bar"                 , deck:"3" },
    { day:4, t:"2:30 PM"  , d:"5.5 hours"  , n:"Visit the Thermal Suite & Hydropool"                     , v:"Spa & Salon"               , deck:"9" },
    { day:4, t:"3:00 PM"  , d:"30 min"     , n:"Cornhole Challenge"                                      , v:"Lido Poolside"             , deck:"9" },
    { day:4, t:"3:00 PM"  , d:"1 hour"     , n:"Walking in Comfort"                                      , v:"Fitness Center"            , deck:"9" },
    { day:4, t:"3:00 PM"  , d:"45 min"     , n:"Vivace Duo Plays"                                        , v:"Explorer's Lounge"         , deck:"2" },
    { day:4, t:"3:00 PM"  , d:"45 min"     , n:"Friends of Bill W. Meet"                                 , v:"Explorer's Lounge"         , deck:"2" },
    { day:4, t:"3:30 PM"  , d:"45 min"     , n:"Creating Doodle Designs: Jar of Dreams"                  , v:"Art Studio"                , deck:"10" },
    { day:4, t:"4:00 PM"  , d:"45 min"     , n:"The Dam Band Plays"                                      , v:"Ocean Bar"                 , deck:"3" },
    { day:4, t:"4:00 PM"  , d:"1 hour"     , n:"Eat More to Weigh Less"                                  , v:"Fitness Center"            , deck:"9" },
    { day:4, t:"4:00 PM"  , d:"45 min"     , n:"Vivace Duo Plays"                                        , v:"Explorer's Lounge"         , deck:"2" },
    { day:4, t:"4:00 PM"  , d:"45 min"     , n:"Team Trivia Challenge"                                   , v:"Billboard Onboard"         , deck:"2" },
    { day:4, t:"4:30 PM"  , d:"45 min"     , n:"Origami Folding: Fish"                                   , v:"Art Studio"                , deck:"10" },
    { day:4, t:"4:30 PM"  , d:"30 min"     , n:"Acupuncture: A Life-Changing Introduction"               , v:"Hudson Room"               , deck:"3" },
    { day:4, t:"5:00 PM"  , d:"1 hour"     , n:"Pure Form Yoga ($20)"                                    , v:"Fitness Center"            , deck:"9" },
    { day:4, t:"5:00 PM"  , d:"1 hour"     , n:"Pickleball Open Play"                                    , v:"Sport Court"               , deck:"11" },
    { day:4, t:"5:00 PM"  , d:"1 hour"     , n:"It's Karaoke Time!"                                      , v:"Rolling Stone Lounge"      , deck:"2" },
    { day:4, t:"5:15 PM"  , d:"45 min"     , n:"Evening Catholic Prayer"                                 , v:"Explorer's Lounge"         , deck:"2" },
    { day:4, t:"6:00 PM"  , d:"45 min"     , n:"Celtic Instrumentalist Plays"                            , v:"Ocean Bar"                 , deck:"3" },
    { day:4, t:"6:00 PM"  , d:"30 min"     , n:"Evening Stretch"                                         , v:"Fitness Center"            , deck:"9" },
    { day:4, t:"6:00 PM"  , d:"45 min"     , n:"Singles & Solo Travelers Meetup"                         , v:"Gallery Bar"               , deck:"2" },
    { day:4, t:"6:00 PM"  , d:"2 hours"    , n:"Shinola Watches: American Made"                          , v:"The Shops"                 , deck:"3" },
    { day:4, t:"7:00 PM"  , d:"1 hour"     , n:"Ladies' Night in the Thermal Suite"                      , v:"Spa & Salon"               , deck:"9" },
    { day:4, t:"7:00 PM"  , d:"45 min"     , n:"Vivace Duo Plays"                                        , v:"Explorer's Lounge"         , deck:"2" },
    { day:4, t:"7:00 PM"  , d:"30 min"     , n:"Music Trivia: Rock n Roll"                               , v:"Billboard Onboard"         , deck:"2" },
    { day:4, t:"7:00 PM"  , d:"45 min"     , n:"PRIDE Meetup"                                            , v:"Gallery Bar"               , deck:"2" },
    { day:4, t:"8:00 PM"  , d:"2 hours"    , n:"Heat Wave Hot Seats"                                     , v:"Casino"                    , deck:"2" },
    { day:4, t:"8:00 PM"  , d:"2 hours"    , n:"Joseph Ribkoff Collection: 70% Off Select Styles"        , v:"The Shops"                 , deck:"3" },
    { day:4, t:"8:15 PM"  , d:"45 min"     , n:"Billboard Onboard Plays The 1960s"                       , v:"Billboard Onboard"         , deck:"2" },
    { day:4, t:"8:15 PM"  , d:"45 min"     , n:"Breton Thunder: Ma's Kitchen Party"                      , v:"Rolling Stone Lounge"      , deck:"2" },
    { day:4, t:"8:30 PM"  , d:"1 hour"     , n:"King of Color: Watercolors Event"                        , v:"Effy Jewelry"              , deck:"3" },
    { day:4, t:"8:30 PM"  , d:"45 min"     , n:"The Dam Band Plays"                                      , v:"Ocean Bar"                 , deck:"3" },
    { day:4, t:"8:30 PM"  , d:"45 min"     , n:"Game Night: Tone Deaf Ditty"                             , v:"Explorer's Lounge"         , deck:"2" },
    { day:4, t:"9:00 PM"  , d:"45 min"     , n:"Young Adult Meetup"                                      , v:"Gallery Bar"               , deck:"2" },
    { day:4, t:"9:30 PM"  , d:"45 min"     , n:"Breton Thunder: Ma's Kitchen Party"                      , v:"Rolling Stone Lounge"      , deck:"2" },
    { day:4, t:"9:45 PM"  , d:"45 min"     , n:"Billboard Onboard Plays One-Hit Wonders"                 , v:"Billboard Onboard"         , deck:"2" },
    { day:4, t:"10:45 PM" , d:"45 min"     , n:"Billboard Onboard Plays All Requests"                    , v:"Billboard Onboard"         , deck:"2" },
    { day:4, t:"11:00 PM" , d:null         , n:"Over $625,000 Paradise Lotto Jackpot Drawing"            , v:"Casino"                    , deck:"2" },
    { day:5, t:"7:00 AM"  , d:"1 hour"     , n:"Tour de Cycle ($20)"                                     , v:"Fitness Center"            , deck:"9" },
    { day:5, t:"8:00 AM"  , d:"16 hours"   , n:"Crosswords & Number Puzzles are Available"               , v:"Atrium"                    , deck:"1" },
    { day:5, t:"8:00 AM"  , d:"9 hours"    , n:"Spa Special: The Perfect Day"                            , v:"Spa & Salon"               , deck:"9" },
    { day:5, t:"8:00 AM"  , d:"1 hour"     , n:"Pickleball Open Play"                                    , v:"Sport Court"               , deck:"11" },
    { day:5, t:"8:00 AM"  , d:"30 min"     , n:"Tai Chi for Everyone"                                    , v:"Lido Poolside"             , deck:"9" },
    { day:5, t:"9:00 AM"  , d:"4 hours"    , n:"Visit the Thermal Suite & Hydropool"                     , v:"Spa & Salon"               , deck:"9" },
    { day:5, t:"9:00 AM"  , d:"30 min"     , n:"Let's Play Ladder Ball"                                  , v:"Lido Poolside"             , deck:"9" },
    { day:5, t:"9:30 AM"  , d:"30 min"     , n:"Sunrise Stretch"                                         , v:"Fitness Center"            , deck:"9" },
    { day:5, t:"9:30 AM"  , d:"45 min"     , n:"Coloring for Adults"                                     , v:"Art Studio"                , deck:"10" },
    { day:5, t:"10:00 AM" , d:"30 min"     , n:"Basketball Knockout"                                     , v:"Sport Court"               , deck:"11" },
    { day:5, t:"10:30 AM" , d:"45 min"     , n:"Origami Folding: Butterfly"                              , v:"Art Studio"                , deck:"10" },
    { day:5, t:"10:30 AM" , d:"3.5 hours"  , n:"Party Bridge Play until 4:00pm"                          , v:"Upper Dining Room"         , deck:"3" },
    { day:5, t:"11:00 AM" , d:"13 hours"   , n:"Crosswords & Number Puzzles are Available"               , v:"Library"                   , deck:"3" },
    { day:5, t:"11:30 AM" , d:"30 min"     , n:"Complimentary Massage Sampler"                           , v:"Spa & Salon"               , deck:"9" },
    { day:5, t:"1:00 PM"  , d:"30 min"     , n:"Today's Trivia: Movies"                                  , v:"Billboard Onboard"         , deck:"2" },
    { day:5, t:"1:00 PM"  , d:"45 min"     , n:"Knitter's Meetup"                                        , v:"Art Studio"                , deck:"10" },
    { day:5, t:"1:00 PM"  , d:"3 hours"    , n:"Mahjong Players Meet until 4:00pm"                       , v:"Game Room"                 , deck:"10" },
    { day:5, t:"2:00 PM"  , d:"45 min"     , n:"Celtic Instrumentalist Plays"                            , v:"Crow's Nest"               , deck:"10" },
    { day:5, t:"2:00 PM"  , d:"3.5 hours"  , n:"Today's Movie: Avatar: Fire & Ash"                       , v:"Rolling Stone Lounge"      , deck:"2" },
    { day:5, t:"3:00 PM"  , d:"1 hour"     , n:"Eat More to Weigh Less"                                  , v:"Fitness Center"            , deck:"9" },
    { day:5, t:"3:00 PM"  , d:"30 min"     , n:"Sjoelen Tournament"                                      , v:"Lido Poolside"             , deck:"9" },
    { day:5, t:"3:30 PM"  , d:"45 min"     , n:"Modern Calligraphy: Bookmarks"                           , v:"Art Studio"                , deck:"10" },
    { day:5, t:"3:30 PM"  , d:"30 min"     , n:"Wrinkle Remedies Seminar"                                , v:"Hudson Room"               , deck:"3" },
    { day:5, t:"4:00 PM"  , d:"30 min"     , n:"Arthritis, Acute and Chronic Pain Relief"                , v:"Hudson Room"               , deck:"3" },
    { day:5, t:"4:00 PM"  , d:"45 min"     , n:"Celtic Instrumentalist Plays"                            , v:"Crow's Nest"               , deck:"10" },
    { day:5, t:"4:30 PM"  , d:"30 min"     , n:"The Greenhouse Spa & Salon Raffle Drawing"               , v:"Fitness Center"            , deck:"9" },
    { day:5, t:"4:30 PM"  , d:"45 min"     , n:"Origami Folding: Butterfly"                              , v:"Art Studio"                , deck:"10" },
    { day:5, t:"5:00 PM"  , d:"45 min"     , n:"Vivace Cellist Plays"                                    , v:"Ocean Bar"                 , deck:"3" },
    { day:5, t:"5:00 PM"  , d:"1 hour"     , n:"Pure Form Pilates ($20)"                                 , v:"Fitness Center"            , deck:"9" },
    { day:5, t:"5:00 PM"  , d:"1 hour"     , n:"Pickleball Open Play"                                    , v:"Sport Court"               , deck:"11" },
    { day:5, t:"5:00 PM"  , d:"30 min"     , n:"New England Seafood Boil ($35)"                          , v:"Lido Market"               , deck:"9" },
    { day:5, t:"5:15 PM"  , d:"45 min"     , n:"Evening Catholic Prayer"                                 , v:"Explorer's Lounge"         , deck:"2" },
    { day:5, t:"5:30 PM"  , d:"1 hour"     , n:"Ballroom Dance Hour"                                     , v:"Rolling Stone Lounge"      , deck:"2" },
    { day:5, t:"6:00 PM"  , d:"30 min"     , n:"Evening Stretch"                                         , v:"Fitness Center"            , deck:"9" },
    { day:5, t:"6:00 PM"  , d:"45 min"     , n:"Singles & Solo Travelers Meetup"                         , v:"Gallery Bar"               , deck:"2" },
    { day:5, t:"6:00 PM"  , d:"45 min"     , n:"Celtic Instrumentalist Plays"                            , v:"Crow's Nest"               , deck:"10" },
    { day:5, t:"7:00 PM"  , d:"1 hour"     , n:"Ladies' Night in the Thermal Suite"                      , v:"Spa & Salon"               , deck:"9" },
    { day:5, t:"7:00 PM"  , d:"45 min"     , n:"Vivace Pianist Plays"                                    , v:"Explorer's Lounge"         , deck:"2" },
    { day:5, t:"7:00 PM"  , d:"30 min"     , n:"Music Trivia: Hits of the 80's"                          , v:"Billboard Onboard"         , deck:"2" },
    { day:5, t:"7:00 PM"  , d:"45 min"     , n:"PRIDE Meetup"                                            , v:"Gallery Bar"               , deck:"2" },
    { day:5, t:"7:00 PM"  , d:"30 min"     , n:"New England Seafood Boil ($35)"                          , v:"Lido Market"               , deck:"9" },
    { day:5, t:"7:00 PM"  , d:"1 hour"     , n:"L&Co Watch Sets ($25)"                                   , v:"The Shops"                 , deck:"3" },
    { day:5, t:"8:00 PM"  , d:"2 hours"    , n:"Paint Dunes at Dusk on Canvas ($25)"                     , v:"Art Studio"                , deck:"10" },
    { day:5, t:"8:15 PM"  , d:"45 min"     , n:"Billboard Onboard Plays The 1960s"                       , v:"Billboard Onboard"         , deck:"2" },
    { day:5, t:"8:30 PM"  , d:"1 hour"     , n:"Nahla Tanzanite Reveal"                                  , v:"Effy Jewelry"              , deck:"3" },
    { day:5, t:"8:30 PM"  , d:"45 min"     , n:"Vivace Cellist Plays"                                    , v:"Ocean Bar"                 , deck:"3" },
    { day:5, t:"8:30 PM"  , d:"30 min"     , n:"Game Night: La La Land"                                  , v:"Explorer's Lounge"         , deck:"2" },
    { day:5, t:"8:30 PM"  , d:"45 min"     , n:"Rolling Stone Lounge Band Plays Rock the Yacht"          , v:"Rolling Stone Lounge"      , deck:"2" },
    { day:5, t:"9:00 PM"  , d:"45 min"     , n:"Young Adult Meetup"                                      , v:"Gallery Bar"               , deck:"2" },
    { day:5, t:"9:15 PM"  , d:"45 min"     , n:"Billboard Onboard Plays One-Hit Wonders"                 , v:"Billboard Onboard"         , deck:"2" },
    { day:5, t:"9:30 PM"  , d:"45 min"     , n:"Rolling Stone Lounge Band Plays Liverpool Sounds"        , v:"Rolling Stone Lounge"      , deck:"2" },
    { day:5, t:"9:45 PM"  , d:"15 min"     , n:"Chocolate Surprise"                                      , v:"Lido Market"               , deck:"9" },
    { day:5, t:"10:15 PM" , d:"45 min"     , n:"Billboard Onboard Plays All Requests"                    , v:"Billboard Onboard"         , deck:"2" },
    { day:5, t:"10:30 PM" , d:"45 min"     , n:"Rolling Stone Lounge Band Plays Liverpool Sounds"        , v:"Rolling Stone Lounge"      , deck:"2" },
    { day:5, t:"11:00 PM" , d:null         , n:"Over $625,000 Paradise Lotto Jackpot Drawing"            , v:"Casino"                    , deck:"2" },
    { day:6, t:"7:00 AM"  , d:"30 min"     , n:"Abs Class"                                               , v:"Fitness Center"            , deck:"9" },
    { day:6, t:"8:00 AM"  , d:"16 hours"   , n:"Crosswords & Number Puzzles are Available"               , v:"Atrium"                    , deck:"1" },
    { day:6, t:"8:00 AM"  , d:"9 hours"    , n:"Spa Special: The Perfect Day"                            , v:"Spa & Salon"               , deck:"9" },
    { day:6, t:"8:00 AM"  , d:"1 hour"     , n:"Tour de Cycle ($20)"                                     , v:"Fitness Center"            , deck:"9" },
    { day:6, t:"8:00 AM"  , d:"1 hour"     , n:"Pickleball Open Play"                                    , v:"Sport Court"               , deck:"11" },
    { day:6, t:"8:00 AM"  , d:"30 min"     , n:"Tai Chi for Everyone"                                    , v:"Lido Poolside"             , deck:"9" },
    { day:6, t:"9:00 AM"  , d:"30 min"     , n:"Golf Putting"                                            , v:"Lido Poolside"             , deck:"9" },
    { day:6, t:"11:00 AM" , d:"13 hours"   , n:"Crosswords & Number Puzzles are Available"               , v:"Library"                   , deck:"3" },
    { day:6, t:"12:30 PM" , d:"30 min"     , n:"Complimentary Massage Sampler"                           , v:"Spa & Salon"               , deck:"9" },
    { day:6, t:"1:00 PM"  , d:"30 min"     , n:"Today's Trivia: Famous Statues"                          , v:"Billboard Onboard"         , deck:"2" },
    { day:6, t:"1:00 PM"  , d:"45 min"     , n:"Knitter's Meetup"                                        , v:"Art Studio"                , deck:"10" },
    { day:6, t:"2:00 PM"  , d:"6 hours"    , n:"Visit the Thermal Suite & Hydropool"                     , v:"Spa & Salon"               , deck:"9" },
    { day:6, t:"2:00 PM"  , d:"45 min"     , n:"Celtic Instrumentalist Plays"                            , v:"Crow's Nest"               , deck:"10" },
    { day:6, t:"3:00 PM"  , d:"1 hour"     , n:"Relieving Back Pain"                                     , v:"Fitness Center"            , deck:"9" },
    { day:6, t:"3:00 PM"  , d:"30 min"     , n:"Sjoelen Tournament"                                      , v:"Lido Poolside"             , deck:"9" },
    { day:6, t:"3:15 PM"  , d:"45 min"     , n:"The Dam Band Plays"                                      , v:"Ocean Bar"                 , deck:"3" },
    { day:6, t:"4:00 PM"  , d:"45 min"     , n:"Friends of Bill W. Meet"                                 , v:"Explorer's Lounge"         , deck:"2" },
    { day:6, t:"4:00 PM"  , d:"45 min"     , n:"Team Trivia Challenge"                                   , v:"Billboard Onboard"         , deck:"2" },
    { day:6, t:"4:00 PM"  , d:"45 min"     , n:"Ping Pong Tournament"                                    , v:"Lido Poolside"             , deck:"9" },
    { day:6, t:"4:30 PM"  , d:"30 min"     , n:"Non-Surgical Facelift"                                   , v:"Hudson Room"               , deck:"3" },
    { day:6, t:"4:30 PM"  , d:"45 min"     , n:"Origami Folding: Sailboat"                               , v:"Art Studio"                , deck:"10" },
    { day:6, t:"5:00 PM"  , d:"1 hour"     , n:"Body Sculpt Boot Camp ($20)"                             , v:"Fitness Center"            , deck:"9" },
    { day:6, t:"5:15 PM"  , d:"45 min"     , n:"Evening Catholic Prayer"                                 , v:"Explorer's Lounge"         , deck:"2" },
    { day:6, t:"5:30 PM"  , d:"3 hours"    , n:"Beauty Under $50"                                        , v:"The Shops"                 , deck:"3" },
    { day:6, t:"6:00 PM"  , d:"45 min"     , n:"Singles & Solo Travelers Meetup"                         , v:"Gallery Bar"               , deck:"2" },
    { day:6, t:"6:00 PM"  , d:"45 min"     , n:"Celtic Instrumentalist Plays"                            , v:"Crow's Nest"               , deck:"10" },
    { day:6, t:"6:00 PM"  , d:"1 hour"     , n:"Pre-Owned & Pristine Rolex Watches"                      , v:"The Shops"                 , deck:"3" },
    { day:6, t:"6:30 PM"  , d:"30 min"     , n:"Footprint and Posture Analysis"                          , v:"Fitness Center"            , deck:"9" },
    { day:6, t:"7:00 PM"  , d:"45 min"     , n:"PRIDE Meetup"                                            , v:"Gallery Bar"               , deck:"2" },
    { day:6, t:"7:15 PM"  , d:"45 min"     , n:"Rolling Stone Dance Party"                               , v:"Rolling Stone Lounge"      , deck:"2" },
    { day:6, t:"7:30 PM"  , d:"45 min"     , n:"Trivia: Guests vs. Officers"                             , v:"World Stage"               , deck:"3" },
    { day:6, t:"7:30 PM"  , d:"45 min"     , n:"The Dam Band Plays"                                      , v:"Ocean Bar"                 , deck:"3" },
    { day:6, t:"8:00 PM"  , d:"2.75 hours" , n:"It's Karaoke Time!"                                      , v:"Rolling Stone Lounge"      , deck:"2" },
    { day:6, t:"8:15 PM"  , d:"15 min"     , n:"Orange Party Line Dance"                                 , v:"World Stage"               , deck:"3" },
    { day:6, t:"9:00 PM"  , d:"45 min"     , n:"Young Adult Meetup"                                      , v:"Gallery Bar"               , deck:"2" },
    { day:6, t:"9:15 PM"  , d:"45 min"     , n:"Billboard Onboard Plays One-Hit Wonders"                 , v:"Billboard Onboard"         , deck:"2" },
    { day:6, t:"9:30 PM"  , d:"1.25 hours" , n:"Rolling Stone Lounge Band Plays Orange Party"            , v:"Rolling Stone Lounge"      , deck:"2" },
    { day:6, t:"10:15 PM" , d:"45 min"     , n:"Billboard Onboard Plays All Requests"                    , v:"Billboard Onboard"         , deck:"2" },
    { day:6, t:"10:45 PM" , d:"45 min"     , n:"Dance to the Hits"                                       , v:"Rolling Stone Lounge"      , deck:"2" },
    { day:7, t:"7:00 AM"  , d:"30 min"     , n:"Stretch & Release"                                       , v:"Fitness Center"            , deck:"9" },
    { day:7, t:"8:00 AM"  , d:"16 hours"   , n:"Crosswords & Number Puzzles are Available"               , v:"Atrium"                    , deck:"1" },
    { day:7, t:"8:00 AM"  , d:"5 hours"    , n:"Spa Special: The Relaxation Package"                     , v:"Spa & Salon"               , deck:"9" },
    { day:7, t:"8:00 AM"  , d:"1 hour"     , n:"Pure Form Yoga ($20)"                                    , v:"Fitness Center"            , deck:"9" },
    { day:7, t:"8:00 AM"  , d:"1 hour"     , n:"Pickleball Open Play"                                    , v:"Sport Court"               , deck:"11" },
    { day:7, t:"8:00 AM"  , d:"30 min"     , n:"Tai Chi for Everyone"                                    , v:"Lido Poolside"             , deck:"9" },
    { day:7, t:"9:00 AM"  , d:null         , n:"EFFY Outlet & Sample Sale"                               , v:"Effy Jewelry"              , deck:"3" },
    { day:7, t:"9:00 AM"  , d:"1.5 hours"  , n:"Designer Watches: Under $500"                            , v:"The Shops"                 , deck:"3" },
    { day:7, t:"9:00 AM"  , d:"1.5 hours"  , n:"Designer Sunglasses: Special Offer"                      , v:"The Shops"                 , deck:"3" },
    { day:7, t:"9:30 AM"  , d:"45 min"     , n:"Watercoloring: Cactus"                                   , v:"Art Studio"                , deck:"10" },
    { day:7, t:"10:00 AM" , d:"30 min"     , n:"Stress Relief & Longevity"                               , v:"Spa & Salon"               , deck:"9" },
    { day:7, t:"10:00 AM" , d:null         , n:"Pickleball Tournament"                                   , v:"Sport Court"               , deck:"11" },
    { day:7, t:"11:00 AM" , d:"13 hours"   , n:"Crosswords & Number Puzzles are Available"               , v:"Library"                   , deck:"3" },
    { day:7, t:"11:00 AM" , d:"30 min"     , n:"Complimentary Massage Sampler"                           , v:"Spa & Salon"               , deck:"9" },
    { day:7, t:"11:00 AM" , d:"45 min"     , n:"Vivace Pianist Plays"                                    , v:"Explorer's Lounge"         , deck:"2" },
    { day:7, t:"11:15 AM" , d:"45 min"     , n:"Vivace Cellist Plays"                                    , v:"Ocean Bar"                 , deck:"3" },
    { day:7, t:"11:30 AM" , d:"30 min"     , n:"Healthy Hair Consultations"                              , v:"Spa & Salon"               , deck:"9" },
    { day:7, t:"1:00 PM"  , d:"3 hours"    , n:"Mahjong Players Meet until 4:00pm"                       , v:"Game Room"                 , deck:"10" },
    { day:7, t:"2:00 PM"  , d:"1.75 hours" , n:"Today's Movie: Good Fortune"                             , v:"Rolling Stone Lounge"      , deck:"2" },
    { day:7, t:"3:00 PM"  , d:"45 min"     , n:"Friends of Bill W. Meet"                                 , v:"Explorer's Lounge"         , deck:"2" },
    { day:7, t:"3:30 PM"  , d:"45 min"     , n:"Creating Doodle Designs: Sunset"                         , v:"Art Studio"                , deck:"10" },
    { day:7, t:"4:00 PM"  , d:"45 min"     , n:"Team Trivia Challenge"                                   , v:"Billboard Onboard"         , deck:"2" },
    { day:7, t:"4:00 PM"  , d:"45 min"     , n:"Ping Pong Tournament"                                    , v:"Lido Poolside"             , deck:"9" },
    { day:7, t:"4:30 PM"  , d:"45 min"     , n:"Origami Folding: Whale"                                  , v:"Art Studio"                , deck:"10" },
    { day:7, t:"5:00 PM"  , d:"30 min"     , n:"Evening Stretch"                                         , v:"Fitness Center"            , deck:"9" },
    { day:7, t:"5:00 PM"  , d:"1 hour"     , n:"Pickleball Open Play"                                    , v:"Sport Court"               , deck:"11" },
    { day:7, t:"7:00 PM"  , d:"30 min"     , n:"Music Trivia: Goodbye Songs"                             , v:"Billboard Onboard"         , deck:"2" },
    { day:7, t:"7:00 PM"  , d:"45 min"     , n:"PRIDE Meetup"                                            , v:"Gallery Bar"               , deck:"2" },
    { day:7, t:"7:15 PM"  , d:"45 min"     , n:"Vivace Pianist Plays"                                    , v:"Explorer's Lounge"         , deck:"2" },
    { day:7, t:"8:15 PM"  , d:"45 min"     , n:"Billboard Onboard Plays The 1960s"                       , v:"Billboard Onboard"         , deck:"2" },
    { day:7, t:"8:30 PM"  , d:"45 min"     , n:"Rolling Stone Lounge Band Plays Rock the Yacht"          , v:"Rolling Stone Lounge"      , deck:"2" },
    { day:7, t:"9:00 PM"  , d:"45 min"     , n:"Young Adult Meetup"                                      , v:"Gallery Bar"               , deck:"2" },
    { day:7, t:"9:15 PM"  , d:"45 min"     , n:"Billboard Onboard Plays One-Hit Wonders"                 , v:"Billboard Onboard"         , deck:"2" },
    { day:7, t:"9:30 PM"  , d:"45 min"     , n:"Game Night: Dance Through the Decades"                   , v:"Explorer's Lounge"         , deck:"2" },
    { day:7, t:"9:30 PM"  , d:"45 min"     , n:"Rolling Stone Lounge Band Plays Liverpool Sounds"        , v:"Rolling Stone Lounge"      , deck:"2" },
    { day:7, t:"10:15 PM" , d:"45 min"     , n:"Billboard Onboard Plays All Requests"                    , v:"Billboard Onboard"         , deck:"2" },
    { day:7, t:"10:30 PM" , d:"45 min"     , n:"Rolling Stone Lounge Band Plays Liverpool Sounds"        , v:"Rolling Stone Lounge"      , deck:"2" },
    { day:8, t:"11:00 AM" , d:"10 hours"   , n:"The Library is Open"                                     , v:"Library"                   , deck:"3" },
    { day:8, t:"11:00 AM" , d:"13 hours"   , n:"Crosswords & Number Puzzles are Available"               , v:"Atrium"                    , deck:"1" },
    { day:8, t:"11:00 AM" , d:"13 hours"   , n:"Crosswords & Number Puzzles are Available"               , v:"Library"                   , deck:"3" },
    { day:8, t:"11:15 AM" , d:"4 hours"    , n:"Make Your Dining Reservations"                           , v:"Pinnacle Bar"              , deck:"2" },
    { day:8, t:"11:15 AM" , d:"4 hours"    , n:"Make Your Dining Reservations"                           , v:"Lido Poolside"             , deck:"9" },
    { day:8, t:"11:15 AM" , d:"4 hours"    , n:"Make Your Dining Reservations"                           , v:"Upper Dining Room"         , deck:"3" },
    { day:8, t:"4:30 PM"  , d:"45 min"     , n:"Friends of Bill W. Meet"                                 , v:"Half Moon Room"            , deck:"3" },
    { day:8, t:"5:00 PM"  , d:"45 min"     , n:"Evening Catholic Prayer"                                 , v:"Hudson Room"               , deck:"3" },
    { day:8, t:"5:00 PM"  , d:"3 hours"    , n:"Welcome Aboard Steak and Shrimp Dinner"                  , v:"Lido Market"               , deck:"9" },
    { day:8, t:"6:00 PM"  , d:"45 min"     , n:"Singles & Solo Travelers Meetup"                         , v:"Gallery Bar"               , deck:"2" },
    { day:8, t:"7:00 PM"  , d:"45 min"     , n:"PRIDE Meetup"                                            , v:"Gallery Bar"               , deck:"2" },
    { day:8, t:"8:00 PM"  , d:"1 hour"     , n:"Teens Meet & Greet"                                      , v:"Art Studio"                , deck:"10" },
    { day:8, t:"9:00 PM"  , d:"45 min"     , n:"Young Adult Meetup"                                      , v:"Gallery Bar"               , deck:"2" }
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
    { day:1, label:"Sat Jun 13", port:"Quebec City · depart 11 PM" },
    { day:2, label:"Sun Jun 14", port:"St. Lawrence River · at sea" },
    { day:3, label:"Mon Jun 15", port:"Gulf of St. Lawrence · at sea" },
    { day:4, label:"Tue Jun 16", port:"Charlottetown, PEI · 7 AM-5 PM" },
    { day:5, label:"Wed Jun 17", port:"Sydney, NS · 7 AM-4 PM" },
    { day:6, label:"Thu Jun 18", port:"Halifax, NS · 8 AM-4 PM" },
    { day:7, label:"Fri Jun 19", port:"Portland, ME · 12:30 PM-10 PM" },
    { day:8, label:"Sat Jun 20", port:"Boston · disembark" }
  ];
})();
