# PostToolUse: aplica governança a HTMLs públicos novos e reporta pendências do acervo.
$ErrorActionPreference = 'SilentlyContinue'

$inputJson = [Console]::In.ReadToEnd()
if ([string]::IsNullOrWhiteSpace($inputJson)) { exit 0 }
try { $data = $inputJson | ConvertFrom-Json } catch { exit 0 }

$editTools = @('apply_patch', 'create_file', 'replace_string_in_file', 'multi_replace_string_in_file', 'edit_notebook_file')
if ($editTools -notcontains $data.tool_name) { exit 0 }

$filePaths = @()
if ($data.tool_input.filePath) { $filePaths += [string]$data.tool_input.filePath }
if ($data.tool_input.replacements) {
    foreach ($replacement in $data.tool_input.replacements) {
        if ($replacement.filePath) { $filePaths += [string]$replacement.filePath }
    }
}
if ($data.tool_input.input) {
    $patchPaths = [regex]::Matches([string]$data.tool_input.input, '(?m)^\*\*\*\s+(?:Add|Update)\s+File:\s+(.+?)\s*$')
    foreach ($match in $patchPaths) {
        $filePaths += $match.Groups[1].Value.Trim()
    }
}
if ($filePaths.Count -eq 0) { exit 0 }

$hasEditorialFile = $false
foreach ($filePath in $filePaths) {
    if ([System.IO.Path]::GetExtension($filePath).ToLowerInvariant() -in @('.html', '.md')) {
        $hasEditorialFile = $true
        break
    }
}
if (-not $hasEditorialFile) { exit 0 }

$validator = Join-Path (Get-Location).Path 'scripts\validate-content-governance.js'
if (-not (Test-Path $validator)) { exit 0 }

& node $validator
exit $LASTEXITCODE
