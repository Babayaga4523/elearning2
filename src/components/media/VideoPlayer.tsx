"use client";

/**
 * VideoPlayer Component
 * HTML5 video player with progress tracking, auto-save, and resume functionality
 */

import React, { useRef, useEffect, useState } from "react";
import { useVideoProgress } from "@/hooks/useVideoProgress";
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface VideoPlayerProps {
  moduleId: string;
  videoUrl: string;
  onComplete?: () => void;
  className?: string;
}

export function VideoPlayer({
  moduleId,
  videoUrl,
  onComplete,
  className,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveTimeRef = useRef<number>(0);

  // Check if videoUrl is valid
  const isValidUrl = videoUrl && videoUrl.trim() !== '';

  const {
    progress,
    isLoading,
    isSaving,
    saveProgress,
    resetProgress,
    shouldResume,
    dismissResume,
  } = useVideoProgress(moduleId);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [hasResumed, setHasResumed] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Load video metadata and handle errors
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setHasError(false); // Clear any previous errors
    };

    const handleError = (e: Event) => {
      console.error("Video loading error:", e);
      setHasError(true);
      setErrorMessage("Video tidak dapat dimuat. Periksa koneksi internet atau hubungi admin.");
    };

    const handleLoadStart = () => {
      setHasError(false);
      setErrorMessage("");
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("error", handleError);
    video.addEventListener("loadstart", handleLoadStart);
    
    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("error", handleError);
      video.removeEventListener("loadstart", handleLoadStart);
    };
  }, [videoUrl]); // Re-run when videoUrl changes

  // Resume from last position
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !progress || hasResumed || isLoading) return;

    if (progress.currentTime > 0 && progress.completionRate < 95) {
      video.currentTime = progress.currentTime;
      setCurrentTime(progress.currentTime);
      setHasResumed(true);
    }
  }, [progress, isLoading, hasResumed]);

  // Auto-save progress every 5 seconds
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const now = video.currentTime;
      setCurrentTime(now);

      // Save every 5 seconds - only if duration is valid
      if (now - lastSaveTimeRef.current >= 5 && video.duration && isFinite(video.duration)) {
        lastSaveTimeRef.current = now;
        saveProgress({
          currentTime: now,
          duration: video.duration,
        });
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, [saveProgress]);

  // Save on pause
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePause = () => {
      // Only save if duration is valid
      if (video.duration && isFinite(video.duration)) {
        saveProgress({
          currentTime: video.currentTime,
          duration: video.duration,
        });
      }
    };

    video.addEventListener("pause", handlePause);
    return () => video.removeEventListener("pause", handlePause);
  }, [saveProgress]);

  // Save on unmount
  useEffect(() => {
    return () => {
      const video = videoRef.current;
      if (video && video.currentTime > 0 && video.duration && isFinite(video.duration)) {
        saveProgress({
          currentTime: video.currentTime,
          duration: video.duration,
        });
      }
    };
  }, [saveProgress]);

  // Check for completion
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnded = () => {
      // Only save if duration is valid
      if (video.duration && isFinite(video.duration)) {
        saveProgress({
          currentTime: video.duration,
          duration: video.duration,
        });
      }

      if (onComplete) {
        onComplete();
      }
    };

    video.addEventListener("ended", handleEnded);
    return () => video.removeEventListener("ended", handleEnded);
  }, [saveProgress, onComplete]);

  // Play/Pause
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      // Handle play() promise to prevent NotSupportedError
      video.play().catch(error => {
        console.error("Video playback failed:", error.name, error.message);
        // You could show a user-friendly error message here
      });
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  // Seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const time = parseFloat(e.target.value);
    video.currentTime = time;
    setCurrentTime(time);
  };

  // Volume
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const vol = parseFloat(e.target.value);
    video.volume = vol;
    setVolume(vol);
    setIsMuted(vol === 0);
  };

  // Mute/Unmute
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  };

  // Fullscreen
  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Resume from saved position
  const handleResume = () => {
    dismissResume();
  };

  // Start from beginning
  const handleStartFromBeginning = async () => {
    const video = videoRef.current;
    if (!video) return;

    await resetProgress();
    video.currentTime = 0;
    setCurrentTime(0);
    dismissResume();
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate completion percentage
  const completionPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Show fallback UI for invalid URL
  if (!isValidUrl) {
    return (
      <div className="w-full aspect-video flex items-center justify-center bg-slate-100 rounded-lg">
        <div className="text-center text-slate-600">
          <div className="text-4xl mb-2">📹</div>
          <p className="font-medium">Video URL tidak tersedia</p>
          <p className="text-sm text-slate-500">Hubungi admin untuk memperbaiki masalah ini</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative w-full", className)}>
      {/* Resume Notification */}
      {shouldResume && !hasResumed && progress && (
        <Alert className="mb-4">
          <AlertDescription className="flex items-center justify-between">
            <span>
              Melanjutkan dari {formatTime(progress.currentTime)} ({Math.round(progress.completionRate)}% selesai)
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleStartFromBeginning}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Mulai dari Awal
              </Button>
              <Button size="sm" onClick={handleResume}>
                Lanjutkan
              </Button>
              <Button size="sm" variant="ghost" onClick={dismissResume}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Video Container */}
      <div
        ref={containerRef}
        className="relative bg-black rounded-lg overflow-hidden group"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full aspect-video"
          onClick={togglePlay}
        />

        {/* Loading Overlay */}
        {isLoading && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-white">Memuat video...</div>
          </div>
        )}

        {/* Error Overlay */}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center text-white p-6">
              <div className="text-4xl mb-4">⚠️</div>
              <p className="font-medium mb-2">Video Tidak Dapat Dimuat</p>
              <p className="text-sm text-gray-300 mb-4">{errorMessage}</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const video = videoRef.current;
                  if (video) {
                    video.load(); // Reload the video
                    setHasError(false);
                  }
                }}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Coba Lagi
              </Button>
            </div>
          </div>
        )}

        {/* Saving Indicator */}
        {isSaving && (
          <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
            Menyimpan progress...
          </div>
        )}

        {/* Controls */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity",
            showControls || !isPlaying ? "opacity-100" : "opacity-0"
          )}
        >
          {/* Progress Bar */}
          <div className="mb-3">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-xs text-white mt-1">
              <span>{formatTime(currentTime)}</span>
              <span className="text-gray-400">
                {Math.round(completionPercentage)}% selesai
              </span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Play/Pause */}
              <Button
                size="sm"
                variant="ghost"
                onClick={togglePlay}
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>

              {/* Volume */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={toggleMute}
                  className="text-white hover:bg-white/20"
                >
                  {isMuted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* Time Display */}
              <span className="text-white text-sm ml-2">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Fullscreen */}
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20"
            >
              <Maximize className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
