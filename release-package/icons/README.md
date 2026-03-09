# PaceRead — Icon Naming Conventions & Specifications

**Client:** Techscript Limited  
**Document version:** 1.0  
**Status:** Production

---

## 1. File Naming Conventions

All icon files follow `{name}-{size}-{variant}.{ext}` convention.

### PWA / Web Icons (place in `public/icons/`)

| Filename | Dimensions | Format | Purpose |
|---|---|---|---|
| `icon.svg` | Scalable | SVG | Master source — generate all raster exports from this file |
| `icon-192.png` | 192×192 px | PNG-32 | PWA manifest (standard icon) |
| `icon-512.png` | 512×512 px | PNG-32 | PWA manifest (standard icon) + Play Store listing icon |
| `icon-512-maskable.png` | 512×512 px | PNG-32 | PWA manifest (maskable) — solid `#060606` background, content in central 80% (409×409 px) |

### Apple Touch Icon (place in `public/`)

| Filename | Dimensions | Format | Purpose |
|---|---|---|---|
| `apple-touch-icon.png` | 180×180 px | PNG-24 | iOS home screen icon — no transparency, solid `#060606` bg |

### Android Adaptive Icon Layers (place in `release-package/icons/`)

All density variants must be exported. File naming follows Android resource convention:

| Filename | Density | Dimensions |
|---|---|---|
| `ic_launcher_foreground.mdpi.png` | mdpi | 108×108 px |
| `ic_launcher_foreground.hdpi.png` | hdpi | 162×162 px |
| `ic_launcher_foreground.xhdpi.png` | xhdpi | 216×216 px |
| `ic_launcher_foreground.xxhdpi.png` | xxhdpi | 324×324 px |
| `ic_launcher_foreground.xxxhdpi.png` | xxxhdpi | 432×432 px |
| `ic_launcher_background.mdpi.png` | mdpi | 108×108 px |
| `ic_launcher_background.hdpi.png` | hdpi | 162×162 px |
| `ic_launcher_background.xhdpi.png` | xhdpi | 216×216 px |
| `ic_launcher_background.xxhdpi.png` | xxhdpi | 324×324 px |
| `ic_launcher_background.xxxhdpi.png` | xxxhdpi | 432×432 px |

For the Capacitor/Android Studio project, place the density variants in the standard Android mipmap directories:

```
android/app/src/main/res/
├── mipmap-mdpi/
│   ├── ic_launcher.png            108×108
│   ├── ic_launcher_foreground.png 108×108
│   └── ic_launcher_background.png 108×108
├── mipmap-hdpi/
│   ├── ic_launcher.png            162×162
│   ├── ic_launcher_foreground.png 162×162
│   └── ic_launcher_background.png 162×162
├── mipmap-xhdpi/
│   ├── ic_launcher.png            216×216
│   ├── ic_launcher_foreground.png 216×216
│   └── ic_launcher_background.png 216×216
├── mipmap-xxhdpi/
│   ├── ic_launcher.png            324×324
│   ├── ic_launcher_foreground.png 324×324
│   └── ic_launcher_background.png 324×324
├── mipmap-xxxhdpi/
│   ├── ic_launcher.png            432×432
│   ├── ic_launcher_foreground.png 432×432
│   └── ic_launcher_background.png 432×432
└── mipmap-anydpi-v26/
    ├── ic_launcher.xml            (adaptive icon XML — points to foreground/background layers)
    └── ic_launcher_round.xml      (same, for round icon mask)
```

---

## 2. Adaptive Icon XML Templates

### `ic_launcher.xml` (place in `mipmap-anydpi-v26/`)

```xml
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
```

### `ic_launcher_round.xml` (place in `mipmap-anydpi-v26/`)

```xml
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
```

---

## 3. Icon Colour Specification

| Layer | Background | Foreground |
|---|---|---|
| `ic_launcher_background.png` | `#060606` (fully opaque) | N/A |
| `ic_launcher_foreground.png` | Transparent | `#f0f0f0` (white symbol) |
| `icon-512.png` (Play Store) | `#060606` | `#f0f0f0` + `#e74c3c` focal accent |
| `icon-512-maskable.png` | `#060606` (fully opaque) | `#f0f0f0` centred in safe zone |
| `apple-touch-icon.png` | `#060606` | `#f0f0f0` |

---

## 4. Safe Zone Reference

```
Adaptive icon total canvas: 108×108 dp
╔═══════════════════════════════╗
║                               ║  ← 18 dp outer ring (masked by system)
║  ╔═════════════════════════╗  ║
║  ║                         ║  ║
║  ║     SAFE ZONE           ║  ║  ← 72×72 dp safe zone
║  ║     (icon content       ║  ║     Keep all visual content here
║  ║      lives here)        ║  ║
║  ║                         ║  ║
║  ╚═════════════════════════╝  ║
║                               ║
╚═══════════════════════════════╝

Maskable PWA icon safe zone (512×512 canvas):
Central 409×409 px = 80% of canvas = keep all content here
```

---

## 5. Export Commands (using `rsvg-convert`)

```bash
# Install: sudo apt-get install librsvg2-bin

# PWA icons from master SVG
rsvg-convert -w 192 -h 192 public/icons/icon.svg -o public/icons/icon-192.png
rsvg-convert -w 512 -h 512 public/icons/icon.svg -o public/icons/icon-512.png

# Apple touch icon (solid background requires compositing step — see below)
rsvg-convert -w 180 -h 180 public/icons/icon.svg -o /tmp/icon-fg-180.png
# Add solid #060606 background using ImageMagick:
# convert -size 180x180 xc:'#060606' /tmp/icon-fg-180.png -composite public/apple-touch-icon.png

# Adaptive foreground (transparent bg)
rsvg-convert -w 108 -h 108 public/icons/icon.svg -o release-package/icons/ic_launcher_foreground.mdpi.png
rsvg-convert -w 162 -h 162 public/icons/icon.svg -o release-package/icons/ic_launcher_foreground.hdpi.png
rsvg-convert -w 216 -h 216 public/icons/icon.svg -o release-package/icons/ic_launcher_foreground.xhdpi.png
rsvg-convert -w 324 -h 324 public/icons/icon.svg -o release-package/icons/ic_launcher_foreground.xxhdpi.png
rsvg-convert -w 432 -h 432 public/icons/icon.svg -o release-package/icons/ic_launcher_foreground.xxxhdpi.png
```

---

*© 2025 Techscript Limited. Internal use only.*
