/*
  Warnings:

  - A unique constraint covering the columns `[publicId]` on the table `Media` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "altText" TEXT,
ADD COLUMN     "bytes" INTEGER,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "focalPoint" JSONB,
ADD COLUMN     "folder" TEXT,
ADD COLUMN     "height" INTEGER,
ADD COLUMN     "publicId" TEXT,
ADD COLUMN     "resourceType" TEXT NOT NULL DEFAULT 'image',
ADD COLUMN     "width" INTEGER;

-- AlterTable
ALTER TABLE "NewsletterSubscriber" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "source" TEXT;

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "contentFormat" TEXT NOT NULL DEFAULT 'html',
ADD COLUMN     "featuredImageAlt" TEXT,
ADD COLUMN     "featuredImageCrop" JSONB,
ADD COLUMN     "seoChecks" JSONB,
ADD COLUMN     "seoFocusKeyword" TEXT,
ADD COLUMN     "seoScore" INTEGER;

-- AlterTable
ALTER TABLE "SiteSetting" ADD COLUMN     "allowComments" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "brandColor" TEXT NOT NULL DEFAULT '#17344e',
ADD COLUMN     "customCss" TEXT,
ADD COLUMN     "customHead" TEXT,
ADD COLUMN     "defaultSeoDescription" TEXT,
ADD COLUMN     "defaultSeoTitle" TEXT,
ADD COLUMN     "googleAnalyticsId" TEXT,
ADD COLUMN     "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "socialLinks" JSONB;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarMediaId" TEXT;

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Media_publicId_key" ON "Media"("publicId");
