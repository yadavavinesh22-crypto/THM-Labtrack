-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "customLabName" TEXT,
ALTER COLUMN "assignmentId" DROP NOT NULL;
