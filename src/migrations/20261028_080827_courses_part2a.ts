import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_enrolments_source" AS ENUM('paid', 'free', 'manual');
  CREATE TABLE "payload"."enrolments" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"customer_id" integer NOT NULL,
  	"course_id" integer NOT NULL,
  	"source" "payload"."enum_enrolments_source" DEFAULT 'manual' NOT NULL,
  	"order_id" integer,
  	"child_first_name" varchar,
  	"guardian_consent_at" timestamp(3) with time zone,
  	"first_accessed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."customers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"phone" varchar NOT NULL,
  	"name" varchar,
  	"saved_slugs" jsonb,
  	"deleted_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."otp_codes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"phone" varchar NOT NULL,
  	"code_hash" varchar NOT NULL,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"sent_at" timestamp(3) with time zone NOT NULL,
  	"attempts" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload"."orders_items" ADD COLUMN "course_id" integer;
  ALTER TABLE "payload"."orders_items" ADD COLUMN "child_first_name" varchar;
  ALTER TABLE "payload"."orders_items" ADD COLUMN "guardian_consent" boolean;
  ALTER TABLE "payload"."orders" ADD COLUMN "account_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "enrolments_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "customers_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "otp_codes_id" integer;
  ALTER TABLE "payload"."commerce_settings" ADD COLUMN "tax_default_tax_class_course_id" integer;
  ALTER TABLE "payload"."enrolments" ADD CONSTRAINT "enrolments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "payload"."customers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."enrolments" ADD CONSTRAINT "enrolments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "payload"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."enrolments" ADD CONSTRAINT "enrolments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "payload"."orders"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "enrolments_customer_idx" ON "payload"."enrolments" USING btree ("customer_id");
  CREATE INDEX "enrolments_course_idx" ON "payload"."enrolments" USING btree ("course_id");
  CREATE INDEX "enrolments_order_idx" ON "payload"."enrolments" USING btree ("order_id");
  CREATE INDEX "enrolments_updated_at_idx" ON "payload"."enrolments" USING btree ("updated_at");
  CREATE INDEX "enrolments_created_at_idx" ON "payload"."enrolments" USING btree ("created_at");
  CREATE UNIQUE INDEX "customer_course_idx" ON "payload"."enrolments" USING btree ("customer_id","course_id");
  CREATE UNIQUE INDEX "customers_phone_idx" ON "payload"."customers" USING btree ("phone");
  CREATE INDEX "customers_updated_at_idx" ON "payload"."customers" USING btree ("updated_at");
  CREATE INDEX "customers_created_at_idx" ON "payload"."customers" USING btree ("created_at");
  CREATE UNIQUE INDEX "otp_codes_phone_idx" ON "payload"."otp_codes" USING btree ("phone");
  CREATE INDEX "otp_codes_updated_at_idx" ON "payload"."otp_codes" USING btree ("updated_at");
  CREATE INDEX "otp_codes_created_at_idx" ON "payload"."otp_codes" USING btree ("created_at");
  ALTER TABLE "payload"."orders_items" ADD CONSTRAINT "orders_items_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "payload"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."orders" ADD CONSTRAINT "orders_account_id_customers_id_fk" FOREIGN KEY ("account_id") REFERENCES "payload"."customers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_enrolments_fk" FOREIGN KEY ("enrolments_id") REFERENCES "payload"."enrolments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_customers_fk" FOREIGN KEY ("customers_id") REFERENCES "payload"."customers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_otp_codes_fk" FOREIGN KEY ("otp_codes_id") REFERENCES "payload"."otp_codes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."commerce_settings" ADD CONSTRAINT "commerce_settings_tax_default_tax_class_course_id_tax_classes_id_fk" FOREIGN KEY ("tax_default_tax_class_course_id") REFERENCES "payload"."tax_classes"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "orders_items_course_idx" ON "payload"."orders_items" USING btree ("course_id");
  CREATE INDEX "orders_account_idx" ON "payload"."orders" USING btree ("account_id");
  CREATE INDEX "payload_locked_documents_rels_enrolments_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("enrolments_id");
  CREATE INDEX "payload_locked_documents_rels_customers_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("customers_id");
  CREATE INDEX "payload_locked_documents_rels_otp_codes_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("otp_codes_id");
  CREATE INDEX "commerce_settings_tax_tax_default_tax_class_course_idx" ON "payload"."commerce_settings" USING btree ("tax_default_tax_class_course_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."enrolments" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."customers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."otp_codes" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."enrolments" CASCADE;
  DROP TABLE "payload"."customers" CASCADE;
  DROP TABLE "payload"."otp_codes" CASCADE;
  ALTER TABLE "payload"."orders_items" DROP CONSTRAINT "orders_items_course_id_courses_id_fk";
  
  ALTER TABLE "payload"."orders" DROP CONSTRAINT "orders_account_id_customers_id_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_enrolments_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_customers_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_otp_codes_fk";
  
  ALTER TABLE "payload"."commerce_settings" DROP CONSTRAINT "commerce_settings_tax_default_tax_class_course_id_tax_classes_id_fk";
  
  DROP INDEX "payload"."orders_items_course_idx";
  DROP INDEX "payload"."orders_account_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_enrolments_id_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_customers_id_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_otp_codes_id_idx";
  DROP INDEX "payload"."commerce_settings_tax_tax_default_tax_class_course_idx";
  ALTER TABLE "payload"."orders_items" DROP COLUMN "course_id";
  ALTER TABLE "payload"."orders_items" DROP COLUMN "child_first_name";
  ALTER TABLE "payload"."orders_items" DROP COLUMN "guardian_consent";
  ALTER TABLE "payload"."orders" DROP COLUMN "account_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "enrolments_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "customers_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "otp_codes_id";
  ALTER TABLE "payload"."commerce_settings" DROP COLUMN "tax_default_tax_class_course_id";
  DROP TYPE "payload"."enum_enrolments_source";`)
}
