try {
    # Start server
    $serverProcess = Start-Process -NoNewWindow -FilePath "npx" -ArgumentList "tsx", "src/index.ts" -WorkingDirectory "$PSScriptRoot" -PassThru
    Write-Output "Server PID: $($serverProcess.Id)"
    
    # Wait for server
    $ready = $false
    for ($i = 0; $i -lt 30; $i++) {
        Start-Sleep -Seconds 1
        try {
            $r = Invoke-WebRequest -Uri "http://localhost:8001/api/health" -UseBasicParsing -ErrorAction Stop
            if ($r.StatusCode -eq 200 -or $r.StatusCode -eq 503) {
                $ready = $true
                Write-Output "Server ready after ${i}s (health: $($r.StatusCode))"
                break
            }
        } catch {
            # Server not ready yet
        }
    }
    
    if (-not $ready) {
        Write-Output "ERROR: Server did not start within 30s"
        $serverProcess.Kill()
        exit 1
    }
    
    # Run rate limit test
    $results = @()
    for ($i = 1; $i -le 4; $i++) {
        try {
            $r = Invoke-WebRequest -Method Post -Uri "http://localhost:8001/api/auth/request-password-reset" -ContentType "application/json" -Body '{"email":"ratelimit-fix-test@fpt.edu.vn","redirectTo":"http://localhost:3000/reset-password"}' -UseBasicParsing -ErrorAction Stop
            $code = $r.StatusCode
        } catch {
            if ($_.Exception.Response) {
                $code = [int]$_.Exception.Response.StatusCode
            } else {
                $code = "NO_RESPONSE"
            }
        }
        Write-Output "Request ${i}: HTTP ${code}"
        $results += $code
    }
    
    # Verify
    if ($results[3] -eq 429) {
        Write-Output "PASS: 4th=429 - rate limiting works"
    } else {
        Write-Output "FAIL: 4th=$($results[3]), expected 429"
    }
    
    # Cleanup
    $serverProcess.Kill()
} catch {
    Write-Output "Script error: $_"
}
