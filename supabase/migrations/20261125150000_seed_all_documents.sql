-- ============================================================================
-- Finathlon: Полная структура документов и их наполнение
-- ============================================================================
-- Создаем публичный бакет для документов (если его нет)
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

-- Политики безопасности для Storage
-- 1. Все могут читать файлы
create policy "Public Access"
  on storage.objects for select
  using (bucket_id = 'documents');

-- 2. Только админы могут загружать файлы
create policy "Admin Upload"
  on storage.objects for insert
  with check (
    bucket_id = 'documents' 
    and public.is_admin(auth.uid())
  );

-- 3. Только админы могут удалять файлы
create policy "Admin Delete"
  on storage.objects for delete
  using (
    bucket_id = 'documents' 
    and public.is_admin(auth.uid())
  );
-- ----------------------------------------------------------------------------
-- 1. Разделы (папки)
-- ----------------------------------------------------------------------------
-- Сначала создаем корневые разделы
insert into public.document_sections (title, slug, sort_order, is_published, parent_id)
values
  ('Документы олимпиады', 'olympiad-docs', 1, true, null),
  ('Нормативные документы РСОШ', 'rsosh-docs', 2, true, null),
  ('Критерии победителей и призёров', 'criteria', 3, true, null)
on conflict (slug) do nothing;

-- Теперь создаем подразделы 2-го уровня (зависит от ID корневых)
insert into public.document_sections (title, slug, sort_order, is_published, parent_id)
select '2026/27 учебный год', 'olympiad-2026-2027', 1, true, id
from public.document_sections where slug = 'olympiad-docs'
on conflict (slug) do nothing;

insert into public.document_sections (title, slug, sort_order, is_published, parent_id)
select 'Архив прошлых лет', 'olympiad-archive', 2, true, id
from public.document_sections where slug = 'olympiad-docs'
on conflict (slug) do nothing;

insert into public.document_sections (title, slug, sort_order, is_published, parent_id)
select 'Действующие', 'rsosh-active', 1, true, id
from public.document_sections where slug = 'rsosh-docs'
on conflict (slug) do nothing;

insert into public.document_sections (title, slug, sort_order, is_published, parent_id)
select 'Архив прошлых лет', 'rsosh-archive', 2, true, id
from public.document_sections where slug = 'rsosh-docs'
on conflict (slug) do nothing;

insert into public.document_sections (title, slug, sort_order, is_published, parent_id)
select '2026/27 учебный год', 'criteria-2026-2027', 1, true, id
from public.document_sections where slug = 'criteria'
on conflict (slug) do nothing;

insert into public.document_sections (title, slug, sort_order, is_published, parent_id)
select 'Архив прошлых лет', 'criteria-archive', 2, true, id
from public.document_sections where slug = 'criteria'
on conflict (slug) do nothing;

-- Теперь создаем подразделы 3-го уровня (профили внутри 2026/27)
insert into public.document_sections (title, slug, sort_order, is_published, parent_id)
select 'Профиль 1 «Финансовая грамотность, экономика и защита прав потребителей финансовых услуг»', 'olympiad-2026-2027-profile-1', 1, true, id
from public.document_sections where slug = 'olympiad-2026-2027'
on conflict (slug) do nothing;

insert into public.document_sections (title, slug, sort_order, is_published, parent_id)
select 'Профиль 2 «Информатика, цифровые финансовые технологии и финансовая грамотность»', 'olympiad-2026-2027-profile-2', 2, true, id
from public.document_sections where slug = 'olympiad-2026-2027'
on conflict (slug) do nothing;

-- ----------------------------------------------------------------------------
-- 2. Документы (с привязкой к разделам)
-- ----------------------------------------------------------------------------

-- === 2.1. Документы олимпиады -> 2026/27 учебный год -> Профиль 1 ===
insert into public.documents (title, description, section_id, file_url, file_name, source, sort_order, is_published)
values
  ('Состав апелляционной комиссии', 'Документ профиля 1', (select id from public.document_sections where slug = 'olympiad-2026-2027-profile-1'), 'https://foyephwengmryvkmvpbr.supabase.co/storage/v1/object/public/documents/olimp-documents/olympiad-2026-2027/profile-1/sostav%20apel.pdf', 'Состав апелляционной комиссии.pdf', 'olympiad', 1, true),
  ('Состав жюри', 'Документ профиля 1', (select id from public.document_sections where slug = 'olympiad-2026-2027-profile-1'), 'https://foyephwengmryvkmvpbr.supabase.co/storage/v1/object/public/documents/olimp-documents/olympiad-2026-2027/profile-1/sostav%20juri.pdf', 'Состав жюри.pdf', 'olympiad', 2, true),
  ('Состав методической комиссии', 'Документ профиля 1', (select id from public.document_sections where slug = 'olympiad-2026-2027-profile-1'), 'https://foyephwengmryvkmvpbr.supabase.co/storage/v1/object/public/documents/olimp-documents/olympiad-2026-2027/profile-1/sostav%20metodich%20comisii.pdf', 'Состав методической комиссии.pdf', 'olympiad', 3, true),
  ('Состав организационного комитета', 'Документ профиля 1', (select id from public.document_sections where slug = 'olympiad-2026-2027-profile-1'), 'https://foyephwengmryvkmvpbr.supabase.co/storage/v1/object/public/documents/olimp-documents/olympiad-2026-2027/profile-1/sostav%20organiz%20komiteta.pdf', 'Состав организационного комитета.pdf', 'olympiad', 4, true)
on conflict do nothing;

-- === 2.2. Документы олимпиады -> 2026/27 учебный год -> Профиль 2 ===
insert into public.documents (title, description, section_id, file_url, file_name, source, sort_order, is_published)
values
  ('Состав апелляционной комиссии', 'Документ профиля 2', (select id from public.document_sections where slug = 'olympiad-2026-2027-profile-2'), 'https://foyephwengmryvkmvpbr.supabase.co/storage/v1/object/public/documents/olimp-documents/olympiad-2026-2027/profile-2/sostav%20apel%20komisii.pdf', 'Состав апелляционной комиссии.pdf', 'olympiad', 1, true),
  ('Состав жюри', 'Документ профиля 2', (select id from public.document_sections where slug = 'olympiad-2026-2027-profile-2'), 'https://foyephwengmryvkmvpbr.supabase.co/storage/v1/object/public/documents/olimp-documents/olympiad-2026-2027/profile-2/sostav%20juri.pdf', 'Состав жюри.pdf', 'olympiad', 2, true),
  ('Состав методической комиссии', 'Документ профиля 2', (select id from public.document_sections where slug = 'olympiad-2026-2027-profile-2'), 'https://foyephwengmryvkmvpbr.supabase.co/storage/v1/object/public/documents/olimp-documents/olympiad-2026-2027/profile-2/sostav%20metodich%20komisii.pdf', 'Состав методической комиссии.pdf', 'olympiad', 3, true),
  ('Состав организационного комитета', 'Документ профиля 2', (select id from public.document_sections where slug = 'olympiad-2026-2027-profile-2'), 'https://foyephwengmryvkmvpbr.supabase.co/storage/v1/object/public/documents/olimp-documents/olympiad-2026-2027/profile-2/sostav%20organiz%20komiteta.pdf', 'Состав организационного комитета.pdf', 'olympiad', 4, true)
on conflict do nothing;

-- === 2.3. Документы олимпиады -> 2026/27 учебный год (общие) ===
insert into public.documents (title, description, section_id, file_url, file_name, source, sort_order, is_published)
values
  ('Календарный план', 'Общий документ на учебный год', (select id from public.document_sections where slug = 'olympiad-2026-2027'), 'https://foyephwengmryvkmvpbr.supabase.co/storage/v1/object/public/documents/olimp-documents/olympiad-2026-2027/kalendarni%20plan.pdf', 'Календарный план.pdf', 'olympiad', 5, true),
  ('Положение об апелляции', 'Общий документ на учебный год', (select id from public.document_sections where slug = 'olympiad-2026-2027'), 'https://foyephwengmryvkmvpbr.supabase.co/storage/v1/object/public/documents/olimp-documents/olympiad-2026-2027/polojenie%20ob%20apelazii.pdf', 'Положение об апелляции.pdf', 'olympiad', 6, true),
  ('Положение об Олимпиаде', 'Общий документ на учебный год', (select id from public.document_sections where slug = 'olympiad-2026-2027'), 'https://foyephwengmryvkmvpbr.supabase.co/storage/v1/object/public/documents/olimp-documents/olympiad-2026-2027/polojenia%20ob%20olimpiade.pdf', 'Положение об Олимпиаде.pdf', 'olympiad', 7, true),
  ('Предполагаемые места проведения заключительного этапа олимпиады', 'Общий документ на учебный год', (select id from public.document_sections where slug = 'olympiad-2026-2027'), 'https://foyephwengmryvkmvpbr.supabase.co/storage/v1/object/public/documents/olimp-documents/olympiad-2026-2027/predpol%20mesta%20proved%20zakluch%20etapa.pdf', 'Предполагаемые места проведения заключительного этапа олимпиады.pdf', 'olympiad', 8, true),
  ('Регламент Олимпиады', 'Общий документ на учебный год', (select id from public.document_sections where slug = 'olympiad-2026-2027'), 'https://foyephwengmryvkmvpbr.supabase.co/storage/v1/object/public/documents/olimp-documents/olympiad-2026-2027/reglament%20olimp.pdf', 'Регламент Олимпиады.pdf', 'olympiad', 9, true),
  ('Согласие на обработку персональных данных', 'Общий документ на учебный год', (select id from public.document_sections where slug = 'olympiad-2026-2027'), 'https://foyephwengmryvkmvpbr.supabase.co/storage/v1/object/public/documents/olimp-documents/olympiad-2026-2027/soglasie%20na%20obrab%20pers%20dannih.docx', 'Согласие на обработку персональных данных.docx', 'olympiad', 10, true),
  ('Условия и требования', 'Общий документ на учебный год', (select id from public.document_sections where slug = 'olympiad-2026-2027'), 'https://foyephwengmryvkmvpbr.supabase.co/storage/v1/object/public/documents/olimp-documents/olympiad-2026-2027/usloviya%20i%20trebov.pdf', 'Условия и требования.pdf', 'olympiad', 11, true)
on conflict do nothing;

-- === 2.4. Документы олимпиады -> Архив прошлых лет ===
insert into public.documents (title, description, section_id, file_url, file_name, source, sort_order, is_published)
values
  ('Календарный план', 'Архивный документ', (select id from public.document_sections where slug = 'olympiad-archive'), 'https://foyephwengmryvkmvpbr.supabase.co/storage/v1/object/public/documents/olimp-documents/olympiad-archive/kalend%20plan.pdf', 'Календарный план.pdf', 'olympiad', 1, true),
  ('Площадки проведения заключительного этапа', 'Архивный документ', (select id from public.document_sections where slug = 'olympiad-archive'), 'https://foyephwengmryvkmvpbr.supabase.co/storage/v1/object/public/documents/olimp-documents/olympiad-archive/ploshadki%20provedenia.pdf', 'Площадки проведения заключительного этапа.pdf', 'olympiad', 2, true),
  ('Положение об апелляции', 'Архивный документ', (select id from public.document_sections where slug = 'olympiad-archive'), 'https://foyephwengmryvkmvpbr.supabase.co/storage/v1/object/public/documents/olimp-documents/olympiad-archive/polojenie%20ob%20apelazii.pdf', 'Положение об апелляции.pdf', 'olympiad', 3, true),
  ('Положение об Олимпиаде', 'Архивный документ', (select id from public.document_sections where slug = 'olympiad-archive'), 'https://foyephwengmryvkmvpbr.supabase.co/storage/v1/object/public/documents/olimp-documents/olympiad-archive/polojenie%20ob%20olimpiade.pdf', 'Положение об Олимпиаде.pdf', 'olympiad', 4, true),
  ('Регламент Олимпиады', 'Архивный документ', (select id from public.document_sections where slug = 'olympiad-archive'), 'https://foyephwengmryvkmvpbr.supabase.co/storage/v1/object/public/documents/olimp-documents/olympiad-archive/reglament%20olimp.pdf', 'Регламент Олимпиады.pdf', 'olympiad', 5, true),
  ('Согласие на обработку персональных данных', 'Архивный документ', (select id from public.document_sections where slug = 'olympiad-archive'), 'https://foyephwengmryvkmvpbr.supabase.co/storage/v1/object/public/documents/olimp-documents/olympiad-archive/sogl%20na%20obrab%20pers%20dann.docx', 'Согласие на обработку персональных данных.docx', 'olympiad', 6, true)
on conflict do nothing;

-- === 2.5. Нормативные документы РСОШ -> Действующие ===
insert into public.documents (title, description, section_id, file_url, file_name, source, sort_order, is_published)
values
  ('Федеральный закон от 29 декабря 2012 г. № 273-ФЗ «Об образовании в Российской Федерации»', null, (select id from public.document_sections where slug = 'rsosh-active'), 'http://www.rg.ru/2012/12/30/obrazovanie-dok.html', null, 'rsosh', 1, true),
  ('Об утверждении перечня олимпиад школьников и их уровней на 2025/26 учебный год', 'Приказ Министерства науки и высшего образования РФ № 669 от 30.08.2025', (select id from public.document_sections where slug = 'rsosh-active'), 'http://publication.pravo.gov.ru/document/0001202510020015', null, 'rsosh', 2, true),
  ('Порядок проведения олимпиад школьников', 'Приказ Минобрнауки России №16 от 16.01.2026', (select id from public.document_sections where slug = 'rsosh-active'), 'http://publication.pravo.gov.ru/document/0001202602240023', null, 'rsosh', 3, true),
  ('Состав Российского совета олимпиад школьников', 'Приказ Министерства науки и высшего образования Российской Федерации № 957 от 8 декабря 2025 года', (select id from public.document_sections where slug = 'rsosh-active'), 'https://foyephwengmryvkmvpbr.supabase.co/storage/v1/object/public/documents/normat-doc-rsosh/deistv/sostav%20ross%20soveta%2008122025.pdf', 'Состав Российского совета олимпиад школьников.pdf', 'rsosh', 4, true)
on conflict do nothing;

-- === 2.6. Нормативные документы РСОШ -> Архив ===
insert into public.documents (title, description, section_id, file_url, file_name, source, sort_order, is_published)
values
  ('Об утверждении перечня олимпиад школьников и их уровней на 2024/25 учебный год', 'Приказ № 571 от 30.08.2024', (select id from public.document_sections where slug = 'rsosh-archive'), 'http://publication.pravo.gov.ru/document/0001202410040019', null, 'rsosh', 1, true),
  ('Об утверждении перечня олимпиад школьников и их уровней на 2023/24 учебный год', 'Приказ № 823 от 28.08.2023', (select id from public.document_sections where slug = 'rsosh-archive'), 'http://publication.pravo.gov.ru/document/0001202309290072', null, 'rsosh', 2, true),
  ('Об утверждении перечня олимпиад школьников и их уровней на 2022/23 учебный год', 'Приказ № 828 от 30.08.2022', (select id from public.document_sections where slug = 'rsosh-archive'), 'http://publication.pravo.gov.ru/Document/View/0001202209300006', null, 'rsosh', 3, true),
  ('Порядок проведения олимпиад школьников', 'Приказ Минобрнауки России №566 от 22.06.2022', (select id from public.document_sections where slug = 'rsosh-archive'), 'http://publication.pravo.gov.ru/Document/View/0001202207220037', null, 'rsosh', 4, true),
  ('Об утверждении перечня олимпиад школьников и их уровней на 2021/22 учебный год', 'Приказ № 804 от 31.08.2021', (select id from public.document_sections where slug = 'rsosh-archive'), 'http://publication.pravo.gov.ru/Document/View/0001202110270027', null, 'rsosh', 5, true),
  ('Об утверждении перечня олимпиад школьников и их уровней на 2020/21 учебный год', 'Приказ № 1125 от 27.08.2020', (select id from public.document_sections where slug = 'rsosh-archive'), 'http://publication.pravo.gov.ru/Document/View/0001202010020035', null, 'rsosh', 6, true),
  ('Об утверждении перечня олимпиад школьников и их уровней на 2019/20 учебный год', 'Приказ № 658 от 30.08.2019', (select id from public.document_sections where slug = 'rsosh-archive'), 'http://publication.pravo.gov.ru/Document/View/0001201909240046?index=0&rangeSize=1', null, 'rsosh', 7, true),
  ('Порядок проведения олимпиад школьников', 'Приказ Минобрнауки России №267 от 04.04.2014', (select id from public.document_sections where slug = 'rsosh-archive'), 'http://www.rg.ru/2014/07/04/provedenie-dok.html', null, 'rsosh', 8, true),
  ('О внесении изменений в Порядок проведения олимпиад школьников', 'Приказ Минобрнауки России №1563 от 10.12.2014', (select id from public.document_sections where slug = 'rsosh-archive'), 'http://publication.pravo.gov.ru/Document/View/0001201501200035', null, 'rsosh', 9, true),
  ('Об утверждении Перечня олимпиад школьников и их уровней на 2016/17 учебный год', 'Приказ Минобрнауки России №1118 от 30.08.2016', (select id from public.document_sections where slug = 'rsosh-archive'), 'http://publication.pravo.gov.ru/Document/View/0001201609230033?index=0&rangeSize=1', null, 'rsosh', 10, true),
  ('Перечень олимпиад школьников на 2018/19 учебный год', 'Приказ №32н от 28.08.2018', (select id from public.document_sections where slug = 'rsosh-archive'), 'http://publication.pravo.gov.ru/Document/View/0001201809140019?index=0&rangeSize=1', null, 'rsosh', 11, true),
  ('Об утверждении Перечня олимпиад школьников и их уровней на 2017/18 учебный год', 'Приказ Минобрнауки России № 866 от 30.08.2017', (select id from public.document_sections where slug = 'rsosh-archive'), 'http://publication.pravo.gov.ru/Document/View/0001201709260041', null, 'rsosh', 12, true),
  ('Приказ МОН РФ №901 от 28.08.2015 «Об утверждении Перечня олимпиад школьников и их уровней на 2015/16 учебный год»', null, (select id from public.document_sections where slug = 'rsosh-archive'), 'http://publication.pravo.gov.ru/Document/View/0001201509110016', null, 'rsosh', 13, true),
  ('Об утверждении Перечня олимпиад школьников и их уровней на 2014/15 учебный год', 'Приказ Минобрнауки РФ №120 от 20.02.2015', (select id from public.document_sections where slug = 'rsosh-archive'), 'http://publication.pravo.gov.ru/Document/View/0001201503170025', null, 'rsosh', 14, true),
  ('Перечень олимпиад школьников на 2013/14 учебный год', 'Приказ Минобрнауки РФ №1421 от 30.12.2013', (select id from public.document_sections where slug = 'rsosh-archive'), 'http://www.rg.ru/2014/03/12/olimpiady-dok.html', null, 'rsosh', 15, true),
  ('Перечень олимпиад школьников на 2012/13 учебный год', 'Приказ МОН РФ №916 от 14.11.2012', (select id from public.document_sections where slug = 'rsosh-archive'), 'http://www.rg.ru/2012/12/19/olimpiadi-dok.html', null, 'rsosh', 16, true),
  ('Перечень олимпиад школьников на 2011/12 учебный год', 'Приказ МОН РФ №2598 от 07.11.2011', (select id from public.document_sections where slug = 'rsosh-archive'), 'http://www.rg.ru/2011/12/09/olimp2-dok.html', null, 'rsosh', 17, true),
  ('Перечень олимпиад школьников на 2010/11 учебный год', 'Приказ МОН РФ №1162 от 16.11.2010', (select id from public.document_sections where slug = 'rsosh-archive'), 'http://www.rg.ru/2010/12/10/olimpiady-dok.html', null, 'rsosh', 18, true),
  ('Перечень олимпиад школьников на 2009/10 учебный год', 'Приказ МОН РФ №777 от 21.12.2009', (select id from public.document_sections where slug = 'rsosh-archive'), 'http://www.rg.ru/2010/02/17/olimpiada-shkola-dok.html', null, 'rsosh', 19, true),
  ('Порядок приема на обучение по образовательным программам высшего образования — программам бакалавриата, программам специалитета, программам магистратуры', 'Приказ Минобрнауки России № 1147 от 14.10.2015', (select id from public.document_sections where slug = 'rsosh-archive'), 'http://www.rg.ru/2015/11/16/obr-dok.html', null, 'rsosh', 20, true),
  ('О внесении изменений в Порядок приема на обучение (Приказ Минобрнауки России от 29 июля 2016 г. N 921)', null, (select id from public.document_sections where slug = 'rsosh-archive'), 'http://publication.pravo.gov.ru/Document/View/0001201608230005?index=6&rangeSize=1', null, 'rsosh', 21, true),
  ('О внесении изменений в Порядок приема на обучение (Приказ Минобрнауки России от 30 ноября 2015 г. N 1387)', null, (select id from public.document_sections where slug = 'rsosh-archive'), 'https://rg.ru/2015/12/28/obuchenie-dok.html', null, 'rsosh', 22, true),
  ('Порядок приема на обучение по программам бакалавриата, специалитета, магистратуры на 2015/16 учебный год', 'Приказ Минобрнауки РФ №839 от 28.07.2014', (select id from public.document_sections where slug = 'rsosh-archive'), 'http://www.rg.ru/2014/09/03/vuz-dok.html', null, 'rsosh', 23, true),
  ('Порядок приема граждан на обучение по программам бакалавриата, программам специалитета и программам магистратуры', 'Приказ Минобрнауки РФ №3 от 9.01.2014', (select id from public.document_sections where slug = 'rsosh-archive'), 'http://www.rg.ru/2014/02/25/poryadok-dok.html', null, 'rsosh', 24, true),
  ('О внесении изменений в Порядок проведения олимпиад школьников', 'Приказ Минобрнауки России №656 от 14.05.2020', (select id from public.document_sections where slug = 'rsosh-archive'), 'https://foyephwengmryvkmvpbr.supabase.co/storage/v1/object/public/documents/normat-doc-rsosh/arhiv/o%20vnesenii%20ismeneni%20v%20poryadok%2014052020.pdf', 'О внесении изменений в Порядок проведения олимпиад школьников.pdf', 'rsosh', 25, true),
  ('О внесении изменений в Порядок проведения олимпиад школьников', 'Приказ Минобрнауки России №491 от 30.03.2020', (select id from public.document_sections where slug = 'rsosh-archive'), 'https://foyephwengmryvkmvpbr.supabase.co/storage/v1/object/public/documents/normat-doc-rsosh/arhiv/o%20vnesenii%20ismeneni%20v%20poryadok%2030032020.pdf', 'О внесении изменений в Порядок проведения олимпиад школьников.pdf', 'rsosh', 26, true),
  ('Об утверждении уровней олимпиад школьников, включенных в Перечень олимпиад школьников на 2013/14 учебный год', 'Приказ Минобрнауки РФ №575 от 22 .05.2014', (select id from public.document_sections where slug = 'rsosh-archive'), 'https://foyephwengmryvkmvpbr.supabase.co/storage/v1/object/public/documents/normat-doc-rsosh/arhiv/ob%20utverjdenii%2022052014.pdf', 'Об утверждении уровней олимпиад школьников.pdf', 'rsosh', 27, true),
  ('Порядок проведения олимпиад школьников', 'Приказ Минобрнауки РФ №285 от 22.10.2007 в редакции 11.10.2010', (select id from public.document_sections where slug = 'rsosh-archive'), 'https://foyephwengmryvkmvpbr.supabase.co/storage/v1/object/public/documents/normat-doc-rsosh/arhiv/poryadok%20provedeniya%2011102010.pdf', 'Порядок проведения олимпиад школьников.pdf', 'rsosh', 28, true),
  ('Состав Российского совета олимпиад школьников', 'Приказ Минобрнауки №393 от 19 июня 2019 года', (select id from public.document_sections where slug = 'rsosh-archive'), 'https://foyephwengmryvkmvpbr.supabase.co/storage/v1/object/public/documents/normat-doc-rsosh/arhiv/sostav%20ross%20soveta%2019062019.pdf', 'Состав Российского совета.pdf', 'rsosh', 29, true),
  ('Состав Российского совета олимпиад школьников', 'Приказ Минобрнауки России №405 от 23.04.2014', (select id from public.document_sections where slug = 'rsosh-archive'), 'https://foyephwengmryvkmvpbr.supabase.co/storage/v1/object/public/documents/normat-doc-rsosh/arhiv/sostav%20ross%20soveta%2023042014.pdf', 'Состав Российского совета.pdf', 'rsosh', 30, true)
on conflict do nothing;


-- === 2.8. Критерии победителей и призёров -> Архив ===
insert into public.documents (title, description, section_id, file_url, file_name, source, sort_order, is_published)
values
  ('Критерии определения победителей и призёров IX Олимпиады (2013-2014 гг.)', null, (select id from public.document_sections where slug = 'criteria-archive'), 'https://foyephwengmryvkmvpbr.supabase.co/storage/v1/object/public/documents/criterii-pobediteley/criteria-archive/2013-2014.pdf', 'Критерии IX Олимпиады.pdf', 'olympiad', 1, true),
  ('Критерии определения победителей и призёров VIII Олимпиады (2012-2013 гг.)', null, (select id from public.document_sections where slug = 'criteria-archive'), 'https://foyephwengmryvkmvpbr.supabase.co/storage/v1/object/public/documents/criterii-pobediteley/criteria-archive/2012-2013.pdf', 'Критерии VIII Олимпиады.pdf', 'olympiad', 2, true),
  ('Критерии определения победителей и призёров X Олимпиады (2014-2015 гг.)', null, (select id from public.document_sections where slug = 'criteria-archive'), 'https://foyephwengmryvkmvpbr.supabase.co/storage/v1/object/public/documents/criterii-pobediteley/criteria-archive/2014-2015.pdf', 'Критерии X Олимпиады.pdf', 'olympiad', 3, true),
  ('Критерии определения победителей и призёров XI Олимпиады (2015-2016 гг.)', null, (select id from public.document_sections where slug = 'criteria-archive'), 'https://foyephwengmryvkmvpbr.supabase.co/storage/v1/object/public/documents/criterii-pobediteley/criteria-archive/2015-2016.pdf', 'Критерии XI Олимпиады.pdf', 'olympiad', 4, true),
  ('Критерии определения победителей и призёров XII Олимпиады (2016-2017 гг.)', null, (select id from public.document_sections where slug = 'criteria-archive'), 'https://foyephwengmryvkmvpbr.supabase.co/storage/v1/object/public/documents/criterii-pobediteley/criteria-archive/2016-2017.pdf', 'Критерии XII Олимпиады.pdf', 'olympiad', 5, true),
  ('Критерии определения победителей и призёров XIII Олимпиады (2017-2018 гг.)', null, (select id from public.document_sections where slug = 'criteria-archive'), 'https://foyephwengmryvkmvpbr.supabase.co/storage/v1/object/public/documents/criterii-pobediteley/criteria-archive/2017-2018.pdf', 'Критерии XIII Олимпиады.pdf', 'olympiad', 6, true),
  ('Критерии определения призёров и победителей XIX Олимпиады (2023-2024 гг.)', null, (select id from public.document_sections where slug = 'criteria-archive'), 'https://foyephwengmryvkmvpbr.supabase.co/storage/v1/object/public/documents/criterii-pobediteley/criteria-archive/2023-2024.pdf', 'Критерии XIX Олимпиады.pdf', 'olympiad', 7, true),
  ('Критерии определения призёров и победителей XVIII Олимпиады (2022-2023 гг.)', null, (select id from public.document_sections where slug = 'criteria-archive'), 'https://foyephwengmryvkmvpbr.supabase.co/storage/v1/object/public/documents/criterii-pobediteley/criteria-archive/2022-2023.pdf', 'Критерии XVIII Олимпиады.pdf', 'olympiad', 8, true),
  ('Критерии определения призёров и победителей XX Олимпиады (2024-2025 гг.)', null, (select id from public.document_sections where slug = 'criteria-archive'), 'https://foyephwengmryvkmvpbr.supabase.co/storage/v1/object/public/documents/criterii-pobediteley/criteria-archive/2024-2025.pdf', 'Критерии XX Олимпиады.pdf', 'olympiad', 9, true)
on conflict do nothing;