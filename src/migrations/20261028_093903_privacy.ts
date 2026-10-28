import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_data_requests_type" AS ENUM('export', 'erase');
  CREATE TYPE "payload"."enum_data_requests_status" AS ENUM('open', 'done');
  CREATE TYPE "payload"."enum_data_requests_source" AS ENUM('account', 'admin');
  ALTER TYPE "payload"."enum_consents_purpose" ADD VALUE 'analytics';
  ALTER TYPE "payload"."enum_consents_purpose" ADD VALUE 'marketing_cookies';
  CREATE TABLE "payload"."data_requests" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"type" "payload"."enum_data_requests_type" NOT NULL,
  	"status" "payload"."enum_data_requests_status" DEFAULT 'open' NOT NULL,
  	"customer_id" integer,
  	"source" "payload"."enum_data_requests_source",
  	"due_at" timestamp(3) with time zone NOT NULL,
  	"done_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload"."consents" ALTER COLUMN "email" DROP NOT NULL;
  ALTER TABLE "payload"."consents" ADD COLUMN "subject" varchar;
  ALTER TABLE "payload"."consents" ADD COLUMN "customer_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "data_requests_id" integer;
  ALTER TABLE "payload"."data_requests" ADD CONSTRAINT "data_requests_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "payload"."customers"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "data_requests_customer_idx" ON "payload"."data_requests" USING btree ("customer_id");
  CREATE INDEX "data_requests_updated_at_idx" ON "payload"."data_requests" USING btree ("updated_at");
  CREATE INDEX "data_requests_created_at_idx" ON "payload"."data_requests" USING btree ("created_at");
  ALTER TABLE "payload"."consents" ADD CONSTRAINT "consents_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "payload"."customers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_data_requests_fk" FOREIGN KEY ("data_requests_id") REFERENCES "payload"."data_requests"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "consents_subject_idx" ON "payload"."consents" USING btree ("subject");
  CREATE INDEX "consents_customer_idx" ON "payload"."consents" USING btree ("customer_id");
  CREATE INDEX "payload_locked_documents_rels_data_requests_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("data_requests_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."data_requests" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."data_requests" CASCADE;
  ALTER TABLE "payload"."consents" DROP CONSTRAINT "consents_customer_id_customers_id_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_data_requests_fk";
  
  ALTER TABLE "payload"."consents" ALTER COLUMN "purpose" SET DATA TYPE text;
  DROP TYPE "payload"."enum_consents_purpose";
  CREATE TYPE "payload"."enum_consents_purpose" AS ENUM('newsletter');
  ALTER TABLE "payload"."consents" ALTER COLUMN "purpose" SET DATA TYPE "payload"."enum_consents_purpose" USING "purpose"::"payload"."enum_consents_purpose";
  DROP INDEX "payload"."consents_subject_idx";
  DROP INDEX "payload"."consents_customer_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_data_requests_id_idx";
  ALTER TABLE "payload"."consents" ALTER COLUMN "email" SET NOT NULL;
  ALTER TABLE "payload"."consents" DROP COLUMN "subject";
  ALTER TABLE "payload"."consents" DROP COLUMN "customer_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "data_requests_id";
  DROP TYPE "payload"."enum_data_requests_type";
  DROP TYPE "payload"."enum_data_requests_status";
  DROP TYPE "payload"."enum_data_requests_source";`)
}
