# PhotoPose

**AI photo pose guide** — discover poses, follow a see-through guide on your camera, take the shot and get instant feedback on your head, arms, legs, framing and light.

PhotoPose is an installable web app (PWA) built with React + TypeScript. It runs full-screen on iPhone once added to the Home Screen, works offline after the first visit, and analyses photos **on-device** (photos never leave the phone).

> Live app: **https://iguslimatamuc.github.io/PhotoPose/**

---

## Try it on iPhone

1. Open the live link in **Safari**.
2. Tap **Share → Add to Home Screen → Add**.
3. Launch **PhotoPose** from the Home Screen (full-screen, like a native app).
4. When you open the camera, allow access. If you declined earlier: *Settings › Apps › Safari › Camera → Allow*.

The first analysis downloads the AI model (~10 MB); afterwards it works offline.

## Run locally

```bash
npm install
npm run fetch-model   # optional: bundles the AI model locally (otherwise loaded from Google's CDN)
npm run dev           # http://localhost:5173 (camera needs https or localhost)
npm test              # unit tests (scoring, filters, entitlements, sample data)
npm run build         # type-check + production build in dist/
```

To test on a phone from your computer use `npm run dev` and open the network URL over https (e.g. with a tunnel such as `cloudflared` or `ngrok`) — iOS only allows the camera on secure origins.

Deployment: every push to `main` runs `.github/workflows/deploy.yml` (tests → build → GitHub Pages).

---

## Project structure

```
src/
  app/                 App shell, routing, bootstrap (splash), service worker
  config/app.config.ts Branding, provider selection, feature flags, free limits, plans
  models/              Domain models: Pose, Category, User, Favorite, PhotoSession,
                       AnalysisResult, Feedback, Subscription, Entitlements, Settings
  data/                Sample content: 12 categories, 48 original poses, skeleton builder
  services/            Replaceable infrastructure (interfaces + implementations)
    container.ts       ← composition root: the ONE place implementations are chosen
    ai/                PoseAnalysisService, MediaPipe (on-device), Mock, Remote, scoring
    camera/            CameraService + WebCameraService (getUserMedia)
    tracking/          BodyTrackingService (live skeleton on the camera preview)
    persistence/       KeyValueStore (localStorage) + PhotoStore (IndexedDB)
    api/               ApiClient + PoseRepository (bundled / remote)
    subscription/      SubscriptionService, entitlements, Mock (test-mode) provider
    analytics/         AnalyticsService facade + providers (console / noop)
    auth/              AuthService + local guest implementation
    share/             Save / share photos (iOS share sheet)
    notifications/     Notification permission + push hook
  stores/              Zustand state (settings, library, catalog, history, subscription, user, toasts)
  features/            Screens grouped by feature (+ use-cases such as session/sessionController.ts)
    onboarding home explore pose camera analysis favorites history profile paywall misc
  components/          Reusable UI (buttons, cards, PoseFigure renderer, sheets, lists, score ring…)
  hooks/ utils/ theme/ Helpers and design tokens (theme/tokens.css = rebrand here)
```

## Architecture in short

- **UI → stores/use-cases → service interfaces → implementations.** Screens never import a concrete provider; they use stores and use-cases (`features/session/sessionController.ts`), which talk to interfaces obtained from `services/container.ts`.
- **Poses are data.** Each pose has one skeleton per person (17 keypoints, normalized). The same data draws the illustration, the camera overlay and is the reference for AI comparison. Add `imageUrl` for real photos — nothing else changes.
- **AI pipeline:** photo → `PoseAnalysisService.analyze()` → `AnalysisResult` (score, body feedback, composition feedback, recommendations). The default provider runs MediaPipe Pose Landmarker in the browser and compares keypoints with the reference (`services/ai/poseScoring.ts`: joint angles, mirroring, framing, headroom, light).
- **Persistence:** settings/favorites/usage in localStorage, sessions+results in IndexedDB, photo blobs in IndexedDB. All survive restarts.
- **Monetization:** UI checks `Entitlements` only (never "is premium"). Free: 5 AI analyses/day, premium poses locked, basic feedback. Premium: unlimited, all poses, detailed breakdown.
- **Performance:** code-split screens, lazy AI runtime (loaded only when analysing), service-worker caching, SVG pose art (no image downloads), `content-visibility` on cards, camera released when the app is backgrounded.
- **Accessibility:** follows iOS Dynamic Type (`-apple-system-body`) + in-app text size, labelled icon buttons, switches/radios with ARIA roles, live regions for countdown/analysis, reduced-motion support, 44pt targets.

## What is fully implemented

Splash, onboarding, home (pose of the day, categories, recommended, popular, recently viewed, saved, recent shots), explore (search, category chips, filters, sort), pose detail, camera (front/back, flash/torch or screen flash, grid, 3/10 s timer, pose overlay with opacity, pose picker, retake/confirm, upload from library), live body tracking (beta toggle), on-device AI analysis, result screen (score, feedback, suggestions, overlay toggle, save, share, try again, try another pose, delete), favorites (grid, edit/remove, start session), history (stats, sort, reopen, retry failed), profile, app/camera/notification settings, privacy/terms, paywall + subscription screens, persistence, error/empty/loading states, analytics events.

## What is mock / stub

| Area | Status |
|---|---|
| `MockPoseAnalysisService` | Simulated detection (used as "basic analysis" fallback or with `VITE_ANALYSIS_PROVIDER=mock`). Clearly labelled in the UI. |
| `MockSubscriptionService` | Test mode: purchases are free and local. |
| Analytics | `ConsoleAnalyticsProvider` in dev, `Noop` in production. |
| Auth | Local guest profile only. |
| Push notifications | Permission handled; sending requires a push server. |
| Content | 48 bundled poses with illustrated figures (no photos yet). |

## Where to connect things later

- **Real AI provider (OpenAI / Gemini / Claude / Vision API / own model):**
  `src/services/ai/RemotePoseAnalysisService.ts` documents the `POST /analysis` contract for your backend (never put API keys in the app). Select it with `VITE_ANALYSIS_PROVIDER=remote` + `VITE_ANALYSIS_ENDPOINT`, or add a new class implementing `PoseAnalysisService` and choose it in `src/services/container.ts`. MoveNet / other keypoint models can reuse `scorePose()`.
- **Backend:** set `VITE_API_BASE_URL`; `RemotePoseRepository` (`src/services/api/PoseRepository.ts`) then loads `/categories` and `/poses`. Auth tokens flow through `ApiClient` (`getToken`). Sync of favorites/history would go behind the store storage adapters in `src/stores/storage.ts`.
- **Authentication:** implement `AuthService` (`src/services/auth/AuthService.ts`) with Sign in with Apple / Firebase / Supabase and swap it in `container.ts`.
- **Subscription / paywall:** implement `SubscriptionService` (`src/services/subscription/SubscriptionService.ts`) with RevenueCat, StoreKit (native wrapper) or Stripe; set `subscription.testMode = false` in `app.config.ts`. Gating rules live only in `entitlementsFor()`. Paywall UI: `src/features/paywall/PaywallScreen.tsx`.
- **Analytics:** add a provider class implementing `AnalyticsProvider` in `src/services/analytics/AnalyticsService.ts` and register it in `container.ts`.
- **Native App Store app:** wrap this PWA with Capacitor and provide native `CameraService` / `SubscriptionService` / `ShareService` implementations — no UI rewrite needed.

## Rebranding

Colours, radii, type scale → `src/theme/tokens.css`. Name, tagline, links, limits, plans → `src/config/app.config.ts`. Icon → `public/icons/logo.svg`, then `npm run icons`.
