# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

# Testing

Always run the app externally via Expo Go on a real device (LAN mode), never via web.

Start the dev server in the background and connect Expo Go to the LAN URL:

```powershell
Set-Location 'D:\project\BeanOS-clone'
Start-Process -FilePath 'node' -ArgumentList 'node_modules\expo\bin\cli','start','--port','8081' `
  -WorkingDirectory 'D:\project\BeanOS-clone' `
  -RedirectStandardOutput 'expo-run.out.log' -RedirectStandardError 'expo-run.err.log' `
  -WindowStyle Hidden -PassThru
```

Then open `exp://<LAN-IP>:8081` in Expo Go (same Wi-Fi as this PC). Find the IP with:

```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.*' } | Select-Object IPAddress, InterfaceAlias
```

# Versioning

Every native build increments the patch version and `android.versionCode` by one:

```powershell
node scripts/bump-version.mjs
```

`npm run build:preview` and `npm run build:production` run it automatically. Never bump for an OTA publish: `runtimeVersion` follows `expo.version`, so an update only reaches builds of that exact version.
