import sys, os
sys.path.insert(0, 'tools')
from safe_write import safe_write
with open('documents.html', encoding='utf-8') as f: s = f.read()
print('IN:', len(s), 'bytes')
assert s.rstrip().endswith('</html>'), 'precondition failed'

# Edit 1: Add the export-row HTML below dv-summary
o = '  <div class="dv-sum" id="dv-summary" aria-live="polite"></div>'
n = o + '''
  <!-- v.216: export-to-PDF button below stats. Hidden until crew. -->
  <div class="dv-export-row" id="dv-export-row" hidden>
    <button type="button" id="dv-export-pdf" class="dv-export-btn" title="Download a PDF with confirmation numbers, map links, and uploaded files">
      <span class="dv-export-ic" aria-hidden="true">DOC</span>
      <span class="dv-export-l">Export to PDF</span>
    </button>
    <span class="dv-export-hint">Confirmation numbers - Apple Maps links - every uploaded file</span>
  </div>'''
assert o in s, 'edit1 anchor missing'
s = s.replace(o, n, 1)

# Edit 2: CSS for export row
o = '  .dv-sum{ display:flex; flex-direction:column; gap:6px; margin:4px 0 26px; }'
n = '''  .dv-sum{ display:flex; flex-direction:column; gap:6px; margin:4px 0 16px; }
  /* v.216 - Export to PDF row. */
  .dv-export-row{ display:flex; align-items:center; gap:14px; flex-wrap:wrap; margin:0 0 26px; padding:14px 16px; background:rgba(200,155,74,.06); border:1px dashed rgba(200,155,74,.32); border-radius:9px; }
  .dv-export-btn{ display:inline-flex; align-items:center; gap:10px; padding:9px 16px; border-radius:999px; border:1px solid rgba(200,155,74,.55); background:linear-gradient(180deg, rgba(200,155,74,.20), rgba(200,155,74,.10)); color:var(--brass-lt); cursor:pointer; font:700 .74rem/1 var(--d-mono); letter-spacing:.06em; text-transform:uppercase; }
  .dv-export-btn:hover{ background:linear-gradient(180deg, rgba(200,155,74,.32), rgba(200,155,74,.18)); color:var(--cream); }
  .dv-export-btn[disabled]{ opacity:.6; cursor:wait; }
  .dv-export-hint{ font:600 .64rem/1.2 var(--d-mono); color:var(--ink-dim); letter-spacing:.04em; flex:1 1 auto; }'''
assert o in s, 'edit2 anchor missing'
s = s.replace(o, n, 1)

# Edit 3: insert exportToPDF before markMyselfDone
o = '  /* v.206 - Mark Complete is PER-USER, not per-card. Pressing it marks'
# the anchor uses the original em-dash; check both forms
if o not in s:
    o = s.split('function markMyselfDone')[0].rsplit('function ', 1)[0]
    # fall back to a different anchor
    o = '  function markMyselfDone(docId){'
assert o in s, 'edit3 anchor missing'
n = '''  /* v.216 - Export to PDF. */
  function loadJsPDF(){
    return new Promise(function(resolve, reject){
      if(window.jspdf && window.jspdf.jsPDF) return resolve(window.jspdf);
      var sc = document.createElement('script');
      sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      sc.onload = function(){ resolve(window.jspdf); };
      sc.onerror = function(){ reject(new Error('Could not load jsPDF.')); };
      document.head.appendChild(sc);
    });
  }
  function mapsLink(q){ return q ? 'https://maps.apple.com/?q=' + encodeURIComponent(q) : null; }
  function fmtTs(ts){ if(!ts) return ''; try{ return new Date(ts).toLocaleString(undefined, { year:'numeric', month:'short', day:'numeric', hour:'numeric', minute:'2-digit' }); }catch(e){ return ''; } }
  async function exportToPDF(){
    if(!isCrew){ alert('Sign in via the Voyage Console first.'); return; }
    var btn = document.getElementById('dv-export-pdf');
    var lab = btn && btn.querySelector('.dv-export-l');
    if(btn){ btn.disabled = true; if(lab) lab.textContent = 'Building PDF...'; }
    try{
      var ns = await loadJsPDF();
      var jsPDF = ns.jsPDF;
      var pdf = new jsPDF({ unit:'pt', format:'letter' });
      var pageW = pdf.internal.pageSize.getWidth();
      var pageH = pdf.internal.pageSize.getHeight();
      var margin = 50, y = margin;
      function room(n){ if(y + n > pageH - margin){ pdf.addPage(); y = margin; } }
      function hr(){ pdf.setDrawColor(220); pdf.line(margin, y, pageW - margin, y); y += 12; }
      function wrap(t, w){ return pdf.splitTextToSize(String(t||''), w); }
      pdf.setFont('helvetica','bold'); pdf.setFontSize(24);
      pdf.text('Document Vault', margin, y); y += 28;
      pdf.setFont('helvetica','normal'); pdf.setFontSize(13);
      pdf.text('Canada & New England 2026 - ms Zuiderdam', margin, y); y += 18;
      pdf.setFontSize(10); pdf.setTextColor(120);
      pdf.text('Embark Quebec City Sat Jun 13 - Disembark Boston Sat Jun 20', margin, y); y += 24;
      pdf.setTextColor(0);
      pdf.setFont('helvetica','bold'); pdf.setFontSize(11);
      pdf.text('Generated for:', margin, y);
      pdf.setFont('helvetica','normal');
      pdf.text(String(crewName || crewKey || 'Crew'), margin + 110, y); y += 16;
      pdf.setFont('helvetica','bold');
      pdf.text('Exported:', margin, y);
      pdf.setFont('helvetica','normal');
      pdf.text(new Date().toLocaleString(), margin + 110, y); y += 24;
      var me = crewKey || '_group';
      var st = { needed:0, pending:0, ready:0, na:0, total:0 };
      Object.keys(window.__DV.byId).forEach(function(id){
        var dm = window.__DV.byId[id];
        var who = effectiveWhoFor(id);
        if(who.length && who.indexOf(me) < 0) return;
        var slot = dm.shared ? '_group' : (who.length ? me : '_group');
        var ps = statusForPerson(id, slot);
        if(ps==='na') st.na++;
        else if(ps==='ready' || ps==='done'){ st.ready++; st.total++; }
        else if(ps==='pending'){ st.pending++; st.total++; }
        else { st.needed++; st.total++; }
      });
      pdf.setFont('helvetica','bold'); pdf.setFontSize(12);
      pdf.text('Your progress', margin, y); y += 16;
      pdf.setFont('helvetica','normal'); pdf.setFontSize(10);
      pdf.text(st.ready + ' ready - ' + st.pending + ' will upload - ' + st.needed + ' outstanding - ' + st.na + ' not needed - ' + st.total + ' total', margin, y);
      y += 24; hr();
      var docs = Object.values(window.__DV.byId).filter(function(d){
        var who = effectiveWhoFor(d.id);
        return !who.length || who.indexOf(me) >= 0;
      });
      docs.sort(function(a,b){ return String(a.date||'9999').localeCompare(String(b.date||'9999')); });
      for(var i=0;i<docs.length;i++){
        var d = docs[i];
        room(160);
        pdf.setFont('helvetica','bold'); pdf.setFontSize(14); pdf.setTextColor(0);
        var tl = wrap(d.title || 'Untitled', pageW - 2*margin);
        pdf.text(tl, margin, y); y += tl.length * 18;
        var cat = (window.__DV_CATS||{})[d.category];
        var parts = [];
        if(cat) parts.push(cat.label);
        if(d.date){ try{ parts.push(new Date(d.date).toDateString()); }catch(e){} }
        parts.push(d.shared ? 'SHARED - one upload covers everyone' : 'PER USER - each traveller uploads');
        var slot = d.shared ? '_group' : (effectiveWhoFor(d.id).length ? me : '_group');
        parts.push('Status: ' + statusForPerson(d.id, slot).toUpperCase());
        pdf.setFont('helvetica','normal'); pdf.setFontSize(9); pdf.setTextColor(110);
        pdf.text(parts.join('   -   '), margin, y); y += 14; pdf.setTextColor(0);
        if(d.vendor && d.vendor !== 'Unknown'){
          pdf.setFont('helvetica','bold'); pdf.setFontSize(10);
          pdf.text('Vendor:', margin, y);
          pdf.setFont('helvetica','normal');
          pdf.text(String(d.vendor), margin + 55, y);
          var ml = mapsLink(d.vendor);
          if(ml){
            pdf.setTextColor(40, 80, 200);
            var lx = margin + 55 + pdf.getTextWidth(String(d.vendor)) + 8;
            pdf.textWithLink('[open in Apple Maps]', lx, y, { url: ml });
            pdf.setTextColor(0);
          }
          y += 14;
        }
        if(d.confirmation){
          pdf.setFont('helvetica','bold'); pdf.setFontSize(10);
          pdf.text('Confirmation:', margin, y);
          pdf.setFont('courier','normal');
          pdf.text(String(d.confirmation), margin + 90, y);
          pdf.setFont('helvetica','normal');
          y += 14;
        }
        var who = effectiveWhoFor(d.id);
        if(who.length){
          pdf.setFont('helvetica','bold'); pdf.setFontSize(10);
          pdf.text('Travellers:', margin, y);
          pdf.setFont('helvetica','normal');
          pdf.text(who.map(function(k){ return NAMES[k]||k; }).join(', '), margin + 70, y); y += 14;
        }
        if(d.docs && d.docs.length){
          pdf.setFont('helvetica','bold'); pdf.setFontSize(10);
          pdf.text('Expected documents:', margin, y); y += 14;
          pdf.setFont('helvetica','normal'); pdf.setFontSize(9);
          for(var k=0;k<d.docs.length;k++){ room(12); pdf.text('- ' + d.docs[k], margin + 14, y); y += 12; }
        }
        if(d.notes){
          pdf.setFont('helvetica','bold'); pdf.setFontSize(10);
          pdf.text('Notes:', margin, y); y += 14;
          pdf.setFont('helvetica','normal'); pdf.setFontSize(9);
          var nl = wrap(d.notes, pageW - 2*margin - 14);
          for(var nn=0;nn<nl.length;nn++){ room(12); pdf.text(nl[nn], margin + 14, y); y += 12; }
        }
        var ppl = personsFor(d.id);
        var hasAtt = ppl.some(function(p){ return (arrFor(d.id, p) || []).length > 0; });
        if(hasAtt){
          y += 4;
          pdf.setFont('helvetica','bold'); pdf.setFontSize(10);
          pdf.text('Uploaded documents:', margin, y); y += 14;
          pdf.setFont('helvetica','normal'); pdf.setFontSize(9);
          for(var pi=0; pi<ppl.length; pi++){
            var p = ppl[pi];
            var atts = arrFor(d.id, p) || [];
            if(!atts.length) continue;
            room(14);
            pdf.setFont('helvetica','bold');
            pdf.text((p === '_group' ? 'Shared (group)' : (NAMES[p]||p)) + ':', margin + 14, y);
            pdf.setFont('helvetica','normal');
            y += 12;
            for(var ai=0; ai<atts.length; ai++){
              var a = atts[ai];
              room(12);
              var tlab = (TYPES[a.type] && TYPES[a.type].label) || a.type || 'doc';
              var line = (a.kind === 'file' ? '[FILE] ' : '[#]    ')
                       + (a.kind === 'file' ? (a.name || 'file') : (a.value || ''))
                       + '   [' + tlab + ']   - ' + (a.by || '?') + ' - ' + fmtTs(a.at);
              pdf.text(line, margin + 28, y); y += 12;
            }
          }
        }
        y += 16; room(20); hr();
      }
      pdf.save('document-vault-' + (crewKey || 'crew') + '-' + new Date().toISOString().slice(0,10) + '.pdf');
      if(btn){ btn.disabled = false; if(lab) lab.textContent = 'Export to PDF'; }
    }catch(err){
      console.error('[CnE2026 exportToPDF]', err);
      alert('Could not build PDF.\\n\\n' + (err && err.message ? err.message : err));
      if(btn){ btn.disabled = false; if(lab) lab.textContent = 'Export to PDF'; }
    }
  }
  function refreshExportRowVisibility(){
    var row = document.getElementById('dv-export-row');
    if(row) row.hidden = !isCrew;
  }
  document.addEventListener('click', function(ev){
    if(ev.target && ev.target.closest && ev.target.closest('#dv-export-pdf')){
      ev.preventDefault();
      exportToPDF();
    }
  });

  function markMyselfDone(docId){'''
s = s.replace(o, n, 1)

# Edit 4: wire refreshExportRowVisibility into setCrew + sign-out branch
o = "    revealConfs();\n    renderAll();\n    startVault();\n  }"
if o in s:
    s = s.replace(o, "    revealConfs();\n    renderAll();\n    startVault();\n    refreshExportRowVisibility();\n  }", 1)

print('len(s) before write:', len(s)); print('encoded bytes:', len(s.encode('utf-8'))); safe_write('documents.html', s); print('written size:', os.path.getsize('documents.html'))
print('OUT:', os.path.getsize('documents.html'), 'bytes')