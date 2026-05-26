# Import Pagos Trabajo Historicos (desde Excel a pago-trabajo + categoria-pago)
# Uso: .\scripts\import-pagos-trabajo.ps1 -ApiUrl "https://tu-backend.railway.app" -Token "TOKEN"
# Dry-run: .\scripts\import-pagos-trabajo.ps1 -DryRun

param(
    [string]$ApiUrl = "http://localhost:1337",
    [string]$Token  = "",
    [switch]$DryRun
)

$ExcelPath = (Get-ChildItem "$env:USERPROFILE\Downloads" -Filter "Comprobaci*Gastos*.xlsx" | Select-Object -First 1).FullName
if (-not $ExcelPath) {
    Write-Host "No se encontro el archivo Excel en Downloads." -ForegroundColor Red
    exit 1
}

# ─── Mapeo de categorias ──────────────────────────────────────────────────────
function Get-Categoria($catRaw, $provRaw, $descRaw) {
    $cat  = if ($catRaw)  { $catRaw.Trim().ToLower()  } else { "" }
    $prov = if ($provRaw) { $provRaw.Trim().ToLower() } else { "" }
    $desc = if ($descRaw) { $descRaw.Trim().ToLower() } else { "" }

    if ($prov -match "google operaciones|google ops" -or $desc -match "^ads |ads control|ads icd|ads computo|ads mhs") {
        return "MKT - ADQUISICION"
    }
    if ($prov -match "meta platforms|facebook") {
        return "MKT - ADQUISICION"
    }
    if ($prov -match "bprm|branpetram" -or $desc -match "bprm|branpetram") {
        return "MKT - OPERACION"
    }
    switch -Wildcard ($cat) {
        "mkt - adquisicion"        { return "MKT - ADQUISICION" }
        "mkt - operacion*"         { return "MKT - OPERACION" }
        "mkt - digital"            { return "MKT - OPERACION" }
        "mkt - imprenta"           { return "MKT - IMPRENTA" }
        "mkt - promocionales"      { return "MKT - PROMOCIONALES" }
        "mkt - publicidad"         { return "MKT - PUBLICIDAD" }
        "mkt - nutrimiento*"       { return "MKT - NUTRIMIENTO" }
        "it - soporte hardware"    { return "IT - SOPORTE HARDWARE" }
        "it - sporte hardware"     { return "IT - SOPORTE HARDWARE" }
        "it - licencias*"          { return "IT - LICENCIAS" }
        "it - licenciasprg"        { return "IT - LICENCIAS" }
        "it - dominios"            { return "IT - LICENCIAS" }
        "it - desarrollo web"      { return "IT - DESARROLLO" }
        "it - desarrollo"          { return "IT - DESARROLLO" }
        default                    { return $null }
    }
}

function Parse-Fecha($raw) {
    if (-not $raw) { return $null }
    $raw2 = $raw.Trim()
    if ($raw2 -match '^(\d{1,2})/(\d{1,2})/(\d{4})$') {
        return "$($Matches[3])-$($Matches[2].PadLeft(2,'0'))-$($Matches[1].PadLeft(2,'0'))"
    }
    return $null
}

# ─── Leer Excel ───────────────────────────────────────────────────────────────
Write-Host "`nAbriendo: $ExcelPath" -ForegroundColor Cyan
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$wb = $excel.Workbooks.Open($ExcelPath)

$registros = [System.Collections.Generic.List[hashtable]]::new()

Write-Host "Leyendo hoja '2024 y 2025'..." -ForegroundColor Yellow
$ws = $wb.Sheets["2024 y 2025"]
$lastRow = $ws.UsedRange.Rows.Count
for ($r = 2; $r -le $lastRow; $r++) {
    $fechaTxt = $ws.Cells($r, 2).Text
    $provTxt  = $ws.Cells($r, 4).Text
    $montoVal = $ws.Cells($r, 5).Value2
    $factura  = $ws.Cells($r, 7).Text
    $catRaw   = $ws.Cells($r, 10).Text

    $fechaISO = Parse-Fecha $fechaTxt
    if (-not $fechaISO) { continue }

    $monto = $null
    if ($montoVal -ne $null -and $montoVal -ne "") { try { $monto = [double]$montoVal } catch {} }
    if (-not $monto -or $monto -le 0) { continue }

    $prov      = if ($provTxt -and $provTxt.Trim()) { $provTxt.Trim() } else { $null }
    $concepto  = if ($prov) { $prov } else { $catRaw.Trim() }
    $categoria = Get-Categoria $catRaw $prov $concepto
    $desc      = if ($factura -and $factura.Trim()) { $factura.Trim() } else { $null }

    $registros.Add(@{ concepto=$concepto; monto=[Math]::Round($monto,2); fecha=$fechaISO; categoria=$categoria; proveedor=$prov; descripcion=$desc })
}
Write-Host "  -> $($registros.Count) de 2024-2025" -ForegroundColor DarkGray

Write-Host "Leyendo hoja '2026'..." -ForegroundColor Yellow
$ws2   = $wb.Sheets["2026"]
$last2 = $ws2.UsedRange.Rows.Count
$antes = $registros.Count
for ($r = 6; $r -le $last2; $r++) {
    $fechaTxt = $ws2.Cells($r, 5).Text
    $catRaw   = $ws2.Cells($r, 6).Text
    $descTxt  = $ws2.Cells($r, 7).Text
    $provTxt  = $ws2.Cells($r, 9).Text
    $factura  = $ws2.Cells($r, 10).Text
    $montoVal = $ws2.Cells($r, 11).Value2

    $fechaISO = Parse-Fecha $fechaTxt
    if (-not $fechaISO) { continue }

    $monto = $null
    if ($montoVal -ne $null -and $montoVal -ne "") { try { $monto = [double]$montoVal } catch {} }
    if (-not $monto -or $monto -le 0) { continue }

    $prov      = if ($provTxt -and $provTxt.Trim()) { $provTxt.Trim() } else { $null }
    $concepto  = if ($descTxt -and $descTxt.Trim()) { $descTxt.Trim() } else { $catRaw.Trim() }
    $categoria = Get-Categoria $catRaw $prov $descTxt
    $desc      = if ($factura -and $factura.Trim()) { $factura.Trim() } else { $null }

    $registros.Add(@{ concepto=$concepto; monto=[Math]::Round($monto,2); fecha=$fechaISO; categoria=$categoria; proveedor=$prov; descripcion=$desc })
}
Write-Host "  -> $($registros.Count - $antes) de 2026" -ForegroundColor DarkGray

$wb.Close($false); $excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null

Write-Host "`nTotal: $($registros.Count) registros" -ForegroundColor Green

$sinCat = $registros | Where-Object { -not $_.categoria }
if ($sinCat.Count -gt 0) {
    Write-Host "Sin categoria ($($sinCat.Count)): " -ForegroundColor DarkYellow
    $sinCat | ForEach-Object { Write-Host "   $($_.fecha)  $($_.concepto)" }
}

if ($DryRun) {
    Write-Host "`nDRY RUN - primeros 10:" -ForegroundColor Cyan
    $registros | Select-Object -First 10 | ForEach-Object {
        $cat = if ($_.categoria) { $_.categoria } else { "(sin cat)" }
        Write-Host "  $($_.fecha)  $cat  $($_.concepto)  $($_.monto)"
    }
    exit 0
}

if (-not $Token) { Write-Host "Falta -Token." -ForegroundColor Red; exit 1 }

$headers = @{ "Content-Type"="application/json"; "Authorization"="Bearer $Token" }

# ─── Crear / cargar categorias ────────────────────────────────────────────────
Write-Host "`nCargando categorias existentes..." -ForegroundColor Cyan
$res  = Invoke-RestMethod -Uri "$ApiUrl/api/categoria-pagos?pagination[pageSize]=100" -Headers @{ "Authorization"="Bearer $Token" }
$catMap = @{}
$res.data | ForEach-Object { $catMap[$_.nombre] = $_.id }

$catNames = $registros | Where-Object { $_.categoria } | ForEach-Object { $_.categoria } | Sort-Object -Unique
foreach ($nombre in $catNames) {
    if (-not $catMap.ContainsKey($nombre)) {
        Write-Host "  Creando categoria: $nombre" -ForegroundColor DarkCyan
        $body = @{ data = @{ nombre = $nombre } } | ConvertTo-Json
        $r = Invoke-RestMethod -Uri "$ApiUrl/api/categoria-pagos" -Method POST -Headers $headers -Body $body
        $catMap[$nombre] = $r.data.id
    }
}
Write-Host "Categorias listas: $($catMap.Count)" -ForegroundColor Green

# ─── Subir registros ─────────────────────────────────────────────────────────
Write-Host "Subiendo $($registros.Count) pagos..." -ForegroundColor Cyan
$ok = 0; $fail = 0; $i = 0
foreach ($reg in $registros) {
    $i++
    $data = @{
        concepto    = $reg.concepto
        monto       = $reg.monto
        fecha       = $reg.fecha
        estado      = "pagado"
        proveedor   = $reg.proveedor
        descripcion = $reg.descripcion
    }
    if ($reg.categoria -and $catMap.ContainsKey($reg.categoria)) {
        $data.categoriaPago = @{ connect = @(@{ id = $catMap[$reg.categoria] }) }
    }
    $body = @{ data = $data } | ConvertTo-Json -Depth 5
    try {
        Invoke-RestMethod -Uri "$ApiUrl/api/pago-trabajos" -Method POST -Headers $headers -Body $body | Out-Null
        $ok++
        if ($i % 25 -eq 0) { Write-Host "  $i/$($registros.Count)..." -ForegroundColor DarkGray }
    } catch {
        $fail++
        Write-Host "  Error fila $i`: $($_.Exception.Message)" -ForegroundColor DarkRed
    }
}
Write-Host "`nImportacion completa: $ok OK  $fail errores" -ForegroundColor Green
