param(
    [string]$NucleiTarget = "",
    [string]$SonarHost = "",
    [string]$SonarProjectKey = "RepairMithra"
)

$ErrorActionPreference = 'Continue'
Set-StrictMode -Version Latest

# ============================================================
# RepairMithra - Baseline Security Audit
# Branch: security-audit
# Purpose: Run security scanners and save raw results.
#
# IMPORTANT:
# - This script does NOT modify application source code.
# - Do NOT commit SONAR_TOKEN.
# - Nuclei runs only when -NucleiTarget is explicitly supplied.
# - Only scan systems/URLs you are authorized to test.
# - This is a baseline scan, NOT an OWASP certification.
# ============================================================


# ============================================================
# Paths
# ============================================================

$Root = Split-Path -Parent $PSScriptRoot
$AuditDir = $PSScriptRoot

$ResultsDir = Join-Path $AuditDir "results"
$ReportsDir = Join-Path $AuditDir "reports"
$LogsDir = Join-Path $AuditDir "logs"


# ============================================================
# Create directories
# ============================================================

New-Item -ItemType Directory -Force -Path $ResultsDir | Out-Null
New-Item -ItemType Directory -Force -Path $ReportsDir | Out-Null
New-Item -ItemType Directory -Force -Path $LogsDir | Out-Null


# ============================================================
# Timestamp
# ============================================================

$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

$SummaryFile = Join-Path `
    $ReportsDir `
    "baseline-summary-$Timestamp.md"


# ============================================================
# Helper: Write Section
# ============================================================

function Write-Section {
    param(
        [string]$Message
    )

    Write-Host ""
    Write-Host "============================================================"
    Write-Host $Message
    Write-Host "============================================================"
}


# ============================================================
# Helper: Check Tool
# ============================================================

function Test-Tool {
    param(
        [string]$Name
    )

    $command = Get-Command $Name -ErrorAction SilentlyContinue

    if ($null -eq $command) {
        Write-Warning "$Name was not found in PATH."
        return $false
    }

    Write-Host "$Name found: $($command.Source)"

    return $true
}


# ============================================================
# Helper: Run Command
# ============================================================

function Run-Command {
    param(
        [string]$Name,
        [string]$FilePath,
        [string[]]$Arguments,
        [string]$OutputFile
    )

    Write-Section $Name

    Write-Host "Command: $FilePath $($Arguments -join ' ')"
    Write-Host "Output:  $OutputFile"

    try {

        & $FilePath @Arguments 2>&1 |
            Tee-Object -FilePath $OutputFile

        $exitCode = $LASTEXITCODE

        Write-Host ""
        Write-Host "$Name exit code: $exitCode"

        return $exitCode
    }
    catch {

        Write-Warning "$Name failed: $($_.Exception.Message)"

        $_ |
            Out-File `
                -FilePath $OutputFile `
                -Append

        return 1
    }
}


# ============================================================
# Environment
# ============================================================

if ([string]::IsNullOrWhiteSpace($SonarHost)) {
    $SonarHost = $env:SONAR_HOST_URL
}

if ([string]::IsNullOrWhiteSpace($SonarHost)) {
    $SonarHost = "http://localhost:9000"
}

$SonarHost = $SonarHost.Trim()

if ($SonarHost -notmatch '^https?://') {
    Write-Warning "SonarQube host URL was malformed: '$SonarHost'. Falling back to http://localhost:9000."
    $SonarHost = "http://localhost:9000"
}

Write-Section "RepairMithra Security Audit"

Push-Location $Root

Write-Host "Repository:      $Root"
Write-Host "Audit directory:  $AuditDir"
Write-Host "Timestamp:        $Timestamp"


# ============================================================
# Git Branch
# ============================================================

$branch = git branch --show-current 2>$null

Write-Host ""
Write-Host "Git branch: $branch"

if ($branch -ne "security-audit") {

    Write-Warning "Current branch is '$branch'."
    Write-Warning "Expected branch: security-audit"
    Write-Warning "Review the branch before continuing."
}


# ============================================================
# Git Status
# ============================================================

Write-Host ""
Write-Host "Git status:"

git status --short


# ============================================================
# Required Tools
# ============================================================

Write-Section "Checking Security Tools"

$Tools = @(
    "git",
    "node",
    "npm",
    "gitleaks",
    "semgrep",
    "trivy",
    "nuclei",
    "docker"
)

$ToolStatus = @{}

foreach ($tool in $Tools) {

    $ToolStatus[$tool] = Test-Tool $tool
}


# ============================================================
# 1. GITLEAKS
# ============================================================

if ($ToolStatus["gitleaks"]) {

    $output = Join-Path `
        $ResultsDir `
        "gitleaks-$Timestamp.json"

    Run-Command `
        -Name "Gitleaks - Repository Secret Scan" `
        -FilePath "gitleaks" `
        -Arguments @(
            "git",
            "--redact",
            "--report-format", "json",
            "--report-path", $output
        ) `
        -OutputFile (
            Join-Path `
                $LogsDir `
                "gitleaks-$Timestamp.log"
        )
}
else {

    Write-Warning "Skipping Gitleaks."
}


# ============================================================
# 2. SEMGREP
# ============================================================

if ($ToolStatus["semgrep"]) {

    $output = Join-Path `
        $ResultsDir `
        "semgrep-$Timestamp.json"

    Run-Command `
        -Name "Semgrep - Security Rules" `
        -FilePath "semgrep" `
        -Arguments @(
            "scan",
            "--config", "auto",
            "--json",
            "--output", $output,
            "--exclude", "node_modules",
            "--exclude", ".git",
            "--exclude", "security-audit"
        ) `
        -OutputFile (
            Join-Path `
                $LogsDir `
                "semgrep-$Timestamp.log"
        )
}
else {

    Write-Warning "Skipping Semgrep."
}


# ============================================================
# 3. TRIVY
# ============================================================

if ($ToolStatus["trivy"]) {

    $output = Join-Path `
        $ResultsDir `
        "trivy-fs-$Timestamp.json"

    Run-Command `
        -Name "Trivy - Filesystem Vulnerability Scan" `
        -FilePath "trivy" `
        -Arguments @(
            "fs",
            "--scanners", "vuln,secret,misconfig",
            "--format", "json",
            "--output", $output,
            "--skip-dirs", "node_modules",
            "--skip-dirs", ".git",
            "--skip-dirs", "security-audit",
            $Root
        ) `
        -OutputFile (
            Join-Path `
                $LogsDir `
                "trivy-$Timestamp.log"
        )
}
else {

    Write-Warning "Skipping Trivy."
}


# ============================================================
# 4. NPM AUDIT
# ============================================================

Write-Section "npm Audit"

$NpmAuditOutput = Join-Path `
    $ResultsDir `
    "npm-audit-$Timestamp.json"

Push-Location $Root

try {

    npm audit --json 2>&1 |
        Tee-Object -FilePath $NpmAuditOutput

    $npmExitCode = $LASTEXITCODE

    Write-Host ""
    Write-Host "npm audit exit code: $npmExitCode"
}
catch {

    Write-Warning "npm audit failed: $($_.Exception.Message)"
}
finally {

    Pop-Location
}


# ============================================================
# 5. SONARQUBE
# ============================================================

Write-Section "SonarQube"

if (-not $env:SONAR_TOKEN) {

    Write-Warning "SONAR_TOKEN is not set."
    Write-Warning "SonarQube scan will be skipped."
    Write-Warning ""
    Write-Warning "Set SONAR_TOKEN in the current PowerShell session."
}
else {

    $scanner = Get-Command `
        sonar-scanner `
        -ErrorAction SilentlyContinue

    if ($null -eq $scanner) {

        Write-Warning "sonar-scanner was not found in PATH."
        Write-Warning "SonarQube server may be running, but scanner CLI is unavailable."
    }
    else {

        $SonarLog = Join-Path `
            $LogsDir `
            "sonarqube-$Timestamp.log"


        # IMPORTANT:
        # Do NOT put SONAR_TOKEN in the arguments.
        # SonarScanner reads SONAR_TOKEN from the environment.
        # This prevents the secret from appearing in command output.

        $sonarArgs = @(
            "-Dsonar.projectKey=$SonarProjectKey",
            "-Dsonar.projectName=RepairMithra",
            "-Dsonar.sources=.",
            "-Dsonar.host.url=$SonarHost",
            "-Dsonar.exclusions=**/node_modules/**,**/.git/**,**/security-audit/**,**/dist/**,**/build/**"
        )


        Run-Command `
            -Name "SonarQube Analysis" `
            -FilePath $scanner.Source `
            -Arguments $sonarArgs `
            -OutputFile $SonarLog
    }
}


# ============================================================
# 6. NUCLEI
# ============================================================

Write-Section "Nuclei"

if ([string]::IsNullOrWhiteSpace($NucleiTarget)) {

    Write-Host "Nuclei target was not supplied."
    Write-Host "Nuclei scan skipped."
    Write-Host ""
    Write-Host "Use -NucleiTarget only with an authorized staging/test URL."
}
elseif (-not $ToolStatus["nuclei"]) {

    Write-Warning "Nuclei is not available."
}
else {

    $safeTarget = $NucleiTarget -replace '[^a-zA-Z0-9.-]', '_'

    $output = Join-Path `
        $ResultsDir `
        "nuclei-$safeTarget-$Timestamp.txt"


    Run-Command `
        -Name "Nuclei - Authorized Target" `
        -FilePath "nuclei" `
        -Arguments @(
            "-u", $NucleiTarget,
            "-severity", "critical,high,medium",
            "-o", $output
        ) `
        -OutputFile (
            Join-Path `
                $LogsDir `
                "nuclei-$Timestamp.log"
        )
}


# ============================================================
# BASELINE SUMMARY
# ============================================================

Write-Section "Creating Baseline Summary"

$gitCommit = git rev-parse HEAD 2>$null


$Summary = @"
# RepairMithra Baseline Security Audit

Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz")

## Repository

- Branch: $branch
- Commit: $gitCommit
- Repository: $Root

## Tools Executed

- Gitleaks
- Semgrep
- Trivy
- npm audit
- SonarQube
- Nuclei

## Nuclei

Target supplied:

$NucleiTarget

Nuclei is only intended for authorized staging/test systems.

## SonarQube

Server:

$SonarHost

Project:

$SonarProjectKey

## Results

Raw scanner results are stored under:

`security-audit/results/`

Scanner logs are stored under:

`security-audit/logs/`

## Important

This document is a scan execution summary.

It is NOT:

- OWASP certification
- A guarantee of complete security
- A penetration-test certification
- A statement that the application is secure

The actual scanner findings must be reviewed individually.

## OWASP Review

After the baseline scans, review the application against:

- A01 Broken Access Control
- A02 Security Misconfiguration
- A03 Software Supply Chain Failures
- A04 Cryptographic Failures
- A05 Injection
- A06 Insecure Design
- A07 Authentication Failures
- A08 Software or Data Integrity Failures
- A09 Security Logging & Alerting Failures
- A10 Mishandling of Exceptional Conditions

## Next Steps

1. Review Gitleaks results.
2. Review Semgrep results.
3. Review Trivy results.
4. Review npm audit results.
5. Review SonarQube findings.
6. Review Nuclei findings.
7. Map confirmed findings to OWASP Top 10:2025 A01-A10.
8. Identify Critical and High severity issues.
9. Review possible false positives.
10. Create the initial SECURITY-REPORT.md.
11. Remediate confirmed security issues.
12. Run application tests.
13. Run the complete security scan again.
14. Compare baseline and final findings.
15. Create FINAL-SECURITY-REPORT.md.
16. Review everything before merging into develop.

"@


# ============================================================
# Save Summary
# ============================================================

$Summary |
    Out-File `
        -FilePath $SummaryFile `
        -Encoding utf8


# ============================================================
# Final Output
# ============================================================

Write-Host ""

Write-Host "Baseline summary created:"
Write-Host $SummaryFile

Write-Section "Audit Complete"

Write-Host "Raw results: $ResultsDir"
Write-Host "Logs:        $LogsDir"
Write-Host "Summary:     $SummaryFile"


# ============================================================
# Restore Location
# ============================================================

Pop-Location