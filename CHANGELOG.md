# Changelog

## [1.5.0]
### Changed
- **Onboarding redesigned** — 4 steps (was 5): Demo → Pick mode → Pick theme → Load content.
  Burger menu callout step removed entirely.
  Step 1 is now a vertical stack of 3 tappable mode tiles (Sprint / Focus / Flow) with emoji,
  WPM range, description, and a "Recommended" badge on Focus.
  Step 2 is a 2×2 theme grid (Midnight / Warm / Obsidian / Day) — better thumb reach than
  the single row of 4. Step 3 keeps the original load-content cards unchanged.
- **Button layout fixed** — Back is now a small chevron icon in a top nav row alongside the
  progress dots and a Replay button (step 0 only). Primary action is full-width at the bottom
  so it never moves between steps. Skip is a small text link below the primary button.
- **Post-onboarding empty state** — the reading viewport now shows two large tappable cards
  ("Upload file" and "Paste text") when no document is loaded, replacing the plain text
  placeholder. Cards show icons, labels, and format hints.
- **Post-onboarding coach mark** — a single tooltip anchored to the burger menu appears 3 s
  after onboarding completes ("Settings & history live here") and auto-dismisses after 5 s or
  on any click. Replaces the previous scatter of help-button pulse, burger-button pulse, and
  upload-button pulse.

### Removed
- Burger menu callout step from onboarding overlay.
- `pulseHelp`, `pulseBurger`, `pulseUpload`, `showPostOnboardingHint` states and all related
  CSS (`helpBtnPulse`, `@keyframes helpPulse`, `postOnboardingHint`, `@keyframes hintBarFade`).
- `pulseBurger` prop from `BurgerMenuProps`.
- `pulseUpload` prop from `ControlsProps`.
### Added
- **Context word size toggle** — new setting `contextWordSameSize` (default: `true`). When
  enabled, context words render at the same font size as the main word. When disabled, they
  use a smaller size (`clamp(1.1rem, 5vw, 1.8rem)`) to create visual hierarchy. Persisted
  in `fastread_context_same_size`.
- **Dim amount slider** — new setting `contextWordOpacity` (default: `0.65`, range 0.20–1.00,
  step 0.05). Controls the opacity of context words when `peripheralFade` is on. When
  `peripheralFade` is off, context words always render at full opacity. Persisted in
  `fastread_context_opacity`.
- **Wizard 1–5 word count** — Step 1 of the Save Mode Wizard now offers all five window
  sizes (1–5) instead of the previous 1–3.
- **Wizard Step 6: Context word size** — new Yes/No step asking whether context words
  should match the main word size.
- **Wizard Step 7: Dim amount** — new stepper step to configure context word opacity,
  applied when dimming is enabled.
- **Wizard keyboard navigation** — press `←`/`→` or `Enter` to move between steps,
  `Y`/`N` on Yes/No steps, `1`–`5` on the word-count step, `Escape` to close.
- **Wizard keyboard hint** — small hint line below the progress bar shows available
  keyboard shortcuts.
- **Burger menu closes on Resume** — clicking "Resume" in the Session Analytics panel now
  closes the burger menu before resuming the session.

### Changed
- `getSlotOpacity` signature updated: the `windowSize` parameter is replaced by
  `contextWordOpacity: number`, which is used as the fade value when `peripheralFade`
  is true (previously hard-coded to `0.45`).
- All three presets (`speed`, `focus`, `read`) updated with `contextWordSameSize: true`
  and `contextWordOpacity: 0.65`.

## [1.4.1]
### Fixed
- **Eye focus button unclickable** — the base `.overlayBar` rule carries
  `pointer-events: none` (so the transparent overlay doesn't swallow word-area
  taps). Child clusters (`.pageNavOverlay`, `.wordNavOverlay`) individually
  restore `pointer-events: all`, but the `.eyeBtn` rule was missing the same
  restoration. Added `pointer-events: all` to the base `.eyeBtn` rule in
  `ReaderViewport.module.css` so the eye button is always clickable regardless
  of eye-focus state.

## [1.4.0]
### Fixed
- **WPM resets to 238 on refresh** — the adaptive speed system (`finalizeSession`)
  was calling `setWpm(newBaseline)` which overwrote `fastread_wpm` in localStorage
  with the adjusted value. On every subsequent refresh the app would initialise to
  238 (250 × 0.95) instead of the user's saved preference. Fix: removed
  `setWpm(newBaseline)` entirely — `finalizeSession` still runs to track rewinds
  and store its baseline in `fastread_adaptive_wpm`, but the user's WPM preference
  is never overwritten. Adaptive toast message updated to "Suggested speed for next
  session" to match the new non-mutating behaviour.

### Changed
- **WPM badge removed** — the WPM number that appeared inside the reading area
  during fullscreen focus mode has been removed. The Controls bar WPM stepper
  remains unchanged. Removed `.focusWpmBadge` and `.focusWpmUnit` CSS classes.
- **Eye focus mode rearchitected** — `isFocusMode` local state removed from
  `ReaderViewport`; replaced with `isEyeFocus` prop driven from `App`. Eye focus
  now borrows `appShellFocused` to hide the top bar and controls bar (same as the
  existing maximize button), and hides page nav, word nav, source label, and focal
  ticks within the viewport. **The word display is completely unchanged** in eye
  focus — same size, same position, same color. Eye button lives inside the
  `overlayBar` between the page nav and word nav clusters. Pressing Escape exits
  eye focus mode.

## v1.3.2 (in progress)
### Added
- **Progress % in word panel** — percentage now prepended before the "W" label
  (`[XX%] W [current] / [total]`). Calculated as
  `Math.round((currentWordIndex / totalWords) * 100)` with a 0% guard when
  no document is loaded. Uses muted `--text-faint` token so it recedes behind
  the word count without a badge or border.
- **Source label** — small, non-interactive overlay at the top-left of the reading
  viewport showing the loaded filename (files) or session title / first line
  (pasted text), truncated to 28 characters with a trailing ellipsis. Renders
  `null` when no source is loaded. Hides in focus mode.
- **Paste text resume** — pasted and URL-fetched content now reliably creates an
  IndexedDB entry so sessions resume from the correct word position on next visit.
  Fixed a pruning-race bug where the `pruneTextCacheToNames` call ran with a
  stale `records` snapshot that did not yet include the newly created session,
  causing the just-saved entry to be immediately deleted.

## v1.3.1 (in progress)
### Added
- InputPanel now wires urlParser.ts for URL inputs (CORS-aware, honest error on blocked sites)
- Reset to Beginning shows a 5s undo toast — position fully recoverable
- Sign-in prompt fires only at ≥95% document completion, not on every pause
- Post-onboarding: hint bar fades in above viewport + Upload button pulses for 4s
- What's New converted from blocking modal to collapsible bottom banner
- Burger menu pulse delayed 2s and extended to 6s post-onboarding
- F key toggles focus mode
- Focus mode entry/exit uses staggered fade transitions; "Esc or F to exit" hint fades in for 3s
- WPM pill flashes accent briefly on every speed change
- iOS back-swipe conflict fixed: left 20px excluded from swipe detection
- Screen reader: aria-live="polite" region announces words at ≤300 WPM, silent above
- Toasts include ARIA role="status" for screen reader announcement
- Peripheral word contrast uses --vp-text-peripheral token (≥4.5:1 per theme) not opacity
- HelpModal: F key + touch gesture documentation added
- ContextPreview: "↩ current" button filled accent + appear animation when detached
- Adaptive speed adjustments now show a toast explaining the change
- InputPanel: optional session title auto-populated from first sentence of pasted text

## [1.3.0]
### Fixed
- Page Preview jitter eliminated: active word now uses threshold-based instant scroll
  (snaps when past 75% of container) instead of competing smooth-scroll animations
- Page Preview text reflow fixed: `.word` and `.activeWord` both use font-weight: 600;
  active state is differentiated by color only, preventing width-change reflow
- Top bar page number chip (topBarReadPos) removed — redundant with viewport overlay
  and Page Preview header
### Added
- "↩ current" return button in Page Preview header — appears when user has browsed
  away from the reading position (isDetached); clicking snaps view back to current
  reading page and clears detached state

## [1.0.6]
### Changed
- All control buttons unified into one visual system matching +/- style
- Progress bar removed — word count and page pill remain
- Info row and page navigation merged into one compact row
- PLAY/PAUSE is visually primary — accent filled, slightly larger
- RESET is visually muted — faint color, no accent hover
- Icon + small label below on all action buttons
- Controls area reorganised from 3 rows to 2 main rows (info + actions + slim WPM row)

## [1.0.5]
### Changed
- ORP coloring is now a separate toggle from ORP alignment — "Highlight key letter"
- ORP color picker replaced with 4 researched science-backed options per theme
- All buttons and icon fills now use var(--color-accent) — theme-synchronized
- "Words" select removed from burger menu display section (redundant with Custom tab)
- Focus mode always enables focal line — removable only in Custom mode
- DESIGN_SYSTEM.md updated: color rules, token audit, icon guidelines

## [1.0.4]
### Added
- 3 app themes: Midnight (default), Warm, Day
- Theme switcher in burger menu (replaces day/night toggle)

### Changed
- Peripheral fade is now uniform across all context slots (0.45 when ON, 0.65 when OFF)
- Mode tiles: emoji stacked above label — 2-line compact layout, no overflow
- "Word Window" label removed — unified as "Words" everywhere
- All accent colors unified to var(--color-accent) — progress bar, icons, wizard
- Custom mode wizard updated: max 3 words, uniform fade, correct defaults
- Default startup: focalLine ON, peripheral fade ON, 250 WPM, Focus mode, 1 word

## [1.0.3]
### Changed
- Maximum word window reduced from 5 to 3
- Word layout redesigned: ORP character always aligned with tick marks
- Pre-ORP column fixed at 3 character widths — accommodates any English word
- Tick position derived from font metrics, identical in 1-word and multi-word mode
- Both modes share same left edge and ORP anchor point

## [1.0.2]
### Fixed
- Single-word mode now left-aligned — same starting X as multi-word mode
- Tick marks completely static — never move between words in either mode
- Tick position computed once from font metrics, only updates on font size change
- Context words flow at natural width — no equal-width columns, no mid-word clipping
- Empty trailing slots removed from DOM (null), no layout gaps
- Focal ticks hidden when no document loaded
- focalLine new-user default corrected to false

## [1.0.1]
### Fixed
- Ellipsis shown only on last context word slot
- Focal tick marks restored in multi-word mode via ORP position measurement
- Empty trailing slots invisible and take no space
- Context panel collapsed by default, tap to expand
- focalLine always colors ORP regardless of orpEnabled toggle
- Viewport vertically centered, words no longer float
- Context word font size increased for mobile readability
- Punctuation pause: sentence-end only (1.25×), minor punctuation removed
