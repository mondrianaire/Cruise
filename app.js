/* Canada & New England 2026 — shared app shell (motion toggle, countdown, stars, scrollspy) */
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
