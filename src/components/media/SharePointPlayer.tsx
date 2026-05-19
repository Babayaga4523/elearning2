"use client";

/**
 * SharePointPlayer Component
 *
 * Simple SharePoint video player that converts stream.aspx to embed.aspx
 * and removes referrer parameters for better embedding.
 */

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ExternalLink, RefreshCw, Video } from "lucide-react";

interface SharePointPlayerProps {
  moduleId: string;
  videoUrl: string;
  onComplete?: () => void;
  className?: string;
}

export function SharePointPlayer({
  moduleId,
  videoUrl,
  onComplete,
  className,
}: SharePointPlayerProps) {
  const [embedUrl, setEmbedUrl] = useState<string>("");
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Convert SharePoint URL to embeddable format
  useEffect(() => {
    if (!videoUrl) {
      setEmbedUrl("");
      return;
    }

    // Clean URL: convert stream.aspx → embed.aspx, remove referrer params
    let converted = videoUrl
      .replace(/stream\.aspx/gi, "embed.aspx") // stream.aspx → embed.aspx
      .split("&referrer")[0] // Remove referrer parameters
      .split("?referrer")[0]; // Also handle ?referrer

    // Ensure it has embed action
    if (!converted.includes("action=") && !converted.includes("embed")) {
      const url = new URL(videoUrl);
      url.searchParams.set("action", "embedview");
      converted = url.toString().replace(/stream\.aspx/gi, "embed.aspx");
    }

    setEmbedUrl(converted);
    setHasError(false);
    setIsLoading(true);

    console.log("[SharePointPlayer] Original:", videoUrl);
    console.log("[SharePointPlayer] Embed:", converted);
  }, [videoUrl]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    console.error("[SharePointPlayer] Load error for:", embedUrl);
  };

  const handleOpenExternal = () => {
    window.open(videoUrl, "_blank", "noopener,noreferrer");
  };

  const handleRetry = () => {
    setIsLoading(true);
    setHasError(false);
    // Force reload by adding timestamp
    const reloadUrl = embedUrl.includes("?")
      ? `${embedUrl}&t=${Date.now()}`
      : `${embedUrl}?t=${Date.now()}`;
    setEmbedUrl(reloadUrl);
  };

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative w-full aspect-video bg-slate-900 rounded-lg overflow-hidden">
        {/* Loading State */}
        {isLoading && !hasError && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900">
            <div className="text-center text-white p-6">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto mb-3" />
              <p className="text-sm font-medium">Memuat video SharePoint...</p>
            </div>
          </div>
        )}

        {/* Error State - Video cannot be embedded */}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <div className="text-center text-white p-6 max-w-sm">
              <div className="h-14 w-14 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-3">
                <Video className="h-7 w-7 text-amber-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Video Tidak Bisa Di-Embed</h3>
              <p className="text-xs text-slate-400 mb-4">
                Buka video langsung di SharePoint untuk menonton.
              </p>

              <div className="flex flex-col gap-2">
                <Button
                  asChild
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 gap-2"
                >
                  <a href={videoUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Buka di SharePoint
                  </a>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  className="border-white/20 text-white hover:bg-white/10 gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Coba Lagi
                </Button>

                {onComplete && (
                  <button
                    onClick={onComplete}
                    className="mt-3 text-xs text-slate-400 hover:text-white underline"
                  >
                    Tandai sudah menonton
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Video Player - iframe */}
        {embedUrl && !hasError && (
          <iframe
            src={embedUrl}
            className="absolute inset-0 w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            onLoad={handleLoad}
            onError={handleError}
            title="SharePoint Video Player"
          />
        )}
      </div>

      {/* Footer */}
      {videoUrl && (
        <div className="mt-2 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-xs text-slate-500 hover:text-slate-700 gap-1"
          >
            <a href={videoUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3" />
              Buka di SharePoint
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}