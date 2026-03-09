# PaceRead — Screenshot Naming Conventions & Specifications

**Client:** Techscript Limited  
**Document version:** 1.0  
**Status:** Production

---

## 1. Required Screenshot Sets

### Phone Screenshots (Required — minimum 2, recommended 4)

| Filename | Dimensions | Content |
|---|---|---|
| `phone-01-reader.jpg` | 1080×1920 px | RSVP word display — word visible at centre, progress shown |
| `phone-02-controls.jpg` | 1080×1920 px | Controls bar, WPM slider, file loaded and at speed |
| `phone-03-history.jpg` | 1080×1920 px | Reading history panel — two or more entries with progress bars |
| `phone-04-context.jpg` | 1080×1920 px | Context preview panel alongside word display |

### 7-inch Tablet (Optional)

| Filename | Dimensions |
|---|---|
| `tablet7-01-reader.jpg` | 1200×1920 px |
| `tablet7-02-controls.jpg` | 1200×1920 px |

### 10-inch Tablet (Optional)

| Filename | Dimensions |
|---|---|
| `tablet10-01-reader.jpg` | 1600×2560 px |
| `tablet10-02-controls.jpg` | 1600×2560 px |

---

## 2. Technical Requirements

| Property | Value |
|---|---|
| Minimum dimensions | 320×568 px |
| Maximum dimensions | 3840×3840 px |
| Recommended phone resolution | 1080×1920 px (portrait) |
| Minimum file size | 100 KB |
| Maximum file size | 8 MB per screenshot |
| Accepted formats | JPEG (≥ 90 quality) or PNG-24 |
| Colour space | sRGB |
| Orientation | Portrait |
| Maximum screenshots per device type | 8 |

---

## 3. Content Standards

### Required
- All screenshots must show the **dark theme** (`#060606` background) — the app has no light theme
- Status bar must show a clean time (**9:41** recommended — matches Apple convention for clean demo shots)
- Remove all notification icons from the status bar where possible
- Show real document content, not Lorem Ipsum
- Battery indicator should show ≥ 80%

### Recommended
- Apply a device frame (Pixel 8 Pro or Pixel 9 — use the Android Asset Studio or Shots.so)
- Add a single line of caption text at the bottom of each screenshot in Segoe UI `#f0f0f0` on `#060606` background — this helps users understand the screen at a glance in small thumbnail view

### Prohibited
- Do not include competitor product names or logos
- Do not overlay Play Store badges or Google logos
- Do not include pricing information in screenshots

---

## 4. Captions (per screenshot)

Add these as overlay text at the bottom of each device frame if using framed screenshots.

| Screenshot | Caption text |
|---|---|
| `phone-01-reader.jpg` | "One word at a time. Zero distraction." |
| `phone-02-controls.jpg` | "60–1000 WPM. Adjust to your pace." |
| `phone-03-history.jpg` | "Your progress. Saved automatically." |
| `phone-04-context.jpg` | "Context panel keeps you oriented." |

---

## 5. Production Workflow

1. Build and deploy the app to a Pixel 8 Pro (physical device or emulator — API 34+)
2. Open a real EPUB or PDF (public domain suggested: *Pride and Prejudice*, *The Great Gatsby*)
3. Start reading at 350 WPM
4. Take screenshots at the four states listed above using `adb shell screencap` or Android Studio Device Capture
5. Crop to 1080×1920 if needed
6. Apply device frame using Android Asset Studio: https://developer.android.com/distribute/marketing-tools/device-art-generator
7. Export as JPEG at 95 quality
8. Name files per convention above and place in this directory

```bash
# Capture screenshot via ADB
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png phone-01-reader.png

# Crop to 1080x1920 using ImageMagick if device is higher resolution
convert phone-01-reader.png -crop 1080x1920+0+0 phone-01-reader-cropped.png

# Convert to JPEG at 95 quality
convert phone-01-reader-cropped.png -quality 95 phone-01-reader.jpg
```

---

## 6. Pre-Upload Validation Checklist

- [ ] Dimensions exactly 1080×1920 px (or Play Store accepted size)
- [ ] File size < 8 MB
- [ ] Format JPEG or PNG
- [ ] sRGB colour profile
- [ ] Dark background visible (`#060606`)
- [ ] No competitor branding
- [ ] No pricing text
- [ ] Status bar shows clean time (9:41)
- [ ] At least 2 phone screenshots present

---

*© 2025 Techscript Limited. Internal use only.*
