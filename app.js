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
    if(n && e) return { name:n, email:e };
  }catch(e){}
  return null;
})();
window.__writeCrewSeed = function(name, email){
  try{
    if(name && email){
      localStorage.setItem('cnen_crew_name', String(name));
      localStorage.setItem('cnen_crew_email', String(email));
      window.__crewSeed = { name:String(name), email:String(email) };
    }
  }catch(e){}
};
window.__clearCrewSeed = function(){
  try{
    localStorage.removeItem('cnen_crew_name');
    localStorage.removeItem('cnen_crew_email');
    window.__crewSeed = null;
  }catch(e){}
};

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
window.SITE_VERSION = 'v.160';
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
