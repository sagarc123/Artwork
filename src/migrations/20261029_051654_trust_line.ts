import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."site_settings" ADD COLUMN "trust_years" numeric;
  ALTER TABLE "payload"."site_settings" ADD COLUMN "trust_events" numeric;
  ALTER TABLE "payload"."site_settings" ADD COLUMN "trust_rating" numeric;
  ALTER TABLE "payload"."site_settings" ADD COLUMN "trust_rating_count" numeric;
  ALTER TABLE "payload"."site_settings_locales" ADD COLUMN "trust_cities" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."site_settings" DROP COLUMN "trust_years";
  ALTER TABLE "payload"."site_settings" DROP COLUMN "trust_events";
  ALTER TABLE "payload"."site_settings" DROP COLUMN "trust_rating";
  ALTER TABLE "payload"."site_settings" DROP COLUMN "trust_rating_count";
  ALTER TABLE "payload"."site_settings_locales" DROP COLUMN "trust_cities";`)
}
