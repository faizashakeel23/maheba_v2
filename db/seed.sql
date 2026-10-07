-- Maheba seed — mirrors web/src/lib/mock-data.ts + demo appointments.
-- Runs once on first `docker compose up` (empty volume only).
-- Re-seed from scratch: `docker compose down -v && docker compose up -d`.

-- Demo users (local auth has no passwords; email identifies the account).
insert into users (email, role, display_name) values
  ('admin@maheba.local', 'admin', 'Maheba Admin'),
  ('glam-by-zawadi@maheba.local', 'provider', 'Glam by Zawadi'),
  ('face-by-amara@maheba.local', 'provider', 'Face by Amara'),
  ('henna-by-layla@maheba.local', 'provider', 'Henna by Layla'),
  ('coastal-mehndi@maheba.local', 'provider', 'Coastal Mehndi'),
  ('sweet-oven@maheba.local', 'provider', 'Sweet Oven'),
  ('pwani-cakes@maheba.local', 'provider', 'Pwani Cakes'),
  ('new-glam-pending@maheba.local', 'provider', 'New Glam (pending review)'),
  ('old-henna-expired@maheba.local', 'provider', 'Old Henna (expired)')
on conflict (email) do nothing;

-- Providers. subscription_end is relative to seed time so visibility
-- rules behave like the mock data (6 visible, 1 pending, 1 expired).
insert into providers
  (id, user_id, business_name, category, location, bio, phone, whatsapp, instagram, status, rating, reviews_count, subscription_end)
values
  ('glam-by-zawadi', (select id from users where email = 'glam-by-zawadi@maheba.local'),
   'Glam by Zawadi', 'makeup', 'Nyali',
   'Bridal & party makeup artist. 6 yrs experience, home service available. Trial sessions available.',
   '+254712345001', '254712345001', '@glambyzawadi', 'approved', 4.9, 132, now() + interval '18 days'),
  ('face-by-amara', (select id from users where email = 'face-by-amara@maheba.local'),
   'Face by Amara', 'makeup', 'Bamburi',
   'Bold editorial + Swahili bridal looks. Studio in Bamburi, travels to Diani & Malindi.',
   '+254712345002', '254712345002', '@facebyamara', 'approved', 4.8, 89, now() + interval '6 days'),
  ('henna-by-layla', (select id from users where email = 'henna-by-layla@maheba.local'),
   'Henna by Layla', 'henna', 'Old Town',
   'Bridal henna specialist — intricate coastal designs, organic cones. Home visits + Eid bookings.',
   '+254712345003', '254712345003', '@hennabylayla', 'approved', 5.0, 210, now() + interval '25 days'),
  ('coastal-mehndi', (select id from users where email = 'coastal-mehndi@maheba.local'),
   'Coastal Mehndi', 'henna', 'Likoni',
   'Fast, neat henna for weddings & festivals. Ferry-side studio, walk-ins welcome.',
   '+254712345004', '254712345004', '@coastalmehndi', 'approved', 4.7, 64, now() + interval '11 days'),
  ('sweet-oven', (select id from users where email = 'sweet-oven@maheba.local'),
   'Sweet Oven', 'baking', 'Kisauni',
   'Custom cakes, cupcakes & Swahili treats. 48-hr notice, delivery available.',
   '+254712345005', '254712345005', '@sweetoven', 'approved', 4.9, 178, now() + interval '29 days'),
  ('pwani-cakes', (select id from users where email = 'pwani-cakes@maheba.local'),
   'Pwani Cakes', 'baking', 'Nyali',
   'Swahili wedding cakes & mahamri platters. Halal kitchen, bulk orders for events.',
   '+254712345006', '254712345006', '@pwanicakes', 'approved', 4.6, 52, now() + interval '3 days'),
  ('new-glam-pending', (select id from users where email = 'new-glam-pending@maheba.local'),
   'New Glam (pending review)', 'makeup', 'Mtwapa',
   'Awaiting admin approval.',
   '+254712345007', '254712345007', '', 'pending', 0, 0, now() + interval '30 days'),
  ('old-henna-expired', (select id from users where email = 'old-henna-expired@maheba.local'),
   'Old Henna (expired)', 'henna', 'Changamwe',
   'Subscription lapsed — hidden until renewed.',
   '+254712345008', '254712345008', '', 'approved', 4.5, 30, now() - interval '5 days')
on conflict (id) do nothing;

-- Services.
insert into services (provider_id, title, description, price_kes, unit) values
  ('glam-by-zawadi', 'Bridal glam (full)', 'Trial + wedding day, lashes included', 8000, 'per session'),
  ('glam-by-zawadi', 'Party glam', 'Soft glam / full glam for events', 3500, 'per face'),
  ('glam-by-zawadi', 'Makeup lesson 1:1', '2-hour personal lesson with kit list', 5000, 'per session'),
  ('face-by-amara', 'Bridal package', 'Bride + 2 bridesmaids', 15000, 'per package'),
  ('face-by-amara', 'Engagement glam', 'HD makeup, hairstyling add-on', 4000, 'per face'),
  ('henna-by-layla', 'Bridal henna (hands + feet)', 'Full intricate design, 4–6 hrs', 6000, 'per bride'),
  ('henna-by-layla', 'Party henna', 'Simple elegant motifs per hand', 800, 'per hand'),
  ('henna-by-layla', 'Eid / group bookings', 'Per-person rate for 5+ guests', 500, 'per person'),
  ('coastal-mehndi', 'Simple hands', 'Both hands front', 1000, 'per set'),
  ('coastal-mehndi', 'Bridal deluxe', 'Hands + feet + touch-up', 5500, 'per bride'),
  ('sweet-oven', 'Custom birthday cake 1kg', 'Vanilla/chocolate/red velvet + message', 2800, 'per kg'),
  ('sweet-oven', 'Wedding cake', '3-tier from, tasting included', 25000, 'from'),
  ('sweet-oven', 'Cupcakes box of 6', 'Assorted flavours', 1200, 'per box'),
  ('pwani-cakes', 'Mahamri platter (20pc)', 'Fresh morning delivery', 900, 'per platter'),
  ('pwani-cakes', 'Coconut cake 1kg', 'Signature pwani flavour', 2500, 'per kg');

-- Portfolio.
insert into portfolio_items (provider_id, image_url, caption) values
  ('glam-by-zawadi', '/images/makeup/m1.jpg', 'Bridal soft glam'),
  ('glam-by-zawadi', '/images/makeup/m2.jpg', 'Kit essentials'),
  ('glam-by-zawadi', '/images/makeup/m3.jpg', 'Party full glam'),
  ('glam-by-zawadi', '/images/makeup/m4.jpg', 'Detail work'),
  ('glam-by-zawadi', '/images/makeup/m5.jpg', 'Glam session'),
  ('glam-by-zawadi', '/images/makeup/m6.jpg', 'Finishing touches'),
  ('face-by-amara', '/images/makeup/m4.jpg', 'Editorial look'),
  ('face-by-amara', '/images/makeup/m5.jpg', 'Bridal glow'),
  ('face-by-amara', '/images/makeup/m6.jpg', 'Shoot day'),
  ('face-by-amara', '/images/makeup/m1.jpg', 'Soft beat'),
  ('face-by-amara', '/images/makeup/m2.jpg', 'Bold lip'),
  ('face-by-amara', '/images/makeup/m3.jpg', 'Skin prep'),
  ('henna-by-layla', '/images/henna/h1.jpg', 'Bridal hands'),
  ('henna-by-layla', '/images/henna/h2.jpg', 'Mehndi detail'),
  ('henna-by-layla', '/images/henna/h3.jpg', 'Cute motif'),
  ('henna-by-layla', '/images/henna/h4.jpg', 'Floral design'),
  ('henna-by-layla', '/images/henna/h5.jpg', 'Full hand'),
  ('henna-by-layla', '/images/henna/h6.jpg', 'Front & back'),
  ('coastal-mehndi', '/images/henna/h5.jpg', 'Palm design'),
  ('coastal-mehndi', '/images/henna/h6.jpg', 'Back hand'),
  ('coastal-mehndi', '/images/henna/h7.jpg', 'Bridal set'),
  ('coastal-mehndi', '/images/henna/h8.jpg', 'Guest design'),
  ('coastal-mehndi', '/images/henna/h1.jpg', 'Festival hands'),
  ('coastal-mehndi', '/images/henna/h2.jpg', 'Fine lines'),
  ('sweet-oven', '/images/baking/b1.jpg', 'Chocolate layer'),
  ('sweet-oven', '/images/baking/b2.jpg', 'Celebration cake'),
  ('sweet-oven', '/images/baking/b3.jpg', 'Sweet detail'),
  ('sweet-oven', '/images/baking/b4.jpg', 'Berry topping'),
  ('sweet-oven', '/images/baking/b5.jpg', 'Fresh bakes'),
  ('sweet-oven', '/images/baking/b6.jpg', 'Cupcake box'),
  ('pwani-cakes', '/images/baking/b4.jpg', 'Signature cake'),
  ('pwani-cakes', '/images/baking/b5.jpg', 'Morning bakes'),
  ('pwani-cakes', '/images/baking/b7.jpg', 'Bakery fresh'),
  ('pwani-cakes', '/images/baking/b8.jpg', 'Sweet box'),
  ('pwani-cakes', '/images/baking/b9.jpg', 'Custom order'),
  ('pwani-cakes', '/images/baking/b2.jpg', 'Weekend treats');

-- Demo appointments (mirrors the localStorage seed).
insert into appointments (id, provider_id, customer_name, customer_phone, starts_at, notes, status) values
  ('appt-seed-1', 'glam-by-zawadi', 'Aisha M', '254722111222',
   date_trunc('day', now() + interval '1 day') + interval '10 hours',
   'Bridal trial — soft glam ♡', 'pending'),
  ('appt-seed-2', 'glam-by-zawadi', 'Brian K', '254733444555',
   date_trunc('day', now() + interval '2 days') + interval '14 hours',
   'Party glam for 2', 'pending')
on conflict (id) do nothing;
