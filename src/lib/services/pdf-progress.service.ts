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
      // Check if UserProgress exists
      const userProgress = await db.userProgress.findUnique({
        where: {
          userId_moduleId: {
            userId,
            moduleId,
          },
        },
      });

      if (userProgress) {
        // Update existing
        await db.userProgress.update({
          where: {
            userId_moduleId: {
              userId,
              moduleId,
            },
          },
          data: {
            isCompleted: true,
          },
        });
      } else {
        // Create new
        await db.userProgress.create({
          data: {
            userId,
            moduleId,
            isCompleted: true,
          },
        });
      }

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

      // Build where clause
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

      for (const record of progressRecords) {
        const moduleId = record.moduleId;

        if (!moduleStats.has(moduleId)) {
          moduleStats.set(moduleId, {
            moduleId,
            moduleName: record.module.title,
            totalReads: 0,
            totalReadTime: 0,
            totalPagesRead: 0,
            completionRates: [],
            usersCompleted: 0,
            usersInProgress: 0,
          });
        }

        const stats = moduleStats.get(moduleId);
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
      const pdfs = Array.from(moduleStats.values()).map((stats) => ({
        moduleId: stats.moduleId,
        moduleName: stats.moduleName,
        totalReads: stats.totalReads,
        averagePagesRead: stats.totalPagesRead / stats.totalReads || 0,
        completionRate:
          stats.completionRates.reduce((a: number, b: number) => a + b, 0) /
            stats.completionRates.length || 0,
        usersCompleted: stats.usersCompleted,
        usersInProgress: stats.usersInProgress,
        usersNotStarted: 0, // Would need enrollment data to calculate
      }));

      return {
        totalPDFs,
        averageCompletionRate,
        totalReadTime,
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
      const existing = await db.pDFProgress.findUnique({
        where: {
          userId_moduleId: {
            userId,
            moduleId,
          },
        },
      });

      if (existing) {
        await db.pDFProgress.update({
          where: {
            userId_moduleId: {
              userId,
              moduleId,
            },
          },
          data: {
            readCount: existing.readCount + 1,
          },
        });
      }
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
