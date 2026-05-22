/**
 * PDF Progress Service
 * Handles all PDF reading progress tracking operations
 */

import { db } from "@/lib/db";
import { log } from "@/lib/logger";
import type { PDFProgress } from "@/generated/client";

export interface SavePDFProgressInput {
  userId: string;
  moduleId: string;
  currentPage: number;
  totalPages: number;
  scrollPosition?: number;
  readTime?: number;
}

export interface PDFAnalyticsFilters {
  courseId?: string;
  moduleId?: string;
  startDate?: Date;
  endDate?: Date;
  department?: string;
}

export class PDFProgressService {
  /**
   * Save or update PDF progress
   */
  static async saveProgress(data: SavePDFProgressInput): Promise<PDFProgress> {
    const { userId, moduleId, currentPage, totalPages, scrollPosition, readTime = 0 } = data;

    try {
      // Check if progress exists
      const existing = await db.pDFProgress.findUnique({
        where: {
          userId_moduleId: {
            userId,
            moduleId,
          },
        },
      });

      let pagesViewed: number[] = [];
      let scrollPositions: Record<number, number> = {};

      if (existing) {
        // Parse existing data
        pagesViewed = Array.isArray(existing.pagesViewed)
          ? (existing.pagesViewed as number[])
          : [];
        scrollPositions =
          typeof existing.scrollPosition === "object" && existing.scrollPosition !== null
            ? (existing.scrollPosition as Record<number, number>)
            : {};
      }

      // Add current page to viewed pages if not already there
      if (!pagesViewed.includes(currentPage)) {
        pagesViewed.push(currentPage);
      }

      // Update scroll position for current page
      if (scrollPosition !== undefined) {
        scrollPositions[currentPage] = scrollPosition;
      }

      // Calculate completion rate
      const completionRate = this.calculateCompletionRate(pagesViewed, totalPages);
      const completed = this.isCompleted(completionRate);

      let progress: PDFProgress;

      if (existing) {
        // Update existing progress
        progress = await db.pDFProgress.update({
          where: {
            userId_moduleId: {
              userId,
              moduleId,
            },
          },
          data: {
            currentPage,
            totalPages,
            pagesViewed,
            scrollPosition: scrollPositions,
            completionRate,
            completed,
            totalReadTime: existing.totalReadTime + readTime,
            lastRead: new Date(),
          },
        });
      } else {
        // Create new progress
        progress = await db.pDFProgress.create({
          data: {
            userId,
            moduleId,
            currentPage,
            totalPages,
            pagesViewed,
            scrollPosition: scrollPositions,
            completionRate,
            completed,
            readCount: 1,
            totalReadTime: readTime,
            lastRead: new Date(),
          },
        });
      }

      // Update module completion status if PDF is completed
      if (completed && !existing?.completed) {
        await this.updateModuleCompletion(userId, moduleId);
      }

      log.info("PDF progress saved", {
        context: "pdf-progress",
        userId,
        moduleId,
        currentPage,
        completionRate,
        completed,
      });

      return progress;
    } catch (error) {
      log.error("Failed to save PDF progress", {
        context: "pdf-progress",
        error,
        userId,
        moduleId,
      });
      throw error;
    }
  }

  /**
   * Get progress for user and module
   */
  static async getProgress(
    userId: string,
    moduleId: string
  ): Promise<PDFProgress | null> {
    try {
      const progress = await db.pDFProgress.findUnique({
        where: {
          userId_moduleId: {
            userId,
            moduleId,
          },
        },
      });

      return progress;
    } catch (error) {
      log.error("Failed to get PDF progress", {
        context: "pdf-progress",
        error,
        userId,
        moduleId,
      });
      throw error;
    }
  }

  /**
   * Calculate completion rate based on pages viewed
   */
  static calculateCompletionRate(pagesViewed: number[], totalPages: number): number {
    if (totalPages <= 0) return 0;
    const rate = (pagesViewed.length / totalPages) * 100;
    return Math.min(Math.max(rate, 0), 100); // Clamp between 0-100
  }

  /**
   * Check if PDF is completed (>= 90%)
   */
  static isCompleted(completionRate: number): boolean {
    return completionRate >= 90;
  }

  /**
   * Update module completion status
   */
  static async updateModuleCompletion(
    userId: string,
    moduleId: string
  ): Promise<void> {
    try {
      // Use upsert for atomic find-or-create + update
      await db.userProgress.upsert({
        where: { userId_moduleId: { userId, moduleId } },
        update: { isCompleted: true },
        create: { userId, moduleId, isCompleted: true },
      });

      log.info("Module completion updated", {
        context: "pdf-progress",
        userId,
        moduleId,
      });
    } catch (error) {
      log.error("Failed to update module completion", {
        context: "pdf-progress",
        error,
        userId,
        moduleId,
      });
      // Don't throw - this is not critical
    }
  }

  /**
   * Reset progress (start from beginning)
   */
  static async resetProgress(userId: string, moduleId: string): Promise<void> {
    try {
      await db.pDFProgress.delete({
        where: {
          userId_moduleId: {
            userId,
            moduleId,
          },
        },
      });

      log.info("PDF progress reset", {
        context: "pdf-progress",
        userId,
        moduleId,
      });
    } catch (error) {
      log.error("Failed to reset PDF progress", {
        context: "pdf-progress",
        error,
        userId,
        moduleId,
      });
      throw error;
    }
  }

  /**
   * Get PDF analytics
   */
  static async getAnalytics(filters: PDFAnalyticsFilters) {
    try {
      const { courseId, moduleId, startDate, endDate, department } = filters;

      // Build where clause for PDF progress
      const where: any = {};

      if (moduleId) {
        where.moduleId = moduleId;
      } else if (courseId) {
        where.module = {
          courseId,
        };
      }

      if (startDate || endDate) {
        where.lastRead = {};
        if (startDate) where.lastRead.gte = startDate;
        if (endDate) where.lastRead.lte = endDate;
      }

      if (department) {
        where.user = {
          department,
        };
      }

      // Get all PDF progress records
      const progressRecords = await db.pDFProgress.findMany({
        where,
        include: {
          module: {
            select: {
              id: true,
              title: true,
              courseId: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
            },
          },
        },
      });

      // Calculate aggregated statistics
      const totalPDFs = new Set(progressRecords.map((p) => p.moduleId)).size;
      const totalReadTime = progressRecords.reduce(
        (sum, p) => sum + p.totalReadTime,
        0
      );
      const averageCompletionRate =
        progressRecords.length > 0
          ? progressRecords.reduce((sum, p) => sum + p.completionRate, 0) /
            progressRecords.length
          : 0;

      // Group by module
      const moduleStats = new Map<string, any>();
      const uniqueUsers = new Set<string>();
      const usersWhoStarted = new Set<string>();

      for (const record of progressRecords) {
        const modId = record.moduleId;
        uniqueUsers.add(record.userId);
        if (record.completionRate > 0) {
          usersWhoStarted.add(record.userId);
        }

        if (!moduleStats.has(modId)) {
          moduleStats.set(modId, {
            moduleId: modId,
            moduleName: record.module.title,
            courseId: record.module.courseId,
            totalReads: 0,
            totalReadTime: 0,
            totalPagesRead: 0,
            completionRates: [],
            usersCompleted: 0,
            usersInProgress: 0,
            usersNotStarted: 0,
          });
        }

        const stats = moduleStats.get(modId);
        stats.totalReads += record.readCount;
        stats.totalReadTime += record.totalReadTime;

        const pagesViewed = Array.isArray(record.pagesViewed)
          ? (record.pagesViewed as number[])
          : [];
        stats.totalPagesRead += pagesViewed.length;
        stats.completionRates.push(record.completionRate);

        if (record.completed) {
          stats.usersCompleted++;
        } else if (record.completionRate > 0) {
          stats.usersInProgress++;
        }
      }

      // Calculate averages and format output
      const pdfs = Array.from(moduleStats.values()).map((stats) => {
        const totalUsers = stats.usersCompleted + stats.usersInProgress + stats.usersNotStarted;
        const averageCompletionRate = stats.completionRates.length > 0
          ? stats.completionRates.reduce((a: number, b: number) => a + b, 0) / stats.completionRates.length
          : 0;

        return {
          moduleId: stats.moduleId,
          moduleName: stats.moduleName,
          courseId: stats.courseId,
          totalReads: stats.totalReads,
          averagePagesRead: stats.totalReads > 0 ? Math.round(stats.totalPagesRead / stats.totalReads) : 0,
          completionRate: Math.round(averageCompletionRate * 10) / 10,
          usersCompleted: stats.usersCompleted,
          usersInProgress: stats.usersInProgress,
          usersNotStarted: totalUsers > 0 ? Math.max(0, totalUsers - stats.usersCompleted - stats.usersInProgress) : 0,
        };
      });

      return {
        totalPDFs,
        averageCompletionRate: Math.round(averageCompletionRate * 10) / 10,
        totalReadTime,
        totalUsers: uniqueUsers.size,
        usersWhoStarted: usersWhoStarted.size,
        pdfs,
      };
    } catch (error) {
      log.error("Failed to get PDF analytics", {
        context: "pdf-progress",
        error,
        filters,
      });
      throw error;
    }
  }

  /**
   * Increment read count (called when PDF is opened)
   */
  static async incrementReadCount(
    userId: string,
    moduleId: string
  ): Promise<void> {
    try {
      // Use atomic increment to avoid race conditions
      await db.pDFProgress.updateMany({
        where: { userId, moduleId },
        data: { readCount: { increment: 1 } },
      });
    } catch (error) {
      log.error("Failed to increment read count", {
        context: "pdf-progress",
        error,
        userId,
        moduleId,
      });
      // Don't throw - this is not critical
    }
  }
}
