Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$unpackedDir = "F:\Spotify-Craft[rea]\Wavelength\desktop\dist\win-unpacked"
$destZip = "F:\Spotify-Craft[rea]\Wavelength\wavelength-windows-x64.zip"

if (Test-Path -LiteralPath $destZip) {
    Remove-Item -LiteralPath $destZip -Force
}

Write-Host "Creating $destZip from $unpackedDir..."
[System.IO.Compression.ZipFile]::CreateFromDirectory($unpackedDir, $destZip, [System.IO.Compression.CompressionLevel]::Optimal, $false)

Write-Host "--- Verification ---"
Get-Item -LiteralPath $destZip | Select-Object Name, Length, LastWriteTime | Format-Table -AutoSize
