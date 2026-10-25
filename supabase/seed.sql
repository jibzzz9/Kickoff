-- Données de démo FICTIVES (Valais). Mot de passe de tous les comptes : demo1234
-- Rechargées par : npx supabase db reset

-- Appels base -> Edge Functions en local (push, emails) : URL interne du projet et clé serveur de DÉVELOPPEMENT (clé de démo publique de la CLI Supabase,
-- identique pour tous les projets locaux). En production, ces deux secrets sont créés à la main dans le coffre.
select vault.create_secret('http://kong:8000', 'project_url');
select vault.create_secret('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU', 'service_role_key');


create function pg_temp.seed_user(p_email text, p_meta jsonb) returns uuid language plpgsql as $$
declare v_id uuid := gen_random_uuid();
begin
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                          raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                          confirmation_token, recovery_token, email_change, email_change_token_new)
  values ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', p_email,
          extensions.crypt('demo1234', extensions.gen_salt('bf')), now(),
          '{"provider":"email","providers":["email"]}', p_meta, now(), now(), '', '', '', '');
  insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (v_id::text, v_id, jsonb_build_object('sub', v_id::text, 'email', p_email, 'email_verified', true), 'email', now(), now(), now());
  return v_id;
end $$;

-- Entreprises (le trigger crée l'entreprise et son admin)
select pg_temp.seed_user('ems@demo.kickoff.ch', '{"role":"company_user","company_name":"EMS Les Tilleuls","commune":"Sion","contact_name":"Claire Fournier"}');
select pg_temp.seed_user('pharmacie@demo.kickoff.ch', '{"role":"company_user","company_name":"Pharmacie du Rhône","commune":"Martigny","contact_name":"Julien Roduit"}');
select pg_temp.seed_user('garage@demo.kickoff.ch', '{"role":"company_user","locale":"de","company_name":"Garage Alpin","commune":"Brig-Glis","contact_name":"Marco Imboden"}');
select pg_temp.seed_user('logistique@demo.kickoff.ch', '{"role":"company_user","company_name":"Logistique du Simplon SA","commune":"Visp","contact_name":"Sandra Zenklusen"}');
select pg_temp.seed_user('boulangerie@demo.kickoff.ch', '{"role":"company_user","company_name":"Boulangerie Test (non vérifiée)","commune":"Sierre","contact_name":"Paul"}');

update public.companies set verified_at = now(), ide_number = 'CHE-000.000.00' || (row_number) from (
  select id, row_number() over (order by name) as row_number from public.companies where name not like 'Boulangerie%'
) v where companies.id = v.id;

-- Élèves
select pg_temp.seed_user('lea@demo.kickoff.ch', jsonb_build_object('role','student','first_name','Léa','birth_date',(current_date - interval '16 years 3 months')::date::text,'commune','Sion'));
select pg_temp.seed_user('noah@demo.kickoff.ch', jsonb_build_object('role','student','first_name','Noah','birth_date',(current_date - interval '15 years 2 months')::date::text,'commune','Sierre'));
select pg_temp.seed_user('mia@demo.kickoff.ch', jsonb_build_object('role','student','locale','de','first_name','Mia','birth_date',(current_date - interval '14 years 6 months')::date::text,'commune','Brig-Glis'));


update public.students set school_year = '11', grades = '{"average": 5.1}',
  aptitude_tests = '[{"name":"Multicheck Santé","score":78}]',
  trial_internships = '[{"professionCode":"assc","company":"Hôpital du Valais","year":2026}]',
  languages = '{fr,de}', interests = '{sport,musique}', soft_skills = '{punctual,friendly,team_player}'
where first_name = 'Léa';
update public.students set school_year = '11', grades = '{"average": 4.6}',
  trial_internships = '[{"professionCode":"logisticien","company":"Migros Valais","year":2026}]',
  languages = '{fr}', interests = '{jeux vidéo,football}', soft_skills = '{organized,careful}', has_moped_license = true
where first_name = 'Noah';

-- Annonces
create function pg_temp.seed_listing(p_company text, p_profession text, p_commune text, p_title text, p_desc text,
                                     p_places int, p_criteria jsonb, p_weights jsonb) returns uuid language plpgsql as $$
declare v_id uuid;
begin
  insert into public.listings (company_id, profession_id, commune_id, title, description, start_date, places_count,
                               contact_name, trial_dates, weights, created_by)
  select c.id, p.id, m.id, p_title, p_desc, date '2027-08-16', p_places, cm.contact_name,
         array[date '2027-01-11', date '2027-02-08', date '2027-03-15'], p_weights, cm.profile_id
  from public.companies c
  join public.company_members cm on cm.company_id = c.id
  join public.professions p on p.code = p_profession
  join public.communes m on m.code = p_commune
  where c.name = p_company
  returning id into v_id;
  insert into public.listing_criteria (listing_id, kind, key, value)
  select v_id, (x ->> 'kind')::public.criterion_kind, x ->> 'key', x -> 'value' from jsonb_array_elements(p_criteria) x;
  return v_id;
end $$;

select pg_temp.seed_listing('EMS Les Tilleuls', 'assc', 'sion', 'Apprentissage ASSC dans une équipe bienveillante',
  'Tu aimes aider les autres ? Chez nous, tu accompagnes les résidents au quotidien : soins, repas, animations. Une équipe soudée te forme pendant 3 ans.',
  2, '[{"kind":"required","key":"trial_done","value":true},{"kind":"bonus","key":"languages","value":["de"]},{"kind":"bonus","key":"volunteering","value":true}]',
  '{"motivation":3,"grades":1,"soft_skills":3,"practical_experience":2}');
select pg_temp.seed_listing('Pharmacie du Rhône', 'employe-commerce', 'martigny', 'Employé·e de commerce en pharmacie',
  'Accueil, commandes, facturation : tu découvres toutes les facettes du commerce dans une pharmacie au cœur de Martigny.',
  1, '[{"kind":"required","key":"min_average","value":4.5},{"kind":"bonus","key":"aptitude_test","value":true}]',
  '{"motivation":2,"grades":3,"soft_skills":2,"practical_experience":1}');
select pg_temp.seed_listing('Garage Alpin', 'employe-commerce', 'brig-glis', 'Kaufmann/Kauffrau EFZ im Garage',
  'Du betreust Kundinnen und Kunden am Empfang, planst Termine und lernst die Buchhaltung eines Familienbetriebs kennen.',
  1, '[{"kind":"required","key":"languages","value":["de"]},{"kind":"bonus","key":"languages","value":["fr"]}]',
  '{"motivation":3,"grades":2,"soft_skills":2,"practical_experience":1}');
select pg_temp.seed_listing('Garage Alpin', 'logisticien', 'brig-glis', 'Logistiker/in EFZ – Ersatzteillager',
  'Ersatzteile annehmen, lagern und ausliefern: Bei uns bist du das Herz der Werkstatt.',
  1, '[{"kind":"bonus","key":"moped_license","value":true}]',
  '{"motivation":3,"grades":1,"soft_skills":2,"practical_experience":3}');
select pg_temp.seed_listing('Logistique du Simplon SA', 'logisticien', 'visp', 'Logisticien·ne CFC – plateforme de distribution',
  'Réception, stockage et préparation des commandes pour tout le Haut-Valais. Formation au chariot élévateur incluse.',
  3, '[{"kind":"required","key":"trial_done","value":true},{"kind":"bonus","key":"moped_license","value":true}]',
  '{"motivation":2,"grades":1,"soft_skills":2,"practical_experience":3}');
select pg_temp.seed_listing('Boulangerie Test (non vérifiée)', 'logisticien', 'sierre', 'Annonce invisible (entreprise non vérifiée)',
  'Cette annonce ne doit jamais apparaître dans l''app élève.', 1, '[]', '{"motivation":2,"grades":2,"soft_skills":2,"practical_experience":2}');

-- Une candidature de démo : Noah chez Logistique du Simplon
insert into public.applications (student_id, listing_id, cover_letter)
select s.profile_id, l.id, 'Bonjour, j''ai fait un stage chez Migros et j''ai adoré organiser le stock. Je serais très motivé à rejoindre votre équipe !'
from public.students s, public.listings l where s.first_name = 'Noah' and l.title like 'Logisticien·ne CFC%';

-- Profils variés pour la démo de la jauge (annonce ASSC de l'EMS Les Tilleuls)
select pg_temp.seed_user('elias@demo.kickoff.ch', jsonb_build_object('role','student','first_name','Elias','birth_date',(current_date - interval '16 years 8 months')::date::text,'commune','Monthey'));
select pg_temp.seed_user('sara@demo.kickoff.ch', jsonb_build_object('role','student','first_name','Sara','birth_date',(current_date - interval '17 years 1 month')::date::text,'commune','Sierre'));
update public.students set school_year = '11', grades = '{"average": 4.2}',
  trial_internships = '[{"professionCode":"logisticien","company":"Coop Valais","year":2026}]',
  languages = '{fr,pt}', soft_skills = '{patient,friendly,careful}', does_volunteering = true
where first_name = 'Sara';

insert into public.applications (student_id, listing_id, cover_letter, created_at)
select s.profile_id, l.id, x.letter, now() - x.ago
from (values
  ('Léa', 'Bonjour, j''ai fait mon stage d''essai à l''Hôpital du Valais et j''ai adoré le contact avec les patients. Prendre soin des autres, c''est ce qui me motive depuis toute petite, et votre EMS a une super réputation à Sion. Je suis ponctuelle, souriante et j''aime travailler en équipe. J''aimerais beaucoup venir faire un stage chez vous pour vous montrer ma motivation.', interval '3 days'),
  ('Elias', 'Bonjour, je cherche une place.', interval '2 days'),
  ('Sara', 'Bonjour ! Je fais du bénévolat à la Croix-Rouge le samedi et j''aime aider les personnes âgées. J''ai fait un stage en logistique mais je veux travailler avec les gens. Je parle aussi portugais, ce qui peut aider avec certains résidents.', interval '1 day')
) as x(first_name, letter, ago)
join public.students s on s.first_name = x.first_name
join public.listings l on l.title = 'Apprentissage ASSC dans une équipe bienveillante';

