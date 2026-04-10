-- CreateEnum
CREATE TYPE "ModuleType" AS ENUM ('VIDEO', 'PDF');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN     "deadline" TIMESTAMP(3),
ADD COLUMN     "status" "EnrollmentStatus" NOT NULL DEFAULT 'IN_PROGRESS';

-- AlterTable
ALTER TABLE "Module" ADD COLUMN     "duration" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "fileSize" BIGINT,
ADD COLUMN     "originalFilename" TEXT,
ADD COLUMN     "type" "ModuleType" NOT NULL DEFAULT 'VIDEO',
ADD COLUMN     "url" TEXT,
ALTER COLUMN "position" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Option" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Test" ADD COLUMN     "duration" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "maxAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "passingScore" INTEGER NOT NULL DEFAULT 70,
ADD COLUMN     "randomizeOptions" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "randomizeQuestions" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "TestAttempt" ADD COLUMN     "completedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "startedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "department" TEXT,
ADD COLUMN     "lokasi" TEXT,
ADD COLUMN     "nip" TEXT;

-- CreateTable
CREATE TABLE "TestAnswer" (
    "id" TEXT NOT NULL,
    "testAttemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedOptionId" TEXT,
    "isCorrect" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TestAnswer_testAttemptId_idx" ON "TestAnswer"("testAttemptId");

-- CreateIndex
CREATE UNIQUE INDEX "TestAnswer_testAttemptId_questionId_key" ON "TestAnswer"("testAttemptId", "questionId");

-- AddForeignKey
ALTER TABLE "TestAnswer" ADD CONSTRAINT "TestAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestAnswer" ADD CONSTRAINT "TestAnswer_selectedOptionId_fkey" FOREIGN KEY ("selectedOptionId") REFERENCES "Option"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestAnswer" ADD CONSTRAINT "TestAnswer_testAttemptId_fkey" FOREIGN KEY ("testAttemptId") REFERENCES "TestAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
