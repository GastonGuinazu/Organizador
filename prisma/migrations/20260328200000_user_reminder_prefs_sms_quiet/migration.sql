-- AlterTable
ALTER TABLE "User" ADD COLUMN "reminderSmsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "quietHoursStart" TEXT,
ADD COLUMN "quietHoursEnd" TEXT;
