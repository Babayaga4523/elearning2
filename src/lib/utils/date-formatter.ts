import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

/**
 * Centralized date formatting utility for consistent date display across the app
 */

export type DateFormatType = 'short' | 'long' | 'full' | 'time' | 'datetime';

/**
 * Format a date with consistent styling
 * @param date - Date to format
 * @param formatType - Type of format to use
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string | null | undefined, formatType: DateFormatType = 'short'): string => {
  if (!date) return '-';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Validate date
  if (isNaN(dateObj.getTime())) return '-';
  
  switch (formatType) {
    case 'short':
      // Format: 25 Apr
      return format(dateObj, "dd MMM", { locale: localeId });
    
    case 'long':
      // Format: 25 April 2026
      return format(dateObj, "dd MMMM yyyy", { locale: localeId });
    
    case 'full':
      // Format: Sabtu, 25 April 2026
      return format(dateObj, "EEEE, dd MMMM yyyy", { locale: localeId });
    
    case 'time':
      // Format: 14:30
      return format(dateObj, "HH:mm", { locale: localeId });
    
    case 'datetime':
      // Format: 25 Apr 2026, 14:30
      return format(dateObj, "dd MMM yyyy, HH:mm", { locale: localeId });
    
    default:
      return format(dateObj, "dd MMM", { locale: localeId });
  }
};

/**
 * Format a date relative to now (e.g., "2 hari lalu", "dalam 3 hari")
 * @param date - Date to format
 * @returns Relative date string
 */
export const formatRelativeDate = (date: Date | string | null | undefined): string => {
  if (!date) return '-';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '-';
  
  const now = new Date();
  const diffMs = dateObj.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  // Future dates
  if (diffDays > 0) {
    if (diffDays === 1) return 'Besok';
    if (diffDays < 7) return `Dalam ${diffDays} hari`;
    if (diffDays < 30) return `Dalam ${Math.floor(diffDays / 7)} minggu`;
    return formatDate(dateObj, 'short');
  }
  
  // Past dates
  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    if (absDays === 0) {
      if (diffHours === 0) {
        if (diffMinutes === 0) return 'Baru saja';
        return `${Math.abs(diffMinutes)} menit lalu`;
      }
      return `${Math.abs(diffHours)} jam lalu`;
    }
    if (absDays === 1) return 'Kemarin';
    if (absDays < 7) return `${absDays} hari lalu`;
    if (absDays < 30) return `${Math.floor(absDays / 7)} minggu lalu`;
    return formatDate(dateObj, 'short');
  }
  
  return 'Hari ini';
};

/**
 * Check if a date is in the past
 * @param date - Date to check
 * @returns True if date is in the past
 */
export const isPastDate = (date: Date | string | null | undefined): boolean => {
  if (!date) return false;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return false;
  
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  dateObj.setHours(0, 0, 0, 0);
  
  return dateObj < now;
};

/**
 * Check if a date is today
 * @param date - Date to check
 * @returns True if date is today
 */
export const isToday = (date: Date | string | null | undefined): boolean => {
  if (!date) return false;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return false;
  
  const now = new Date();
  
  return (
    dateObj.getDate() === now.getDate() &&
    dateObj.getMonth() === now.getMonth() &&
    dateObj.getFullYear() === now.getFullYear()
  );
};
