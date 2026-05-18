/**
 * Video Progress Service
 * Handles all video progress tracking operations
 */

import { db } from "@/lib/db";
import { log } from "@/lib/logger";
import type { VideoProgress } from "@/generated/client";

export interface SaveVideoProgressInput {
  userId: string;
  moduleId: string;
  currentTime: number;
  duration: number;
  watchTime?: number;
}

export interface VideoAnalyticsFilters {
  courseId?: string;
  moduleId?: string;
  startDate?: Date;
  endDate?: Date;
  department?: string;
}

export class VideoProgressService {
  /**
   * Save or update video progress
   */
  static async saveProgress(data: SaveVideoProgressInput): Promise<VideoProgress> {
    const { userId, moduleId, currentTime, duration, watchTime = 0 } = data;

    try {
      // Calculate completion rate
      const completionRate = this.calculateCompletionRate(currentTime, duration);
      const completed = this.isCompleted(completionRate);

      // Check if progress exists
      const existing = await db.videoProgress.findUnique({
        where: {
          userId_moduleId: {
            userId,
            moduleId,
          },
        },
      });

      let progress: VideoProgress;

      if (existing) {
        // Update existing progress
        progress = await db.videoProgress.update({
          where: {
            userId_moduleId: {
              userId,
              moduleId,
            },
          },
          data: {
            currentTime,
            duration,
            completionRate,
            completed,
            totalWatchTime: existing.totalWatchTime + watchTime,
            lastWatched: new Date(),
          },
        });
      } else {
        // Create new progress
        progress = await db.videoProgress.create({
          data: {
            userId,
            moduleId,
            currentTime,
            duration,
            completionRate,
            completed,
            watchCount: 1,
            totalWatchTime: watchTime,
            lastWatched: new Date(),
          },
        });
      }

      // Update module completion status if video is completed
      if (completed && !existing?.completed) {
        await this.updateModuleCompletion(userId, moduleId);
      }

      log.info("Video progress saved", {
        context: "video-progress",
        userId,
        moduleId,
        completionRate,
        completed,
      });

      return progress;
    } catch (error) {
      log.error("Failed to save video progress", {
        context: "video-progress",
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
  ): Promise<VideoProgress | null> {
    try {
      const progress = await db.videoProgress.findUnique({
        where: {
          userId_moduleId: {
            userId,
            moduleId,
          },
        },
      });

      return progress;
    } catch (error) {
      log.error("Failed to get video progress", {
        context: "video-progress",
        error,
        userId,
        moduleId,
      });
      throw error;
    }
  }

  /**
   * Calculate completion rate
   */
  static calculateCompletionRate(currentTime: number, duration: number): number {
    if (duration <= 0) return 0;
    const rate = (currentTime / duration) * 100;
    return Math.min(Math.max(rate, 0), 100); // Clamp between 0-100
  }

  /**
   * Check if video is completed (>= 95%)
   */
  static isCompleted(completionRate: number): boolean {
    return completionRate >= 95;
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
        context: "video-progress",
        userId,
        moduleId,
      });
    } catch (error) {
      log.error("Failed to update module completion", {
        context: "video-progress",
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
      await db.videoProgress.delete({
        where: {
          userId_moduleId: {
            userId,
            moduleId,
          },
        },
      });

      log.info("Video progress reset", {
        context: "video-progress",
        userId,
        moduleId,
      });
    } catch (error) {
      log.error("Failed to reset video progress", {
        context: "video-progress",
        error,
        userId,
        moduleId,
      });
      throw error;
    }
  }

  /**
   * Get video analytics
   */
  static async getAnalytics(filters: VideoAnalyticsFilters) {
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
        where.lastWatched = {};
        if (startDate) where.lastWatched.gte = startDate;
        if (endDate) where.lastWatched.lte = endDate;
      }

      if (department) {
        where.user = {
          department,
        };
      }

      // Get all video progress records
      const progressRecords = await db.videoProgress.findMany({
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
      const totalVideos = new Set(progressRecords.map((p) => p.moduleId)).size;
      const totalWatchTime = progressRecords.reduce(
        (sum, p) => sum + p.totalWatchTime,
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
            totalViews: 0,
            totalWatchTime: 0,
            completionRates: [],
            usersCompleted: 0,
            usersInProgress: 0,
          });
        }

        const stats = moduleStats.get(moduleId);
        stats.totalViews += record.watchCount;
        stats.totalWatchTime += record.totalWatchTime;
        stats.completionRates.push(record.completionRate);

        if (record.completed) {
          stats.usersCompleted++;
        } else if (record.completionRate > 0) {
          stats.usersInProgress++;
        }
      }

      // Calculate averages and format output
      const videos = Array.from(moduleStats.values()).map((stats) => ({
        moduleId: stats.moduleId,
        moduleName: stats.moduleName,
        totalViews: stats.totalViews,
        averageWatchTime: stats.totalWatchTime / stats.totalViews || 0,
        completionRate:
          stats.completionRates.reduce((a: number, b: number) => a + b, 0) /
            stats.completionRates.length || 0,
        usersCompleted: stats.usersCompleted,
        usersInProgress: stats.usersInProgress,
        usersNotStarted: 0, // Would need enrollment data to calculate
      }));

      return {
        totalVideos,
        averageCompletionRate,
        totalWatchTime,
        videos,
      };
    } catch (error) {
      log.error("Failed to get video analytics", {
        context: "video-progress",
        error,
        filters,
      });
      throw error;
    }
  }

  /**
   * Increment watch count (called when video starts playing)
   */
  static async incrementWatchCount(
    userId: string,
    moduleId: string
  ): Promise<void> {
    try {
      // Use atomic increment to avoid race conditions
      await db.videoProgress.updateMany({
        where: { userId, moduleId },
        data: { watchCount: { increment: 1 } },
      });
    } catch (error) {
      log.error("Failed to increment watch count", {
        context: "video-progress",
        error,
        userId,
        moduleId,
      });
      // Don't throw - this is not critical
    }
  }
}
