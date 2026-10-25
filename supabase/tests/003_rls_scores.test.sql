begin;
select plan(7);

insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data) values
  ('30000000-0000-4000-8000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 's-a@test.ch',
   '{"role":"company_user","company_name":"Score A","commune":"Sion","contact_name":"A"}'),
  ('30000000-0000-4000-8000-0000000000b1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 's-b@test.ch',
   '{"role":"company_user","company_name":"Score B","commune":"Sion","contact_name":"B"}'),
  ('30000000-0000-4000-8000-0000000000c1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 's-c@test.ch',
   jsonb_build_object('role','student','first_name','Zoé','birth_date',(current_date - interval '17 years')::date::text,'commune','Sion'));

update public.companies set verified_at = now() where name in ('Score A', 'Score B');
update public.companies set plan = 'basic' where name = 'Score B';

insert into public.listings (id, company_id, profession_id, commune_id, title, description, start_date)
select '30000000-0000-4000-8000-00000000f001', c.id, p.id, m.id, 'Annonce score', 'desc', '2027-08-16'
from public.companies c, public.professions p, public.communes m
where c.name = 'Score A' and p.code = 'assc' and m.code = 'sion';
insert into public.applications (id, student_id, listing_id)
values ('30000000-0000-4000-8000-00000000a001', '30000000-0000-4000-8000-0000000000c1', '30000000-0000-4000-8000-00000000f001');
insert into public.match_scores (application_id, score, segments, badge, details, algo_version, inputs_hash)
values ('30000000-0000-4000-8000-00000000a001', 80, 4, 'very_interesting', '{}', '1.0.0', 'x');

select ok(public.company_has_feature((select id from public.companies where name = 'Score A'), 'ai_gauge'), 'plan Pro : jauge activée');
select ok(not public.company_has_feature((select id from public.companies where name = 'Score B'), 'ai_gauge'), 'plan Basique : jauge désactivée');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"30000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
select is((select badge from public.match_scores where application_id = '30000000-0000-4000-8000-00000000a001'), 'very_interesting',
  'entreprise : voit la jauge de ses candidatures');
select throws_ok($$insert into public.match_scores (application_id, score, segments, badge, details, algo_version, inputs_hash)
  values ('30000000-0000-4000-8000-00000000a001', 100, 5, 'very_interesting', '{}', 'x', 'x')$$, '42501', null,
  'entreprise : ne peut pas écrire un score (serveur uniquement)');

select set_config('request.jwt.claims', '{"sub":"30000000-0000-4000-8000-0000000000b1","role":"authenticated"}', true);
select is((select count(*)::int from public.match_scores where application_id = '30000000-0000-4000-8000-00000000a001'), 0,
  'autre entreprise : ne voit pas la jauge');

select set_config('request.jwt.claims', '{"sub":"30000000-0000-4000-8000-0000000000c1","role":"authenticated"}', true);
select is((select count(*)::int from public.match_scores), 0, 'élève : ne voit jamais la jauge');
select throws_ok($$select * from public.score_audit_log$$, '42501', null, 'élève : journal des scores inaccessible');

reset role;
select * from finish();
rollback;
