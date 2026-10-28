import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "payload"."review_photos" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar,
  	"review_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumb_url" varchar,
  	"sizes_thumb_width" numeric,
  	"sizes_thumb_height" numeric,
  	"sizes_thumb_mime_type" varchar,
  	"sizes_thumb_filesize" numeric,
  	"sizes_thumb_filename" varchar
  );
  
  ALTER TABLE "payload"."reviews" DROP CONSTRAINT "reviews_photo_id_media_id_fk";
  
  ALTER TABLE "payload"."certificates" ALTER COLUMN "enrolment_id" DROP NOT NULL;
  ALTER TABLE "payload"."orders" ADD COLUMN "visitor_id" varchar;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "review_photos_id" integer;
  ALTER TABLE "payload"."review_photos" ADD CONSTRAINT "review_photos_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "payload"."reviews"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "review_photos_review_idx" ON "payload"."review_photos" USING btree ("review_id");
  CREATE INDEX "review_photos_updated_at_idx" ON "payload"."review_photos" USING btree ("updated_at");
  CREATE INDEX "review_photos_created_at_idx" ON "payload"."review_photos" USING btree ("created_at");
  CREATE UNIQUE INDEX "review_photos_filename_idx" ON "payload"."review_photos" USING btree ("filename");
  CREATE INDEX "review_photos_sizes_thumb_sizes_thumb_filename_idx" ON "payload"."review_photos" USING btree ("sizes_thumb_filename");
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_review_photos_fk" FOREIGN KEY ("review_photos_id") REFERENCES "payload"."review_photos"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "orders_visitor_id_idx" ON "payload"."orders" USING btree ("visitor_id");
  CREATE INDEX "payload_locked_documents_rels_review_photos_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("review_photos_id");

  -- Rate-limit counters (see src/server/rate-limit.ts): one row per key and fixed window.
  CREATE TABLE "payload"."rate_limits" (
  	"key" varchar NOT NULL,
  	"window_start" timestamp(3) with time zone NOT NULL,
  	"count" integer DEFAULT 1 NOT NULL,
  	PRIMARY KEY ("key", "window_start")
  );
  CREATE INDEX "rate_limits_window_start_idx" ON "payload"."rate_limits" USING btree ("window_start");`)

  // Photos already sent with reviews move out of the public photo library into review-photos (rows and files).
  const moved = await db.execute(sql`
    SELECT m.filename, m.sizes_thumb_filename FROM "payload"."media" m JOIN "payload"."reviews" r ON r.photo_id = m.id`)
  await db.execute(sql`
    CREATE TEMP TABLE moved AS SELECT r.id AS review_id, r.photo_id AS media_id FROM "payload"."reviews" r WHERE r.photo_id IS NOT NULL;
    INSERT INTO "payload"."review_photos" (alt, review_id, updated_at, created_at, url, thumbnail_u_r_l, filename, mime_type, filesize, width, height, focal_x, focal_y,
      sizes_thumb_url, sizes_thumb_width, sizes_thumb_height, sizes_thumb_mime_type, sizes_thumb_filesize, sizes_thumb_filename)
    SELECT m.alt, moved.review_id, m.updated_at, m.created_at, replace(m.url, '/cms-api/media/', '/cms-api/review-photos/'), replace(m.thumbnail_u_r_l, '/cms-api/media/', '/cms-api/review-photos/'),
      m.filename, m.mime_type, m.filesize, m.width, m.height, m.focal_x, m.focal_y,
      replace(m.sizes_thumb_url, '/cms-api/media/', '/cms-api/review-photos/'), m.sizes_thumb_width, m.sizes_thumb_height, m.sizes_thumb_mime_type, m.sizes_thumb_filesize, m.sizes_thumb_filename
    FROM "payload"."media" m JOIN moved ON moved.media_id = m.id;
    UPDATE "payload"."reviews" r SET photo_id = rp.id FROM "payload"."review_photos" rp WHERE rp.review_id = r.id AND r.id IN (SELECT review_id FROM moved);
    DELETE FROM "payload"."media" WHERE id IN (SELECT media_id FROM moved);
    DROP TABLE moved;
    ALTER TABLE "payload"."reviews" ADD CONSTRAINT "reviews_photo_id_review_photos_id_fk" FOREIGN KEY ("photo_id") REFERENCES "payload"."review_photos"("id") ON DELETE set null ON UPDATE no action;`)
  const { mkdir, rename } = await import('node:fs/promises')
  const path = await import('node:path')
  const from = path.resolve(process.cwd(), 'media')
  const to = path.resolve(process.cwd(), 'review-photos')
  await mkdir(to, { recursive: true })
  for (const r of moved.rows as { filename: string | null; sizes_thumb_filename: string | null }[])
    for (const name of [r.filename, r.sizes_thumb_filename]) if (name) await rename(path.join(from, path.basename(name)), path.join(to, path.basename(name))).catch(() => {})
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload"."rate_limits";
  -- Review photos are not moved back to the photo library: the reviews lose their photo link.
  UPDATE "payload"."reviews" SET photo_id = NULL;
  ALTER TABLE "payload"."review_photos" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."review_photos" CASCADE;
  ALTER TABLE "payload"."reviews" DROP CONSTRAINT IF EXISTS "reviews_photo_id_review_photos_id_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_review_photos_fk";
  
  DROP INDEX "payload"."orders_visitor_id_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_review_photos_id_idx";
  ALTER TABLE "payload"."certificates" ALTER COLUMN "enrolment_id" SET NOT NULL;
  ALTER TABLE "payload"."reviews" ADD CONSTRAINT "reviews_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."orders" DROP COLUMN "visitor_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "review_photos_id";`)
}
