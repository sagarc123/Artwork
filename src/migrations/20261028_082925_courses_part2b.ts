import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_certificates_status" AS ENUM('valid', 'revoked');
  CREATE TABLE "payload"."certificates" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"public_id" varchar NOT NULL,
  	"name_on_cert" varchar NOT NULL,
  	"course_id" integer NOT NULL,
  	"issued_at" timestamp(3) with time zone NOT NULL,
  	"enrolment_id" integer NOT NULL,
  	"customer_id" integer NOT NULL,
  	"status" "payload"."enum_certificates_status" DEFAULT 'valid' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."lesson_progress" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"enrolment_id" integer NOT NULL,
  	"lesson_id" integer NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload"."enrolments" ADD COLUMN "last_lesson_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "certificates_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "lesson_progress_id" integer;
  ALTER TABLE "payload"."certificates" ADD CONSTRAINT "certificates_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "payload"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."certificates" ADD CONSTRAINT "certificates_enrolment_id_enrolments_id_fk" FOREIGN KEY ("enrolment_id") REFERENCES "payload"."enrolments"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."certificates" ADD CONSTRAINT "certificates_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "payload"."customers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."lesson_progress" ADD CONSTRAINT "lesson_progress_enrolment_id_enrolments_id_fk" FOREIGN KEY ("enrolment_id") REFERENCES "payload"."enrolments"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "payload"."lessons"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "certificates_public_id_idx" ON "payload"."certificates" USING btree ("public_id");
  CREATE INDEX "certificates_course_idx" ON "payload"."certificates" USING btree ("course_id");
  CREATE INDEX "certificates_enrolment_idx" ON "payload"."certificates" USING btree ("enrolment_id");
  CREATE INDEX "certificates_customer_idx" ON "payload"."certificates" USING btree ("customer_id");
  CREATE INDEX "certificates_updated_at_idx" ON "payload"."certificates" USING btree ("updated_at");
  CREATE INDEX "certificates_created_at_idx" ON "payload"."certificates" USING btree ("created_at");
  CREATE UNIQUE INDEX "enrolment_idx" ON "payload"."certificates" USING btree ("enrolment_id");
  CREATE INDEX "lesson_progress_enrolment_idx" ON "payload"."lesson_progress" USING btree ("enrolment_id");
  CREATE INDEX "lesson_progress_lesson_idx" ON "payload"."lesson_progress" USING btree ("lesson_id");
  CREATE INDEX "lesson_progress_updated_at_idx" ON "payload"."lesson_progress" USING btree ("updated_at");
  CREATE INDEX "lesson_progress_created_at_idx" ON "payload"."lesson_progress" USING btree ("created_at");
  CREATE UNIQUE INDEX "enrolment_lesson_idx" ON "payload"."lesson_progress" USING btree ("enrolment_id","lesson_id");
  ALTER TABLE "payload"."enrolments" ADD CONSTRAINT "enrolments_last_lesson_id_lessons_id_fk" FOREIGN KEY ("last_lesson_id") REFERENCES "payload"."lessons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_certificates_fk" FOREIGN KEY ("certificates_id") REFERENCES "payload"."certificates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_lesson_progress_fk" FOREIGN KEY ("lesson_progress_id") REFERENCES "payload"."lesson_progress"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "enrolments_last_lesson_idx" ON "payload"."enrolments" USING btree ("last_lesson_id");
  CREATE INDEX "payload_locked_documents_rels_certificates_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("certificates_id");
  CREATE INDEX "payload_locked_documents_rels_lesson_progress_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("lesson_progress_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."certificates" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."lesson_progress" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."certificates" CASCADE;
  DROP TABLE "payload"."lesson_progress" CASCADE;
  ALTER TABLE "payload"."enrolments" DROP CONSTRAINT "enrolments_last_lesson_id_lessons_id_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_certificates_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_lesson_progress_fk";
  
  DROP INDEX "payload"."enrolments_last_lesson_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_certificates_id_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_lesson_progress_id_idx";
  ALTER TABLE "payload"."enrolments" DROP COLUMN "last_lesson_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "certificates_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "lesson_progress_id";
  DROP TYPE "payload"."enum_certificates_status";`)
}
