$path = "c:\Users\User\bsw\app\actions\truth.ts"
$content = [System.IO.File]::ReadAllBytes($path)
$text = [System.Text.Encoding]::UTF8.GetString($content)
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($path, $text, $utf8NoBom)
Write-Host "Done - file re-saved as UTF-8 without BOM"
