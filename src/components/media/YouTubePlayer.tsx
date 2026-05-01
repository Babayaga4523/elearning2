"use client";

/**
 * YouTubePlayer Component
 * Renders YouTube videos using iframe with progress tracking
 */

import React, { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Play, AlertCircle, ExternalLink } from "lucide-react";
import { extractYouTubeId } from "./SmartVideoPlayer";

interface YouTubePlayerProps {
  moduleId: string;
  videoUrl: string;
  onComplete?: () => void;
  className?: string;
}

export function YouTubePlayer({
  moduleId,
  videoUrl,
  onComplete,
  className,
}: YouTubePlayerProps) {
  const [hasStarted, setHasStarted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Extract YouTube video ID
  const videoId = extractYouTubeId(videoUrl);

  // Build YouTube embed URL with parameters
  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}?` +
      new URLSearchParams({
        rel: "0", // Don't show related videos
        modestbranding: "1", // Minimal YouTube branding
        autoplay: "0", // Don't autoplay
        enablejsapi: "1", // Enable JavaScript API
        origin: typeof window !== "undefined" ? window.location.origin : "",
      }).toString()
    : null;

  // Track video start
  const handleVideoStart = () => {
    if (!hasStarted) {
      setHasStarted(true);
      console.log("YouTube video started:", moduleId);
    }
  };

  // Handle iframe load
  const handleIframeLoad = () => {
    setHasError(false);
  };

  // Handle iframe error
  const handleIframeError = () => {
    setHasError(true);
    console.error("Failed to load YouTube video:", videoUrl);
  };

  // If no valid video ID, show error
  if (!videoId || !embedUrl) {
    return (
      <div className="w-full aspect-video flex items-center justify-center bg-slate-100 rounded-lg">
        <div className="text-center p-6">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-2">
            URL YouTube Tidak Valid
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            Tidak dapat mengekstrak ID video dari URL yang diberikan.
          </p>
          <p className="text-xs text-slate-500 font-mono bg-slate-50 p-2 rounded break-all">
            {videoUrl}
          </p>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="mt-4 gap-2"
          >
            <a href={videoUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              Buka di YouTube
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative w-full", className)}>
      {/* YouTube iframe */}
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
        {!hasError ? (
          <iframe
            ref={iframeRef}
            src={embedUrl}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title="YouTube Video Player"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <div className="text-center text-white p-6">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
              <p className="font-medium mb-2">Gagal Memuat Video YouTube</p>
              <p className="text-sm text-slate-400 mb-4">
                Periksa koneksi internet atau coba refresh halaman
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Refresh Halaman
              </Button>
            </div>
          </div>
        )}

        {/* Play overlay (shown before video starts) */}
        {!hasStarted && !hasError && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer transition-opacity hover:bg-black/40"
            onClick={handleVideoStart}
          >
            <div className="h-20 w-20 rounded-full bg-red-600 flex items-center justify-center shadow-2xl transform transition-transform hover:scale-110">
              <Play className="h-10 w-10 text-white ml-1" fill="white" />
            </div>
          </div>
        )}
      </div>

      {/* External link */}
      <div className="mt-4 flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="gap-2 text-slate-600"
        >
          <a
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="h-4 w-4" />
            Buka di YouTube
          </a>
        </Button>
      </div>
    </div>
  );
}
