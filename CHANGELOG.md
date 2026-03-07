# Changelog

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
