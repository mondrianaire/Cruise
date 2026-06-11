$ErrorActionPreference = 'Continue'
$root = "C:\Users\mondr\Documents\Claude\Projects\Cruise"
$a = [System.IO.File]::ReadAllText("$root\app.js", [System.Text.UTF8Encoding]::new($false))
$a = [regex]::Replace($a, "window\.SITE_VERSION = 'v\.\d+'", "window.SITE_VERSION = 'v.161'")
[System.IO.File]::WriteAllText("$root\app.js", $a, [System.Text.UTF8Encoding]::new($false))
foreach ($f in 'index.html','overview.html','journey.html','ship.html','programs.html','ports.html','kbyg.html','documents.html') {
  $p = Join-Path $root $f
  if (-not (Test-Path $p)) { continue }
  $t = [System.IO.File]::ReadAllText($p, [System.Text.UTF8Encoding]::new($false))
  $t = [regex]::Replace($t, '\?v=\d+', '?v=161')
  [System.IO.File]::WriteAllText($p, $t, [System.Text.UTF8Encoding]::new($false))
}
Set-Location $root
if (Test-Path .git\index.lock) { Remove-Item .git\index.lock -Force }
git add -A
git commit -m "v.161: cache-bust bump - force fresh fetch of v.158 venueMatch + v.160 restore scripts"
git pull --rebase
git push
