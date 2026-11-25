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

-- Public document references from the official Finathlon catalogue and
-- the original publishers (RSOSH, Pravo and Rossiyskaya Gazeta).
-- Existing records and editorial overrides are retained.
with catalog(title, description, section_slug, file_url, file_name, source, sort_order) as (
  values
  ('Состав апелляционной комиссии', 'Документ профиля 1', 'olympiad-2026-2027-profile-1', 'https://fin-olimp.ru/wp-content/uploads/Apelliatcionnaia_komissiia_26_1.pdf', 'Состав апелляционной комиссии.pdf', 'olympiad', 1),
  ('Состав жюри', 'Документ профиля 1', 'olympiad-2026-2027-profile-1', 'https://fin-olimp.ru/wp-content/uploads/Sostav_zhiuri_26_1.pdf', 'Состав жюри.pdf', 'olympiad', 2),
  ('Состав методической комиссии', 'Документ профиля 1', 'olympiad-2026-2027-profile-1', 'https://fin-olimp.ru/wp-content/uploads/Metodicheskaia_komissiia_26_1.pdf', 'Состав методической комиссии.pdf', 'olympiad', 3),
  ('Состав организационного комитета', 'Документ профиля 1', 'olympiad-2026-2027-profile-1', 'https://fin-olimp.ru/wp-content/uploads/Orgkomitet_26_1.pdf', 'Состав организационного комитета.pdf', 'olympiad', 4),
  ('Состав апелляционной комиссии', 'Документ профиля 2', 'olympiad-2026-2027-profile-2', 'https://fin-olimp.ru/wp-content/uploads/Apelliatcionnaia_komissiia_26_2.pdf', 'Состав апелляционной комиссии.pdf', 'olympiad', 1),
  ('Состав жюри', 'Документ профиля 2', 'olympiad-2026-2027-profile-2', 'https://fin-olimp.ru/wp-content/uploads/Sostav_zhiuri_26_2-.pdf', 'Состав жюри.pdf', 'olympiad', 2),
  ('Состав методической комиссии', 'Документ профиля 2', 'olympiad-2026-2027-profile-2', 'https://fin-olimp.ru/wp-content/uploads/Metodicheskaia_komissiia_26_2.pdf', 'Состав методической комиссии.pdf', 'olympiad', 3),
  ('Состав организационного комитета', 'Документ профиля 2', 'olympiad-2026-2027-profile-2', 'https://fin-olimp.ru/wp-content/uploads/Orgkomitet_26_2.pdf', 'Состав организационного комитета.pdf', 'olympiad', 4),
  ('Календарный план', 'Общий документ на учебный год', 'olympiad-2026-2027', 'https://fin-olimp.ru/wp-content/uploads/kalendarnyi_plan2026.pdf', 'Календарный план.pdf', 'olympiad', 5),
  ('Положение об апелляции', 'Общий документ на учебный год', 'olympiad-2026-2027', 'https://fin-olimp.ru/wp-content/uploads/appeal_2026.pdf', 'Положение об апелляции.pdf', 'olympiad', 6),
  ('Положение об Олимпиаде', 'Общий документ на учебный год', 'olympiad-2026-2027', 'https://fin-olimp.ru/wp-content/uploads/Polozhenie-ob-Olimpiade_2026.pdf', 'Положение об Олимпиаде.pdf', 'olympiad', 7),
  ('Предполагаемые места проведения заключительного этапа олимпиады', 'Общий документ на учебный год', 'olympiad-2026-2027', 'https://fin-olimp.ru/wp-content/uploads/platforms22.pdf', 'Предполагаемые места проведения заключительного этапа олимпиады.pdf', 'olympiad', 8),
  ('Регламент Олимпиады', 'Общий документ на учебный год', 'olympiad-2026-2027', 'https://fin-olimp.ru/wp-content/uploads/Reglament-Olimpiady_2026.pdf', 'Регламент Олимпиады.pdf', 'olympiad', 9),
  ('Согласие на обработку персональных данных', 'Общий документ на учебный год', 'olympiad-2026-2027', 'https://fin-olimp.ru/wp-content/uploads/soglasie_2026-.docx', 'Согласие на обработку персональных данных.docx', 'olympiad', 10),
  ('Условия и требования', 'Общий документ на учебный год', 'olympiad-2026-2027', 'https://fin-olimp.ru/wp-content/uploads/UsloviaITrebovania2026.pdf', 'Условия и требования.pdf', 'olympiad', 11),
  ('Календарный план', 'Архивный документ', 'olympiad-archive', 'https://fin-olimp.ru/wp-content/uploads/kalendarnyi_plan__25.pdf', 'Календарный план.pdf', 'olympiad', 1),
  ('Площадки проведения заключительного этапа', 'Архивный документ', 'olympiad-archive', 'https://fin-olimp.ru/wp-content/uploads/platforms21.pdf', 'Площадки проведения заключительного этапа.pdf', 'olympiad', 2),
  ('Положение об апелляции', 'Архивный документ', 'olympiad-archive', 'https://fin-olimp.ru/wp-content/uploads/appeal_2026.pdf', 'Положение об апелляции.pdf', 'olympiad', 3),
  ('Положение об Олимпиаде', 'Архивный документ', 'olympiad-archive', 'https://fin-olimp.ru/wp-content/uploads/Polozhenie-ob-Olimpiade-2025-2026-.pdf', 'Положение об Олимпиаде.pdf', 'olympiad', 4),
  ('Регламент Олимпиады', 'Архивный документ', 'olympiad-archive', 'https://fin-olimp.ru/wp-content/uploads/Reglament-Olimpiady2025-2026-1.pdf', 'Регламент Олимпиады.pdf', 'olympiad', 5),
  ('Согласие на обработку персональных данных', 'Архивный документ', 'olympiad-archive', 'https://fin-olimp.ru/wp-content/uploads/soglasie_2026-.docx', 'Согласие на обработку персональных данных.docx', 'olympiad', 6),
  ('Федеральный закон от 29 декабря 2012 г. № 273-ФЗ «Об образовании в Российской Федерации»', null, 'rsosh-active', 'https://www.rg.ru/2012/12/30/obrazovanie-dok.html', null, 'rsosh', 1),
  ('Об утверждении перечня олимпиад школьников и их уровней на 2025/26 учебный год', 'Приказ Министерства науки и высшего образования РФ № 669 от 30.08.2025', 'rsosh-active', 'http://publication.pravo.gov.ru/document/0001202510020015', null, 'rsosh', 2),
  ('Порядок проведения олимпиад школьников', 'Приказ Минобрнауки России №16 от 16.01.2026', 'rsosh-active', 'http://publication.pravo.gov.ru/document/0001202602240023', null, 'rsosh', 3),
  ('Состав Российского совета олимпиад школьников', 'Приказ Министерства науки и высшего образования Российской Федерации № 957 от 8 декабря 2025 года', 'rsosh-active', 'https://rsr-olymp.ru/files/m_docs/39/08_12_2025_957_prikaz_o_rsosh.pdf', 'Состав Российского совета олимпиад школьников.pdf', 'rsosh', 4),
  ('Об утверждении перечня олимпиад школьников и их уровней на 2024/25 учебный год', 'Приказ № 571 от 30.08.2024', 'rsosh-archive', 'http://publication.pravo.gov.ru/document/0001202410040019', null, 'rsosh', 1),
  ('Об утверждении перечня олимпиад школьников и их уровней на 2023/24 учебный год', 'Приказ № 823 от 28.08.2023', 'rsosh-archive', 'http://publication.pravo.gov.ru/document/0001202309290072', null, 'rsosh', 2),
  ('Об утверждении перечня олимпиад школьников и их уровней на 2022/23 учебный год', 'Приказ № 828 от 30.08.2022', 'rsosh-archive', 'http://publication.pravo.gov.ru/Document/View/0001202209300006', null, 'rsosh', 3),
  ('Порядок проведения олимпиад школьников', 'Приказ Минобрнауки России №566 от 22.06.2022', 'rsosh-archive', 'http://publication.pravo.gov.ru/Document/View/0001202207220037', null, 'rsosh', 4),
  ('Об утверждении перечня олимпиад школьников и их уровней на 2021/22 учебный год', 'Приказ № 804 от 31.08.2021', 'rsosh-archive', 'http://publication.pravo.gov.ru/Document/View/0001202110270027', null, 'rsosh', 5),
  ('Об утверждении перечня олимпиад школьников и их уровней на 2020/21 учебный год', 'Приказ № 1125 от 27.08.2020', 'rsosh-archive', 'http://publication.pravo.gov.ru/Document/View/0001202010020035', null, 'rsosh', 6),
  ('Об утверждении перечня олимпиад школьников и их уровней на 2019/20 учебный год', 'Приказ № 658 от 30.08.2019', 'rsosh-archive', 'http://publication.pravo.gov.ru/document/0001201909240046', null, 'rsosh', 7),
  ('Порядок проведения олимпиад школьников', 'Приказ Минобрнауки России №267 от 04.04.2014', 'rsosh-archive', 'https://www.rg.ru/2014/07/04/provedenie-dok.html', null, 'rsosh', 8),
  ('О внесении изменений в Порядок проведения олимпиад школьников', 'Приказ Минобрнауки России №1563 от 10.12.2014', 'rsosh-archive', 'http://publication.pravo.gov.ru/Document/View/0001201501200035', null, 'rsosh', 9),
  ('Об утверждении Перечня олимпиад школьников и их уровней на 2016/17 учебный год', 'Приказ Минобрнауки России №1118 от 30.08.2016', 'rsosh-archive', 'http://publication.pravo.gov.ru/document/0001201609230033', null, 'rsosh', 10),
  ('Перечень олимпиад школьников на 2018/19 учебный год', 'Приказ №32н от 28.08.2018', 'rsosh-archive', 'http://publication.pravo.gov.ru/document/0001201809140019', null, 'rsosh', 11),
  ('Об утверждении Перечня олимпиад школьников и их уровней на 2017/18 учебный год', 'Приказ Минобрнауки России № 866 от 30.08.2017', 'rsosh-archive', 'http://publication.pravo.gov.ru/Document/View/0001201709260041', null, 'rsosh', 12),
  ('Приказ МОН РФ №901 от 28.08.2015 «Об утверждении Перечня олимпиад школьников и их уровней на 2015/16 учебный год»', null, 'rsosh-archive', 'http://publication.pravo.gov.ru/Document/View/0001201509110016', null, 'rsosh', 13),
  ('Об утверждении Перечня олимпиад школьников и их уровней на 2014/15 учебный год', 'Приказ Минобрнауки РФ №120 от 20.02.2015', 'rsosh-archive', 'http://publication.pravo.gov.ru/Document/View/0001201503170025', null, 'rsosh', 14),
  ('Перечень олимпиад школьников на 2013/14 учебный год', 'Приказ Минобрнауки РФ №1421 от 30.12.2013', 'rsosh-archive', 'https://www.rg.ru/2014/03/12/olimpiady-dok.html', null, 'rsosh', 15),
  ('Перечень олимпиад школьников на 2012/13 учебный год', 'Приказ МОН РФ №916 от 14.11.2012', 'rsosh-archive', 'https://www.rg.ru/2012/12/19/olimpiadi-dok.html', null, 'rsosh', 16),
  ('Перечень олимпиад школьников на 2011/12 учебный год', 'Приказ МОН РФ №2598 от 07.11.2011', 'rsosh-archive', 'https://www.rg.ru/2011/12/09/olimp2-dok.html', null, 'rsosh', 17),
  ('Перечень олимпиад школьников на 2010/11 учебный год', 'Приказ МОН РФ №1162 от 16.11.2010', 'rsosh-archive', 'https://www.rg.ru/2010/12/10/olimpiady-dok.html', null, 'rsosh', 18),
  ('Перечень олимпиад школьников на 2009/10 учебный год', 'Приказ МОН РФ №777 от 21.12.2009', 'rsosh-archive', 'https://www.rg.ru/2010/02/17/olimpiada-shkola-dok.html', null, 'rsosh', 19),
  ('Порядок приема на обучение по образовательным программам высшего образования — программам бакалавриата, программам специалитета, программам магистратуры', 'Приказ Минобрнауки России № 1147 от 14.10.2015', 'rsosh-archive', 'https://www.rg.ru/2015/11/16/obr-dok.html', null, 'rsosh', 20),
  ('О внесении изменений в Порядок приема на обучение (Приказ Минобрнауки России от 29 июля 2016 г. N 921)', null, 'rsosh-archive', 'http://publication.pravo.gov.ru/Document/View/0001201608230005?index=6&rangeSize=1', null, 'rsosh', 21),
  ('О внесении изменений в Порядок приема на обучение (Приказ Минобрнауки России от 30 ноября 2015 г. N 1387)', null, 'rsosh-archive', 'https://rg.ru/2015/12/28/obuchenie-dok.html', null, 'rsosh', 22),
  ('Порядок приема на обучение по программам бакалавриата, специалитета, магистратуры на 2015/16 учебный год', 'Приказ Минобрнауки РФ №839 от 28.07.2014', 'rsosh-archive', 'https://www.rg.ru/2014/09/03/vuz-dok.html', null, 'rsosh', 23),
  ('Порядок приема граждан на обучение по программам бакалавриата, программам специалитета и программам магистратуры', 'Приказ Минобрнауки РФ №3 от 9.01.2014', 'rsosh-archive', 'https://www.rg.ru/2014/02/25/poryadok-dok.html', null, 'rsosh', 24),
  ('О внесении изменений в Порядок проведения олимпиад школьников', 'Приказ Минобрнауки России №656 от 14.05.2020', 'rsosh-archive', 'https://rsr-olymp.ru/upload/files/poryadok-2020.pdf', 'О внесении изменений в Порядок проведения олимпиад школьников.pdf', 'rsosh', 25),
  ('О внесении изменений в Порядок проведения олимпиад школьников', 'Приказ Минобрнауки России №491 от 30.03.2020', 'rsosh-archive', 'https://rsr-olymp.ru/upload/files/poryadok-30_03_2020.pdf', 'О внесении изменений в Порядок проведения олимпиад школьников.pdf', 'rsosh', 26),
  ('Об утверждении уровней олимпиад школьников, включенных в Перечень олимпиад школьников на 2013/14 учебный год', 'Приказ Минобрнауки РФ №575 от 22 .05.2014', 'rsosh-archive', 'https://rsr-olymp.ru/upload/files/doc/MON-575-2205-14-levels.pdf', 'Об утверждении уровней олимпиад школьников.pdf', 'rsosh', 27),
  ('Порядок проведения олимпиад школьников', 'Приказ Минобрнауки РФ №285 от 22.10.2007 в редакции 11.10.2010', 'rsosh-archive', 'https://rsr-olymp.ru/upload/files/doc/MON-285-221007-111010.pdf', 'Порядок проведения олимпиад школьников.pdf', 'rsosh', 28),
  ('Состав Российского совета олимпиад школьников', 'Приказ Минобрнауки №393 от 19 июня 2019 года', 'rsosh-archive', 'https://rsr-olymp.ru/files/m_docs/28/19.06.2019_393_%D0%9F%D1%80%D0%B8%D0%BA%D0%B0%D0%B7_%D0%BE_%D0%A0%D0%A1%D0%9E%D0%A8.pdf', 'Состав Российского совета.pdf', 'rsosh', 29),
  ('Состав Российского совета олимпиад школьников', 'Приказ Минобрнауки России №405 от 23.04.2014', 'rsosh-archive', 'https://rsr-olymp.ru/upload/files/doc/MON-405-230414-sostav.pdf', 'Состав Российского совета.pdf', 'rsosh', 30),
  ('Критерии определения победителей и призёров IX Олимпиады (2013-2014 гг.)', null, 'criteria-archive', 'https://www.fin-olimp.ru/wp-content/uploads/2018/06/criteria13-14.pdf', 'Критерии IX Олимпиады.pdf', 'olympiad', 1),
  ('Критерии определения победителей и призёров VIII Олимпиады (2012-2013 гг.)', null, 'criteria-archive', 'https://www.fin-olimp.ru/wp-content/uploads/2018/06/criteria12-13.pdf', 'Критерии VIII Олимпиады.pdf', 'olympiad', 2),
  ('Критерии определения победителей и призёров X Олимпиады (2014-2015 гг.)', null, 'criteria-archive', 'https://www.fin-olimp.ru/wp-content/uploads/2018/06/criteria14-15.pdf', 'Критерии X Олимпиады.pdf', 'olympiad', 3),
  ('Критерии определения победителей и призёров XI Олимпиады (2015-2016 гг.)', null, 'criteria-archive', 'https://www.fin-olimp.ru/wp-content/uploads/2018/06/criteria15-16.pdf', 'Критерии XI Олимпиады.pdf', 'olympiad', 4),
  ('Критерии определения победителей и призёров XII Олимпиады (2016-2017 гг.)', null, 'criteria-archive', 'https://www.fin-olimp.ru/wp-content/uploads/2018/06/criteria16-17.pdf', 'Критерии XII Олимпиады.pdf', 'olympiad', 5),
  ('Критерии определения победителей и призёров XIII Олимпиады (2017-2018 гг.)', null, 'criteria-archive', 'https://www.fin-olimp.ru/wp-content/uploads/2018/06/criteria17-18.pdf', 'Критерии XIII Олимпиады.pdf', 'olympiad', 6),
  ('Критерии определения призёров и победителей XIX Олимпиады (2023-2024 гг.)', null, 'criteria-archive', 'https://fin-olimp.ru/wp-content/uploads/Kriterii-opredeleniya-prizerov-pobeditelej-XX-Olimpiady.pdf', 'Критерии XIX Олимпиады.pdf', 'olympiad', 7),
  ('Критерии определения призёров и победителей XVIII Олимпиады (2022-2023 гг.)', null, 'criteria-archive', 'https://www.fin-olimp.ru/wp-content/uploads/criteria22-23.pdf', 'Критерии XVIII Олимпиады.pdf', 'olympiad', 8),
  ('Критерии определения призёров и победителей XX Олимпиады (2024-2025 гг.)', null, 'criteria-archive', 'https://fin-olimp.ru/wp-content/uploads/Kriterii-opredeleniya-prizerov-i-pobeditelej-XX-Olimpiady-.pdf', 'Критерии XX Олимпиады.pdf', 'olympiad', 9)
)
insert into public.documents
  (title, description, section_id, file_url, file_name, source, sort_order, is_published)
select c.title, c.description, s.id, c.file_url, c.file_name, c.source, c.sort_order, true
from catalog c
join public.document_sections s on s.slug = c.section_slug
where not exists (
  select 1 from public.documents d
  where d.section_id = s.id and d.title = c.title
    and d.description is not distinct from c.description
);
