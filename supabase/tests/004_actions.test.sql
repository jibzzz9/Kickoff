begin;
select plan(26);

-- Acteurs : entreprise A (Pro), entreprise B (Basique), élèves Léo et Ana
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data) values
  ('40000000-0000-4000-8000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'act-a@test.ch',
   '{"role":"company_user","company_name":"Act A","commune":"Sion","contact_name":"A"}'),
  ('40000000-0000-4000-8000-0000000000b1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'act-b@test.ch',
   '{"role":"company_user","company_name":"Act B","commune":"Sion","contact_name":"B"}'),
  ('40000000-0000-4000-8000-0000000000c1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'leo@test.ch',
   jsonb_build_object('role','student','first_name','Léo','birth_date',(current_date - interval '17 years')::date::text,'commune','Sion')),
  ('40000000-0000-4000-8000-0000000000c2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ana@test.ch',
   jsonb_build_object('role','student','first_name','Ana','birth_date',(current_date - interval '17 years')::date::text,'commune','Sion'));
update public.companies set verified_at = now() where name in ('Act A', 'Act B');
update public.companies set plan = 'basic' where name = 'Act B';

insert into public.listings (id, company_id, profession_id, commune_id, title, description, start_date, places_count)
select x.id, c.id, p.id, m.id, x.title, 'desc', '2027-08-16', 1
from (values ('40000000-0000-4000-8000-00000000f00a'::uuid, 'Act A', 'Annonce A'), ('40000000-0000-4000-8000-00000000f00b'::uuid, 'Act B', 'Annonce B')) x(id, company, title)
join public.companies c on c.name = x.company, public.professions p, public.communes m
where p.code = 'assc' and m.code = 'sion';

insert into public.applications (id, student_id, listing_id, created_at) values
  ('40000000-0000-4000-8000-0000000000e1', '40000000-0000-4000-8000-0000000000c1', '40000000-0000-4000-8000-00000000f00a', now()),
  ('40000000-0000-4000-8000-0000000000e2', '40000000-0000-4000-8000-0000000000c2', '40000000-0000-4000-8000-00000000f00a', now() - interval '11 days'),
  ('40000000-0000-4000-8000-0000000000e3', '40000000-0000-4000-8000-0000000000c1', '40000000-0000-4000-8000-00000000f00b', now());

select is((select count(*)::int from public.notifications where profile_id = '40000000-0000-4000-8000-0000000000a1' and type = 'new_application'), 2,
  'entreprise A : notifiée de chaque nouvelle candidature');

-- ===== Entreprise A invite Léo à un entretien =====
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"40000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
select is(public.company_invite(array['40000000-0000-4000-8000-0000000000e1'::uuid], 'interview', 'Bonjour Léo !',
  array[now() + interval '3 days', now() + interval '4 days'], 'Rue du Rhône 1', 'Claire', 'Ton dernier bulletin'), 1,
  'entreprise : invitation envoyée en un clic');
select throws_ok($$select public.company_invite(array['40000000-0000-4000-8000-0000000000e1'::uuid], 'interview', 'x', array[now() - interval '1 day'])$$,
  '22023', null, 'entreprise : un créneau dans le passé est refusé');
select throws_ok($$select public.company_invite(array['40000000-0000-4000-8000-0000000000e3'::uuid], 'interview', 'x', array[now() + interval '1 day'])$$,
  '42501', null, 'entreprise : ne peut pas agir sur la candidature d''une autre entreprise');
select throws_ok($$select public.post_message('40000000-0000-4000-8000-0000000000e1', 'system', 'filled', null)$$,
  '42501', null, 'fonctions internes non appelables depuis le client');
select lives_ok($$insert into public.recruiter_notes (application_id, body) values ('40000000-0000-4000-8000-0000000000e1', 'Très à l''aise')$$,
  'entreprise : ajoute une note privée');

-- ===== Léo voit l'invitation et choisit un créneau =====
select set_config('request.jwt.claims', '{"sub":"40000000-0000-4000-8000-0000000000c1","role":"authenticated"}', true);
select is((select status::text from public.applications where id = '40000000-0000-4000-8000-0000000000e1'), 'interview', 'élève : statut « Entretien »');
select is((select count(*)::int from public.notifications where type = 'invitation'), 1, 'élève : notification d''invitation reçue');
select is((select count(*)::int from public.appointment_slots), 2, 'élève : voit les 2 créneaux proposés');
select is((select count(*)::int from public.recruiter_notes), 0, 'élève : ne voit jamais les notes privées');
select lives_ok($$select public.student_choose_slot((select id from public.appointments limit 1),
  (select id from public.appointment_slots order by starts_at limit 1))$$, 'élève : choisit un créneau');
select throws_ok($$select public.company_decide('40000000-0000-4000-8000-0000000000e1', 'offer', 'x')$$, '42501', null,
  'élève : ne peut pas prendre une décision d''entreprise');
select throws_ok($$insert into public.messages (application_id, sender_role, sender_id, kind, body)
  values ('40000000-0000-4000-8000-0000000000e1', 'student', auth.uid(), 'offer_accepted', 'x')$$, '42501', null,
  'élève : ne peut pas fabriquer un message d''événement');
select lives_ok($$insert into public.messages (application_id, sender_role, sender_id, body)
  values ('40000000-0000-4000-8000-0000000000e1', 'student', auth.uid(), 'Merci, à jeudi !')$$, 'élève : envoie un message libre');

-- Ana ne peut pas toucher au rendez-vous de Léo
select set_config('request.jwt.claims', '{"sub":"40000000-0000-4000-8000-0000000000c2","role":"authenticated"}', true);
select is((select count(*)::int from public.appointments), 0, 'autre élève : ne voit pas le rendez-vous');

-- ===== L'entreprise voit le choix en temps réel, propose la place =====
select set_config('request.jwt.claims', '{"sub":"40000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
select is((select status::text from public.appointments limit 1), 'scheduled', 'entreprise : voit le créneau choisi');
select is((select count(*)::int from public.notifications where type = 'slot_chosen'), 1, 'entreprise : notifiée du choix');
select is((select count(*)::int from public.messages where kind = 'text'), 1, 'entreprise : lit le message de l''élève');
select lives_ok($$select public.company_decide('40000000-0000-4000-8000-0000000000e1', 'offer', 'Bonne nouvelle !')$$,
  'entreprise : propose la place');

-- Entreprise Basique : actions en un clic réservées au plan Pro
select set_config('request.jwt.claims', '{"sub":"40000000-0000-4000-8000-0000000000b1","role":"authenticated"}', true);
select throws_like($$select public.company_decide('40000000-0000-4000-8000-0000000000e3', 'waitlist', 'x')$$,
  'plan_feature_disabled%', 'plan Basique : actions en un clic désactivées');

-- ===== Léo accepte : place pourvue, Ana reçoit une réponse polie =====
select set_config('request.jwt.claims', '{"sub":"40000000-0000-4000-8000-0000000000c1","role":"authenticated"}', true);
select lives_ok($$select public.student_respond_offer('40000000-0000-4000-8000-0000000000e1', true)$$, 'élève : accepte la place');
reset role;
select is((select status::text from public.listings where id = '40000000-0000-4000-8000-00000000f00a'), 'filled', 'annonce fermée automatiquement (1 place)');
select is((select status::text from public.applications where id = '40000000-0000-4000-8000-0000000000e2'), 'not_this_time',
  'autre candidate : réponse donnée, personne n''attend dans le vide');
select is((select count(*)::int from public.notifications where profile_id = '40000000-0000-4000-8000-0000000000c2' and type = 'filled'), 1,
  'autre candidate : notification polie « place pourvue »');

-- ===== Rappels =====
insert into public.applications (id, student_id, listing_id, created_at)
values ('40000000-0000-4000-8000-0000000000e4', '40000000-0000-4000-8000-0000000000c2', '40000000-0000-4000-8000-00000000f00b', now() - interval '12 days');
select ok(public.run_reminders() >= 1, 'rappel de relance après 10 jours sans réponse');
select is(public.run_reminders(), 0, 'pas de rappel en double');

select * from finish();
rollback;
