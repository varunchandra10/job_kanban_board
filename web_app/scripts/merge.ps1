$srcDir = Join-Path $PSScriptRoot "..\frontend\src"
$outputFile = Join-Path $PSScriptRoot "..\frontend\app.js"

$files = Get-ChildItem -Path $srcDir -Filter "*.js" | Sort-Object Name
$nl = [Environment]::NewLine

$bundle = "// ==========================================================================$nl" +
          "// Job Tracker Kanban Board - Client Application Bundle$nl" +
          "// Automatically generated from frontend/src/*.js - DO NOT EDIT app.js DIRECTLY!$nl" +
          "// ==========================================================================$nl$nl"

foreach ($f in $files) {
    $content = (Get-Content $f.FullName -Raw).Trim()
    $bundle += "// --------------------------------------------------------------------------$nl"
    $bundle += "// MODULE: $($f.Name)$nl"
    $bundle += "// --------------------------------------------------------------------------$nl"
    $bundle += "$content$nl$nl"
    Write-Host "  + Bundled: $($f.Name)"
}

[IO.File]::WriteAllText($outputFile, $bundle, [Text.Encoding]::UTF8)
Write-Host "Bundle generated at $outputFile ($($files.Count) modules)."
