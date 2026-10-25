begin;
select plan(14);

insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data) values
  ('60000000-0000-4000-8000-0000000000c1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'p6-student@test.ch',
   jsonb_build_object('role','student','first_name','Noé','birth_date',(current_date - interval '17 years')::date::text,'commune','Sion')),
  ('60000000-0000-4000-8000-0000000000d1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'p6-parent@test.ch',
   '{"role":"parent"}'),
  ('60000000-0000-4000-8000-0000000000d2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'p6-other@test.ch',
   '{"role":"parent"}'),
  ('60000000-0000-4000-8000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'p6-co@test.ch',
   '{"role":"company_user","company_name":"P6 Co","commune":"Sion","contact_name":"C"}'),
  ('60000000-0000-4000-8000-0000000000a2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'p6-co2@test.ch',
   '{"role":"company_user","company_name":"P6 Basic","commune":"Sion","contact_name":"D"}');
update public.companies set verified_at = now() where name in ('P6 Co', 'P6 Basic');
update public.companies set plan = 'basic' where name = 'P6 Basic';

select is((select role::text from public.profiles where id = '60000000-0000-4000-8000-0000000000d1'), 'parent', 'inscription parent : rôle parent');
select is((select count(*)::int from public.students where profile_id = '60000000-0000-4000-8000-0000000000d1'), 0, 'inscription parent : pas de dossier élève');

insert into public.listings (id, company_id, profession_id, commune_id, title, description, start_date)
select x.id, c.id, p.id, m.id, 'Annonce P6', 'd', '2027-08-16'
from (values ('60000000-0000-4000-8000-00000000f001'::uuid, 'P6 Co'), ('60000000-0000-4000-8000-00000000f002'::uuid, 'P6 Basic')) x(id, co)
join public.companies c on c.name = x.co, public.professions p, public.communes m where p.code = 'assc' and m.code = 'sion';
insert into public.applications (id, student_id, listing_id) values
  ('60000000-0000-4000-8000-0000000000e1', '60000000-0000-4000-8000-0000000000c1', '60000000-0000-4000-8000-00000000f001');
insert into public.messages (application_id, sender_role, body) values ('60000000-0000-4000-8000-0000000000e1', 'system', 'secret');
insert into public.checkup_reports (student_id, period_start, period_end, content)
values ('60000000-0000-4000-8000-0000000000c1', now() - interval '7 days', now(), '{}');
insert into public.guardians_access (student_id, guardian_email, guardian_profile_id, accepted_at)
values ('60000000-0000-4000-8000-0000000000c1', 'p6-parent@test.ch', '60000000-0000-4000-8000-0000000000d1', now()),
       ('60000000-0000-4000-8000-0000000000c1', 'p6-other@test.ch', '60000000-0000-4000-8000-0000000000d2', null);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"60000000-0000-4000-8000-0000000000d1","role":"authenticated"}', true);
select is((select count(*)::int from public.applications), 1, 'parent : voit les candidatures de l''élève qui l''a invité');
select is((select count(*)::int from public.listing_cards where id = '60000000-0000-4000-8000-00000000f001'), 1, 'parent : voit l''annonce concernée');
select is((select count(*)::int from public.messages), 0, 'parent : ne voit jamais les messages avec les entreprises');
select is((select count(*)::int from public.checkup_reports), 0, 'parent : check-ups invisibles tant que l''élève ne les partage pas');
select throws_ok($$update public.applications set status = 'withdrawn'$$, '42501', null, 'parent : lecture seule');

select set_config('request.jwt.claims', '{"sub":"60000000-0000-4000-8000-0000000000d2","role":"authenticated"}', true);
select is((select count(*)::int from public.applications), 0, 'invitation non acceptée : aucun accès');

-- L'élève partage ses check-ups, puis révoque l'accès
select set_config('request.jwt.claims', '{"sub":"60000000-0000-4000-8000-0000000000c1","role":"authenticated"}', true);
update public.students set share_checkups_with_guardians = true where profile_id = auth.uid();
select lives_ok($$select public.record_listing_view('60000000-0000-4000-8000-00000000f001')$$, 'élève : vue de l''annonce enregistrée');
select public.record_listing_view('60000000-0000-4000-8000-00000000f001');
select set_config('request.jwt.claims', '{"sub":"60000000-0000-4000-8000-0000000000d1","role":"authenticated"}', true);
select is((select count(*)::int from public.checkup_reports), 1, 'parent : voit les check-ups une fois partagés');
select set_config('request.jwt.claims', '{"sub":"60000000-0000-4000-8000-0000000000c1","role":"authenticated"}', true);
update public.guardians_access set revoked_at = now() where student_id = auth.uid();
select set_config('request.jwt.claims', '{"sub":"60000000-0000-4000-8000-0000000000d1","role":"authenticated"}', true);
select is((select count(*)::int from public.applications), 0, 'accès révoqué : plus rien de visible');

-- Statistiques
select set_config('request.jwt.claims', '{"sub":"60000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
select is((select views from public.listing_stats('60000000-0000-4000-8000-00000000f001')), 1, 'stats : une vue par élève et par jour');
select set_config('request.jwt.claims', '{"sub":"60000000-0000-4000-8000-0000000000a2","role":"authenticated"}', true);
select throws_ok($$select * from public.listing_stats('60000000-0000-4000-8000-00000000f001')$$, '42501', null, 'stats : jamais celles d''une autre entreprise');
select throws_like($$select * from public.listing_stats('60000000-0000-4000-8000-00000000f002')$$, 'plan_feature_disabled%', 'stats : réservées au plan Pro');

reset role;
select * from finish();
rollback;
