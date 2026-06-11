/* Canada & New England 2026 â€” shared app shell (motion toggle, countdown, stars, scrollspy) */
(function(){
  'use strict';

  /* --- motion toggle (gates animation on this page) --- */
  var osR = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var motionOff = osR;
  var mtog = document.getElementById('motionToggle');
  function applyMotion(){
    document.body.classList.toggle('motion-off', motionOff);
    if(mtog){
      mtog.setAttribute('aria-pressed', String(!motionOff));
      var ml = mtog.querySelector('.ml');
      if(ml) ml.textContent = motionOff ? 'Animation off' : 'Animation on';
    }
  }
  applyMotion();
  if(mtog){ mtog.addEventListener('click', function(){ motionOff = !motionOff; applyMotion(); }); }

  /* --- hero stars (only on pages that have #stars) --- */
  var stars = document.getElementById('stars');
  if(stars){
    for(var i=0;i<26;i++){
      var s = document.createElement('i');
      s.style.left = (Math.random()*100)+'%';
      s.style.top = (Math.random()*92)+'%';
      s.style.animationDelay = (-Math.random()*4)+'s';
      stars.appendChild(s);
    }
  }

  /* --- countdown to embarkation (only on pages with #cd) --- */
  var target = new Date('2026-06-13T00:00:00').getTime();
  function tick(){
    var cd = document.getElementById('cd');
    if(!cd) return;
    var d = target - new Date().getTime();
    if(d < 0){
      cd.innerHTML = '<div><span class="num">&#9875;</span><span class="lbl">Bon Voyage</span></div>';
      return;
    }
    var days = Math.floor(d/86400000);
    var hrs  = Math.floor((d%86400000)/3600000);
    var mins = Math.floor((d%3600000)/60000);
    var dEl = document.getElementById('cd-d'); if(dEl) dEl.textContent = days;
    var hEl = document.getElementById('cd-h'); if(hEl) hEl.textContent = hrs;
    var mEl = document.getElementById('cd-m'); if(mEl) mEl.textContent = mins;
  }
  if(document.getElementById('cd')){ tick(); setInterval(tick, 30000); }

  /* --- nav scrolled state --- */
  function onScroll(){ document.body.classList.toggle('nav-scrolled', window.scrollY > 80); }
  window.addEventListener('scroll', onScroll, { passive:true });
  onScroll();

  /* --- active nav link by current filename --- */
  var here = (location.pathname.split('/').pop() || 'overview.html').toLowerCase();
  if(here === '' || here === 'index.html') here = 'index.html';
  document.querySelectorAll('nav .links a').forEach(function(a){
    var href = (a.getAttribute('href') || '').toLowerCase();
    if(href === here) a.classList.add('active');
  });

  /* --- replay button: send the user back to here after the animation --- */
  var rb = document.getElementById('replayBtn');
  if(rb){
    rb.setAttribute('href', 'index.html?replay=1&from=' + encodeURIComponent(here));
  }
})();



  /* --- nav sub-tab labels (desktop + mobile sheet) --- */
  var SUBTABS = {
    'overview.html':  ['At a Glance','Flights','Hotels'],
    'journey.html':   ['Itinerary','Daily Plan'],
    'ship.html':      ['The Ship'],
    'programs.html':  ['Daily Programme'],
    'ports.html':     ['Ports','Group Picks'],
    'kbyg.html':      [],
    'documents.html': []
  };
  document.querySelectorAll('nav .links a').forEach(function(a){
    var page = (a.getAttribute('href')||'').toLowerCase();
    var subs = SUBTABS[page] || [];
    var n = a.querySelector('.n');
    var label = a.cloneNode(true);
    var nc = label.querySelector('.n'); if(nc) nc.remove();
    var labelTxt = label.textContent.trim();
    a.innerHTML = '<span class="nav-main">' + (n?n.outerHTML:'') + '<span>'+labelTxt+'</span></span>'
      + (subs.length ? '<span class="sublabels">'+subs.join(' · ')+'</span>' : '');
  });

/* --- mobile hamburger nav sheet --- */
(function(){
  var burger = document.getElementById('navBurger');
  if(!burger) return;
  var navLinks = document.querySelectorAll('nav .links a');
  var navConsole = document.querySelector('nav .console');
  if(!navLinks.length) return;
  var sheet = document.createElement('div');
  sheet.id = 'navSheet';
  sheet.className = 'nav-sheet';
  sheet.setAttribute('role','dialog');
  sheet.setAttribute('aria-modal','true');
  sheet.setAttribute('aria-hidden','true');
  var top = '<div class="nav-sheet-top">' +
    '<span class="nav-sheet-brand">âš“ Canada &amp; New England</span>' +
    '<button type="button" class="nav-sheet-close" id="navSheetClose" aria-label="Close menu">&times;</button>' +
    '</div>';
  var list = '<div class="nav-sheet-list">';
  Array.prototype.forEach.call(navLinks, function(a){
    var n = a.querySelector('.n');
    // The SUBTABS step has already wrapped each link's content in .nav-main + (optional) .sublabels.
    // Pull the *main* label text out of .nav-main only (sans the .n badge) so we don't
    // concatenate the sublabels into the main text.
    var mainSrc = a.querySelector('.nav-main') || a;
    var clone = mainSrc.cloneNode(true);
    var nClone = clone.querySelector('.n'); if(nClone) nClone.remove();
    var label = clone.textContent.trim();
    var subSpan = a.querySelector('.sublabels');
    var subTxt = subSpan ? subSpan.textContent.trim() : '';
    list += '<a href="' + a.getAttribute('href') + '"' + (a.classList.contains('active') ? ' class="active"' : '') + '>';
    list += '<span class="nav-main">';
    if(n) list += '<span class="n">' + n.textContent + '</span>';
    list += '<span>' + label + '</span></span>';
    if(subTxt) list += '<span class="sublabels">' + subTxt + '</span>';
    list += '</a>';
  });
  list += '</div>';
  var consoleHtml = '';
  if(navConsole){
    consoleHtml = '<div class="nav-sheet-console"><a href="' + navConsole.getAttribute('href') + '">' +
      navConsole.innerHTML + '</a></div>';
  }
  sheet.innerHTML = top + list + consoleHtml;
  document.body.appendChild(sheet);
  function setOpen(open){
    sheet.classList.toggle('open', open);
    sheet.setAttribute('aria-hidden', String(!open));
    burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', function(){ setOpen(!sheet.classList.contains('open')); });
  document.getElementById('navSheetClose').addEventListener('click', function(){ setOpen(false); });
  sheet.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', function(){ setOpen(false); });
  });
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && sheet.classList.contains('open')) setOpen(false);
  });
  /* v.156: outside-click closes the dropdown (desktop). On mobile the
     sheet is full-screen so this is harmless. */
  document.addEventListener('click', function(e){
    if(!sheet.classList.contains('open')) return;
    if(sheet.contains(e.target) || burger.contains(e.target)) return;
    setOpen(false);
  });
})();

/* --- mark the signed-in traveller's calendar-subscribe pill --- */
(function(){
  if(!window.__crewKey){
    // wait until auth resolves on journey.html
    var i = setInterval(function(){
      if(window.__crewKey){ clearInterval(i); mark(); }
    }, 250);
    setTimeout(function(){ clearInterval(i); }, 8000);
  } else { mark(); }
  function mark(){
    document.querySelectorAll('.cal-actions a[data-traveller]').forEach(function(a){
      if(a.getAttribute('data-traveller') === window.__crewKey){
        a.classList.add('is-me');
        a.textContent = a.textContent + ' (you)';
      }
    });
  }
})();

/* ===== v.152: Optimistic crew-seed API (cross-page SSO continuity) =====
   Firebase Auth IS persisted in IndexedDB by default, but restoring the
   user object takes 100-500 ms and the roster getDoc takes another
   200-800 ms — during that window pages look "signed out". We mirror the
   confirmed identity into localStorage so every subsequent page can seed
   the UI synchronously on load. The real security gate is still the
   Firebase Auth handshake + Firestore rules; this is just a UX layer. */
window.__crewSeed = (function(){
  try{
    var n = localStorage.getItem('cnen_crew_name')||'';
    var e = localStorage.getItem('cnen_crew_email')||'';
    var p = localStorage.getItem('cnen_crew_photo')||'';
    if(n && e) return { name:n, email:e, photoURL:p };
  }catch(e){}
  return null;
})();
window.__writeCrewSeed = function(name, email, photoURL){
  try{
    if(name && email){
      localStorage.setItem('cnen_crew_name', String(name));
      localStorage.setItem('cnen_crew_email', String(email));
      if(photoURL){
        localStorage.setItem('cnen_crew_photo', String(photoURL));
      }
      window.__crewSeed = { name:String(name), email:String(email),
        photoURL: photoURL ? String(photoURL) : (window.__crewSeed && window.__crewSeed.photoURL) || '' };
      if(window.__paintNavAvatar) window.__paintNavAvatar();
    }
  }catch(e){}
};
window.__clearCrewSeed = function(){
  try{
    localStorage.removeItem('cnen_crew_name');
    localStorage.removeItem('cnen_crew_email');
    localStorage.removeItem('cnen_crew_photo');
    window.__crewSeed = null;
    if(window.__paintNavAvatar) window.__paintNavAvatar();
  }catch(e){}
};

/* ===== v.166: nav-bar avatar for signed-in crew =====
   Inject a circular profile-pic chip into the nav rail next to the
   hamburger so it's obvious at a glance whether a user is signed in.
   Uses the cross-page crew seed (window.__crewSeed) so it paints
   instantly on navigation without waiting for Firebase. Falls back to
   the first-letter monogram if photoURL is missing or fails to load. */
window.__paintNavAvatar = function(){
  var nav = document.querySelector('nav .inner');
  if(!nav) return;
  var burger = nav.querySelector('.nav-burger');
  var existing = nav.querySelector('.nav-avatar');
  var seed = window.__crewSeed;
  if(!seed || !seed.name){
    if(existing) existing.parentNode.removeChild(existing);
    return;
  }
  var initial = String(seed.name).trim().charAt(0).toUpperCase() || '?';
  var title = 'Signed in as ' + seed.name;
  if(seed.email) title += ' (' + seed.email + ')';
  if(existing){
    /* Update in-place if the seed changed. */
    existing.setAttribute('title', title);
    existing.setAttribute('data-tip', title);
    var letter = existing.querySelector('.nav-avatar-letter');
    if(letter) letter.textContent = initial;
    var img = existing.querySelector('img');
    if(seed.photoURL){
      if(!img){
        img = document.createElement('img');
        img.alt = '';
        img.onerror = function(){ img.parentNode.removeChild(img); };
        existing.insertBefore(img, existing.firstChild);
      }
      if(img.src !== seed.photoURL) img.src = seed.photoURL;
    } else if(img){
      img.parentNode.removeChild(img);
    }
    return;
  }
  var av = document.createElement('div');
  av.className = 'nav-avatar';
  av.setAttribute('title', title);
  av.setAttribute('data-tip', title);
  av.setAttribute('role','img');
  av.setAttribute('aria-label', title);
  av.innerHTML = '<span class="nav-avatar-letter">' + initial + '</span>';
  if(seed.photoURL){
    var img2 = document.createElement('img');
    img2.alt = '';
    img2.src = seed.photoURL;
    img2.onerror = function(){ img2.parentNode.removeChild(img2); };
    av.insertBefore(img2, av.firstChild);
  }
  if(burger){
    nav.insertBefore(av, burger);
  } else {
    nav.appendChild(av);
  }
};

/* v.168 — Suggestion inbox indicator on the nav avatar.
   When a page (e.g. programs.html) finds the signed-in user has unread
   suggestions, it calls __setNavAvatarBadge(N). We attach a brass dot
   with a small numeric badge that pulses to nudge the eye. */
window.__setNavAvatarBadge = function(n){
  var av = document.querySelector('.nav-avatar');
  if(!av) return;
  var num = Math.max(0, parseInt(n,10) || 0);
  if(num <= 0){
    av.classList.remove('has-badge');
    av.removeAttribute('data-badge');
    return;
  }
  av.classList.add('has-badge');
  av.setAttribute('data-badge', String(num));
};

/* Paint once on load (synchronous from the seed), then again after auth
   confirms via the per-page handlers (they call __writeCrewSeed, which
   re-paints). */
function __cnenInitAvatar(){ if(window.__paintNavAvatar) window.__paintNavAvatar(); }
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', __cnenInitAvatar);
} else {
  __cnenInitAvatar();
}

/* v.153: global crew-reveal unlocker. Any page that scatters sensitive
   tokens (confirmation #, flight #, room #) wraps them in
   <span class="crew-reveal locked" data-val="X" data-mask="••••••">.
   We unlock all of them in one place — optimistically from the seed,
   and again from the per-page Firebase auth listener when it confirms. */
window.__unlockCrewReveal = function(){
  document.querySelectorAll('.crew-reveal.locked').forEach(function(el){
    el.classList.remove('locked');
  });
  document.querySelectorAll('.crew-only[hidden]').forEach(function(el){
    el.hidden = false;
  });
};
window.__lockCrewReveal = function(){
  document.querySelectorAll('.crew-reveal').forEach(function(el){
    el.classList.add('locked');
  });
  document.querySelectorAll('.crew-only').forEach(function(el){
    el.hidden = true;
  });
};
/* Run unlock immediately if we have a crew seed — keeps the page from
   flashing the masked state on every navigation between pages. */
if(window.__crewSeed && window.__crewSeed.name){
  /* Wait one tick so the DOM is ready (this script runs in <body>). */
  document.addEventListener('DOMContentLoaded', function(){
    window.__unlockCrewReveal();
  });
  /* If DOMContentLoaded already fired (late script), unlock now. */
  if(document.readyState !== 'loading'){
    window.__unlockCrewReveal();
  }
}

/* ===== Site version badge in nav (visible across all pages) ===== */
window.SITE_VERSION = 'v.175';
(function(){
  document.querySelectorAll('nav .brand .br-y').forEach(function(y){
    if(!y.querySelector('.br-ver')){
      var ver = document.createElement('span');
      ver.className = 'br-ver';
      ver.textContent = window.SITE_VERSION;
      y.appendChild(ver);
    }
  });
})();


/* ===== v.159: Custom branded tooltip =====
   Replaces the browser's native title= popup with a floating brass-
   bordered card. Auto-harvests every [title] and <svg><title> on the
   page, hides the original from the browser so we don't get a double
   tooltip, and re-runs the harvest whenever the DOM mutates so dynamic
   content (events drawers, dropdowns, etc.) is covered too.

   Interaction model:
   - Desktop (no touch capability detected): hover shows, mouse-leave
     hides. Short fade in / out.
   - Touch: tap shows the tip for 2.4 seconds then auto-hides. A second
     tap on the same element hides immediately. Outside-tap hides.
   - The tip is positioned above the trigger when possible, otherwise
     below; clamped to the viewport on both axes so it never overflows.
*/
(function(){
  if(window.__tipReady) return;
  window.__tipReady = true;

  var tip = document.createElement('div');
  tip.className = 'tip';
  tip.setAttribute('role','tooltip');
  tip.setAttribute('aria-hidden','true');
  tip.innerHTML = '<div class="tip-body"></div><div class="tip-arrow"></div>';
  function attach(){
    if(document.body){ document.body.appendChild(tip); }
    else { setTimeout(attach, 30); }
  }
  attach();
  var tipBody = tip.querySelector('.tip-body');

  var IS_TOUCH = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  var hideTimer = null;
  var currentTarget = null;

  /* Harvest title attributes -> data-tip, then strip the title so the
     browser does not race in with its own popup. Also climb up from
     <svg><title> children to mark their parent <g>. */
  function harvest(root){
    root = root || document;
    /* Skip <head> child <title> (the page title). */
    var els = root.querySelectorAll('[title]');
    for(var i=0;i<els.length;i++){
      var el = els[i];
      if(el.tagName === 'TITLE') continue;          /* page title */
      if(el.closest && el.closest('head')) continue;
      var t = el.getAttribute('title');
      if(t){
        if(!el.getAttribute('data-tip')) el.setAttribute('data-tip', t);
        el.removeAttribute('title');
      }
    }
    /* SVG <title>: hoist the text onto the parent <g> as data-tip. We
       leave the <title> in place for accessibility (screen readers). */
    var stitles = root.querySelectorAll('svg title');
    for(var j=0;j<stitles.length;j++){
      var st = stitles[j];
      var p = st.parentElement;
      if(p && !p.getAttribute('data-tip')){
        var txt = (st.textContent || '').trim();
        if(txt) p.setAttribute('data-tip', txt);
      }
    }
  }

  function setTip(text){ tipBody.innerHTML = String(text); }

  function position(target){
    /* Force layout so we have real dimensions. */
    tip.style.visibility = 'hidden';
    tip.classList.add('open');
    var tr = tip.getBoundingClientRect();
    var rr = target.getBoundingClientRect();
    var x = rr.left + rr.width/2 - tr.width/2;
    var y = rr.top - tr.height - 10;
    var below = false;
    if(y < 6){
      y = rr.bottom + 10;
      below = true;
    }
    var maxX = window.innerWidth - tr.width - 8;
    if(x < 8) x = 8;
    if(x > maxX) x = maxX;
    tip.style.left = Math.round(x) + 'px';
    tip.style.top  = Math.round(y) + 'px';
    tip.classList.toggle('tip-bottom', below);
    /* Arrow horizontal: keep it pointing at the trigger centre. */
    var arrow = tip.querySelector('.tip-arrow');
    if(arrow){
      var triggerCx = rr.left + rr.width/2;
      var arrowLeft = triggerCx - x - 4.5;
      arrowLeft = Math.max(8, Math.min(tr.width - 18, arrowLeft));
      arrow.style.left = Math.round(arrowLeft) + 'px';
      arrow.style.marginLeft = '0';
    }
    tip.style.visibility = '';
  }

  function show(target){
    if(!target || !target.getAttribute) return;
    var txt = target.getAttribute('data-tip');
    if(!txt) return;
    currentTarget = target;
    setTip(txt);
    position(target);
    tip.setAttribute('aria-hidden','false');
  }

  function hide(){
    currentTarget = null;
    tip.classList.remove('open');
    tip.setAttribute('aria-hidden','true');
    clearTimeout(hideTimer);
  }

  /* Desktop hover */
  if(!IS_TOUCH){
    document.addEventListener('mouseover', function(e){
      var t = e.target.closest && e.target.closest('[data-tip]');
      if(!t){ if(currentTarget) hide(); return; }
      if(t !== currentTarget) show(t);
    });
    document.addEventListener('mouseout', function(e){
      var t = e.target.closest && e.target.closest('[data-tip]');
      if(!t) return;
      var to = e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('[data-tip]');
      if(to === t) return;
      hide();
    });
    /* Hide on scroll so the tip does not sit floating over moved content. */
    window.addEventListener('scroll', hide, {passive:true});
  }

  /* Touch: tap to show with auto-dismiss; second tap on same element hides. */
  if(IS_TOUCH){
    document.addEventListener('click', function(e){
      var t = e.target.closest && e.target.closest('[data-tip]');
      if(!t){ hide(); return; }
      if(t === currentTarget){
        hide();
        return;
      }
      show(t);
      clearTimeout(hideTimer);
      hideTimer = setTimeout(hide, 2400);
    }, true);
  }

  /* Escape always hides. */
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape') hide();
  });

  /* Initial harvest after DOM ready, plus a MutationObserver so any
     dynamic content (drawer renders, dropdowns, etc.) gets covered. */
  function bootHarvest(){
    harvest(document);
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', bootHarvest);
  } else {
    bootHarvest();
  }
  if(window.MutationObserver){
    var mo = new MutationObserver(function(records){
      var needRehome = false;
      for(var i=0;i<records.length;i++){
        var r = records[i];
        if(r.addedNodes && r.addedNodes.length){
          for(var k=0;k<r.addedNodes.length;k++){
            var n = r.addedNodes[k];
            if(n.nodeType === 1){
              if(n.getAttribute && n.getAttribute('title')){
                if(!n.getAttribute('data-tip')) n.setAttribute('data-tip', n.getAttribute('title'));
                n.removeAttribute('title');
              }
              if(n.querySelector && (n.querySelector('[title]') || n.querySelector('title'))){
                harvest(n);
              }
            }
          }
        }
        if(r.type === 'attributes' && r.attributeName === 'title'){
          var el = r.target;
          if(el.tagName !== 'TITLE'){
            var t2 = el.getAttribute('title');
            if(t2){
              if(!el.getAttribute('data-tip')) el.setAttribute('data-tip', t2);
              el.removeAttribute('title');
            }
          }
        }
      }
    });
    function startMO(){
      if(!document.body){ setTimeout(startMO, 30); return; }
      mo.observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:['title']});
    }
    startMO();
  }
})();


/* ============================================================
   v.170 — Sync Center widget (shared across sync-enabled pages)
   ============================================================
   Renders a fixed bottom-right "save status" chip that is always
   visible while you scroll. It owns the canonical sync state
   (connecting | saving | synced | offline | signedout | error)
   and any per-page Firebase wiring just notifies it via
   __SyncCenter.setState(...). Click the chip to expand a panel
   with the last-saved timestamp, pending change count, and a
   manual "Sync Now" button — solves the "did it actually save?"
   feedback gap and the "always shows OFFLINE on reload" bug
   (default state is now "connecting", not "offline"). */
(function(){
  if(window.__SyncCenter) return;
  var SC = {
    el: null,
    state: 'idle',
    label: 'Cloud sync',
    domain: '',
    expanded: false,
    lastSavedAt: 0,
    pending: 0,
    syncFn: null,         // called when user taps "Sync Now"
    user: '',
    /* v.172 — diagnostic state so users (and us) can see WHY a write failed.
       Without this the chip just said "Sync error" and we had no signal. */
    lastError: '',
    lastErrorCode: '',
    lastErrorAt: 0,
    initError: '',
    /* timer to refresh the "Saved Xs ago" label */
    _tickT: null
  };

  function escHtml(s){
    return String(s==null?'':s).replace(/[&<>"]/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];
    });
  }
  function fmtAgo(ts){
    if(!ts) return 'never';
    var s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
    if(s < 5)   return 'just now';
    if(s < 60)  return s + 's ago';
    if(s < 3600)return Math.floor(s/60) + 'm ago';
    if(s < 86400)return Math.floor(s/3600) + 'h ago';
    return Math.floor(s/86400) + 'd ago';
  }

  function render(){
    if(!SC.el) return;
    var st = SC.state;
    var ico, txt, sub;
    switch(st){
      case 'connecting':
        ico = '<svg viewBox="0 0 24 24" class="sc-spin" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="14 28" stroke-linecap="round"/></svg>';
        txt = 'Connecting';
        sub = 'reaching the cloud…';
        break;
      case 'saving':
        ico = '<svg viewBox="0 0 24 24" class="sc-spin" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="14 28" stroke-linecap="round"/></svg>';
        txt = 'Saving';
        sub = 'uploading change';
        break;
      case 'synced':
        ico = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l4 4 10-10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        txt = 'Saved to cloud';
        sub = SC.lastSavedAt ? fmtAgo(SC.lastSavedAt) : 'just now';
        break;
      case 'offline':
        ico = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M5 12a14 14 0 0 1 4-3.4M19 12a14 14 0 0 0-7-3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
        txt = 'Offline';
        sub = SC.pending ? (SC.pending + ' change' + (SC.pending===1?'':'s') + ' pending') : 'saved on this device';
        break;
      case 'signedout':
        ico = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="9" r="3.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M5 20c1-3 4-5 7-5s6 2 7 5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
        txt = 'Sign in to sync';
        sub = 'edits saved on this device only';
        break;
      case 'error':
        ico = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v8m0 4v.01" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>';
        txt = 'Sync error';
        sub = SC.lastErrorCode ? SC.lastErrorCode : 'tap to retry';
        break;
      default:
        ico = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 17a4 4 0 0 1 1-7.9 5 5 0 0 1 9.6-1.4A4 4 0 0 1 18 17H6z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/></svg>';
        txt = 'Cloud sync';
        sub = SC.user ? 'standby — signed in as ' + SC.user : 'standby';
    }
    /* v.173: bottom-edge bar (always visible) — shows icon + state +
       last-saved time + signed-in identity + Sync Now button. Click the
       bar itself to expand a details panel UPWARD with diagnostics. */
    var canSync = (st === 'offline' || st === 'error' || st === 'synced' || st === 'idle') && !!SC.syncFn;
    var syncBtnAttrs = canSync ? '' : ' disabled';
    var pendBadge = (SC.pending > 0 && st !== 'saving')
      ? '<span class="sc-bar-pend">' + SC.pending + '</span>' : '';
    var userChip = SC.user
      ? '<span class="sc-bar-user" title="Signed in as ' + escHtml(SC.user) + '">' +
          '<span class="sc-bar-user-av" aria-hidden="true">' + escHtml(SC.user.charAt(0).toUpperCase()) + '</span>' +
          '<span class="sc-bar-user-n">' + escHtml(SC.user) + '</span>' +
        '</span>'
      : '';
    var html = '<div class="sc-bar sc-' + st + '" id="scBar">' +
      '<button type="button" class="sc-bar-toggle" id="scBarToggle" aria-expanded="' + (SC.expanded?'true':'false') + '" aria-label="Toggle sync details">' +
        '<span class="sc-bar-ic" aria-hidden="true">' + ico + '</span>' +
        '<span class="sc-bar-txt">' +
          '<span class="sc-bar-lbl">' + txt + '</span>' +
          '<span class="sc-bar-sub">' + escHtml(sub) + '</span>' +
        '</span>' +
        pendBadge +
      '</button>' +
      '<div class="sc-bar-spacer"></div>' +
      userChip +
      /* v.175 — bar button is hidden by CSS but kept in the DOM for
         layout; rename its id so the panel's #scSyncNow stays unique. */
      '<button type="button" class="sc-bar-sync" id="scBarSyncNow"' + syncBtnAttrs + ' title="Force a re-push to the cloud">↻ <span class="sc-bar-sync-l">Sync now</span></button>' +
      '</div>';
    if(SC.expanded){
      var errBlock = '';
      if(SC.lastError){
        var code = SC.lastErrorCode ? ' <span class="sc-err-code">' + escHtml(SC.lastErrorCode) + '</span>' : '';
        errBlock = '<div class="sc-panel-err">' +
          '<div class="sc-panel-err-h">Last error' + code + '</div>' +
          '<div class="sc-panel-err-msg">' + escHtml(SC.lastError) + '</div>' +
          (SC.lastErrorAt ? '<div class="sc-panel-err-when">' + fmtAgo(SC.lastErrorAt) + '</div>' : '') +
          '</div>';
      }
      html += '<div class="sc-panel" role="dialog" aria-label="Sync status detail">' +
        '<div class="sc-panel-row"><span class="sc-k">Status</span><span class="sc-v">' + txt + '</span></div>' +
        '<div class="sc-panel-row"><span class="sc-k">Detail</span><span class="sc-v">' + sub + '</span></div>' +
        (SC.user ? '<div class="sc-panel-row"><span class="sc-k">Signed in</span><span class="sc-v">' + SC.user + '</span></div>' : '') +
        '<div class="sc-panel-row"><span class="sc-k">Last saved</span><span class="sc-v">' + (SC.lastSavedAt ? fmtAgo(SC.lastSavedAt) : 'not yet') + '</span></div>' +
        '<div class="sc-panel-row"><span class="sc-k">Pending</span><span class="sc-v">' + SC.pending + '</span></div>' +
        errBlock +
        /* v.175: the toolbar pill no longer has its own Sync Now button
           (the wide bar is gone), so the expanded panel is the single
           place to force a re-push. */
        '<button type="button" class="sc-cta" id="scSyncNow"' + disabled + '>↻ Sync now</button>' +
        '<button type="button" class="sc-cta sc-cta-alt" id="scCopyDiag">⧉ Copy diagnostics</button>' +
        '</div>';
    }
    SC.el.innerHTML = html;
    var toggle = SC.el.querySelector('#scBarToggle');
    if(toggle){
      toggle.addEventListener('click', function(e){
        e.stopPropagation();
        SC.expanded = !SC.expanded;
        render();
      });
    }
    var btn = SC.el.querySelector('#scSyncNow');
    if(btn){
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        if(SC.syncFn){
          SC.setState('saving');
          try{
            var p = SC.syncFn();
            if(p && typeof p.then === 'function'){
              p.then(function(){ SC.markSaved(); })
               .catch(function(err){ SC.markError(err); });
            } else {
              SC.markSaved();
            }
          }catch(err){ SC.markError(err); }
        }
      });
    }
    var cdb = SC.el.querySelector('#scCopyDiag');
    if(cdb){
      cdb.addEventListener('click', function(e){
        e.stopPropagation();
        var diag = [
          'Canada & New England 2026 — Sync diagnostics',
          'Site version: ' + (window.SITE_VERSION || '?'),
          'Page: ' + location.pathname,
          'When: ' + new Date().toISOString(),
          'State: ' + SC.state,
          'Signed in as: ' + (SC.user || '(none)'),
          'Last saved at: ' + (SC.lastSavedAt ? new Date(SC.lastSavedAt).toISOString() : 'never'),
          'Pending writes: ' + SC.pending,
          'Init error: ' + (SC.initError || '(none)'),
          'Last error code: ' + (SC.lastErrorCode || '(none)'),
          'Last error message: ' + (SC.lastError || '(none)'),
          'Last error at: ' + (SC.lastErrorAt ? new Date(SC.lastErrorAt).toISOString() : 'never'),
          'Online: ' + (navigator.onLine ? 'yes' : 'no'),
          'User agent: ' + navigator.userAgent
        ].join('\n');
        if(navigator.clipboard && navigator.clipboard.writeText){
          navigator.clipboard.writeText(diag).then(function(){
            cdb.textContent = '✓ Copied — paste anywhere';
            setTimeout(function(){ cdb.textContent = '⧉ Copy diagnostics'; }, 1800);
          }).catch(function(){ cdb.textContent = 'Copy failed (see console)'; console.log(diag); });
        } else {
          console.log(diag);
          cdb.textContent = '(printed to console)';
          setTimeout(function(){ cdb.textContent = '⧉ Copy diagnostics'; }, 1800);
        }
      });
    }
  }

  function tick(){
    /* v.173: refresh the bar so "Saved · 12s ago" stays current even when
       no other state changes. Cheap render — DOM is tiny. */
    if(SC.state === 'synced' && SC.el) render();
  }

  SC.init = function(){
    if(SC.el) return;
    SC.el = document.createElement('div');
    SC.el.id = 'syncCenter';
    SC.el.className = 'sync-center';
    document.body.appendChild(SC.el);
    SC.state = 'connecting';
    render();
    if(!SC._tickT) SC._tickT = setInterval(tick, 10000);
    /* Click outside closes the expanded panel */
    document.addEventListener('click', function(e){
      if(!SC.expanded || !SC.el) return;
      if(SC.el.contains(e.target)) return;
      SC.expanded = false;
      render();
    });
    /* Browser online/offline transitions */
    window.addEventListener('online', function(){
      if(SC.state === 'offline'){
        SC.setState('connecting');
        if(SC.syncFn){
          try{ SC.syncFn(); SC.markSaved(); }catch(e){ SC.setState('error'); }
        }
      }
    });
    window.addEventListener('offline', function(){ SC.setState('offline'); });
  };

  SC.setState = function(state){
    SC.state = state;
    render();
  };
  SC.markSaving = function(){
    SC.state = 'saving';
    render();
  };
  SC.markSaved = function(){
    SC.state = 'synced';
    SC.lastSavedAt = Date.now();
    SC.pending = 0;
    /* v.172: clear lingering error once a successful save lands. */
    SC.lastError = '';
    SC.lastErrorCode = '';
    if(SC.el){
      SC.el.classList.remove('sc-flash');
      /* force reflow so the animation re-runs every save */
      void SC.el.offsetWidth;
      SC.el.classList.add('sc-flash');
    }
    render();
  };
  SC.markError = function(err){
    if(err){
      SC.lastError = (err && err.message) ? err.message : String(err);
      SC.lastErrorCode = (err && err.code) ? String(err.code) : '';
      SC.lastErrorAt = Date.now();
      /* Log to console with a grep-able prefix. */
      try{ console.error('[CnE2026 sync error]', SC.lastErrorCode || '', SC.lastError, err); }catch(e){}
    }
    SC.setState('error');
  };
  SC.markInitError = function(err){
    SC.initError = (err && err.message) ? err.message : String(err || '');
    try{ console.error('[CnE2026 init error]', err); }catch(e){}
  };
  SC.markOffline = function(){ SC.setState('offline'); };
  SC.markSignedOut = function(){
    SC.user = '';
    SC.setState('signedout');
  };
  SC.setUser = function(name){
    SC.user = name || '';
    render();
  };
  SC.bumpPending = function(n){
    SC.pending = Math.max(0, (SC.pending|0) + (n|0));
    render();
  };
  SC.setPending = function(n){
    SC.pending = Math.max(0, n|0);
    render();
  };
  SC.setSyncFn = function(fn){ SC.syncFn = fn; };
  SC.setDomain = function(d){ SC.domain = d; };

  window.__SyncCenter = SC;

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ SC.init(); });
  } else {
    SC.init();
  }
})();
