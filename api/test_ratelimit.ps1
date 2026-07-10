$ErrorActionPreference = "Continue"
$resultPath = "$PSScriptRoot\test_result.txt"
$outPath = "$PSScriptRoot\server_stdout.txt"

function Log {
    param([string]$msg)
    $ts = Get-Date -Format "HH:mm:ss"
    "$ts $msg" | Out-File -FilePath $resultPath -Append -Encoding UTF8
    Write-Output $msg
}

Log "=== Task 8b - Rate Limit IP Detection Fix ==="
Log "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Log ""

# 1. Start server
Log "Starting server..."
$proc = Start-Process -WindowStyle Hidden -FilePath "npx" -ArgumentList "tsx", "src/index.ts" -WorkingDirectory $PSScriptRoot -RedirectStandardOutput $outPath -RedirectStandardError "$PSScriptRoot\server_stderr.txt" -PassThru
$serverPid = $proc.Id
Log "Server PID: $serverPid"

# 2. Wait for server
$ready = $false
for ($i = 0; $i -lt 40; $i++) {
    Start-Sleep -Seconds 1
    $alive = Get-Process -Id $serverPid -ErrorAction SilentlyContinue
    if (-not $alive) {
        Log "Server process died! Exit code: $($proc.ExitCode)"
        Log "STDOUT: $(Get-Content $outPath -Raw -ErrorAction SilentlyContinue)"
        break
    }
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:8001/api/health" -UseBasicParsing -ErrorAction Stop
        Log "Health check after ${i}s: HTTP $($r.StatusCode)"
        $ready = $true
        break
    } catch {}
}

if (-not $ready) {
    Log "ERROR: Server not ready after 40s"
    if ($alive) { $proc.Kill() }
    Log "DONE"
    exit 1
}

# 3. Rate limit test
for ($j = 1; $j -le 4; $j++) {
    try {
        $resp = Invoke-WebRequest -Method Post -Uri "http://localhost:8001/api/auth/request-password-reset" -ContentType "application/json" -Body '{"email":"ratelimit-fix-test@fpt.edu.vn","redirectTo":"http://localhost:3000/reset-password"}' -UseBasicParsing -ErrorAction Stop
        $code = $resp.StatusCode
    } catch {
        $code = -1
        if ($_.Exception.Response) {
            try { $code = [int]$_.Exception.Response.StatusCode } catch {}
        }
    }
    Log "Request ${j}: HTTP ${code}"
}

# 4. Verify
Log ""
$resultLines = Get-Content $resultPath -Encoding UTF8
$lastResult = ($resultLines | Select-String "Request 4:").ToString()
if ($lastResult -match "429") {
    Log "PASS: 4th request returned 429 - rate limiting works"
} else {
    Log "FAIL: 4th request did NOT return 429"
}

# 5. Cleanup
if ($alive) { $proc.Kill() }
Log "Server stopped."
