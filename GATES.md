# Gates: BeanOS intro replacement

OWNS: src/components/intro/BeanOSSplash.tsx, app/_layout.tsx, app.json, scripts/unlazy-verify-intro.mjs, scripts/unlazy-verify-typecheck.mjs, scripts/unlazy-verify-bundle.mjs

Scope: Launch shows the designed BeanOS intro (logo, wordmark, tagline, progress bar, version) for at least 2.6s while the database and settings load, then hands off to the app. The native splash uses the same logo and background so there is no flash.

- [x] G1: The intro component, its mount point and the native splash config match the provided design
  CHECK: node scripts/unlazy-verify-intro.mjs
  EXPECT: intro verification passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=ad6a6d7155c2a6aac20794ca898c903a457ae8ef00af1590258a7181c99eebc0; exit=0; EXPECT=matched; output-sha256=0c9522d3864e221064f0ae7a272a050871e33958a4cd20bf30b3669abfc3c8c0; output-bytes=26; shell=C:\WINDOWS\system32\cmd.exe; cwd=D:\project\BeanOS-clone; path=3d2d965d4922/17 entries

- [x] G2: The app still typechecks with TypeScript 5
  CHECK: node scripts/unlazy-verify-typecheck.mjs
  EXPECT: typecheck passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=3d342f723d2630384854fc3ed5c086464a2f0f95fa8bccb87553758eaddf93b9; exit=0; EXPECT=matched; output-sha256=88603ae6d0804b467cf0223e64644258397c61d0119a5876e07565cc5b2dd279; output-bytes=17; shell=C:\WINDOWS\system32\cmd.exe; cwd=D:\project\BeanOS-clone; path=3d2d965d4922/17 entries

- [x] G3: Metro serves a complete Android bundle containing the change
  CHECK: node scripts/unlazy-verify-bundle.mjs
  EXPECT: bundle passed
  EVIDENCE: automatic-evidence=v1; definition-sha256=bec11e0370510e6ffbb9bb95e6c5a784958b257c497a8e4c38693cf6026d980c; exit=0; EXPECT=matched; output-sha256=8ae8862a5df9a79423fb807945d5e4290607ddf08797783b5b135e70eec64cb2; output-bytes=31; shell=C:\WINDOWS\system32\cmd.exe; cwd=D:\project\BeanOS-clone; path=3d2d965d4922/17 entries

- [ ] G4: On device, launch plays the intro for ~2.6s over the brand background and then shows the app; after a native rebuild the splash matches with no white flash
  EVIDENCE: preview APK v1.0.1 (build 2) https://expo.dev/artifacts/eas/mHYJQIbLQPLvmlDN8sNyGIVPII4G1VRzGBKmImIHNL0.apk — pending device check
