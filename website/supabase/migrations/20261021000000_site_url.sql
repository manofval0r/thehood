-- The site's own address.
--
-- The scheduler runs inside the database and has to reach out to the site, so
-- it needs to be told where the site is. It was seeded with the wrong domain,
-- which is the sort of thing that only shows up when a cron fires at five
-- past the hour and the response is a payment-required page.

update public.app_config
   set value = 'https://thehood-psi.vercel.app'
 where key = 'site_url';
