# AMV Planning Tool

A lightweight web-based tool for planning and annotating videos to music. Synchronize lyrics, add timestamped comments, and organize your creative vision all in one place.

## Features

- **Audio Playback**: Load and play your audio tracks
- **Lyrics Sync**: Import lyrics and sync them with audio playback for visual reference
- **Comments**: Add timestamped comments/notes at any point in the audio
- **Project Management**: Save and load entire projects with all data
- **Persistent Caching**: Automatically saves your last project to local storage

## How to Input Data

The tool supports importing data in multiple formats via the upload interface:

### Supported Formats

| Data Type | Format | File Extension | Description |
|-----------|--------|---|---|
| **Audio** | MP3| `.mp3` | Audio track for your video |
| **Lyrics** | LRC (Lyric) format | `.lrc` | Timestamped lyrics in standard LRC format: `[MM:SS.xx]Lyric text` |
| **Comments** | JSON | `.json` | Array of comment objects: `[{"time": 12.5, "text": "Note here"}]` |
| **Full Project** | AMVP (custom format) | `.amvp` | Complete project file with audio, lyrics, comments, and title |

### How to Import

1. **Select Data Type**: Use the dropdown in the tools panel to choose what you want to import
2. **Choose File**: Click the file input and select your file matching the selected format
3. **Confirm**: A confirmation dialog will appear; confirm to overwrite existing data
4. **Sync**: Data is automatically synced to the audio and displayed on screen

### Quick Actions

- **Download Project**: Click the download button to export your entire project as an `.amvp` file
- **Reset**: Use the reset button to clear all data and start fresh
- **Title**: Edit the project title directly in the header

## Getting Started

TODO add link to webpage

All your work is automatically saved to your browser's local storage!

But regularly save it to your machine. Just to be sure no Frontend magic messes you up :)