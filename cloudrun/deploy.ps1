param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectId,

  [string]$Region = "us-central1",
  [string]$AppService = "clario-app",
  [string]$SocketService = "clario-socket",
  [string]$AppImage = "",
  [string]$SocketImage = ""
)

$ErrorActionPreference = "Stop"

if (-not $AppImage) {
  $AppImage = "gcr.io/$ProjectId/$AppService"
}

if (-not $SocketImage) {
  $SocketImage = "gcr.io/$ProjectId/$SocketService"
}

$env:CLOUDSDK_CORE_PROJECT = $ProjectId

Write-Host "Building app image..."
cmd /c "gcloud builds submit --project $ProjectId --tag $AppImage -f cloudrun/app.Dockerfile ."

Write-Host "Building socket image..."
cmd /c "gcloud builds submit --project $ProjectId --tag $SocketImage -f cloudrun/socket.Dockerfile ."

Write-Host "Deploying socket service..."
cmd /c "gcloud run deploy $SocketService --project $ProjectId --region $Region --image $SocketImage --allow-unauthenticated --port 8080"

$socketUrl = (cmd /c "gcloud run services describe $SocketService --project $ProjectId --region $Region --format=""value(status.url)""" | Out-String).Trim()

if (-not $socketUrl) {
  throw "Could not resolve deployed socket service URL."
}

Write-Host "Socket URL: $socketUrl"
Write-Host "Deploying app service..."
Write-Host "Set env vars/secrets in Cloud Run for Clerk, Prisma, Stripe, Anthropic, etc. before first production use."

cmd /c "gcloud run deploy $AppService --project $ProjectId --region $Region --image $AppImage --allow-unauthenticated --port 8080 --set-env-vars NEXT_PUBLIC_SOCKET_URL=$socketUrl,SOCKET_SERVER_INTERNAL_URL=$socketUrl"

$appUrl = (cmd /c "gcloud run services describe $AppService --project $ProjectId --region $Region --format=""value(status.url)""" | Out-String).Trim()

if ($appUrl) {
  Write-Host "App URL: $appUrl"
  cmd /c "gcloud run services update $AppService --project $ProjectId --region $Region --update-env-vars NEXT_PUBLIC_APP_URL=$appUrl"
  cmd /c "gcloud run services update $SocketService --project $ProjectId --region $Region --update-env-vars CLIENT_URL=$appUrl,NEXT_PUBLIC_APP_URL=$appUrl"
  Write-Host ""
  Write-Host "Important:"
  Write-Host "1. Add all required runtime secrets with 'gcloud run services update --set-secrets' or in the Console."
  Write-Host "2. Configure Clerk allowed origins/redirect URLs for $appUrl."
  Write-Host "3. Keep TURN credentials configured for production-grade video connectivity."
}
