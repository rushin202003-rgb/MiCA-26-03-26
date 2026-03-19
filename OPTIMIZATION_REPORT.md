# Codebase Optimization Report — 2026-03-19

Branch: `feature/v2-landing-page`
Preceded by: Post-redesign UX fixes (Round 3)

This document records every change made during the safe optimization pass. Medium-risk (reducer refactor) and high-risk (EyeCharacter state machine) changes were explicitly **not** made.

---

## What Was NOT Changed (and Why)

| Skipped | Reason |
|---------|--------|
| EyeCharacter state machine refactor | HIGH risk — 6-stage async launch sequence is business-critical; animations are working |
| DoodleMapPage → useReducer consolidation | MEDIUM risk — React 18 already batches setState in event handlers; benefit is marginal, refactor is large |
| Mouse throttle in EyeCharacter | Marginal benefit; could affect animation feel |

---

## Tier 1 — Zero Risk Changes

### 1A. Deleted Backup Files
- `src/pages/Campaign/DoodleMap/DoodleNode.backup.tsx` — **deleted**
- `src/pages/Campaign/DoodleMap/NoodleConnections.backup.tsx` — **deleted**

Neither was imported anywhere. Originals are preserved in git history (commit `bb6817e`).

---

### 1B. Extracted `CHANNEL_LABELS` constant
**File:** `src/pages/Campaign/TonePreview.tsx`

**Before:** A `const labels: Record<string, string>` object was recreated inside every `.map()` call on every render.

**After:** Moved to module-level constant above the component:
```ts
const CHANNEL_LABELS: Record<string, string> = {
  email: 'Email Marketing',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  video_ad: 'Video Ads',
};
```

---

### 1C. Extracted `TONE_OPTIONS` constant
**File:** `src/pages/Campaign/TonePreview.tsx`

**Before:** Five hardcoded `<option>` elements in the tone select.

**After:** Module-level constant + `.map()`:
```ts
const TONE_OPTIONS = ['Professional', 'Warm & Inspirational', 'Urgent', 'Casual', 'Custom'] as const;
// Rendered as:
{TONE_OPTIONS.map(t => <option key={t}>{t}</option>)}
```

---

### 1D. Fixed `any` Types

**File: `src/pages/Campaign/TonePreview.tsx`**

| Location | Before | After |
|----------|--------|-------|
| `Campaign.tone_preview_content` | `any` | `TonePreviewData \| null` |
| `const updates` (line ~207) | `any` | `Partial<Campaign> & { tone_preview_content?: TonePreviewData; recommended_channels?: string[] }` |
| `catch (err: any)` (line ~230) | `any` + `err.message` | `unknown` + `err instanceof Error ? err.message : "..."` |
| `setCampaign(DEMO_CAMPAIGN as any)` | `as any` cast | `{ ...DEMO_CAMPAIGN, tone_revision_used: false }` (missing field added inline) |

**File: `src/services/aiService.ts`**

| Location | Before | After |
|----------|--------|-------|
| `catch (error: any)` | `error.name === 'AbortError'` with no type guard | `catch (error: unknown)` + `error instanceof Error && error.name === 'AbortError'` |

---

### 1E. Extracted `GIGGLE_KEYFRAMES` Constant
**File:** `src/components/EyeCharacter.tsx`

Lines ~67–71 and ~181–191 defined identical keyframe arrays. Extracted to:
```ts
const GIGGLE_KEYFRAMES = {
  rotate: [-6, 6, -5, 5, -4, 4, -3, 3, -2, 2, -1, 1, 0],
  y: [2, -4, 2, -4, 2, -3, 1, -3, 1, -2, 0, -1, 0],
} as const;
```

**Side-effect fix:** The rocket launch sequence previously used `Promise.all` with two separate `gigglesControls.start()` calls for `rotate` and `y` independently. This is incorrect — Framer Motion's `useAnimation` doesn't support two concurrent independent animations on the same controller. Consolidated to a single `.start()` call with both properties, matching the correct pattern used in the click handler.

---

## Tier 2 — Low Risk Performance Changes

### 2A. Stable Callbacks in DoodleCanvas Render Loop
**File:** `src/pages/Campaign/DoodleMap/DoodleCanvas.tsx`

**Before:** Two inline arrow functions created on every render inside `NODES.map()`:
```tsx
onAdvance={() => onAdvance(node.id)}           // new function reference every render
onEditFocusChange={(payload) => setEditExpansion(payload)}  // new function reference every render
```

**After:**
- `onEditFocusChange` wrapped in `useCallback` as `handleEditFocusChange` (stable reference, no deps)
- `onAdvance` passed directly as `onAdvance={onAdvance}` — the inline wrapper removed entirely (see 2B for how DoodleNode picks up the nodeId)

---

### 2B. `React.memo` on DoodleNode
**File:** `src/pages/Campaign/DoodleMap/DoodleNode.tsx`

**Interface change:** `onAdvance: () => void` → `onAdvance: (nodeId: string) => void`

DoodleNode now calls `onAdvance(node.id)` internally at all call sites (11 locations updated). This allowed DoodleCanvas to pass the parent's `handleAdvance` directly without a per-node wrapper.

**Export change:**
```ts
// Before
export default DoodleNode;

// After
export default React.memo(DoodleNode);
```

**Why this is safe:** All state that DoodleNode consumes is passed as props. All parent callbacks (`onAdvance`, `onYesNo`, `onChoice`, etc.) are already wrapped in `useCallback` in `DoodleMapPage`. After 2A removed the two inline wrappers in DoodleCanvas, DoodleNode's props are now fully stable — `React.memo` will prevent sibling nodes from re-rendering when one node's local state changes.

**Verification:** React DevTools Profiler — type into one node, observe other nodes show no render flash.

---

### 2C. Code Splitting with `React.lazy` + `Suspense`
**File:** `src/App.tsx`

**Before:** All page components statically imported — entire app bundled into one chunk.

**After:** Entry pages kept static (LandingPage, Login, Signup — need instant render). All auth-gated pages lazy-loaded:

```ts
const CreateCampaign    = lazy(() => import('./pages/Campaign/CreateCampaign')...);
const TonePreview       = lazy(() => import('./pages/Campaign/TonePreview')...);
const GeneratingCampaign= lazy(() => import('./pages/Campaign/GeneratingCampaign')...);
const Dashboard         = lazy(() => import('./pages/Campaign/Dashboard')...);
const CampaignList      = lazy(() => import('./pages/CampaignList')...);
const DemoPrep          = lazy(() => import('./pages/DemoPrep')...);
```

`<Routes>` wrapped in `<Suspense>` with a spinner fallback matching the existing loading UI style.

**Why this matters:** DoodleMapPage imports the entire canvas system + Framer Motion animation tree. Keeping it out of the initial bundle directly improves Time to Interactive for the landing page.

---

### 2D. Lazy Video Loading on Landing Page
**File:** `src/pages/LandingPage.tsx`

**Before:** Three `<video autoPlay loop muted>` elements fired immediately on page load (estimated 2–5 MB each, loading in parallel on first paint).

**After:** New `LazyVideo` component using `IntersectionObserver`:
- Videos only mount their `<video>` element when within 200px of the viewport
- Observer disconnects after first intersection (one-shot, no continuous polling)
- The `200px` rootMargin gives the browser a head start before the user actually sees the video

```tsx
const LazyVideo: React.FC<{ src: string; className?: string }> = ({ src, className }) => {
  // IntersectionObserver → setInView(true) once → observer.disconnect()
  // Returns <div ref> placeholder until in view, then mounts <video>
};
```

All three hero videos replaced with `<LazyVideo src="..." className="..." />`.

---

## Files Changed Summary

| File | Type of Change |
|------|---------------|
| `src/pages/Campaign/DoodleMap/DoodleNode.backup.tsx` | DELETED |
| `src/pages/Campaign/DoodleMap/NoodleConnections.backup.tsx` | DELETED |
| `src/pages/Campaign/TonePreview.tsx` | CHANNEL_LABELS, TONE_OPTIONS, 4× any→typed |
| `src/services/aiService.ts` | catch any→unknown |
| `src/components/EyeCharacter.tsx` | GIGGLE_KEYFRAMES constant, launch giggle fix |
| `src/pages/Campaign/DoodleMap/DoodleCanvas.tsx` | handleEditFocusChange useCallback, stable onAdvance |
| `src/pages/Campaign/DoodleMap/DoodleNode.tsx` | onAdvance signature, 11 call sites, React.memo |
| `src/App.tsx` | React.lazy + Suspense for 6 routes |
| `src/pages/LandingPage.tsx` | LazyVideo component, 3 videos replaced |

---

## Verification Checklist

- [x] `tsc --noEmit` — zero TypeScript errors
- [ ] DoodleMap — type into a node, confirm other nodes don't re-render (React DevTools Profiler)
- [ ] Network tab — navigate between routes, confirm each lazy chunk loads on first visit only
- [ ] LandingPage on Slow 3G — confirm videos don't start loading until they scroll into view
- [ ] Channel badges in TonePreview still render correct labels
- [ ] Tone select still shows all 5 options
- [ ] Giggle animation still fires correctly on click and at end of launch sequence
