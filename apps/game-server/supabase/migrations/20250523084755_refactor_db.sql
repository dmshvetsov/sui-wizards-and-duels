revoke delete on table "public"."deprecated_matches" from "anon";

revoke insert on table "public"."deprecated_matches" from "anon";

revoke references on table "public"."deprecated_matches" from "anon";

revoke select on table "public"."deprecated_matches" from "anon";

revoke trigger on table "public"."deprecated_matches" from "anon";

revoke truncate on table "public"."deprecated_matches" from "anon";

revoke update on table "public"."deprecated_matches" from "anon";

revoke delete on table "public"."deprecated_matches" from "authenticated";

revoke insert on table "public"."deprecated_matches" from "authenticated";

revoke references on table "public"."deprecated_matches" from "authenticated";

revoke select on table "public"."deprecated_matches" from "authenticated";

revoke trigger on table "public"."deprecated_matches" from "authenticated";

revoke truncate on table "public"."deprecated_matches" from "authenticated";

revoke update on table "public"."deprecated_matches" from "authenticated";

revoke delete on table "public"."deprecated_matches" from "service_role";

revoke insert on table "public"."deprecated_matches" from "service_role";

revoke references on table "public"."deprecated_matches" from "service_role";

revoke select on table "public"."deprecated_matches" from "service_role";

revoke trigger on table "public"."deprecated_matches" from "service_role";

revoke truncate on table "public"."deprecated_matches" from "service_role";

revoke update on table "public"."deprecated_matches" from "service_role";

alter table "public"."deprecated_matches" drop constraint "duel_matches_pkey";

drop index if exists "public"."duel_matches_pkey";

drop table "public"."deprecated_matches";


