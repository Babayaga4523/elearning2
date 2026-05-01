/**
 * Custom Hook: usePDFProgress
 * Manages PDF reading progress tracking with debouncing, retry logic, and offline support
 */

import { useState, useEffect, useCallback, useRef } from "react";

interface PDFProgress {
  currentPage: number;
  totalPages: number;
  pagesViewed: number[];
  scrollPosition: Record<number, number>;
  completionRate: number;
  completed: boolean;
  lastRead: string;
  readCount: number;
  totalReadTime: number;
}

interface SaveProgressData {
  currentPage: number;
  totalPages: number;
  scrollPosition?: number;
  readTime?: number;
}

interface UsePDFProgressReturn {
  progress: PDFProgress | null;
  isLoading: boolean;
  isSaving: boolean;
  error: Error | null;
  saveProgress: (data: SaveProgressData) => Promise<void>;
  resetProgress: () => Promise<void>;
  shouldResume: boolean;
  dismissResume: () => void;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export function usePDFProgress(moduleId: string): UsePDFProgressReturn {
  const [progress, setProgress] = useState<PDFProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [shouldResume, setShouldResume] = useState(false);
  
  const saveQueueRef = useRef<SaveProgressData | null>(null);
  const retryCountRef = useRef(0);
  const sessionStartTimeRef = useRef<number>(Date.now());

  // Load progress on mount
  useEffect(() => {
    loadProgress();
  }, [moduleId]);

  // Check if should show resume notification
  useEffect(() => {
    if (progress && progress.currentPage > 1 && progress.completionRate < 90) {
      setShouldResume(true);
    }
  }, [progress]);

  /**
   * Load progress from API
   */
  const loadProgress = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/progress/pdf/${moduleId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load progress");
      }

      setProgress(data.data);
    } catch (err) {
      setError(err as Error);
      console.error("Failed to load PDF progress:", err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Save progress to API with retry logic
   */
  const saveProgressToAPI = async (
    data: SaveProgressData,
    retryCount = 0
  ): Promise<void> => {
    try {
      setIsSaving(true);
      setError(null);

      const response = await fetch("/api/progress/pdf/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          moduleId,
          ...data,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save progress");
      }

      // Update local state
      setProgress((prev) => {
        const pagesViewed = prev?.pagesViewed || [];
        if (!pagesViewed.includes(data.currentPage)) {
          pagesViewed.push(data.currentPage);
        }

        const scrollPosition = prev?.scrollPosition || {};
        if (data.scrollPosition !== undefined) {
          scrollPosition[data.currentPage] = data.scrollPosition;
        }

        return {
          ...prev!,
          currentPage: data.currentPage,
          totalPages: data.totalPages,
          pagesViewed,
          scrollPosition,
          completionRate: result.data.completionRate,
          completed: result.data.completed,
          lastRead: new Date().toISOString(),
          readCount: prev?.readCount || 1,
          totalReadTime: (prev?.totalReadTime || 0) + (data.readTime || 0),
        };
      });

      // Clear retry count on success
      retryCountRef.current = 0;
      saveQueueRef.current = null;
    } catch (err) {
      console.error("Failed to save PDF progress:", err);

      // Retry logic
      if (retryCount < MAX_RETRIES) {
        const delay = RETRY_DELAY * Math.pow(2, retryCount); // Exponential backoff
        console.log(`Retrying in ${delay}ms... (attempt ${retryCount + 1}/${MAX_RETRIES})`);

        await new Promise((resolve) => setTimeout(resolve, delay));
        return saveProgressToAPI(data, retryCount + 1);
      } else {
        // Max retries reached, queue for later
        saveQueueRef.current = data;
        setError(err as Error);
        console.error("Max retries reached. Progress queued for later sync.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Save progress (debounced)
   */
  const saveProgress = useCallback(
    async (data: SaveProgressData) => {
      // Calculate read time since session start
      const now = Date.now();
      const readTime = (now - sessionStartTimeRef.current) / 1000;
      sessionStartTimeRef.current = now;

      await saveProgressToAPI({
        ...data,
        readTime: data.readTime || readTime,
      });
    },
    [moduleId]
  );

  /**
   * Reset progress
   */
  const resetProgress = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/progress/pdf/${moduleId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset progress");
      }

      setProgress(null);
      setShouldResume(false);
    } catch (err) {
      setError(err as Error);
      console.error("Failed to reset PDF progress:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Dismiss resume notification
   */
  const dismissResume = () => {
    setShouldResume(false);
  };

  /**
   * Sync queued progress on reconnect
   */
  useEffect(() => {
    const handleOnline = async () => {
      if (saveQueueRef.current) {
        console.log("Connection restored. Syncing queued progress...");
        await saveProgressToAPI(saveQueueRef.current);
      }
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  return {
    progress,
    isLoading,
    isSaving,
    error,
    saveProgress,
    resetProgress,
    shouldResume,
    dismissResume,
  };
}
