# READING_ENGINE.md — RSVP Algorithm Explanation

> **Purpose:** Complete technical reference for the ReadSwift reading engine. Read this before modifying `useRSVPEngine`, `useChunkEngine`, `useAdaptiveSpeed`, or any file that touches playback timing. Cross-reference `/AGENT_READSWIFT.md` for architecture context.

---

## What RSVP Is

**Rapid Serial Visual Presentation (RSVP)** displays words sequentially at a fixed focal point rather than requiring the eye to scan across a line. This eliminates saccades — the rapid eye movements that consume 10–30% of reading time in traditional reading — allowing comfortable reading speeds of 300–1000+ WPM.

**The cognitive contract with the reader:**
- One word (or a small phrase window) appears at the same position on every tick.
- The eye should not need to move at all between words.
- The reading area must be visually stable — no jumps, no shifts, no jitter.

---

## Core Engine: `useRSVPEngine`

**File:** `src/hooks/useRSVPEngine.ts`

### Timing Architecture: `requestAnimationFrame` + Delta Timing

The engine uses `requestAnimationFrame` (rAF) rather than `setInterval` for word advancement.

**Why rAF instead of `setInterval`?**

`setInterval` at short intervals (e.g. 40 ms at 1500 WPM) is inaccurate on the browser main thread — it queues tasks that fire late when the thread is busy, and the errors accumulate (drift). `requestAnimationFrame` fires on every display refresh (typically 60 Hz = every ~16.7 ms). The engine checks on every frame whether enough time has elapsed and only advances the word when due. This gives millisecond-precise timing with no drift.

```typescript
const tick = () => {
  if (!isPlayingRef.current) return;
  const now = performance.now();

  if (now >= nextTickRef.current) {
    // Advance word
    const nextIndex = indexRef.current + 1;
    if (nextIndex >= wordsLenRef.current) { setIsPlaying(false); return; }
    indexRef.current = nextIndex;
    setCurrentWordIndex(nextIndex);

    // Schedule next tick based on current word's delay multiplier
    const mult = wordDelayMultiplier(currentWord, punctuationPause, longWordComp);
    nextTickRef.current = now + (60_000 / wpm) * mult;
  }

  rafRef.current = requestAnimationFrame(tick);
};
rafRef.current = requestAnimationFrame(tick);
```

### Stale-Closure Prevention via Refs

All engine parameters read inside the rAF callback live in refs:

| Ref | Mirrors |
|-----|---------|
| `indexRef` | `currentWordIndex` |
| `wordsLenRef` | `words.length` |
| `wordsRef` | `words` array |
| `wpmRef` | `wpm` |
| `punctuationPauseRef` | `punctuationPause` |
| `longWordCompRef` | `longWordCompensation` |
| `isPlayingRef` | `isPlaying` |

Each ref is kept in sync with its state equivalent via a `useEffect`. This means the rAF callback always reads the *current* value without needing to be recreated on every state change.

### Word Index: Center Word Convention

`currentWordIndex` always points to the **center (highlight) word** of the window, regardless of window size. The engine advances by exactly **one word per tick** no matter what `windowSize` is set to.

This means:
- **WPM accuracy is completely independent of window size.** At 300 WPM with a 3-word window, you still advance at 300 words per minute — the window is a rendering concern only.
- The window is built by `useRSVPEngine` as a `useMemo` from `currentWordIndex ± half`:

```typescript
const half = Math.ceil(windowSize / 2) - 1;
// Slot 0..windowSize-1: wordIdx = currentWordIndex - half + slot
// Slots outside word boundaries → empty string ''
```

### Base Delay Formula

```
baseMs = 60,000 / wpm
```

At 300 WPM: `60,000 / 300 = 200 ms` per word.
At 1500 WPM: `60,000 / 1500 = 40 ms` per word.

---

## Delay Modifiers

### Punctuation Pause (`punctuationPause`)

When enabled, words ending with certain punctuation get a delay multiplier:

| Punctuation | Characters | Multiplier |
|------------|-----------|------------|
| Major pause | `.` `?` `!` | × 1.4 |
| Minor pause | `,` `;` `:` | × 1.2 |

```typescript
const PUNCT_MAJOR_MULT = 1.4;  // after . ? !
const PUNCT_MINOR_MULT = 1.2;  // after , ; :
```

The multiplier is applied to the *following* delay — i.e. the word that ended with punctuation stays on screen longer. This gives the reader time to process clause and sentence boundaries.

### Long-Word Compensation (`longWordCompensation`)

Words longer than 8 characters get an additional delay proportional to excess length:

```typescript
const LONG_WORD_THRESHOLD = 8;  // characters (stripped of non-alphanumeric)
const LONG_WORD_BONUS = 0.04;   // +4% per extra character

if (strippedLength > LONG_WORD_THRESHOLD) {
  mult += (strippedLength - LONG_WORD_THRESHOLD) * LONG_WORD_BONUS;
}
```

A 12-character word (4 chars over threshold) adds `4 × 0.04 = +16%` to display time. This prevents long words from flashing by too quickly.

### Combined Multiplier

Both modifiers are applied to the same multiplier:

```typescript
function wordDelayMultiplier(word, punctuationPause, longWordComp): number {
  let mult = 1.0;
  if (punctuationPause) { /* apply punct mult */ }
  if (longWordComp)     { /* apply long-word bonus */ }
  return mult;
}
```

Maximum possible multiplier (major punct + very long word): e.g. 1.4 × (1 + 0.04 × 10) = 1.96. At 300 WPM base, a 20-char word ending in `.` displays for ≈ 392 ms.

---

## ORP — Optimal Recognition Point

**File:** `src/components/ReaderViewport.tsx` (`calcOrpIndex`, `WordWithOrp`)

The ORP is the optimal letter for the eye to fixate on within a word to enable the fastest recognition. Research places it at approximately 20% from the left edge (classic Spritz algorithm).

### ORP Index Calculation

```typescript
function calcOrpIndex(word: string): number {
  return Math.max(0, Math.ceil(word.length / 5) - 1);
}
```

| Word length | ORP index (0-based) | Example |
|------------|--------------------|---------| 
| 1 | 0 | **t**he |
| 2–5 | 0 | **r**ead |
| 6–10 | 1 | r**e**ading |
| 11–15 | 2 | un**d**erstanding |
| 16–20 | 3 | com**p**rehension |

### ORP Rendering

When `orpEnabled` is true, the center word is split into three `<span>` elements:

```tsx
<span className={styles.orpContext}>{word.slice(0, orpIdx)}</span>
<span className={styles.orpChar} style={{ color: highlightColor }}>{word[orpIdx]}</span>
<span className={styles.orpContext}>{word.slice(orpIdx + 1)}</span>
```

CSS:
```css
.orpChar    { font-size: 1.08em; font-weight: 900; }  /* slightly larger, bold */
.orpContext { opacity: 0.78; }                          /* prefix/suffix muted */
```

### Why ORP Must Never Shift

The ORP character must remain at a visually consistent horizontal position word-to-word. If the ORP shifts laterally, the eye must re-fixate on every word change, negating the speed benefit.

**How ReadSwift guarantees ORP stability:**

In horizontal mode, the center (ORP) word is the *inline-block anchor* of `.wordLayout`. Peripheral words are `position: absolute` relative to `.wordLayout`'s edges. The center word's own position is set by `text-align: center` on the parent — it **never moves** because peripheral words entering or leaving the DOM do not affect the center word's layout box.

```
parent (.windowHorizontal): text-align: center
  └── .wordLayout (inline-block — sized only by center word)
        ├── .leftPeripherals  (position: absolute; right: 100%)
        ├── center word span  ← THIS NEVER MOVES
        └── .rightPeripherals (position: absolute; left: 100%)
```

This layout technique is the **core visual stability guarantee** of the app. Do not change it.

---

## Intelligent Chunk Engine: `useChunkEngine`

**File:** `src/hooks/useChunkEngine.ts`

When `chunkMode === 'intelligent'`, the engine groups words into natural phrase chunks rather than advancing word-by-word through a fixed window.

### Phrase Boundary Rules

Chunks are built once (on `words` or `windowSize` change) by `buildPhraseChunks`:

1. **Terminal punctuation** — end chunk after any word ending with `,` `;` `:`
2. **Conjunction boundary** — end chunk before a conjunction (`and`, `but`, `or`, `because`, `while`, etc.) when the current segment is ≥ 2 words
3. **Preposition boundary** — end chunk before a preposition (`in`, `on`, `at`, `for`, `with`, etc.) when the current segment is ≥ 2 words
4. **Maximum chunk size** — `windowSize × 2` (prevents overly long chunks)
5. **Minimum chunk size** — 1 word (single words are valid chunks)

### Chunk Data Structures

```typescript
// Each chunk is an array of word indices into `words`
chunks: number[][]

// Reverse map: wordIndex → chunkIndex (Int32Array for O(1) lookup)
wordToChunk: Int32Array
```

Building the chunk index for a 100,000-word document takes < 10 ms.

### ORP in Chunk Mode

In intelligent mode, `currentWordIndex` still advances one word per tick (the RSVP engine is unchanged). The chunk engine maps `currentWordIndex` to its chunk and renders the full chunk centered on the ORP slot. The ORP highlight is always the center slot (same formula as fixed mode).

```typescript
const orpSlot = Math.ceil(windowSize / 2) - 1;
// Place words from the chunk around the current position within the chunk
for (let i = 0; i < chunk.length; i++) {
  const slot = orpSlot + (i - posInChunk);
  if (slot >= 0 && slot < windowSize) result[slot] = words[chunk[i]];
}
```

This means readers see the entire phrase for as long as the RSVP engine spends ticking through all words in the chunk — giving phrases a natural dwell time.

---

## Adaptive Speed Engine: `useAdaptiveSpeed`

**File:** `src/hooks/useAdaptiveSpeed.ts`

Tracks reading behavior within each session and subtly adjusts the WPM baseline stored in localStorage. The goal is to find the reader's comfortable pace automatically over time.

### Signals Tracked

| Signal | How detected |
|--------|-------------|
| **Rewinds** | `currentWordIndex` moving backward during active playback |
| **Session completion** | `(currentWordIndex - startIndex) / totalWords` |

### Adjustment Logic (`finalizeSession`)

Called by `App.tsx` when `isPlaying` transitions to `false`:

```typescript
if (rewinds >= 5)              adjusted = round(wpm * 0.95);  // −5%
if (completion < 0.5
    && wordsConsumed > 50)     adjusted = round(wpm * 0.95);  // −5%
if (rewinds === 0
    && completion > 0.8
    && wordsConsumed > 100)    adjusted = round(wpm * 1.02);  // +2%

adjusted = clamp(adjusted, 60, 1500);
```

Constants:
- `REWIND_THRESHOLD = 5` — rewinds per session before speed reduction
- `SLOW_FACTOR = 0.95` — −5% adjustment
- `FAST_FACTOR = 1.02` — +2% adjustment
- `LOW_COMPLETION_THRESHOLD = 0.5` — below 50% → reduce
- `HIGH_COMPLETION_THRESHOLD = 0.8` — above 80% (+ no rewinds) → increase
- `MIN_WORDS_FOR_COMPLETION_CHECK = 50` — ignore tiny partial reads
- `MIN_WORDS_FOR_SPEEDUP = 100` — must read ≥ 100 words before earning a speedup

### Manual Override Guard

`App.tsx` maintains `manualWpmRef`. If the user pressed ↑/↓ or moved the slider during the session, `manualWpmRef.current = true`. In this case the adaptive suggestion is computed but **not applied** to the current session's WPM. The baseline is still stored for future sessions.

---

## Session Analytics

Tracked entirely via refs inside `useRSVPEngine` to avoid stale closures:

| Ref | Tracks |
|-----|--------|
| `segmentStartRef` | `performance.now()` when the current play segment started |
| `totalActiveTimeMsRef` | Cumulative active reading time across all segments (ms) |
| `totalWordsDisplayedRef` | Total words advanced during this session |
| `indexAtSegmentStartRef` | Word index at play-segment start |

### Flush on Pause/Stop

When `isPlaying → false`, `flushSessionStats()` runs:

```typescript
if (segmentStartRef.current > 0) {
  totalActiveTimeMsRef.current += performance.now() - segmentStartRef.current;
  segmentStartRef.current = 0;
}
updateSessionStats({
  wordsRead: totalWordsDisplayedRef.current,
  activeTimeMs: totalActiveTimeMsRef.current,
});
```

### Effective WPM Calculation

In `ReaderContext`:

```typescript
effectiveWpm = round(wordsRead / (activeTimeMs / 60_000))
```

Only computed when `activeTimeMs >= 2,000 ms` (2 seconds) and `wordsRead > 0`. This prevents unrealistically high numbers from very short play sessions.

---

## Structural Map

**File:** `src/utils/structureUtils.ts`

When a document is loaded, `buildStructureMap(rawLines, words)` produces a `Map<wordIndex, StructuralMarker>` that tags where structural elements begin (headers, subheadings, scene separators, dialogue).

### Structural Types

```typescript
type StructuralType = 'header' | 'subheading' | 'paragraph' | 'scene-separator' | 'dialogue';
```

### Detection Heuristics (line-based)

| Type | Condition |
|------|-----------|
| `scene-separator` | Line matches `***`, `---`, `___`, `* * *`, etc. |
| `header` | Line matches `chapter N`, `part N`, `section N`, `prologue`, `epilogue`, etc. OR ATX markdown `#` heading |
| `subheading` | Line is ALL CAPS (3–80 chars, contains uppercase, no lowercase) |
| `dialogue` | Line starts with `"` or `'` |
| `paragraph` | Empty line between content |

The structural map is used by `ContextPreview` to display chapter/section hints alongside the RSVP display, and to provide navigation context.

---

## Content Normalizer

**File:** `src/utils/contentNormalizer.ts`

Applied after PDF and EPUB extraction, before tokenization. Strips running headers, footers, and page numbers that would appear as noise in the word stream.

### Pipeline

```
rawPages[] → normalizePages() → { normalizedPages[], stats }
```

The normalizer classifies lines that appear repeatedly at the top/bottom of pages (same text, or matching a page-number pattern) and removes them. This runs once at ingestion — never during playback.

### Ingestion Progress Stages

```
0%  → start
0–80%: streaming extraction (PDF page-by-page / EPUB chapter-by-chapter)
80–90%: normalization (normalizePages)
90%: setLoadingProgress(90) before tokenization loop
100%: tokenization complete
```

---

## Tokenizer

**File:** `src/utils/textUtils.ts`

```typescript
export function tokenize(text: string): string[] {
  return text
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 0 && /\w/.test(w));
}
```

- Splits on any whitespace.
- Filters out punctuation-only tokens (e.g. `—`, `|`, `•`) that add no reading value.
- Preserves punctuation *attached* to words (e.g. `"Hello,"` stays as one token).

---

## Engine Safety Rules

These invariants must hold at all times:

1. `currentWordIndex` is always in range `[0, words.length - 1]`.
2. The rAF loop checks `isPlayingRef.current` on every frame and exits immediately if false. This is the primary stop guard.
3. `clearEngine()` calls `cancelAnimationFrame` before `startEngine()` to prevent double-running loops.
4. Engine refs are reset on `reset()` (called via `resetReader()`).
5. Session analytics refs are reset when a new file is loaded (`useEffect` on `words`).
6. `finalizeSession` is always called with the current `wpm` value — it never mutates WPM directly; it only returns a suggestion.

---

## Performance Notes

- **rAF loop cost**: each frame executes one timestamp comparison and (on the advance frame) one `setCurrentWordIndex` call. No DOM reads or writes happen in the rAF callback — only ref reads and a React state dispatch.
- **Word window `useMemo`**: rebuilds the `wordWindow` array only when `currentWordIndex`, `words`, or `windowSize` changes. At 300 WPM it rebuilds every 200 ms — negligible.
- **Chunk index `useMemo`**: rebuilds only when `words` or `windowSize` changes. For a 100 k-word document this takes < 10 ms and happens at most once per file load.
- **`React.memo` on `ReaderViewport`**: props are checked shallowly. `wordWindow` is a new array reference on every advance (from `useRSVPEngine`'s `useMemo`), which is intentional — it signals the viewport to re-render.
- **`will-change: contents`** is set on `.wordSlot` to hint the GPU layer compositor. Do not remove this.

---

## Engine Extension Guide

When adding new timing modifiers (e.g. a modifier for rare words, difficult vocabulary, or sentence starts):

1. Add a constant at the top of `useRSVPEngine.ts` with a comment explaining the purpose and magnitude.
2. Add a ref for the new feature flag (e.g. `newFeatureRef`), kept in sync via `useEffect`.
3. Apply the modifier inside `wordDelayMultiplier()` — this function is the single place all delay multipliers are composed.
4. Add the flag to `ReaderContext` (`readerContextDef.ts`) with a default value and a localStorage key.
5. Expose it in BurgerMenu > Reading Features section.
6. Document the constant and behavior in this file.

When adding new chunk types:

1. Add boundary detection logic inside `buildPhraseChunks` in `useChunkEngine.ts`.
2. The function returns the same `{ chunks, wordToChunk }` shape — no interface change needed.
3. Performance-test on a 100 k-word document to verify chunk building stays under 10 ms.
