$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Write-Section {
    param([string]$Message)
    Write-Host ""
    Write-Host "=== $Message ===" -ForegroundColor Cyan
}

function Fail {
    param([string]$Message)
    Write-Error $Message
    exit 1
}

function Test-CommandExists {
    param([string]$Name)
    return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

function Get-CommandVersion {
    param(
        [string]$CommandName,
        [string[]]$VersionArgs = @('--version')
    )

    if (-not (Test-CommandExists $CommandName)) {
        return 'not installed'
    }

    try {
        $result = & $CommandName @VersionArgs 2>$null | Select-Object -First 1
        if ($null -ne $result -and $result.ToString().Trim() -ne '') {
            return $result.ToString().Trim()
        }

        return 'available'
    }
    catch {
        return 'available'
    }
}

function Add-UserBinToPath {
    param([string]$BinPath)

    if (-not $BinPath) {
        return
    }

    $segments = $env:PATH -split ';'
    if ($segments -notcontains $BinPath) {
        $env:PATH = "$BinPath;$env:PATH"
    }
}

# 1) Verify platform and prerequisites
Write-Section 'Checking environment'

if ($env:OS -ne 'Windows_NT') {
    Fail 'This setup script must be run on Windows PowerShell.'
}

if (-not $PSVersionTable) {
    Fail 'PowerShell is required to run this setup script.'
}

# Required helpers for installation and setup
if (-not (Test-CommandExists git)) {
    Fail 'Git is required but not installed. Install Git for Windows from https://git-scm.com/download/win and rerun this script.'
}

if (-not (Test-CommandExists node)) {
    Fail 'Node.js is required but not installed. Install Node.js LTS from https://nodejs.org/ and rerun this script.'
}

if (-not (Test-CommandExists npm)) {
    Fail 'npm is required but not installed. Install Node.js LTS from https://nodejs.org/ and rerun this script.'
}

$DockerAvailable = $false
$DockerRunning = $false
if (Test-CommandExists docker) {
    $DockerAvailable = $true
    try {
        $null = docker info 2>$null
        $DockerRunning = $true
    }
    catch {
        $DockerRunning = $false
    }
}

Write-Host "Git: $(git --version 2>$null | Select-Object -First 1)"
Write-Host "Node: $(node --version 2>$null | Select-Object -First 1)"
Write-Host "npm: $(npm --version 2>$null | Select-Object -First 1)"
if ($DockerAvailable) {
    Write-Host "Docker: available"
    if ($DockerRunning) {
        Write-Host "Docker daemon: running"
    }
    else {
        Write-Host "Docker daemon: not running"
    }
}
else {
    Write-Host 'Docker: not installed'
}

# 2) Ensure audit working directories exist
Write-Section 'Preparing audit directories'
$AuditRoot = $PSScriptRoot
foreach ($directory in @(
    $AuditRoot,
    (Join-Path $AuditRoot 'results'),
    (Join-Path $AuditRoot 'reports'),
    (Join-Path $AuditRoot 'logs')
)) {
    New-Item -ItemType Directory -Force -Path $directory | Out-Null
    Write-Host "Ready: $directory"
}

# 3) Track tool status
$ToolStatus = [ordered]@{
    'Gitleaks' = @{ Installed = $false; Version = 'not installed' }
    'Semgrep' = @{ Installed = $false; Version = 'not installed' }
    'Trivy' = @{ Installed = $false; Version = 'not installed' }
    'Nuclei' = @{ Installed = $false; Version = 'not installed' }
    'SonarQube' = @{ Installed = $false; Version = 'not installed' }
    'npm' = @{ Installed = $false; Version = 'not installed' }
}

# 4) Install or verify each required tool
Write-Section 'Verifying and installing security tools'

# npm audit is part of npm, not a separate dependency install
if (Test-CommandExists npm) {
    $ToolStatus['npm'].Installed = $true
    $ToolStatus['npm'].Version = (Get-CommandVersion -CommandName 'npm' -VersionArgs @('--version'))
    Write-Host "npm audit is available via npm. Version: $($ToolStatus['npm'].Version)"
}
else {
    Fail 'npm is not available after required checks. Install Node.js LTS and rerun.'
}

# Gitleaks: official windows install via winget if available, otherwise official upstream Go install
if (-not (Test-CommandExists gitleaks)) {
    Write-Host 'Gitleaks not found. Installing using official package manager or official upstream method...'
    if (Test-CommandExists winget) {
        winget install --id Gitleaks.Gitleaks -e --source winget
    }
    elseif (Test-CommandExists go) {
        $gobin = & go env GOPATH
        if (-not $gobin) { $gobin = "$HOME/go" }
        Add-UserBinToPath (Join-Path $gobin 'bin')
        & go install -v github.com/gitleaks/gitleaks/v8@latest
    }
    else {
        Fail 'Gitleaks could not be installed because neither winget nor Go is available.'
    }
}

if (Test-CommandExists gitleaks) {
    $ToolStatus['Gitleaks'].Installed = $true
    $ToolStatus['Gitleaks'].Version = (Get-CommandVersion -CommandName 'gitleaks' -VersionArgs @('version'))
    Write-Host "Gitleaks: $($ToolStatus['Gitleaks'].Version)"
}
else {
    Fail 'Gitleaks installation did not complete successfully.'
}

# Semgrep: detect the user's installed Semgrep first, then fall back to official Python install only if needed
if (-not (Test-CommandExists semgrep)) {
    Write-Host 'Semgrep not found in PATH. Checking common user Python Scripts directories...'

    $SemgrepCandidates = @(
        (Join-Path $env:APPDATA 'Python\Python312\Scripts\semgrep.exe'),
        (Join-Path $env:APPDATA 'Python\Python311\Scripts\semgrep.exe'),
        (Join-Path $env:APPDATA 'Python\Python310\Scripts\semgrep.exe'),
        (Join-Path $env:LOCALAPPDATA 'Programs\Python\Python312\Scripts\semgrep.exe'),
        (Join-Path $env:LOCALAPPDATA 'Programs\Python\Python311\Scripts\semgrep.exe'),
        (Join-Path $env:LOCALAPPDATA 'Programs\Python\Python310\Scripts\semgrep.exe')
    )

    $SemgrepCommand = $null
    foreach ($candidate in $SemgrepCandidates) {
        if (Test-Path $candidate) {
            $SemgrepCommand = $candidate
            break
        }
    }

    if (-not $SemgrepCommand) {
        $UserPythonRoot = Join-Path $env:LOCALAPPDATA 'Programs\Python'
        if (Test-Path $UserPythonRoot) {
            $PythonScriptDirs = Get-ChildItem -Path $UserPythonRoot -Directory -ErrorAction SilentlyContinue | ForEach-Object {
                Join-Path $_.FullName 'Scripts'
            }

            foreach ($dir in $PythonScriptDirs) {
                $candidate = Join-Path $dir 'semgrep.exe'
                if (Test-Path $candidate) {
                    $SemgrepCommand = $candidate
                    break
                }
            }
        }
    }

    if ($SemgrepCommand) {
        $SemgrepDir = Split-Path -Parent $SemgrepCommand
        Add-UserBinToPath $SemgrepDir
        $SemgrepVersion = (& $SemgrepCommand --version 2>$null | Select-Object -First 1)
        if ($SemgrepVersion) {
            Write-Host "Semgrep already installed at $SemgrepCommand. Version: $SemgrepVersion"
        }
        else {
            Write-Host "Semgrep already installed at $SemgrepCommand."
        }
    }
    else {
        Write-Host 'Semgrep not found in user Python Script locations. Checking for a real Python executable...'

        $PythonCmd = $null
        $PythonCandidates = @(
            'py.exe',
            'python.exe',
            'python3.exe'
        )

        foreach ($candidate in $PythonCandidates) {
            $resolved = Get-Command $candidate -ErrorAction SilentlyContinue
            if ($null -ne $resolved -and $resolved.Source) {
                $PythonCmd = $resolved.Source
                break
            }
        }

        if (-not $PythonCmd) {
            $commonPythonDirs = @(
                (Join-Path $env:LOCALAPPDATA 'Programs\Python'),
                (Join-Path ${env:ProgramFiles} 'Python'),
                (Join-Path ${env:ProgramFiles(x86)} 'Python'),
                'C:\Python312',
                'C:\Python311',
                'C:\Python310'
            )

            foreach ($dir in $commonPythonDirs) {
                if (-not (Test-Path $dir)) { continue }

                $pythonExecutables = Get-ChildItem -Path $dir -Recurse -Filter 'python.exe' -File -ErrorAction SilentlyContinue
                if ($pythonExecutables -and $pythonExecutables.Count -gt 0) {
                    $PythonCmd = $pythonExecutables[0].FullName
                    break
                }

                $pyExecutables = Get-ChildItem -Path $dir -Recurse -Filter 'py.exe' -File -ErrorAction SilentlyContinue
                if ($pyExecutables -and $pyExecutables.Count -gt 0) {
                    $PythonCmd = $pyExecutables[0].FullName
                    break
                }
            }
        }

        if (-not $PythonCmd) {
            if (Test-CommandExists winget) {
                Write-Host 'No real Python installation was found. Installing Python 3.12 using winget...'
                winget install --id Python.Python.3.12 -e --source winget

                $refreshPaths = @(
                    (Join-Path $env:LOCALAPPDATA 'Programs\Python\Python312'),
                    (Join-Path $env:LOCALAPPDATA 'Programs\Python\Python312\Scripts'),
                    (Join-Path ${env:ProgramFiles} 'Python\Python312'),
                    (Join-Path ${env:ProgramFiles} 'Python\Python312\Scripts'),
                    (Join-Path ${env:ProgramFiles(x86)} 'Python\Python312'),
                    (Join-Path ${env:ProgramFiles(x86)} 'Python\Python312\Scripts')
                )

                foreach ($path in $refreshPaths) {
                    if (Test-Path $path) {
                        $env:PATH = "$path;$env:PATH"
                    }
                }

                foreach ($candidate in @('py.exe', 'python.exe', 'python3.exe')) {
                    $resolved = Get-Command $candidate -ErrorAction SilentlyContinue
                    if ($null -ne $resolved -and $resolved.Source) {
                        $PythonCmd = $resolved.Source
                        break
                    }
                }

                if (-not $PythonCmd) {
                    $commonPythonDirs = @(
                        (Join-Path $env:LOCALAPPDATA 'Programs\Python'),
                        (Join-Path ${env:ProgramFiles} 'Python'),
                        (Join-Path ${env:ProgramFiles(x86)} 'Python'),
                        'C:\Python312',
                        'C:\Python311',
                        'C:\Python310'
                    )

                    foreach ($dir in $commonPythonDirs) {
                        if (-not (Test-Path $dir)) { continue }

                        $pythonExecutables = Get-ChildItem -Path $dir -Recurse -Filter 'python.exe' -File -ErrorAction SilentlyContinue
                        if ($pythonExecutables -and $pythonExecutables.Count -gt 0) {
                            $PythonCmd = $pythonExecutables[0].FullName
                            break
                        }

                        $pyExecutables = Get-ChildItem -Path $dir -Recurse -Filter 'py.exe' -File -ErrorAction SilentlyContinue
                        if ($pyExecutables -and $pyExecutables.Count -gt 0) {
                            $PythonCmd = $pyExecutables[0].FullName
                            break
                        }
                    }
                }
            }
        }

        if (-not $PythonCmd) {
            Fail 'Semgrep requires Python, and no real Python executable could be found or installed. Install Python 3 and rerun this script.'
        }

        & $PythonCmd --version
        if ($LASTEXITCODE -ne 0) {
            Fail 'Python was found, but the executable is not valid. Fix the Python installation and rerun this script.'
        }

        & $PythonCmd -m pip install --user semgrep

        $UserScripts = Join-Path $HOME 'AppData\Roaming\Python\Scripts'
        if (Test-Path $UserScripts) { Add-UserBinToPath $UserScripts }

        $LocalPythonScripts = Join-Path $HOME 'AppData\Local\Programs\Python'
        if (Test-Path $LocalPythonScripts) {
            $PythonDirs = Get-ChildItem -Path $LocalPythonScripts -Directory -ErrorAction SilentlyContinue
            foreach ($pyDir in $PythonDirs) {
                $scriptsDir = Join-Path $pyDir.FullName 'Scripts'
                if (Test-Path $scriptsDir) {
                    Add-UserBinToPath $scriptsDir
                }
            }
        }
    }
}

if (Test-CommandExists semgrep) {
    $ToolStatus['Semgrep'].Installed = $true
    $ToolStatus['Semgrep'].Version = (Get-CommandVersion -CommandName 'semgrep' -VersionArgs @('--version'))
    Write-Host "Semgrep: $($ToolStatus['Semgrep'].Version)"
}
else {
    Fail 'Semgrep installation did not complete successfully.'
}

# Trivy: official install via winget when available
if (-not (Test-CommandExists trivy)) {
    Write-Host 'Trivy not found. Installing using the official Aqua Security package manager method...'
    if (Test-CommandExists winget) {
        winget install --id AquaSecurity.Trivy -e --source winget
    }
    else {
        Fail 'Trivy could not be installed because winget is not available.'
    }
}

if (Test-CommandExists trivy) {
    $ToolStatus['Trivy'].Installed = $true
    $ToolStatus['Trivy'].Version = (Get-CommandVersion -CommandName 'trivy' -VersionArgs @('--version'))
    Write-Host "Trivy: $($ToolStatus['Trivy'].Version)"
}
else {
    Fail 'Trivy installation did not complete successfully.'
}

# Nuclei: official upstream Go installation
if (-not (Test-CommandExists nuclei)) {
    Write-Host 'Nuclei not found. Installing using the official Go upstream installation method...'
    if (Test-CommandExists go) {
        $gobin = & go env GOPATH
        if (-not $gobin) { $gobin = "$HOME/go" }
        Add-UserBinToPath (Join-Path $gobin 'bin')
        & go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest
    }
    else {
        Fail 'Nuclei requires Go, but Go is not installed. Install Go and rerun this script.'
    }
}

if (Test-CommandExists nuclei) {
    $ToolStatus['Nuclei'].Installed = $true
    $ToolStatus['Nuclei'].Version = (Get-CommandVersion -CommandName 'nuclei' -VersionArgs @('-version'))
    Write-Host "Nuclei: $($ToolStatus['Nuclei'].Version)"
}
else {
    Fail 'Nuclei installation did not complete successfully.'
}

# SonarQube: prefer Docker-based local install if Docker is available and running
if (Test-CommandExists docker) {
    $dockerContainerName = 'sonarqube'
    $containerExists = $false
    try {
        $existing = docker ps -a --format '{{.Names}}' 2>$null
        if ($existing -contains $dockerContainerName) {
            $containerExists = $true
        }
    }
    catch {
        $containerExists = $false
    }

    if ($DockerRunning) {
        if (-not $containerExists) {
            Write-Host 'SonarQube not found. Pulling and starting the official Docker image...'
            docker pull sonarqube:lts-community
            docker run -d --name sonarqube -p 9000:9000 -p 9092:9092 sonarqube:lts-community
        }
        else {
            Write-Host 'SonarQube container already exists; reusing it.'
        }

        $running = $false
        try {
            $runningNames = docker ps --format '{{.Names}}' 2>$null
            if ($runningNames -contains $dockerContainerName) {
                $running = $true
            }
        }
        catch {
            $running = $false
        }

        if (-not $running) {
            Fail 'SonarQube Docker container could not be started. Check Docker daemon status and try again.'
        }

        $ToolStatus['SonarQube'].Installed = $true
        $ToolStatus['SonarQube'].Version = 'docker-container: sonarqube:lts-community'
        Write-Host "SonarQube: $($ToolStatus['SonarQube'].Version)"
    }
    else {
        Fail 'SonarQube requires Docker, but the Docker daemon is not running. Start Docker Desktop or a local Docker service, then rerun this script.'
    }
}
else {
    Fail 'SonarQube requires Docker, but Docker is not installed. Install Docker Desktop for Windows and rerun this script.'
}

# 5) Final verification summary
Write-Section 'Final status summary'
Write-Host 'Installed / already available:'
foreach ($tool in @('Gitleaks', 'Semgrep', 'Trivy', 'Nuclei', 'SonarQube', 'npm')) {
    $value = $ToolStatus[$tool]
    Write-Host ("- {0}: {1} | {2}" -f $tool, $value.Installed.ToString().ToLowerInvariant(), $value.Version)
}

Write-Host ""
Write-Host 'SECURITY TOOL SETUP COMPLETE' -ForegroundColor Green
Write-Host 'Detected versions:'
foreach ($tool in @('Gitleaks', 'Semgrep', 'Trivy', 'Nuclei', 'SonarQube', 'npm')) {
    Write-Host ("- {0}: {1}" -f $tool, $ToolStatus[$tool].Version)
}
