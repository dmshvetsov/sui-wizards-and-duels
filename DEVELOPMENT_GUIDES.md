# Game development guidelines for browser platform

## Sound effects and Music

- Short UI sounds / blips / clicks: under 20KB
- Action sounds (explosions, jumps, hits): 30–100KB
- Ambience / looping background sounds: 100KB–500KB, depending on quality and loop length

- Compress intelligently: Use audio tools (like Audacity or FFMPEG) to reduce bit rate (e.g., 96kbps–128kbps for SFX).
- Trim silence from start/end of sounds.
- Normalize volume levels so SFX blend well together.
- Use mono instead of stereo unless stereo is needed — mono cuts size in half.

Recommended auto formats:
- ogg
- mp3 if ogg can't be used

Avoid:

- WAV: Very large file size due to uncompressed audio. Fine for short sound effects during development, but not optimal for web delivery.
- AAC: Good quality, but browser support is more limited and inconsistent (especially with .m4a files).

### .ogg

Pros:

- Open-source and royalty-free.
- Good audio quality at lower bitrates.
- Smaller file sizes compared to WAV.
- Widely supported in modern browsers.

Bitrate suggestion: 96–160 kbps is usually enough for sound effects and music.

Usage example (FFmpeg):

    ffmpeg -i input.wav -ac 1 -b:a 128k output.ogg


### .mp3

Pros:

- Very widely supported (even on older browsers).
- Decent compression and quality.

Cons:

- Patented (though most licenses have expired).
- Slightly larger than Ogg for similar quality.

FFmpeg example:

    ffmpeg -i input.wav -ac 1 -b:a 128k output.mp3

Concatenating audio files into sprites:


```Bash
ffmpeg \
  -i sound1.wav \
  -i sound2.wav \
  -i sound3.wav \
  -i sound4.wav \
  -filter_complex "\
  [0]adelay=0|0[a0]; \
  [1]adelay=5000|5000[a1]; \
  [2]adelay=10000|10000[a2]; \
  [3]adelay=15000|15000[a3]; \
  [a0][a1][a2][a3]amix=inputs=4:duration=longest" \
  -acodec libvorbis output.ogg
```

### browsed compatibility

ogg [https://caniuse.com/?search=ogg](https://caniuse.com/?search=ogg)

mp3 [https://caniuse.com/?search=mp3](https://caniuse.com/?search=mp3)

To support all browsers, consider providing both MP3 and Ogg versions and loading the one supported by the client:

```html
<audio controls>
  <source src="sound.ogg" type="audio/ogg">
  <source src="sound.mp3" type="audio/mpeg">
  Your browser does not support the audio element.
</audio>
```

### volume normalization

To **limit (or reduce) the audio volume** using `ffmpeg`, you can use either of these two main filters:

🎛️ Option 1: Use `volume` filter (simple adjustment)

This is best for **manually setting** the volume level.

🔧 Reduce volume by 50%:

    ffmpeg -i input.wav -af "volume=0.5" output.wav

* `volume=0.5`: Reduces volume to 50% (can use decimals or dB).
* You can also use decibels, e.g.:

  ```bash
  -af "volume=-3dB"
  ```

🧠 Option 2: Use `dynaudnorm` or `loudnorm` for intelligent limiting

🔧 Limit peaks using `loudnorm` (EBU R128 compliant):

    ffmpeg -i input.wav -af "loudnorm=I=-23:LRA=7:TP=-2" output.wav

* `I=-23`: Target integrated loudness (LUFS).
* `TP=-2`: Maximum True Peak (avoid clipping).
* Best for **dialogue or music normalization** in games.

🔧 Prevent sudden volume spikes (dynamic normalization):

    ffmpeg -i input.wav -af "dynaudnorm" output.wav

* Useful for **leveling dynamic audio**, like varying SFX or voices.

🛠 Combine volume limiting with other options:

You can combine filters like this:

    ffmpeg -i input.wav -af "volume=0.8, dynaudnorm" output.wav

🧪 Tip: Preview before converting

Use `ffplay` to test the volume effect in real time:

    ffplay -af "volume=0.5" input.wav
