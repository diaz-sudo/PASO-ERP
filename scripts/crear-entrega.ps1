param([string]$Nombre = 'PASO-ERP-1.2.0-fuente.zip')
$ErrorActionPreference = 'Stop'
$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$outputRoot = Join-Path $projectRoot 'entrega'
if ([System.IO.Path]::GetFileName($Nombre) -ne $Nombre -or $Nombre -notmatch '\.zip$') {
    throw 'Nombre debe ser un nombre de archivo ZIP, sin rutas.'
}
[System.IO.Directory]::CreateDirectory($outputRoot) | Out-Null
$zipPath = Join-Path $outputRoot $Nombre
if (Test-Path -LiteralPath $zipPath) { throw "Ya existe $zipPath. Usa otro -Nombre para conservar las entregas anteriores." }

# Lista permitida: no se recorre el proyecto completo ni se incluyen bases de otra PC.
$rootFiles = @('package.json','.editorconfig','.gitignore','.env.example','AGENTS.md','README.md','LEEME_PRIMERO.md','GUIA_RAPIDA.html','TareaSemana4.docx','data/README.md')
$sourceFiles = @()
foreach ($relativePath in $rootFiles) {
    $absolutePath = Join-Path $projectRoot $relativePath
    if (-not (Test-Path -LiteralPath $absolutePath -PathType Leaf)) { throw "Falta archivo requerido: $relativePath" }
    $sourceFiles += Get-Item -LiteralPath $absolutePath
}
$extensions = @('.mjs','.js','.html','.css','.svg','.sql','.md','.ps1')
foreach ($folderName in @('server','public','scripts','tests','docs')) {
    $folderPath = Join-Path $projectRoot $folderName
    $sourceFiles += Get-ChildItem -LiteralPath $folderPath -File -Recurse | Where-Object {
        $extensions -contains $_.Extension.ToLowerInvariant() -and
        -not ($_.Attributes -band [System.IO.FileAttributes]::ReparsePoint)
    }
}
$sourceFiles = @($sourceFiles | Sort-Object FullName -Unique)
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$stream = [System.IO.File]::Open($zipPath,[System.IO.FileMode]::CreateNew)
$archive = [System.IO.Compression.ZipArchive]::new($stream,[System.IO.Compression.ZipArchiveMode]::Create,$false)
$manifest = [System.Collections.Generic.List[string]]::new()
try {
    foreach ($file in $sourceFiles) {
        $resolvedFile = [System.IO.Path]::GetFullPath($file.FullName)
        if (-not $resolvedFile.StartsWith($projectRoot + [System.IO.Path]::DirectorySeparatorChar,[System.StringComparison]::OrdinalIgnoreCase)) {
            throw 'Archivo fuera de la carpeta del proyecto.'
        }
        $relative = $resolvedFile.Substring($projectRoot.Length + 1).Replace('\','/')
        if ($relative -match '(^|/)(node_modules|\.git|entrega|\.artifacts)(/|$)|\.sqlite($|-)|(^|/)\.env$') {
            throw "Archivo no permitido: $relative"
        }
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive,$resolvedFile,"PASO-ERP/$relative",[System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
        $hash = (Get-FileHash -LiteralPath $resolvedFile -Algorithm SHA256).Hash.ToLowerInvariant()
        $manifest.Add("$hash  $relative")
    }
    $entry = $archive.CreateEntry('PASO-ERP/CONTENIDO-SHA256.txt')
    $writer = [System.IO.StreamWriter]::new($entry.Open(),[System.Text.UTF8Encoding]::new($false))
    try { $writer.WriteLine(($manifest -join "`n")) } finally { $writer.Dispose() }
} finally { $archive.Dispose(); $stream.Dispose() }

$zipHash = (Get-FileHash -LiteralPath $zipPath -Algorithm SHA256).Hash.ToLowerInvariant()
[System.IO.File]::WriteAllText("$zipPath.sha256","$zipHash  $Nombre`n",[System.Text.UTF8Encoding]::new($false))
[pscustomobject]@{ Zip=$zipPath; Archivos=$sourceFiles.Count + 1; Bytes=(Get-Item -LiteralPath $zipPath).Length; SHA256=$zipHash } | Format-List
