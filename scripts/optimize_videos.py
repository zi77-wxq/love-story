from __future__ import annotations

import argparse
import os
import stat
import subprocess
from pathlib import Path

import imageio_ffmpeg


ROOT = Path(__file__).resolve().parents[1]
MEDIA = ROOT / "media"
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()


def optimize(source: Path) -> tuple[int, int, str]:
    temporary = source.with_name(f"{source.stem}.optimized{source.suffix}")
    before = source.stat().st_size
    command = [
        FFMPEG,
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-i",
        str(source),
        "-map_metadata",
        "-1",
        "-vf",
        "scale=w='min(1280,iw)':h='min(720,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "27",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "96k",
        "-movflags",
        "+faststart",
        str(temporary),
    ]
    try:
        subprocess.run(command, check=True)
        after = temporary.stat().st_size
        if after >= before:
            temporary.unlink()
            return before, before, "kept original"
        source.chmod(source.stat().st_mode | stat.S_IWRITE)
        os.replace(temporary, source)
        return before, after, "optimized"
    except Exception:
        temporary.unlink(missing_ok=True)
        raise


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--start-index", type=int, default=1)
    args = parser.parse_args()
    videos = sorted(MEDIA.rglob("*.mp4"))
    total_before = 0
    total_after = 0
    for index, video in enumerate(videos, start=1):
        if index < args.start_index:
            continue
        before, after, status = optimize(video)
        total_before += before
        total_after += after
        print(
            f"[{index:02}/{len(videos):02}] {status}: {video.relative_to(ROOT)} "
            f"({before / 1024 / 1024:.1f} MB -> {after / 1024 / 1024:.1f} MB)"
        )
    print(
        f"Total: {total_before / 1024 / 1024:.1f} MB -> "
        f"{total_after / 1024 / 1024:.1f} MB"
    )


if __name__ == "__main__":
    main()
