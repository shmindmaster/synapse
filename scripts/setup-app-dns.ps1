# setup-app-dns.ps1
# Automate DNS record creation in DigitalOcean for new applications
# Prerequisites:
#   - doctl CLI installed and authenticated
#   - OR DigitalOcean API token set in DIGITALOCEAN_TOKEN env var
#   - Domain (shtrial.com) added to DigitalOcean DNS

param(
    [Parameter(Mandatory = $true)]
    [string]$AppSlug,

    [Parameter(Mandatory = $false)]
    [string]$AppDomainBase = "shtrial.com",

    [Parameter(Mandatory = $false)]
    [string]$DoToken = $env:DIGITALOCEAN_TOKEN,

    [Parameter(Mandatory = $false)]
    [string]$TargetCname = "origin-apps.ondigitalocean.com.",

    [Parameter(Mandatory = $false)]
    [int]$Ttl = 1800
)

Write-Host "=== DigitalOcean DNS Automation ===" -ForegroundColor Cyan
Write-Host ""

# Validate inputs
if (!$DoToken) {
    Write-Host "No DIGITALOCEAN_TOKEN found, attempting to use doctl authentication..." -ForegroundColor Yellow
}

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  App Slug:          $AppSlug"
Write-Host "  Domain Base:       $AppDomainBase"
Write-Host "  Target CNAME:      $TargetCname"
Write-Host "  TTL:               $Ttl seconds"
Write-Host ""

# Function to check if record exists
function Test-DnsRecordExists {
    param(
        [string]$Domain,
        [string]$RecordName,
        [string]$Token
    )

    try {
        if ($Token) {
            $headers = @{ "Authorization" = "Bearer $Token" }
            $response = Invoke-RestMethod -Uri "https://api.digitalocean.com/v2/domains/$Domain/records" -Headers $headers -Method Get
            $existing = $response.domain_records | Where-Object { $_.name -eq $RecordName }
            return $existing
        }
        else {
            # Use doctl
            $result = & doctl compute domain records list $Domain --format ID,Name,Type,Data --no-header 2>$null
            if ($LASTEXITCODE -eq 0) {
                $lines = $result -split "`n"
                foreach ($line in $lines) {
                    if ($line -match "^\s*(\d+)\s+$RecordName\s+") {
                        return $true
                    }
                }
            }
            return $false
        }
    }
    catch {
        return $false
    }
}

# Function to create DNS record via API
function New-DnsRecord {
    param(
        [string]$Domain,
        [string]$RecordName,
        [string]$RecordType,
        [string]$RecordData,
        [int]$Ttl,
        [string]$Token
    )

    try {
        if ($Token) {
            $headers = @{
                "Authorization" = "Bearer $Token"
                "Content-Type"  = "application/json"
            }
            $body = @{
                type = $RecordType
                name = $RecordName
                data = $RecordData
                ttl  = $Ttl
            } | ConvertTo-Json

            $response = Invoke-RestMethod -Uri "https://api.digitalocean.com/v2/domains/$Domain/records" -Headers $headers -Method Post -Body $body
            return $response.domain_record
        }
        else {
            # Use doctl
            $result = & doctl compute domain records create $Domain `
                --record-name $RecordName `
                --record-type $RecordType `
                --record-data $RecordData `
                --record-ttl $Ttl `
                --format ID,Name,Type,Data 2>&1

            if ($LASTEXITCODE -eq 0) {
                return $result
            }
            else {
                throw "doctl command failed: $result"
            }
        }
    }
    catch {
        Write-Error "Failed to create DNS record: $_"
        return $null
    }
}

# Main execution
try {
    Write-Host "Checking existing DNS records for $AppDomainBase..." -ForegroundColor Yellow
    Write-Host ""

    # List current records
    Write-Host "Current DNS Records:" -ForegroundColor Yellow
    if ($DoToken) {
        $headers = @{ "Authorization" = "Bearer $DoToken" }
        $response = Invoke-RestMethod -Uri "https://api.digitalocean.com/v2/domains/$AppDomainBase/records" -Headers $headers -Method Get
        foreach ($record in $response.domain_records | Select-Object -First 10) {
            Write-Host "  $($record.name) ($($record.type)) -> $($record.data)" -ForegroundColor Gray
        }
        if ($response.domain_records.Count -gt 10) {
            Write-Host "  ... and $($response.domain_records.Count - 10) more records" -ForegroundColor Gray
        }
    }
    else {
        $records = & doctl compute domain records list $AppDomainBase --format Name,Type,Data --no-header 2>$null
        if ($records) {
            $records | Select-Object -First 10 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
        }
    }
    Write-Host ""

    # Check and create frontend record
    $frontendRecordName = $AppSlug
    $frontendExists = Test-DnsRecordExists -Domain $AppDomainBase -RecordName $frontendRecordName -Token $DoToken

    if ($frontendExists) {
        Write-Host "✓ Frontend record already exists: $frontendRecordName.$AppDomainBase" -ForegroundColor Yellow
    }
    else {
        Write-Host "Creating frontend record: $frontendRecordName.$AppDomainBase" -ForegroundColor Green
        $result = New-DnsRecord -Domain $AppDomainBase -RecordName $frontendRecordName -RecordType "CNAME" -RecordData $TargetCname -Ttl $Ttl -Token $DoToken
        if ($result) {
            Write-Host "✓ Frontend record created successfully" -ForegroundColor Green
        }
    }

    # Check and create backend record
    $backendRecordName = "api.$AppSlug"
    $backendExists = Test-DnsRecordExists -Domain $AppDomainBase -RecordName $backendRecordName -Token $DoToken

    if ($backendExists) {
        Write-Host "✓ Backend record already exists: $backendRecordName.$AppDomainBase" -ForegroundColor Yellow
    }
    else {
        Write-Host "Creating backend record: $backendRecordName.$AppDomainBase" -ForegroundColor Green
        $result = New-DnsRecord -Domain $AppDomainBase -RecordName $backendRecordName -RecordType "CNAME" -RecordData $TargetCname -Ttl $Ttl -Token $DoToken
        if ($result) {
            Write-Host "✓ Backend record created successfully" -ForegroundColor Green
        }
    }

    Write-Host ""
    Write-Host "=== DNS Setup Complete ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "DNS Records configured:" -ForegroundColor Yellow
    Write-Host "  Frontend: $frontendRecordName.$AppDomainBase -> $TargetCname"
    Write-Host "  Backend:  $backendRecordName.$AppDomainBase -> $TargetCname"
    Write-Host ""
    Write-Host "Propagation time: 2-5 minutes (DigitalOcean DNS is fast)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Verify with:" -ForegroundColor Cyan
    Write-Host "  nslookup $frontendRecordName.$AppDomainBase"
    Write-Host "  nslookup $backendRecordName.$AppDomainBase"
    Write-Host ""
    Write-Host "Or check in DigitalOcean dashboard:" -ForegroundColor Cyan
    Write-Host "  https://cloud.digitalocean.com/networking/domains/$AppDomainBase"
    Write-Host ""
}
catch {
    Write-Error "Setup failed: $_"
    exit 1
}
