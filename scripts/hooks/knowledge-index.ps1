# PostToolUse: reindexa incrementalmente a base de conhecimento quando um HTML da raiz é editado.
$ErrorActionPreference = 'SilentlyContinue'

$inputJson = [Console]::In.ReadToEnd()
if ([string]::IsNullOrWhiteSpace($inputJson)) { exit 0 }
try { $data = $inputJson | ConvertFrom-Json } catch { exit 0 }

# Apenas edições em arquivos
$editTools = @('create_file', 'replace_string_in_file', 'multi_replace_string_in_file', 'edit_notebook_file')
if ($editTools -notcontains $data.tool_name) { exit 0 }

# Reúne os caminhos dos arquivos tocados
$filePaths = @()
if ($data.tool_input.filePath) { $filePaths += [string]$data.tool_input.filePath }
if ($data.tool_input.replacements) {
    foreach ($replacement in $data.tool_input.replacements) {
        if ($replacement.filePath) { $filePaths += [string]$replacement.filePath }
    }
}
if ($filePaths.Count -eq 0) { exit 0 }

$root = (Get-Location).Path
$idiomas = @('en','es','de','it','fr','hi','zh','ar','ja','ru','ko','tr','nl','pl','sv','id','vi','uk')
$proibidos = @('footer.html','menu-global.html','global-body-elements.html','downloads.html','menu-lateral.html','_language_selector.html','googlefc0a17cdd552164b.html')

foreach ($filePath in $filePaths) {
    $full = [System.IO.Path]::GetFullPath($filePath)
    if (-not $full.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) { continue }

    $rel = $full.Substring($root.Length).TrimStart('\','/')
    $parts = $rel.Split('\','/')
    if ($parts.Count -ne 1) { continue }                 # só arquivos direto na raiz (não em subpastas/idiomas)
    if ([System.IO.Path]::GetExtension($rel).ToLowerInvariant() -ne '.html') { continue }
    if ($proibidos -contains $parts[0]) { continue }

    node scripts/build-knowledge-index.js --file $parts[0] | Out-Null
}
exit 0
