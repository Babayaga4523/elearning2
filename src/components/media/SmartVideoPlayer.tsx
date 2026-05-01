"use client";

/**
 * SmartVideoPlayer Component
 * Automatically detects video source type and renders appropriate player
 * Supports: YouTube, SharePoint, Direct MP4/WebM/OGG
 */

import React from "react";
import { VideoPlayer } from "./VideoPlayer";
import { YouTubePlayer } from "./YouTubePlayer";
import { SharePointPlayer } from "./SharePointPlayer";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SmartVideoPlayerProps {
  moduleId: string;
  videoUrl: string;
  onComplete?: () => void;
  className?: string;
}

/**
 * Video source type detection
 */
export enum VideoSourceType {
  YOUTUBE = "youtube",
  SHAREPOINT = "sharepoint",
  DIRECT_VIDEO = "direct_video",
  UNKNOWN = "unknown",
}

/**
 * Detect video source type from URL
 */
export function detectVideoSourceType(url: string): VideoSourceType {
  if (!url || typeof url !== "string") {
    return VideoSourceType.UNKNOWN;
  }

  const normalizedUrl = url.toLowerCase().trim();

  // YouTube detection
  if (
    normalizedUrl.includes("youtube.com") ||
    normalizedUrl.includes("youtu.be") ||
    normalizedUrl.includes("youtube-nocookie.com")
  ) {
    return VideoSourceType.YOUTUBE;
  }

  // SharePoint detection
  if (
    normalizedUrl.includes("sharepoint.com") ||
    normalizedUrl.includes("1drv.ms") ||
    normalizedUrl.includes("onedrive.live.com")
  ) {
    return VideoSourceType.SHAREPOINT;
  }

  // Direct video file detection
  if (
    normalizedUrl.match(/\.(mp4|webm|ogg|mov|avi|mkv)(\?.*)?$/i) ||
    normalizedUrl.includes("/video/") ||
    normalizedUrl.includes("video")
  ) {
    return VideoSourceType.DIRECT_VIDEO;
  }

  return VideoSourceType.UNKNOWN;
}

/**
 * Extract YouTube video ID from various URL formats
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;

  // Standard watch URL: https://www.youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) return watchMatch[1];

  // Short URL: https://youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([^?]+)/);
  if (shortMatch) return shortMatch[1];

  // Embed URL: https://www.youtube.com/embed/VIDEO_ID
  const embedMatch = url.match(/youtube\.com\/embed\/([^?]+)/);
  if (embedMatch) return embedMatch[1];

  return null;
}

/**
 * SmartVideoPlayer Component
 */
export function SmartVideoPlayer({
  moduleId,
  videoUrl,
  onComplete,
  className,
}: SmartVideoPlayerProps) {
  // Detect source type
  const sourceType = detectVideoSourceType(videoUrl);

  // Render appropriate player based on source type
  switch (sourceType) {
    case VideoSourceType.YOUTUBE:
      return (
        <YouTubePlayer
          moduleId={moduleId}
          videoUrl={videoUrl}
          onComplete={onComplete}
          className={className}
        />
      );

    case VideoSourceType.SHAREPOINT:
      return (
        <SharePointPlayer
          moduleId={moduleId}
          videoUrl={videoUrl}
          onComplete={onComplete}
          className={className}
        />
      );

    case VideoSourceType.DIRECT_VIDEO:
      return (
        <VideoPlayer
          moduleId={moduleId}
          videoUrl={videoUrl}
          onComplete={onComplete}
          className={className}
        />
      );

    case VideoSourceType.UNKNOWN:
    default:
      return <UnsupportedVideoFallback videoUrl={videoUrl} />;
  }
}

/**
 * Fallback component for unsupported video sources
 */
function UnsupportedVideoFallback({ videoUrl }: { videoUrl: string }) {
  return (
    <div className="w-full aspect-video flex items-center justify-center bg-slate-100 rounded-lg">
      <div className="max-w-md text-center p-6">
        <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-8 w-8 text-amber-600" />
        </div>
        
        <h3 className="font-semibold text-slate-900 mb-2">
          Format Video Tidak Didukung
        </h3>
        
        <p className="text-sm text-slate-600 mb-4">
          URL video tidak dapat dikenali atau format tidak didukung oleh sistem.
        </p>

        <Alert className="mb-4 text-left">
          <AlertDescription className="text-xs">
            <strong>Format yang didukung:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>YouTube (youtube.com, youtu.be)</li>
              <li>SharePoint (sharepoint.com)</li>
              <li>Direct video files (.mp4, .webm, .ogg)</li>
            </ul>
          </AlertDescription>
        </Alert>

        {videoUrl && (
          <Button
            variant="outline"
            size="sm"
            asChild
            className="gap-2"
          >
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
              Buka di Tab Baru
            </a>
          </Button>
        )}

        <p className="text-xs text-slate-500 mt-4">
          Hubungi admin jika masalah berlanjut
        </p>
      </div>
    </div>
  );
}
