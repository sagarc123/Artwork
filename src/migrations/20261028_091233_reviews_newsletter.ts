import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_reviews_status" AS ENUM('pending', 'approved', 'rejected');
  CREATE TYPE "payload"."enum_reviews_kind" AS ENUM('product', 'course');
  CREATE TYPE "payload"."enum_subscribers_status" AS ENUM('confirmed', 'pending', 'unsubscribed');
  CREATE TYPE "payload"."enum_subscribers_locale" AS ENUM('en', 'mr', 'hi');
  CREATE TYPE "payload"."enum_consents_purpose" AS ENUM('newsletter');
  CREATE TABLE "payload"."reviews" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"status" "payload"."enum_reviews_status" DEFAULT 'pending' NOT NULL,
  	"name" varchar NOT NULL,
  	"rating" numeric NOT NULL,
  	"kind" "payload"."enum_reviews_kind" NOT NULL,
  	"product_id" integer,
  	"course_id" integer,
  	"text" varchar NOT NULL,
  	"photo_id" integer,
  	"customer_id" integer NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."subscribers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL,
  	"status" "payload"."enum_subscribers_status" DEFAULT 'pending' NOT NULL,
  	"confirmed_at" timestamp(3) with time zone,
  	"unsubscribed_at" timestamp(3) with time zone,
  	"confirm_sent_at" timestamp(3) with time zone,
  	"locale" "payload"."enum_subscribers_locale",
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."consents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL,
  	"purpose" "payload"."enum_consents_purpose" NOT NULL,
  	"notice_version" varchar NOT NULL,
  	"source" varchar NOT NULL,
  	"granted_at" timestamp(3) with time zone NOT NULL,
  	"withdrawn_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  DROP INDEX "payload"."customer_course_idx";
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "reviews_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "subscribers_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "consents_id" integer;
  ALTER TABLE "payload"."reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "payload"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."reviews" ADD CONSTRAINT "reviews_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "payload"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."reviews" ADD CONSTRAINT "reviews_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."reviews" ADD CONSTRAINT "reviews_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "payload"."customers"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "reviews_product_idx" ON "payload"."reviews" USING btree ("product_id");
  CREATE INDEX "reviews_course_idx" ON "payload"."reviews" USING btree ("course_id");
  CREATE INDEX "reviews_photo_idx" ON "payload"."reviews" USING btree ("photo_id");
  CREATE INDEX "reviews_customer_idx" ON "payload"."reviews" USING btree ("customer_id");
  CREATE INDEX "reviews_updated_at_idx" ON "payload"."reviews" USING btree ("updated_at");
  CREATE INDEX "reviews_created_at_idx" ON "payload"."reviews" USING btree ("created_at");
  CREATE UNIQUE INDEX "customer_product_idx" ON "payload"."reviews" USING btree ("customer_id","product_id");
  CREATE UNIQUE INDEX "customer_course_idx" ON "payload"."reviews" USING btree ("customer_id","course_id");
  CREATE UNIQUE INDEX "subscribers_email_idx" ON "payload"."subscribers" USING btree ("email");
  CREATE INDEX "subscribers_updated_at_idx" ON "payload"."subscribers" USING btree ("updated_at");
  CREATE INDEX "subscribers_created_at_idx" ON "payload"."subscribers" USING btree ("created_at");
  CREATE INDEX "consents_email_idx" ON "payload"."consents" USING btree ("email");
  CREATE INDEX "consents_updated_at_idx" ON "payload"."consents" USING btree ("updated_at");
  CREATE INDEX "consents_created_at_idx" ON "payload"."consents" USING btree ("created_at");
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reviews_fk" FOREIGN KEY ("reviews_id") REFERENCES "payload"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_subscribers_fk" FOREIGN KEY ("subscribers_id") REFERENCES "payload"."subscribers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_consents_fk" FOREIGN KEY ("consents_id") REFERENCES "payload"."consents"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "customer_course_1_idx" ON "payload"."enrolments" USING btree ("customer_id","course_id");
  CREATE INDEX "payload_locked_documents_rels_reviews_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("reviews_id");
  CREATE INDEX "payload_locked_documents_rels_subscribers_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("subscribers_id");
  CREATE INDEX "payload_locked_documents_rels_consents_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("consents_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."reviews" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."subscribers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."consents" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."reviews" CASCADE;
  DROP TABLE "payload"."subscribers" CASCADE;
  DROP TABLE "payload"."consents" CASCADE;
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_reviews_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_subscribers_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_consents_fk";
  
  DROP INDEX "payload"."customer_course_1_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_reviews_id_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_subscribers_id_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_consents_id_idx";
  CREATE UNIQUE INDEX "customer_course_idx" ON "payload"."enrolments" USING btree ("customer_id","course_id");
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "reviews_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "subscribers_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "consents_id";
  DROP TYPE "payload"."enum_reviews_status";
  DROP TYPE "payload"."enum_reviews_kind";
  DROP TYPE "payload"."enum_subscribers_status";
  DROP TYPE "payload"."enum_subscribers_locale";
  DROP TYPE "payload"."enum_consents_purpose";`)
}
