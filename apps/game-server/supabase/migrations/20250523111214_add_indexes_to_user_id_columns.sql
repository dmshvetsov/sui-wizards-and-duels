CREATE INDEX messages_user_id
ON "public"."messages"
USING btree (user_id);

CREATE INDEX user_accounts_user_id
ON "public"."user_accounts"
USING btree (user_id);
