# Fix cam.html UI strings in all languages
function Fix-CamStrings {
  param($lang, $path, $map)
  $c = [IO.File]::ReadAllText($path, [Text.UTF8Encoding]::new($false))
  $orig = $c
  $p = $map -split '\|'
  # 0=POS 1=NEG 2=PRES 3=AUS 4=sim 5=nao 6=SIM 7=NAO
  $c = $c -replace 'hasDelirium \? "[^"]*" : "[^"]*"', ('hasDelirium ? "' + $p[0] + '" : "' + $p[1] + '"')
  $c = $c -replace '"Presente" : "Ausente"', ('"' + $p[2] + '" : "' + $p[3] + '"')
  $c = $c -replace 'd\.status === "[^"]*"', ('d.status === "' + $p[0] + '"')
  $c = $c -replace '"Sim" : "N[ãa]o"', ('"' + $p[4] + '" : "' + $p[5] + '"')
  $c = $c -replace '"SIM" : "N[ÃA][ÃA]O"', ('"' + $p[6] + '" : "' + $p[7] + '"')
  if ($c -ne $orig) {
    [IO.File]::WriteAllText($path, $c, [Text.UTF8Encoding]::new($false))
    return $true
  }
  return $false
}

$total = 0
# PT
if (Fix-CamStrings "pt" "cam.html" "POSITIVO|NEGATIVO|Presente|Ausente|Sim|Nao|SIM|NAO") { $total++ }
# EN  
if (Fix-CamStrings "en" "en/cam.html" "POSITIVE|NEGATIVE|Present|Absent|Yes|No|YES|NO") { $total++ }
# ES
if (Fix-CamStrings "es" "es/cam.html" "POSITIVO|NEGATIVO|Presente|Ausente|Si|No|SI|NO") { $total++ }
# FR
if (Fix-CamStrings "fr" "fr/cam.html" "POSITIF|NEGATIF|Present|Absent|Oui|Non|OUI|NON") { $total++ }
# DE
if (Fix-CamStrings "de" "de/cam.html" "POSITIV|NEGATIV|Vorhanden|Abwesend|Ja|Nein|JA|NEIN") { $total++ }
# IT
if (Fix-CamStrings "it" "it/cam.html" "POSITIVO|NEGATIVO|Presente|Assente|Si|No|SI|NO") { $total++ }
# NL
if (Fix-CamStrings "nl" "nl/cam.html" "POSITIEF|NEGATIEF|Aanwezig|Afwezig|Ja|Nee|JA|NEE") { $total++ }
# PL
if (Fix-CamStrings "pl" "pl/cam.html" "POZYTYWNY|NEGATYWNY|Obecny|Nieobecny|Tak|Nie|TAK|NIE") { $total++ }
# SV
if (Fix-CamStrings "sv" "sv/cam.html" "POSITIV|NEGATIV|Narvarande|Franvarande|Ja|Nej|JA|NEJ") { $total++ }
# TR
if (Fix-CamStrings "tr" "tr/cam.html" "POZITIF|NEGATIF|Mevcut|Yok|Evet|Hayir|EVET|HAYIR") { $total++ }
# ID
if (Fix-CamStrings "id" "id/cam.html" "POSITIF|NEGATIF|Ada|Tidak Ada|Ya|Tidak|YA|TIDAK") { $total++ }
# VI
if (Fix-CamStrings "vi" "vi/cam.html" "DUONG TINH|AM TINH|Co mat|Vang mat|Co|Khong|CO|KHONG") { $total++ }
Write-Host "Latin done: $total files"