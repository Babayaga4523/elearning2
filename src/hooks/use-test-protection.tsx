"use client";

import { useEffect, useCallback } from "react";

interface UseTestProtectionOptions {
  enabled?: boolean;
  allowPrint?: boolean;
}

/**
 * Hook untuk melindungi test dari aktivitas curang:
 * - Nonaktifkan klik kanan
 * - Nonaktifkan Ctrl+C, Ctrl+A, Ctrl+U, Ctrl+P, dll
 * - Nonaktifkan selection teks
 * - Nonaktifkan drag & drop
 * - Nonaktifkan paste
 */
export function useTestProtection(options: UseTestProtectionOptions = {}) {
  const { enabled = true, allowPrint = false } = options;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    // Block common copy/paste/print shortcuts
    const blocked = [
      'c', 'a', 'x', 'p', 's', 'u', // Ctrl+key
    ];

    if (e.ctrlKey || e.metaKey) {
      if (blocked.includes(e.key.toLowerCase())) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }

    // Block F12 (DevTools)
    if (e.key === 'F12') {
      e.preventDefault();
      return false;
    }

    // Block Ctrl+Shift+I (DevTools)
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      return false;
    }

    // Block Ctrl+Shift+J (DevTools)
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'j') {
      e.preventDefault();
      return false;
    }

    // Block PrintScreen
    if (e.key === 'PrintScreen') {
      e.preventDefault();
      return false;
    }
  }, [enabled]);

  const handleContextMenu = useCallback((e: MouseEvent) => {
    if (!enabled) return;
    e.preventDefault();
    e.stopPropagation();
    return false;
  }, [enabled]);

  const handleCopy = useCallback((e: ClipboardEvent) => {
    if (!enabled) return;
    e.preventDefault();
    e.stopPropagation();
    return false;
  }, [enabled]);

  const handlePaste = useCallback((e: ClipboardEvent) => {
    if (!enabled) return;
    e.preventDefault();
    e.stopPropagation();
    return false;
  }, [enabled]);

  const handleSelectStart = useCallback((e: Event) => {
    if (!enabled) return;
    // Allow print dialog
    if (allowPrint && (e as any).type === 'beforeprint') return;
    e.preventDefault();
    return false;
  }, [enabled, allowPrint]);

  const handleDragStart = useCallback((e: DragEvent) => {
    if (!enabled) return;
    e.preventDefault();
    return false;
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('copy', handleCopy, true);
    document.addEventListener('paste', handlePaste, true);
    document.addEventListener('selectstart', handleSelectStart, true);
    document.addEventListener('dragstart', handleDragStart, true);

    // Disable selection CSS
    document.body.style.userSelect = 'none';
    (document.body.style as any).webkitUserSelect = 'none';
    (document.body.style as any).mozUserSelect = 'none';
    (document.body.style as any).msUserSelect = 'none';

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('copy', handleCopy, true);
      document.removeEventListener('paste', handlePaste, true);
      document.removeEventListener('selectstart', handleSelectStart, true);
      document.removeEventListener('dragstart', handleDragStart, true);

      // Re-enable selection CSS
      document.body.style.userSelect = '';
      (document.body.style as any).webkitUserSelect = '';
      (document.body.style as any).mozUserSelect = '';
      (document.body.style as any).msUserSelect = '';
    };
  }, [enabled, handleKeyDown, handleContextMenu, handleCopy, handlePaste, handleSelectStart, handleDragStart, allowPrint]);
}

/**
 * Component wrapper untuk proteksi test
 */
export function TestProtectionProvider({
  children,
  enabled = true,
  allowPrint = false
}: {
  children: React.ReactNode;
  enabled?: boolean;
  allowPrint?: boolean;
}) {
  useTestProtection({ enabled, allowPrint });
  return <>{children}</>;
}
