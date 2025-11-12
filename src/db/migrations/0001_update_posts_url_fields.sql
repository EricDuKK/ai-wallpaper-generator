-- Update cover_url and author_avatar_url from varchar(255) to text
-- to support longer URLs including base64 data URLs

ALTER TABLE "posts" 
  ALTER COLUMN "cover_url" TYPE text,
  ALTER COLUMN "author_avatar_url" TYPE text;

