# Game development guidelines for browser platform

## Sound effects

- Short UI sounds / blips / clicks: under 20KB
- Action sounds (explosions, jumps, hits): 30–100KB
- Ambience / looping background sounds: 100KB–500KB, depending on quality and loop length

- Compress intelligently: Use audio tools (like Audacity or FFMPEG) to reduce bitrate (e.g., 96kbps–128kbps for SFX).
- Trim silence from start/end of sounds.
- Normalize volume levels so SFX blend well together.
- Use mono instead of stereo unless stereo is needed — mono cuts size in half.
