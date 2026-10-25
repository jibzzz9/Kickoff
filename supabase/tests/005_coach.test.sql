begin;
select plan(10);

insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data) values
  ('50000000-0000-4000-8000-0000000000c1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'coach-1@test.ch',
   jsonb_build_object('role','student','first_name','Tim','birth_date',(current_date - interval '17 years')::date::text,'commune','Sion')),
  ('50000000-0000-4000-8000-0000000000c2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'coach-2@test.ch',
   jsonb_build_object('role','student','first_name','Eva','birth_date',(current_date - interval '17 years')::date::text,'commune','Visp')),
  ('50000000-0000-4000-8000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'coach-co@test.ch',
   '{"role":"company_user","company_name":"Coach Co","commune":"Sion","contact_name":"C"}');
update public.companies set verified_at = now() where name = 'Coach Co';
update public.students set target_professions = '{logisticien}', checkup_frequency_days = 7,
  created_at = now() - interval '8 days' where profile_id = '50000000-0000-4000-8000-0000000000c1';

insert into public.listings (id, company_id, profession_id, commune_id, title, description, start_date)
select x.id, c.id, p.id, m.id, x.title, 'd', '2027-08-16'
from (values ('50000000-0000-4000-8000-00000000f001'::uuid, 'logisticien', 'zermatt', 'Loin mais visé'),
             ('50000000-0000-4000-8000-00000000f002'::uuid, 'assc', 'sion', 'Proche'),
             ('50000000-0000-4000-8000-00000000f003'::uuid, 'assc', 'sion', 'Déjà postulé')) x(id, prof, commune, title)
join public.professions p on p.code = x.prof join public.communes m on m.code = x.commune, public.companies c
where c.name = 'Coach Co';
insert into public.applications (student_id, listing_id) values ('50000000-0000-4000-8000-0000000000c1', '50000000-0000-4000-8000-00000000f003');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"50000000-0000-4000-8000-0000000000c1","role":"authenticated"}', true);
select is((select listing_id from public.suggest_listings(50) where listing_id in (select '50000000-0000-4000-8000-00000000f001'::uuid union select '50000000-0000-4000-8000-00000000f002') limit 1),
  '50000000-0000-4000-8000-00000000f001'::uuid, 'suggestions : le métier visé passe avant la proximité');
select is((select reason from public.suggest_listings(50) where listing_id = '50000000-0000-4000-8000-00000000f001'), 'target_profession', 'raison : métier visé');
select is((select count(*)::int from public.suggest_listings(50) where listing_id = '50000000-0000-4000-8000-00000000f003'), 0,
  'suggestions : jamais une place où l''élève a déjà postulé');
select throws_ok($$select public.generate_checkup(auth.uid())$$, '42501', null, 'génération forcée réservée au serveur');
reset role;

select ok(public.generate_due_checkups() >= 1, 'check-up automatique quand la période choisie (7 jours) est écoulée');
select is((select count(*)::int from public.checkup_reports where student_id = '50000000-0000-4000-8000-0000000000c1'), 1, 'un compte rendu créé');
select is((select count(*)::int from public.notifications where profile_id = '50000000-0000-4000-8000-0000000000c1' and type = 'checkup_ready'), 1,
  'notification « check-up prêt »');
select is((select count(*)::int from public.checkup_reports where student_id = '50000000-0000-4000-8000-0000000000c2'), 0,
  'pas de check-up avant la fin de la période');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"50000000-0000-4000-8000-0000000000c1","role":"authenticated"}', true);
select is(public.request_checkup(), (select id from public.checkup_reports limit 1), 'bilan à la demande : au plus un par jour');
select set_config('request.jwt.claims', '{"sub":"50000000-0000-4000-8000-0000000000c2","role":"authenticated"}', true);
select is((select count(*)::int from public.checkup_reports where student_id = '50000000-0000-4000-8000-0000000000c1'), 0,
  'un autre élève ne voit pas les comptes rendus');

reset role;
select * from finish();
rollback;
