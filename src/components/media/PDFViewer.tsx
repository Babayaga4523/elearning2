"use client";

/**
 * PDFViewer Component
 * PDF viewer with progress tracking, auto-save, and resume functionality
 * Uses browser's native PDF viewer with progress tracking overlay
 */

import React, { useRef, useEffect, useState } from "react";
import { usePDFProgress } from "@/hooks/usePDFProgress";
import { ChevronLeft, ChevronRight, RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PDFViewerProps {
  moduleId: string;
  pdfUrl: string;
  onComplete?: () => void;
  className?: string;
}

export function PDFViewer({
  moduleId,
  pdfUrl,
  onComplete,
  className,
}: PDFViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    progress,
    isLoading,
    isSaving,
    saveProgress,
    resetProgress,
    shouldResume,
    dismissResume,
  } = usePDFProgress(moduleId);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [hasResumed, setHasResumed] = useState(false);
  const [pagesViewed, setPagesViewed] = useState<Set<number>>(new Set([1]));

  // Estimate total pages (this is a simplified approach)
  // In a real implementation, you'd use PDF.js to get actual page count
  useEffect(() => {
    // For now, we'll estimate based on progress data
    if (progress && progress.totalPages > 0) {
      setTotalPages(progress.totalPages);
    } else {
      // Default estimate - will be updated when user navigates
      setTotalPages(10);
    }
  }, [progress]);

  // Resume from last position
  useEffect(() => {
    if (!progress || hasResumed || isLoading) return;

    if (progress.currentPage > 1 && progress.completionRate < 90) {
      setCurrentPage(progress.currentPage);
      setPagesViewed(new Set(progress.pagesViewed as number[]));
      setHasResumed(true);

      // Scroll to saved position if available
      if (progress.scrollPosition && typeof progress.scrollPosition === 'object') {
        const savedScroll = (progress.scrollPosition as Record<number, number>)[progress.currentPage];
        if (savedScroll !== undefined) {
          setScrollPosition(savedScroll);
        }
      }
    }
  }, [progress, isLoading, hasResumed]);

  // Auto-save progress every 3 seconds when page or scroll changes
  useEffect(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      if (currentPage > 0 && totalPages > 0) {
        saveProgress({
          currentPage,
          totalPages,
          scrollPosition,
        });
      }
    }, 3000);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [currentPage, scrollPosition, totalPages, saveProgress]);

  // Track page views
  useEffect(() => {
    if (currentPage > 0) {
      setPagesViewed((prev) => new Set([...prev, currentPage]));
    }
  }, [currentPage]);

  // Check for completion
  useEffect(() => {
    if (totalPages > 0 && pagesViewed.size > 0) {
      const completionRate = (pagesViewed.size / totalPages) * 100;
      if (completionRate >= 90 && onComplete) {
        onComplete();
      }
    }
  }, [pagesViewed, totalPages, onComplete]);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (currentPage > 0 && totalPages > 0) {
        saveProgress({
          currentPage,
          totalPages,
          scrollPosition,
        });
      }
    };
  }, [currentPage, totalPages, scrollPosition, saveProgress]);

  // Handle scroll (debounced)
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const newScrollPosition = target.scrollTop;
    setScrollPosition(newScrollPosition);

    // Debounce scroll save
    if (scrollTimerRef.current) {
      clearTimeout(scrollTimerRef.current);
    }

    scrollTimerRef.current = setTimeout(() => {
      saveProgress({
        currentPage,
        totalPages,
        scrollPosition: newScrollPosition,
      });
    }, 1000);
  };

  // Navigation
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);

  // Resume from saved position
  const handleResume = () => {
    dismissResume();
  };

  // Start from beginning
  const handleStartFromBeginning = async () => {
    await resetProgress();
    setCurrentPage(1);
    setScrollPosition(0);
    setPagesViewed(new Set([1]));
    dismissResume();
  };

  // Update total pages (manual input)
  const handleTotalPagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pages = parseInt(e.target.value);
    if (pages > 0) {
      setTotalPages(pages);
    }
  };

  // Calculate completion percentage
  const completionPercentage =
    totalPages > 0 ? (pagesViewed.size / totalPages) * 100 : 0;

  return (
    <div className={cn("relative w-full", className)}>
      {/* Resume Notification */}
      {shouldResume && !hasResumed && progress && (
        <Alert className="mb-4">
          <AlertDescription className="flex items-center justify-between">
            <span>
              Melanjutkan dari halaman {progress.currentPage} ({Math.round(progress.completionRate)}% selesai)
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

      {/* PDF Controls */}
      <div className="bg-gray-100 border border-gray-300 rounded-t-lg p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Page Navigation */}
          <Button
            size="sm"
            variant="outline"
            onClick={prevPage}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2 text-sm">
            <span>Halaman</span>
            <input
              type="number"
              min="1"
              max={totalPages}
              value={currentPage}
              onChange={(e) => goToPage(parseInt(e.target.value))}
              className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
            />
            <span>dari</span>
            <input
              type="number"
              min="1"
              value={totalPages}
              onChange={handleTotalPagesChange}
              className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
              placeholder="Total"
            />
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={nextPage}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center gap-3">
          {isSaving && (
            <span className="text-sm text-gray-600">Menyimpan progress...</span>
          )}
          <div className="text-sm font-medium text-gray-700">
            {Math.round(completionPercentage)}% selesai
          </div>
          <div className="w-32 h-2 bg-gray-300 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* PDF Viewer */}
      <div
        className="relative bg-gray-200 border border-gray-300 rounded-b-lg overflow-auto"
        style={{ height: "calc(100vh - 300px)", minHeight: "600px" }}
        onScroll={handleScroll}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-600">Memuat PDF...</div>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={`${pdfUrl}#page=${currentPage}`}
            className="w-full h-full border-0"
            title="PDF Viewer"
          />
        )}
      </div>

      {/* Pages Viewed Info */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-sm text-blue-700">
          <strong>Halaman yang sudah dibaca:</strong> {pagesViewed.size} dari {totalPages} halaman
        </div>
        <div className="mt-1 text-xs text-blue-600">
          {Array.from(pagesViewed)
            .sort((a, b) => a - b)
            .join(", ")}
        </div>
      </div>

      {/* Completion Badge */}
      {progress && progress.completed && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-700">
            <svg
              className="h-5 w-5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M5 13l4 4L19 7"></path>
            </svg>
            <span className="font-medium">PDF selesai dibaca!</span>
          </div>
        </div>
      )}
    </div>
  );
}
