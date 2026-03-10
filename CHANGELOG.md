# Changelog

## v1.3.2 (in progress)
### Added
- PDF diagram zones detected spatially and replaced with [Figure] placeholder — garbled diagram label tokens (single letters, arrows, glyph fragments) no longer flow into the RSVP word array

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
