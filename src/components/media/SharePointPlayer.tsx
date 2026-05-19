"use client";

/**
 * SharePointPlayer Component
 *
 * Renders SharePoint/OneDrive videos via embed.aspx iframe.
 *
 * CRITICAL: SharePoint stream.aspx has CSP frame-ancestors 'none' and
 * CANNOT be embedded. We always convert to embed.aspx before rendering.
 * If embedding still fails (org policy), we show a graceful fallback with
 * a direct link to watch in SharePoint.
 */

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AlertCircle, ExternalLink, Play, RefreshCw } from "lucide-react";
import { getEmbedUrl, isStreamAspxUrl } from "@/lib/sharepoint";

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
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Convert URL to embeddable format (stream.aspx → embed.aspx)
  const embedUrl = getEmbedUrl(videoUrl);
  const wasStreamAspx = isStreamAspxUrl(videoUrl);

  useEffect(() => {
    // Safety timeout: if iframe doesn't load within 15s, show fallback
    loadTimeoutRef.current = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        setHasError(true);
        console.warn("[SharePointPlayer] Load timeout for:", embedUrl);
      }
    }, 15000);

    return () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    };
  }, [embedUrl, isLoading]);

  const handleIframeLoad = () => {
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    setIsLoading(false);
    setHasError(false);

    // Trigger video started tracking
    if (!hasStarted) {
      setHasStarted(true);
      console.log("SharePoint video started:", moduleId);
    }
  };

  const handleIframeError = () => {
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    setIsLoading(false);
    setHasError(true);
    console.error("[SharePointPlayer] iframe error for:", embedUrl);
  };

  const handleRetry = () => {
    setIsLoading(true);
    setHasError(false);
    // Force iframe reload by briefly removing src
    if (iframeRef.current) {
      iframeRef.current.src = "";
      setTimeout(() => {
        if (iframeRef.current) iframeRef.current.src = embedUrl;
      }, 100);
    }
  };

  return (
    <div className={cn("relative w-full", className)}>
      {/* Warning badge jika URL asli adalah stream.aspx */}
      {wasStreamAspx && !hasError && (
        <div className="mb-2 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>
            Video di-embed dari SharePoint. Pastikan Anda sudah login ke akun Microsoft organisasi.
          </span>
        </div>
      )}

      <div className="relative w-full aspect-video bg-slate-900 rounded-lg overflow-hidden">
        {/* Loading spinner */}
        {isLoading && !hasError && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
              <p className="text-sm font-medium">Memuat video SharePoint...</p>
              <p className="text-xs text-slate-400 mt-1">Pastikan Anda terhubung ke jaringan kantor</p>
            </div>
          </div>
        )}

        {/* Error / Fallback state */}
        {hasError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <div className="text-center text-white p-6 max-w-md">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-amber-400" />
              <p className="font-semibold text-lg mb-2">Video Tidak Dapat Ditampilkan</p>
              <p className="text-sm text-slate-300 mb-6">
                Browser Anda mungkin memblokir cookie pihak ketiga (SharePoint), atau memerlukan login ulang.
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  variant="default"
                  size="sm"
                  asChild
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2 w-full"
                >
                  <a href={videoUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Tonton Langsung di SharePoint
                  </a>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 gap-2 w-full"
                >
                  <RefreshCw className="h-4 w-4" />
                  Muat Ulang Iframe
                </Button>
              </div>
              {/* Mark complete manually */}
              {onComplete && (
                <button
                  onClick={onComplete}
                  className="mt-4 text-xs text-slate-400 underline hover:text-white transition-colors"
                >
                  Saya sudah menonton video ini, tandai selesai
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Embed iframe — always uses embed.aspx, never stream.aspx */}
            <iframe
              ref={iframeRef}
              src={embedUrl}
              className="absolute inset-0 w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              title="SharePoint Video Player"
              // Dihapus: attribute sandbox karena sering memblokir SSO (Single Sign-On) Microsoft
            />
          </>
        )}
      </div>

      {/* External link selalu tersedia sebagai fallback */}
      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Video tersimpan di SharePoint BNI Multifinance
        </p>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="gap-1.5 text-xs text-slate-500 hover:text-slate-800"
        >
          <a href={videoUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3.5 w-3.5" />
            Buka di SharePoint
          </a>
        </Button>
      </div>
    </div>
  );
}
