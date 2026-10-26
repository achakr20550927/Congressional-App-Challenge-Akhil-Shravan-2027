# Publish NeuraTrack

Deploy the **web app in `app/`**, not the entire repository or the Swift project. No database, account backend, API key, or server process is required for the current local-first app.

## Recommended: GitHub → Vercel

1. Commit and push the desired web changes to your GitHub repository. Review what you are committing; do not upload local journals, credentials, training datasets, or build folders.
2. In Vercel, create a new project and import `achakr20550927/Congressional-App-Challenge-Akhil-Shravan-2027`.
3. Select the branch containing these changes. Set **Root Directory: `app`** and **Framework: Vite**.
4. Use **Node.js 24**, **Install: `npm ci`**, **Build: `npm run build`**, **Output: `dist`**. Optionally set `ELECTRON_SKIP_BINARY_DOWNLOAD=1` in the hosting build environment to avoid downloading the desktop runtime.
5. Deploy. Vercel supplies an HTTPS URL. Add your domain through the provider later if desired.

`app/vercel.json` provides client-side route fallback and basic response headers. Model/media assets are excluded from the SPA rewrite. Check provider plan terms and limits before choosing a plan; no paid service is required by the app code.

Official reference: https://vercel.com/docs/frameworks/frontend/vite

## Alternative: Netlify

Import the same repository and branch. Set **base directory `app`**, **build command `npm run build`**, **publish directory `dist`**, and Node 24. The `_redirects` and `_headers` files in `app/public/` are copied into the build for route refreshes and headers.

For a manual deployment:

```sh
cd "/Users/akhil/CAC Neuratrack APP/app"
npm ci
npm test
npm run build
```

Upload **only `app/dist/`** to Netlify's manual deployment interface. Do not upload the repository folder. Manual uploads do not automatically update after future source changes; rebuild and upload again.

Official reference: https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/

## Before sharing the link

- Visit `/welcome`, `/demo`, and `/evidence` directly and refresh each route.
- Verify the DNA video plays and the pause control works; test a phone and reduced-motion settings.
- Complete consent, a spiral check-in, and a camera check-in on a physical phone. Allow camera permission over HTTPS. Simulator/test landmarks do not establish camera accuracy.
- Reload and confirm the journal persists. Export a report and check its contents.
- On iPhone, open the HTTPS URL in Safari and use Share → Add to Home Screen.
- Open browser developer tools: confirm no failed model/WASM downloads. First-time tracker initialization needs internet access.
- Close all existing app tabs after a deployment so the updated service worker can activate. Do not clear storage to update: that can erase the local journal.

## Important boundaries

Publishing does not sync anyone's data. Each browser, origin/domain, and native app has a separate journal. Moving from localhost or a preview URL to a production domain does not transfer recordings. Users should export important records; clearing browser data can erase them.

The site is a research prototype, not a validated diagnostic device. Keep the consent, quality gates, sample-data labels, and limitations visible. Hosting publicly does not establish clinical accuracy. This preparation has not itself deployed or pushed the project.
