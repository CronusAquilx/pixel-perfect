import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, ChevronRight, FileText, Play, RotateCcw, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { clock, lessonVideos, lessonVideoUrl, videoCaptions } from "@/lib/lesson-videos";
import { cn } from "@/lib/utils";

export function LessonVideoPlayer({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  const video = lessonVideos[id];
  const url = lessonVideoUrl(id);
  const player = useRef<HTMLVideoElement>(null);
  const lastTime = useRef(0);
  const visited = useRef(new Set<number>());
  const [current, setCurrent] = useState(0);
  const [practice, setPractice] = useState<number | null>(null);
  const [follow, setFollow] = useState(true);
  const [transcript, setTranscript] = useState(false);
  const [captions, setCaptions] = useState<string>();
  const [error, setError] = useState(false);
  const [playError, setPlayError] = useState(false);

  useEffect(() => {
    if (!video) return;
    const track = URL.createObjectURL(new Blob([videoCaptions(video.chapters)], { type: "text/vtt" }));
    setCaptions(track);
    return () => URL.revokeObjectURL(track);
  }, [video]);

  if (!video || !url) return <section className="my-6 border-y py-6"><div className="flex items-center gap-2 text-muted-foreground"><Video className="h-5 w-5" /> Lesson video unavailable</div><div className="mt-4">{children}</div></section>;
  const chapter = video.chapters[practice ?? current];
  const resume = async () => {
    setPractice(null);
    try { await player.current?.play(); setPlayError(false); } catch { setPlayError(true); }
  };
  const seek = (index: number) => {
    const el = player.current;
    if (!el) return;
    const target = video.chapters[index].start;
    el.currentTime = target;
    lastTime.current = target;
    visited.current.delete(index);
    setCurrent(index);
    setPractice(null);
  };
  return <section className="my-6 border-y py-5" aria-label={`${title} video lesson`}>
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2"><Video className="h-4 w-4 text-gain" /><h2 className="font-semibold">Watch & practice</h2><span className="num text-xs text-muted-foreground">{clock(video.duration)}</span></div>
      <label className="flex cursor-pointer items-center gap-2 text-xs"><Switch checked={follow} onCheckedChange={(value) => { setFollow(value); if (!value) setPractice(null); }} aria-label="Pause for practice" />Pause for practice</label>
    </div>
    <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div className="min-w-0">
        <video ref={player} src={url} controls playsInline preload="metadata" className="aspect-video w-full rounded-md bg-background" aria-label={`${title} narrated video`}
          onError={() => setError(true)} onSeeking={(e) => { lastTime.current = e.currentTarget.currentTime; setPractice(null); }}
          onTimeUpdate={(e) => {
            const el = e.currentTarget;
            const time = el.currentTime;
            const match = video.chapters.findIndex((c) => time >= c.start && time < c.end);
            const index = match >= 0 ? match : video.chapters.length - 1;
            setCurrent(index);
            if (follow && !el.seeking && !el.paused) {
              const stop = video.chapters.findIndex((c, i) => c.practice && !visited.current.has(i) && lastTime.current < c.end && time >= c.end);
              if (stop >= 0) { visited.current.add(stop); el.pause(); setPractice(stop); }
            }
            lastTime.current = time;
          }}
          onEnded={() => { const last = video.chapters.length - 1; setCurrent(last); if (follow && !visited.current.has(last)) { visited.current.add(last); setPractice(last); } }}>
          {captions && <track kind="captions" src={captions} srcLang="en" label="English" />}
        </video>
        {error && <p role="alert" className="mt-2 text-sm text-loss">The video couldn’t load. <Button variant="link" onClick={() => { setError(false); player.current?.load(); }}>Retry</Button></p>}
        <nav aria-label="Video chapters" className="mt-3 grid gap-1">
          {video.chapters.map((c, i) => <Button key={c.start} variant="ghost" onClick={() => seek(i)} className={cn("h-auto justify-start gap-3 whitespace-normal px-2 py-2 text-left text-xs", i === current && "bg-accent")}><span className="num shrink-0 text-muted-foreground">{clock(c.start)}</span><span className="flex-1">{c.title}</span>{visited.current.has(i) && <Check className="h-3 w-3 text-gain" />}</Button>)}
        </nav>
        <Button variant="ghost" size="sm" className="mt-2" onClick={() => setTranscript(!transcript)} aria-expanded={transcript}><FileText className="mr-2 h-4 w-4" />Transcript</Button>
        {transcript && <div className="mt-2 max-h-64 space-y-3 overflow-y-auto border-t pt-3 text-sm text-muted-foreground">{video.chapters.map((c) => <p key={c.start}><strong className="text-foreground">{c.title}. </strong>{c.transcript}</p>)}</div>}
      </div>
      <div className="min-w-0" aria-live="polite">
        <div className="mb-3 flex items-center gap-2 text-xs text-gain">{practice !== null ? "YOUR TURN" : "FOLLOW ALONG"}<span className="text-muted-foreground">· {chapter?.title}</span></div>
        {chapter?.practice && <p className="mb-4 text-sm">{chapter.practice}</p>}
        {children}
        {practice !== null && <div className="mt-4 border-t pt-4"><details className="mb-3 text-sm"><summary className="cursor-pointer text-muted-foreground">Check your understanding</summary><p className="mt-2">{chapter?.outcome}</p></details><div className="flex flex-wrap gap-2"><Button variant="gain" onClick={resume}><Play className="mr-2 h-4 w-4" />Continue video<ChevronRight className="ml-1 h-4 w-4" /></Button><Button variant="ghost" size="icon" aria-label="Replay chapter" title="Replay chapter" onClick={() => { seek(practice); void resume(); }}><RotateCcw className="h-4 w-4" /></Button></div></div>}
        {playError && <p role="alert" className="mt-2 text-sm text-warn">Press play on the video to continue.</p>}
      </div>
    </div>
  </section>;
}