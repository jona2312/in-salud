# Push del fix TS2769 a GitHub
Set-Location "C:\Dev\in-salud-app"

if (Test-Path ".git\index.lock") {
    Remove-Item ".git\index.lock" -Force
    Write-Host "Lock file eliminado." -ForegroundColor Yellow
}

git config user.email "jonabrewing@gmail.com"
git config user.name "Jonatan"

git push origin master

Write-Host ""
Write-Host "LISTO! Push completado." -ForegroundColor Green
Write-Host "EAS Build se dispara automaticamente desde GitHub." -ForegroundColor Cyan
Read-Host "Presiona Enter para cerrar"
