param([string]$Repo = '.')
Set-Location $Repo
$ErrorActionPreference = 'Stop'

$docPath = (Resolve-Path 'documents.html').Path
$jsPath  = Join-Path (Get-Location) 'tools\v216-export.js'

# Read inputs via .NET (preserves CRLF, bypasses mount cache surprises)
$doc = [System.IO.File]::ReadAllText($docPath, [System.Text.Encoding]::UTF8)
$js  = [System.IO.File]::ReadAllText($jsPath,  [System.Text.Encoding]::UTF8)
Write-Host "INPUT: doc=$($doc.Length) chars, js=$($js.Length) chars"

if (-not $doc.TrimEnd().EndsWith('</html>')) { throw 'documents.html does not end with </html>' }

# Edit 1: insert the export-row HTML block immediately after dv-summary
$buttonAnchor = '  <div class="dv-sum" id="dv-summary" aria-live="polite"></div>'
$buttonInsert = @"

  <!-- v.216: export-to-PDF button below stats. Hidden until crew. -->
  <div class="dv-export-row" id="dv-export-row" hidden>
    <button type="button" id="dv-export-pdf" class="dv-export-btn" title="Download a PDF with confirmation numbers, map links, and uploaded files">
      <span class="dv-export-ic" aria-hidden="true">📄</span>
      <span class="dv-export-l">Export to PDF</span>
    </button>
    <span class="dv-export-hint">Confirmation numbers · Apple Maps links · every uploaded file</span>
  </div>
"@
if (-not $doc.Contains($buttonAnchor)) { throw 'Edit 1 anchor not found' }
$doc = $doc.Replace($buttonAnchor, $buttonAnchor + $buttonInsert)
Write-Host "AFTER E1: $($doc.Length) chars"

# Edit 2: insert export-row CSS right before the .dv-sum block
$cssAnchor = '  .dv-sum{ display:flex; flex-direction:column; gap:6px; margin:4px 0 26px; }'
$cssInsert = @"
  /* v.216 - Export to PDF row. */
  .dv-export-row{ display:flex; align-items:center; gap:14px; flex-wrap:wrap; margin:0 0 26px; padding:14px 16px; background:rgba(200,155,74,.06); border:1px dashed rgba(200,155,74,.32); border-radius:9px; }
  .dv-export-btn{ display:inline-flex; align-items:center; gap:10px; padding:9px 16px; border-radius:999px; border:1px solid rgba(200,155,74,.55); background:linear-gradient(180deg, rgba(200,155,74,.20), rgba(200,155,74,.10)); color:var(--brass-lt); cursor:pointer; font:700 .74rem/1 var(--d-mono); letter-spacing:.06em; text-transform:uppercase; }
  .dv-export-btn:hover{ background:linear-gradient(180deg, rgba(200,155,74,.32), rgba(200,155,74,.18)); color:var(--cream); }
  .dv-export-btn[disabled]{ opacity:.6; cursor:wait; }
  .dv-export-hint{ font:600 .64rem/1.2 var(--d-mono); color:var(--ink-dim); letter-spacing:.04em; flex:1 1 auto; }
  .dv-sum{ display:flex; flex-direction:column; gap:6px; margin:4px 0 16px; }
"@
if (-not $doc.Contains($cssAnchor)) { throw 'Edit 2 anchor not found' }
$doc = $doc.Replace($cssAnchor, $cssInsert)
Write-Host "AFTER E2: $($doc.Length) chars"

# Edit 3: paste the entire export function before markMyselfDone
$jsAnchor = '  function markMyselfDone(docId){'
if (-not $doc.Contains($jsAnchor)) { throw 'Edit 3 anchor not found' }
$doc = $doc.Replace($jsAnchor, $js)
Write-Host "AFTER E3: $($doc.Length) chars"

# Edit 4: wire refreshExportRowVisibility into setCrew's tail
$setCrewAnchor = "    revealConfs();`r`n    renderAll();`r`n    startVault();`r`n  }"
$setCrewReplace = "    revealConfs();`r`n    renderAll();`r`n    startVault();`r`n    refreshExportRowVisibility();   /* v.216 */`r`n  }"
if ($doc.Contains($setCrewAnchor)) {
    $doc = $doc.Replace($setCrewAnchor, $setCrewReplace)
    Write-Host "AFTER E4: $($doc.Length) chars"
} else {
    Write-Host "AFTER E4: anchor not found, skipped"
}

if (-not $doc.TrimEnd().EndsWith('</html>')) { throw 'POST: documents.html no longer ends with </html>' }

# Atomic write via .NET
$tmp = "$docPath.tmp216"
[System.IO.File]::WriteAllText($tmp, $doc, (New-Object System.Text.UTF8Encoding($false)))
$tmpLen = (Get-Item $tmp).Length
Write-Host "TMP written: $tmpLen bytes"
Move-Item $tmp $docPath -Force
$finalLen = (Get-Item $docPath).Length
Write-Host "FINAL: $finalLen bytes"

# Verify on disk
$check = [System.IO.File]::ReadAllText($docPath, [System.Text.Encoding]::UTF8)
Write-Host ("Ends with </html>: " + $check.TrimEnd().EndsWith('</html>'))
Write-Host ("Contains exportToPDF: " + $check.Contains('exportToPDF'))
Write-Host ("Contains markMyselfDone: " + $check.Contains('markMyselfDone'))
Write-Host ("Contains dv-export-pdf:  " + $check.Contains('dv-export-pdf'))
