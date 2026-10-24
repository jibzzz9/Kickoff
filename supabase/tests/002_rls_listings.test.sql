begin;
select plan(20);

-- Utilisateurs : 2 entreprises (A vérifiée, B non vérifiée), 2 élèves (adulte, mineur en attente)
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data) values
  ('10000000-0000-4000-8000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a@test.ch',
   '{"role":"company_user","company_name":"EMS A","commune":"Sion","contact_name":"A"}'),
  ('10000000-0000-4000-8000-0000000000b1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b@test.ch',
   '{"role":"company_user","company_name":"Garage B","commune":"Brig","contact_name":"B"}'),
  ('10000000-0000-4000-8000-0000000000c1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lea@test.ch',
   jsonb_build_object('role','student','first_name','Léa','birth_date',(current_date - interval '17 years')::date::text,'commune','sion')),
  ('10000000-0000-4000-8000-0000000000c2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'mia@test.ch',
   jsonb_build_object('role','student','first_name','Mia','birth_date',(current_date - interval '14 years')::date::text,'commune','Brig-Glis','parent_email','p@test.ch'));

update public.companies set verified_at = now() where name = 'EMS A';

select isnt((select commune_id from public.students where profile_id = '10000000-0000-4000-8000-0000000000c1'), null,
  'commune saisie en texte reliée à la table communes (insensible à la casse)');
select is((select commune from public.students where profile_id = '10000000-0000-4000-8000-0000000000c1'), 'sion',
  'le texte saisi est conservé tel quel à l''inscription');

create temp table ids (name text primary key, id uuid);
grant all on ids to authenticated;
insert into ids select 'company_a', id from public.companies where name = 'EMS A';
insert into ids select 'company_b', id from public.companies where name = 'Garage B';

-- Entreprise A crée une annonce
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
select lives_ok($$
  insert into ids values ('listing_a', public.create_listing(jsonb_build_object(
    'company_id', (select id from ids where name = 'company_a'),
    'profession_id', (select id from public.professions where code = 'assc'),
    'commune_id', (select id from public.communes where code = 'sion'),
    'title', 'Apprentissage ASSC', 'description', 'Viens nous rejoindre', 'start_date', '2027-08-16',
    'contact_name', 'A', 'trial_dates', jsonb_build_array('2027-01-10', '2027-01-17'),
    'criteria', jsonb_build_array(
      jsonb_build_object('kind','required','key','trial_done','value',true),
      jsonb_build_object('kind','bonus','key','languages','value',jsonb_build_array('de'))))))
$$, 'entreprise A: crée une annonce avec critères');
select is((select count(*)::int from public.listing_criteria where listing_id = (select id from ids where name = 'listing_a')), 2,
  'les critères sont enregistrés');
select throws_ok($$
  select public.create_listing(jsonb_build_object(
    'company_id', (select id from ids where name = 'company_b'),
    'profession_id', (select id from public.professions where code = 'assc'),
    'commune_id', (select id from public.communes where code = 'sion'),
    'title', 'Fausse annonce', 'description', 'x', 'start_date', '2027-08-16'))
$$, '42501', null, 'entreprise A: ne peut pas publier pour une autre entreprise');

-- Entreprise B (non vérifiée) crée une annonce
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-0000000000b1","role":"authenticated"}', true);
select lives_ok($$
  insert into ids values ('listing_b', public.create_listing(jsonb_build_object(
    'company_id', (select id from ids where name = 'company_b'),
    'profession_id', (select id from public.professions where code = 'logisticien'),
    'commune_id', (select id from public.communes where code = 'brig-glis'),
    'title', 'Logisticien', 'description', 'Lager', 'start_date', '2027-08-16',
    'criteria', jsonb_build_array(jsonb_build_object('kind','bonus','key','moped_license','value',true)))))
$$, 'entreprise B: crée une annonce');
select is((select count(*)::int from public.listings), 1, 'entreprise B: ne voit que ses propres annonces');

-- Élève adulte
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-0000000000c1","role":"authenticated"}', true);
select is((select count(*)::int from public.listing_cards where id in (select id from ids where name like 'listing_%')), 1,
  'élève: ne voit que les annonces d''entreprises vérifiées');
select is((select count(*)::int from public.listings), 0, 'élève: aucun accès direct à la table listings');
select is((select count(*)::int from public.listing_criteria where listing_id in (select id from ids where name like 'listing_%')), 2,
  'élève: voit les critères des annonces publiques (pas ceux des annonces non publiques)');
select lives_ok($$
  insert into public.applications (student_id, listing_id, cover_letter)
  values (auth.uid(), (select id from ids where name = 'listing_a'), 'Bonjour, je suis motivée !')
$$, 'élève: peut postuler à une annonce publique');
select throws_ok($$
  insert into public.applications (student_id, listing_id) values (auth.uid(), (select id from ids where name = 'listing_a'))
$$, '23505', null, 'élève: ne peut pas postuler deux fois');
select throws_ok($$
  insert into public.applications (student_id, listing_id) values (auth.uid(), (select id from ids where name = 'listing_b'))
$$, '42501', null, 'élève: ne peut pas postuler à une annonce non publique');
select is((select count(*)::int from public.candidate_cards), 0, 'élève: aucun accès aux cartes candidats');

-- Élève mineur, consentement parental en attente
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-0000000000c2","role":"authenticated"}', true);
select throws_ok($$
  insert into public.applications (student_id, listing_id) values (auth.uid(), (select id from ids where name = 'listing_a'))
$$, '42501', null, 'élève en attente de consentement: ne peut pas postuler');
select is((select count(*)::int from public.applications), 0, 'élève: ne voit pas les candidatures des autres');

-- Entreprise A reçoit la candidature
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
select is((select first_name from public.candidate_cards), 'Léa', 'entreprise A: voit la carte de la candidate');
select is((select age from public.candidate_cards), 17, 'entreprise A: voit l''âge, pas la date de naissance');
select is((select count(*)::int from public.students), 0, 'entreprise A: aucun accès direct à la table students');

-- Entreprise B ne voit rien
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-0000000000b1","role":"authenticated"}', true);
select is((select count(*)::int from public.candidate_cards) + (select count(*)::int from public.applications), 0,
  'entreprise B: ne voit pas les candidatures d''une autre entreprise');

reset role;
select * from finish();
rollback;
