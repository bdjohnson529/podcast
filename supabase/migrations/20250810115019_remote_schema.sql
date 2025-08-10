

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."episodes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "topic" "text" NOT NULL,
    "familiarity" "text" NOT NULL,
    "industries" "text"[] DEFAULT '{}'::"text"[],
    "use_case" "text",
    "duration" integer DEFAULT 8 NOT NULL,
    "script" "jsonb" NOT NULL,
    "audio_url" "text",
    "audio_duration" integer,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "visibility" "text" DEFAULT 'private'::"text",
    CONSTRAINT "episodes_duration_check" CHECK ((("duration" >= 1) AND ("duration" <= 15))),
    CONSTRAINT "episodes_familiarity_check" CHECK (("familiarity" = ANY (ARRAY['new'::"text", 'some'::"text", 'expert'::"text"]))),
    CONSTRAINT "episodes_visibility_check" CHECK (("visibility" = ANY (ARRAY['private'::"text", 'public'::"text"])))
);


ALTER TABLE "public"."episodes" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."episode_summaries" AS
 SELECT "id",
    "user_id",
    "topic",
    "familiarity",
    "duration",
    ("script" ->> 'title'::"text") AS "title",
    ("script" ->> 'estimatedDuration'::"text") AS "estimated_duration",
        CASE
            WHEN ("audio_url" IS NOT NULL) THEN true
            ELSE false
        END AS "has_audio",
    "visibility",
    "created_at",
    "updated_at"
   FROM "public"."episodes"
  ORDER BY "created_at" DESC;


ALTER VIEW "public"."episode_summaries" OWNER TO "postgres";


ALTER TABLE ONLY "public"."episodes"
    ADD CONSTRAINT "episodes_pkey" PRIMARY KEY ("id");



CREATE INDEX "episodes_created_at_idx" ON "public"."episodes" USING "btree" ("created_at" DESC);



CREATE INDEX "episodes_topic_idx" ON "public"."episodes" USING "gin" ("to_tsvector"('"english"'::"regconfig", "topic"));



CREATE INDEX "episodes_user_id_idx" ON "public"."episodes" USING "btree" ("user_id");



CREATE INDEX "episodes_visibility_idx" ON "public"."episodes" USING "btree" ("visibility");



CREATE OR REPLACE TRIGGER "update_episodes_updated_at" BEFORE UPDATE ON "public"."episodes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."episodes"
    ADD CONSTRAINT "episodes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Anonymous users can insert episodes" ON "public"."episodes" FOR INSERT WITH CHECK (("user_id" IS NULL));



CREATE POLICY "Anonymous users can view public episodes" ON "public"."episodes" FOR SELECT USING (("user_id" IS NULL));



CREATE POLICY "Anyone can view public episodes" ON "public"."episodes" FOR SELECT USING (("visibility" = 'public'::"text"));



CREATE POLICY "Authenticated users can delete own episodes" ON "public"."episodes" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Authenticated users can insert own episodes" ON "public"."episodes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Authenticated users can update own episodes" ON "public"."episodes" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Authenticated users can view own episodes" ON "public"."episodes" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."episodes" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."episodes" TO "anon";
GRANT ALL ON TABLE "public"."episodes" TO "authenticated";
GRANT ALL ON TABLE "public"."episodes" TO "service_role";



GRANT ALL ON TABLE "public"."episode_summaries" TO "anon";
GRANT ALL ON TABLE "public"."episode_summaries" TO "authenticated";
GRANT ALL ON TABLE "public"."episode_summaries" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
