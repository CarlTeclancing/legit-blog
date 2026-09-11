ALTER TABLE "SiteSetting" ADD COLUMN "logoUrl" TEXT;
ALTER TABLE "AuthorRequest" ADD COLUMN "response" TEXT NOT NULL DEFAULT '', ADD COLUMN "reviewedById" TEXT, ADD COLUMN "accountId" TEXT;
CREATE UNIQUE INDEX "AuthorRequest_accountId_key" ON "AuthorRequest"("accountId");
CREATE TABLE "AuthorReply" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "requestId" TEXT NOT NULL REFERENCES "AuthorRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "body" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'SENDING',
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
