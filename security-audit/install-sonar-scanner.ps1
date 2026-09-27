$ErrorActionPreference = "Stop"

$Version = "8.1.0.6389"
$Url = "https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-$Version-windows-x64.zip"

$InstallRoot = Join-Path $env:USERPROFILE "sonar-scanner"
$ZipPath = Join-Path $env:TEMP "sonar-scanner-$Version.zip"

Write-Host "Downloading SonarScanner CLI $Version..."

Invoke-WebRequest `
    -Uri $Url `
    -OutFile $ZipPath

Write-Host "Download complete."

if (Test-Path $InstallRoot) {
    Remove-Item $InstallRoot -Recurse -Force
}

New-Item -ItemType Directory -Path $InstallRoot -Force | Out-Null

Write-Host "Extracting..."

Expand-Archive `
    -Path $ZipPath `
    -DestinationPath $InstallRoot `
    -Force

$Extracted = Get-ChildItem `
    -Path $InstallRoot `
    -Directory |
    Select-Object -First 1

if ($null -eq $Extracted) {
    throw "Could not find extracted SonarScanner directory."
}

$ScannerBin = Join-Path $Extracted.FullName "bin"

if (-not (Test-Path $ScannerBin)) {
    throw "SonarScanner bin directory was not found."
}

# Add to current PowerShell session
$env:Path = "$ScannerBin;$env:Path"

Write-Host ""
Write-Host "SonarScanner installed."
Write-Host "Scanner path:"
Write-Host $ScannerBin

Write-Host ""
Write-Host "Testing SonarScanner..."

sonar-scanner --version

Write-Host ""
Write-Host "SUCCESS: SonarScanner is ready."