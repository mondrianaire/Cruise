/* Canada & New England 2026 — events drawer UI.
   v.139.

   Wires up the "tap a Notable-on-this-deck row to expand an event
   drawer beneath it" behaviour for ship.html's deck-plans view.

   Depends on: events.js (window.shipEventsForVenue, window.SHIP_DAYS).
*/
(function(){
  'use strict';
  if(typeof window === 'undefined') return;
  if(!window.shipEventsForVenue) return;

  function fmt12(t24){
    var p = String(t24).split(':');
    if(p.length !== 2) return t24;
    var h = parseInt(p[0],10), m = parseInt(p[1],10);
    var suff = h >= 12 ? 'PM' : 'AM';
    var h12 = ((h + 11) % 12) + 1;
    return h12 + ':' + (m<10?'0':'') + m + ' ' + suff;
  }
  function fmtDur(min){
    if(min == null) return '';
    if(min < 60) return min + ' min';
    var h = Math.floor(min/60), r = min%60;
    return r === 0 ? (h + ' h') : (h + ' h ' + r);
  }
  function dayLabel(day){
    var d = (window.SHIP_DAYS || []).filter(function(x){ return x.day === day; })[0];
    return d ? d.label : ('Day ' + day);
  }
  function dayPort(day){
    var d = (window.SHIP_DAYS || []).filter(function(x){ return x.day === day; })[0];
    return d ? d.port : '';
  }
  function esc(s){
    return String(s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  function buildDrawer(li, deck, slug){
    var data = window.shipEventsForVenue(deck, slug);
    var html = '<div class="dv-events-card" role="region" aria-label="Scheduled events at this venue">';
    var any = (data.daily && data.daily.length) || (data.scheduled && data.scheduled.length);

    if(data.daily && data.daily.length){
      html += '<div class="dv-events-section">';
      html +=   '<div class="dv-events-h"><span>Daily events</span>'
            +   '<span class="dv-h-count">' + data.daily.length + ' recurring</span></div>';
      html +=   '<ul class="dv-evt-list">';
      data.daily.forEach(function(e){
        html += '<li class="dv-evt">'
              + '<span class="dv-evt-t">' + esc(fmt12(e.time24)) + '</span>'
              + '<span class="dv-evt-n">' + esc(e.name)
              + '<span class="dv-evt-daily-badge">daily</span></span>'
              + '<span class="dv-evt-d">' + esc(fmtDur(e.durationMin)) + '</span>'
              + '</li>';
      });
      html += '</ul></div>';
    }

    if(data.scheduled && data.scheduled.length){
      var byDay = {};
      data.scheduled.forEach(function(e){
        if(!byDay[e.day]) byDay[e.day] = [];
        byDay[e.day].push(e);
      });
      html += '<div class="dv-events-section">';
      html +=   '<div class="dv-events-h"><span>Calendar</span>'
            +   '<span class="dv-h-count">' + data.scheduled.length + ' scheduled</span></div>';
      Object.keys(byDay).map(Number).sort(function(a,b){return a-b;}).forEach(function(d){
        html += '<div class="dv-day-h">'
              + '<span>' + esc(dayLabel(d)) + '</span>'
              + '<span class="dv-day-port">' + esc(dayPort(d)) + '</span>'
              + '</div>';
        html += '<ul class="dv-evt-list">';
        byDay[d].forEach(function(e){
          html += '<li class="dv-evt">'
                + '<span class="dv-evt-t">' + esc(fmt12(e.time24)) + '</span>'
                + '<span class="dv-evt-n">' + esc(e.name) + '</span>'
                + '<span class="dv-evt-d">' + esc(fmtDur(e.durationMin)) + '</span>'
                + '</li>';
        });
        html += '</ul>';
      });
      html += '</div>';
    }

    if(!any){
      html += '<div class="dv-events-empty">No Daily-Program events ingested for this venue yet. Days 3–7 will appear here as the Navigator recordings are processed.</div>';
    }

    html += '</div>';

    var box = li.querySelector('.dv-events');
    if(!box){
      box = document.createElement('div');
      box.className = 'dv-events';
      li.appendChild(box);
    }
    box.innerHTML = html;
  }

  function closeAll(){
    document.querySelectorAll('.dv-item.is-open').forEach(function(x){
      x.classList.remove('is-open');
      x.setAttribute('aria-expanded','false');
    });
    document.querySelectorAll('.fp-hot.is-active').forEach(function(h){
      h.classList.remove('is-active');
    });
  }

  function openVenue(deck, slug){
    var li = document.getElementById('venue-' + deck + '-' + slug);
    if(!li) return false;
    var alreadyOpen = li.classList.contains('is-open');
    closeAll();
    if(alreadyOpen) return true;       // toggle behaviour: tap again closes
    buildDrawer(li, deck, slug);
    li.classList.add('is-open');
    li.setAttribute('aria-expanded','true');
    document.querySelectorAll('.fp-hot[data-deck="'+deck+'"][data-venue-id="'+slug+'"]')
      .forEach(function(h){ h.classList.add('is-active'); });
    setTimeout(function(){
      li.scrollIntoView({behavior:'smooth', block:'center'});
    }, 60);
    return true;
  }

  // Expose so ship.html's deep-link handler can call us
  window.openVenueDrawer = openVenue;
  window.closeAllVenueDrawers = closeAll;

  function init(){
    document.querySelectorAll('.dv-item').forEach(function(li){
      var m = (li.id||'').match(/^venue-(\d+)-(.+)$/);
      if(!m) return;
      li.addEventListener('click', function(e){
        if(e.target.closest('a,button')) return;
        openVenue(m[1], m[2]);
      });
      li.setAttribute('tabindex','0');
      li.setAttribute('role','button');
      li.setAttribute('aria-expanded','false');
      li.addEventListener('keydown', function(e){
        if(e.key === 'Enter' || e.key === ' '){
          e.preventDefault();
          openVenue(m[1], m[2]);
        }
      });
    });
    document.querySelectorAll('.fp-hot').forEach(function(h){
      h.addEventListener('click', function(){
        var d = h.getAttribute('data-deck');
        var v = h.getAttribute('data-venue-id');
        if(d && v) openVenue(d, v);
      });
    });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
