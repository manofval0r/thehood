-- The index key is text, not a uuid.
--
-- The archive files already have stable, readable ids in the manifest
-- ("gst312-session-1"), and those ids are what the deep link ?r=<id> carries.
-- Making the column a uuid would mean inventing a second identity for every
-- file and having the links point at the invented one instead of the one
-- people already have in their history and their bookmarks.

alter table public.files alter column id type text using id::text;
