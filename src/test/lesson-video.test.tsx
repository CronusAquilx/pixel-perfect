import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/lesson-videos", () => ({
  clock: (n: number) => `0:${n}`,
  lessonVideoUrl: () => "https://example.test/lesson.mp4",
  lessonVideos: { basics: { duration: 20, filename: "basics.mp4", chapters: [
    { start: 0, end: 10, title: "First", transcript: "Investing basics.", practice: "Try the slider.", outcome: "More years compound." },
    { start: 10, end: 20, title: "Second", transcript: "Risk matters.", practice: "Check your result.", outcome: "Returns vary." },
  ] } },
  videoCaptions: () => "WEBVTT",
}));
import { LessonVideoPlayer } from "@/components/ml/LessonVideo";

afterEach(cleanup);
describe("Video follow-along", () => {
  it("pauses at a practice boundary and continues on request", () => {
    URL.createObjectURL = vi.fn(() => "blob:captions");
    URL.revokeObjectURL = vi.fn();
    const pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    render(<LessonVideoPlayer id="basics" title="Investing basics"><div>Practice widget</div></LessonVideoPlayer>);
    const video = screen.getByLabelText("Investing basics narrated video") as HTMLVideoElement;
    Object.defineProperty(video, "paused", { value: false, configurable: true });
    video.currentTime = 9;
    fireEvent.timeUpdate(video);
    video.currentTime = 10.1;
    fireEvent.timeUpdate(video);
    expect(pause).toHaveBeenCalledTimes(1);
    expect(screen.getByText("YOUR TURN")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Continue video/i }));
    expect(play).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("YOUR TURN")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Transcript" }));
    expect(screen.getByText("Risk matters.")).toBeInTheDocument();
    pause.mockRestore(); play.mockRestore();
  });
  it("allows watching without practice pauses", () => {
    const pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    render(<LessonVideoPlayer id="basics" title="Investing basics"><div>Practice widget</div></LessonVideoPlayer>);
    fireEvent.click(screen.getByRole("switch", { name: "Pause for practice" }));
    const video = screen.getByLabelText("Investing basics narrated video") as HTMLVideoElement;
    Object.defineProperty(video, "paused", { value: false, configurable: true });
    video.currentTime = 10.1;
    fireEvent.timeUpdate(video);
    expect(pause).not.toHaveBeenCalled();
    pause.mockRestore();
  });
});