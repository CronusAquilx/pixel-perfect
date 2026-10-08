import manifest from "./lesson-video-manifest.json";

export interface VideoChapter {
  start: number;
  end: number;
  title: string;
  transcript: string;
  practice: string;
  outcome: string;
}

export interface LessonVideo {
  duration: number;
  filename: string;
  chapters: VideoChapter[];
}

const pointers = import.meta.glob<{ default: { url: string } }>("../assets/videos/*.asset.json", { eager: true });
export const lessonVideos = manifest as Record<string, LessonVideo>;

export function lessonVideoUrl(id: string) {
  const video = lessonVideos[id];
  if (!video) return undefined;
  return pointers[`../assets/videos/${video.filename}.asset.json`]?.default.url;
}

export function clock(seconds: number) {
  const value = Math.max(0, Math.floor(seconds));
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
}

export function videoCaptions(chapters: VideoChapter[]) {
  const timestamp = (seconds: number) => {
    const ms = Math.round(seconds * 1000);
    return `${String(Math.floor(ms / 3600000)).padStart(2, "0")}:${String(Math.floor(ms / 60000) % 60).padStart(2, "0")}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}.${String(ms % 1000).padStart(3, "0")}`;
  };
  return "WEBVTT\n\n" + chapters.map((chapter, i) => `${i + 1}\n${timestamp(chapter.start)} --> ${timestamp(chapter.end)}\n${chapter.transcript.replace(/-->/g, "→")}\n`).join("\n");
}