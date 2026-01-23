# Media Assets Guide

## Hero Section Videos

Place your hero banner MP4 videos in `/media/hero/`:

### Required Files:
- `sbb-hero-loop.mp4` - Main desktop hero video (recommended: 1920x1080, 15-30 seconds loop)
- `sbb-hero-poster.jpg` - Fallback image when video can't play (same dimensions)
- `sbb-hero-mobile.mp4` - Mobile-optimized version (recommended: 1080x1920 or 720x1280)

### Video Specifications:
- **Format:** MP4 (H.264 codec)
- **Desktop:** 1920x1080 or 2560x1440
- **Mobile:** 1080x1920 (vertical) or 720x1280
- **Duration:** 15-30 seconds (seamless loop)
- **File size:** Keep under 10MB for desktop, 5MB for mobile
- **Frame rate:** 24-30fps
- **Audio:** Remove audio track (videos autoplay muted)

### Compression Tips:
```bash
# Using FFmpeg to compress video
ffmpeg -i input.mp4 -c:v libx264 -crf 23 -preset medium -an -movflags +faststart output.mp4

# For mobile version (resize to 720p vertical)
ffmpeg -i input.mp4 -vf "scale=720:1280" -c:v libx264 -crf 25 -preset medium -an -movflags +faststart mobile.mp4
```

## Banner Videos

Place promotional banner videos in `/media/banners/`:

- `quality-commitment.mp4` - About/quality section video
- `quality-commitment-poster.jpg` - Fallback poster

## Category Images

Place category images in `/media/categories/`:

- `peptides.jpg` - Research Peptides category (recommended: 800x600)
- `reference.jpg` - Analytical Reference category
- `supplies.jpg` - Laboratory Supplies category

## Image Specifications:
- **Format:** JPG or WebP (preferred)
- **Category images:** 800x600 or 1200x800
- **Poster images:** Same dimensions as corresponding video

## API Endpoints

The frontend fetches hero configuration from:
- `GET /api/content/hero` - Hero slides with video URLs
- `GET /api/content/homepage` - Full homepage content
- `GET /api/content/banners` - Promotional banners

## Notes for Codex (Frontend)

The hero component should:
1. Fetch config from `/api/content/hero`
2. Render `<video>` with autoplay, muted, loop, playsInline attributes
3. Use poster image as fallback
4. Switch to mobile video on smaller screens (use srcSet or JS detection)
5. Apply overlay gradient for text readability
6. Support multiple slides with fade transitions (if multiple slides configured)
