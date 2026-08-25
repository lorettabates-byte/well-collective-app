# WELL App Store Screenshots

## Step 1 — Add Your Photos

Save these 3 photos into the `photos/` folder with EXACT filenames:

| File name | Which photo |
|---|---|
| `photos/photo-landscape.jpg` | Wide panoramic shot — laughing, leaning, looking up-right (background for slides 1 & 2) |
| `photos/photo-portrait.jpg` | Close-up portrait — smiling straight at camera (background for slides 3 & 5) |
| `photos/photo-cutout.jpg` | Cutout on white background — sitting pose (slide 4, bottom right corner) |

## Step 2 — Export Each Slide

Open each HTML file in **Chrome** and use one of these methods:

### Option A — Chrome screenshot (quick)
1. Open the file in Chrome
2. Open DevTools (Cmd+Option+I)
3. Click the device toolbar icon (Cmd+Shift+M)
4. Set custom size: **430 × 932**
5. Right-click on the page → "Capture screenshot"
6. This gives you a 430×932 PNG → scale up for store submission

### Option B — Full resolution via Chrome DevTools (best)
1. Open DevTools → Device toolbar → set 430 × 932
2. Open DevTools Console and paste:
```js
// Sets device pixel ratio to 3x for true 1290×2796 export
```
3. Then use "Capture full size screenshot" from the DevTools menu (⋮)

### Option C — Use a screenshot tool like CleanMyMac, Shottr, or PixelSnap
Set the capture area to exactly 430×932 pixels.

## Step 3 — Required Sizes Per Store

### App Store (iOS) — submit the 1290×2796 version
- Open each file at **430×932** px in browser
- Screenshot at **3x device pixel ratio** = 1290×2796 ✓
- Submit 5 screenshots minimum

### Google Play — submit at 1080×1920
- Open each file at **360×640** px (or scale down the 430×932 export)
- Or use the same 1290×2796 exports (Google Play accepts larger sizes)

## The 5 Slides

| File | Headline | Feature shown |
|---|---|---|
| slide-1-hero.html | "Women who get it. All in one place." | Channel list home screen |
| slide-2-community.html | "Real conversations. Real support." | Live chat with messages |
| slide-3-channels.html | "Every part of your wellbeing, covered." | All 5 topic channels |
| slide-4-calendar.html | "Community events made for you." | Calendar + event cards |
| slide-5-cta.html | "Your wellness. Your community. Your WELL." | CTA + social proof |

## Panoramic Effect (Slides 1 + 2)
Slides 1 and 2 both use `photo-landscape.jpg` but crop to different parts:
- Slide 1: left portion of photo (her face / body visible through gradient)
- Slide 2: right portion (open space where she's looking — phone mockup fills that space)

When displayed side-by-side in the App Store, this creates the seamless panoramic look you wanted.
