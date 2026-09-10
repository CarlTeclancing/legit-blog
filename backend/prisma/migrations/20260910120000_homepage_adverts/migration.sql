CREATE TABLE "Advert" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "eyebrow" TEXT NOT NULL DEFAULT '',
  "description" TEXT NOT NULL DEFAULT '',
  "image" TEXT NOT NULL,
  "imageAlt" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "href" TEXT NOT NULL,
  "color" TEXT NOT NULL DEFAULT '#ead8ca',
  "active" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Advert_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Advert_active_sortOrder_idx" ON "Advert"("active", "sortOrder");

-- Preserve the existing homepage promotions as editable adverts.
INSERT INTO "Advert" ("id","title","eyebrow","description","image","imageAlt","action","href","color","active","sortOrder","updatedAt") VALUES ('discover','A little curiosity. A whole new perspective.','Inspiration starts here','Discover fresh stories, creative voices, and ideas that stay with you.','/assets/art.svg','Colorful geometric artwork representing art and ideas','Find your next read','#latest-stories','#ead8ca',true,0,CURRENT_TIMESTAMP);
INSERT INTO "Advert" ("id","title","eyebrow","description","image","imageAlt","action","href","color","active","sortOrder","updatedAt") VALUES ('voices','Have a story the world should hear?','Your voice belongs here','Share your perspective and become part of our community of writers.','/assets/history.svg','Illustration celebrating history and discovery','Become a contributor','/author-request','#e5ddcb',true,1,CURRENT_TIMESTAMP);
INSERT INTO "Advert" ("id","title","eyebrow","description","image","imageAlt","action","href","color","active","sortOrder","updatedAt") VALUES ('about','Meet the publication behind the stories.','More than a headline','Get to know our mission and the ideas that bring this community together.','/assets/philosophy.svg','Illustration inspired by philosophy and new perspectives','Discover our story','/about','#dce5e8',true,2,CURRENT_TIMESTAMP);
