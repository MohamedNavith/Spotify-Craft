Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$botDir = "F:\Spotify-Craft[rea]\Wavelength\discord-bot"
$destZip = "F:\Spotify-Craft[rea]\Wavelength\wavelength-bot-wispbyte.zip"
$deployZip = "F:\Spotify-Craft[rea]\Wavelength\discord-bot\wavelength-bot-deploy.zip"

if (Test-Path -LiteralPath $destZip) {
    Remove-Item -LiteralPath $destZip -Force
}

$zip = [System.IO.Compression.ZipFile]::Open($destZip, [System.IO.Compression.ZipArchiveMode]::Create)

$rootFiles = @('index.js', 'package.json', 'package-lock.json', '.env', '.npmrc', 'README.md', 'ecosystem.config.js')
foreach ($f in $rootFiles) {
    $src = Join-Path $botDir $f
    if (Test-Path -LiteralPath $src) {
        Write-Host "Adding root file: $f"
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $src, $f) | Out-Null
    }
}

$distDir = Join-Path $botDir "dist"
Get-ChildItem -LiteralPath $distDir -Recurse | Where-Object { -not $_.PSIsContainer } | ForEach-Object {
    $rel = $_.FullName.Substring($distDir.Length + 1).Replace('\', '/')
    $entryName = "dist/" + $rel
    Write-Host "Adding entry: $entryName"
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $entryName) | Out-Null
}

$zip.Dispose()

Copy-Item -LiteralPath $destZip -Destination $deployZip -Force

Write-Host "--- Verification ---"
Get-Item -LiteralPath $destZip, $deployZip | Select-Object Name, Length, LastWriteTime | Format-Table -AutoSize
