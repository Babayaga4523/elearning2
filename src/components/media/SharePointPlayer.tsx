"use client";

/**
 * SharePointPlayer Component
 * Renders SharePoint/OneDrive videos using iframe
 */

import React, { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AlertCircle, ExternalLink, Play } from "lucide-react";

interface SharePointPlayerProps {
  moduleId: string;
  videoUrl: string;
  onComplete?: () => void;
  className?: string;
}

/**
 * Convert SharePoint URL to embed URL
 */
function getSharePointEmbedUrl(url: string): string {
  // If already an embed URL, return as is
  if (url.includes("embed")) {
    return url;
  }

  // Try to convert sharing URL to embed URL
  try {
    const urlObj = new URL(url);
    
    // OneDrive/SharePoint embed pattern
    if (urlObj.hostname.includes("sharepoint.com") || urlObj.hostname.includes("1drv.ms")) {
      // Add embed parameter
      urlObj.searchParams.set("embed", "1");
      return urlObj.toString();
    }
  } catch (e) {
    console.error("Failed to parse SharePoint URL:", e);
  }

  // Return original URL if conversion fails
  return url;
}

export function SharePointPlayer({
  moduleId,
  videoUrl,
  onComplete,
  className,
}: SharePointPlayerProps) {
  const [hasStarted, setHasStarted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Get embed URL
  const embedUrl = getSharePointEmbedUrl(videoUrl);

  // Handle iframe load
  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  // Handle iframe error
  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
    console.error("Failed to load SharePoint video:", videoUrl);
  };

  // Track video start
  const handleVideoStart = () => {
    if (!hasStarted) {
      setHasStarted(true);
      console.log("SharePoint video started:", moduleId);
    }
  };

  return (
    <div className={cn("relative w-full", className)}>
      {/* SharePoint iframe */}
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
        {!hasError ? (
          <>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                <div className="text-center text-white">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                  <p className="text-sm">Memuat video SharePoint...</p>
                </div>
              </div>
            )}
            
            <iframe
              ref={iframeRef}
              src={embedUrl}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              title="SharePoint Video Player"
            />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <div className="text-center text-white p-6 max-w-md">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
              <p className="font-medium mb-2">Gagal Memuat Video SharePoint</p>
              <p className="text-sm text-slate-400 mb-4">
                Video mungkin memerlukan autentikasi atau tidak dapat diakses secara publik.
              </p>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 w-full"
                >
                  Refresh Halaman
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 w-full gap-2"
                >
                  <a href={videoUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Buka di SharePoint
                  </a>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Play overlay (shown before video starts) */}
        {!hasStarted && !hasError && !isLoading && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer transition-opacity hover:bg-black/40"
            onClick={handleVideoStart}
          >
            <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center shadow-2xl transform transition-transform hover:scale-110">
              <Play className="h-10 w-10 text-white ml-1" fill="white" />
            </div>
          </div>
        )}
      </div>

      {/* Info Alert */}
      {/* Manual completion button */}
      {/* External link */}
      <div className="mt-4 flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="gap-2 text-slate-600"
        >
          <a href={videoUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
            Buka di SharePoint
          </a>
        </Button>
      </div>
    </div>
  );
}
