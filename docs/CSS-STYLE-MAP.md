# Справочник стилей Finathlon

Один файл для быстрого поиска: **какой блок на сайте** → **в каком CSS-файле** → **как называется класс**.

---

## Как пользоваться

1. **Найти блок** в оглавлении ниже (по странице или по смыслу: «шапка», «подвал», «модалка входа»).
2. **Открыть указанный файл** в проекте (путь от корня репозитория).
3. **Искать в файле** по имени класса — в CSS это строка после точки, например `.navLink`.
4. В коде React классы подключаются как **CSS Modules**: в файле `.tsx` что-то вроде `className={styles.navLink}` соответствует классу `.navLink` в соседнем `.module.css`.

**Важно:** имена в браузере могут быть с хешом (это норма для CSS Modules). Редактировать нужно исходный файл `*.module.css`, а не то, что видно в инспекторе.

---

## Глобальные настройки (не модули)

| Файл | Что менять |
|------|------------|
| `src/app/styles/index.css` | Цвета сайта (`--color-*`), тени (`--shadow-card`), скругления (`--radius-*`), отступы секций (`--section-space`), шрифт (`--font-family`), фон страницы (`body`) |

Основные переменные для правок «в целом по сайту»:

- `--color-primary`, `--color-primary-hover` — акцент (кнопки, ссылки в шапке)
- `--color-bg-page`, `--color-bg-surface`, `--color-bg-muted`, `--color-bg-footer`
- `--color-text-primary`, `--color-text-secondary`, `--color-text-muted`
- `--section-space` — вертикальный ритм между секциями на главной

---

## Главная страница

### Каркас страницы

| Файл | Классы | Что это на экране |
|------|--------|-------------------|
| `src/pages/home/styles/HomePage.module.css` | `page` | Обёртка всей главной (минимальная высота экрана) |
| | `main` | Область под шапкой: колонка со всеми секциями |

---

## Страница личного кабинета

| Файл | Классы | Что это на экране |
|------|--------|-------------------|
| `src/pages/account/styles/AccountPage.module.css` | `page` | Обёртка страницы кабинета |
| | `main` | Основная зона под шапкой |
| | `workspace` | Сетка: слева сайдбар, справа контент (серый фон, скругление) |
| | `content` | Правая колонка (фон блока с баннером и секциями) |
| | `sectionArea` | Область с переключаемым контентом (личные данные, события и т.д.) |

---

## Виджет: шапка (Header)

**Файл:** `src/widgets/header/styles/Header.module.css`

| Класс | Элемент |
|-------|---------|
| `header` | Вся липкая шапка сверху |
| `inner` | Контейнер: логотип, меню, кнопка |
| `innerNoAction` | Вариант без кнопки справа (кабинет) |
| `nav` | Блок ссылок навигации |
| `navCentered` | Навигация по центру |
| `navLink` | Одна ссылка меню (+ подчёркивание при наведении через `::after`) |

Кнопка «Личный кабинет» в шапке — общий компонент кнопки (см. shared ниже).

---

## Виджет: подвал (Footer)

**Файл:** `src/widgets/footer/styles/Footer.module.css`

| Класс | Элемент |
|-------|---------|
| `footer` | Весь подвал |
| `inner` | Сетка колонок |
| `contacts` | Колонка «Контакты» |
| `column` | Колонка ссылок или соцсетей |
| `title` | Заголовок «Контакты:» |
| `link` | Ссылка |
| `meta` | Адрес (второстепенный текст) |

---

## Виджет: Hero (первый экран главной)

**Файл:** `src/widgets/hero/styles/HeroSection.module.css`

| Класс | Элемент |
|-------|---------|
| `hero` | Секция целиком |
| `inner` | Сетка: текст слева, визуал справа |
| `content` | Колонка с заголовком |
| `title` | Большой заголовок |
| `visual` | Серая плашка-заглушка под картинку |
| `visualText` | Текст внутри плашки |

---

## Виджет: участие (карточки этапов)

**Файлы:**

- `src/widgets/participation/styles/ParticipationSection.module.css` — сетка карточек
- `src/widgets/participation/styles/ParticipationCard.module.css` — одна карточка

**ParticipationSection**

| Класс | Элемент |
|-------|---------|
| `grid` | Сетка из трёх карточек |

**ParticipationCard**

| Класс | Элемент |
|-------|---------|
| `card` | Карточка целиком |
| `body` | Основная часть карточки |
| `title` | Заголовок карточки |
| `description` | Описание |
| `pointsBlock` | Блок со списком пунктов |
| `pointsTitle` | Подзаголовок списка |
| `list` | Маркированный список |
| `listItem` | Пункт списка |
| `actions` | Ряд с кнопкой внизу карточки |

---

## Виджет: статистика (цифры)

**Файл:** `src/widgets/stats/styles/StatsSection.module.css`

| Класс | Элемент |
|-------|---------|
| `grid` | Сетка блоков со статистикой |
| `card` | Одна ячейка (выравнивание текста) |
| `value` | Большое число |
| `label` | Подпись под числом |

---

## Виджет: таймлайн

**Файл:** `src/widgets/timeline/styles/TimelineSection.module.css`

| Класс | Элемент |
|-------|---------|
| `timeline` | Секция таймлайна |
| `track` | Горизонтальная полоска-линия |
| `event` | Точка/событие на линии |
| `markerWrap` | Обёртка вертикального маркера |
| `markerRed` | Красный маркер |
| `markerBlue` | Синий маркер |
| `eventCard` | Карточка подписи к событию |
| `eventDate` | Дата |
| `eventLabel` | Текст события |
| `years` | Ряд годов внизу |
| `year` | Один год |

---

## Виджет: новости

**Файлы:**

- `src/widgets/news/styles/NewsSection.module.css` — сетка
- `src/widgets/news/styles/NewsCard.module.css` — карточка новости

**NewsSection:** класс `grid` — сетка карточек.

**NewsCard**

| Класс | Элемент |
|-------|---------|
| `card` | Карточка (hover: подъём и тень) |
| `image` | Блок под изображение |
| `imageText` | Заглушка-текст вместо фото |
| `footer` | Нижняя серая полоса с заголовком |
| `title` | Заголовок новости |

---

## Виджет: блок «О проекте»

**Файл:** `src/widgets/about/styles/AboutSection.module.css`

| Класс | Элемент |
|-------|---------|
| `content` | Колонка с текстами |
| `paragraph` | Один абзац |

---

## Виджет: FAQ

**Файлы:**

- `src/widgets/faq/styles/FaqSection.module.css` — список вопросов
- `src/widgets/faq/styles/FaqItem.module.css` — один аккордеон

**FaqSection:** класс `list` — список пунктов.

**FaqItem**

| Класс | Элемент |
|-------|---------|
| `item` | Обертка пункта (модификатор `open` на том же элементе раскрывает ответ) |
| `trigger` | Кликабельная строка вопроса |
| `icon` | Иконка «плюс/минус» |
| `content` | Анимированная обёртка ответа |
| `answer` | Текст ответа |

---

## Виджет: личный кабинет — сайдбар и баннер

**AccountSidebar** — `src/widgets/account-layout/styles/AccountSidebar.module.css`

| Класс | Элемент |
|-------|---------|
| `sidebar` | Левая колонка меню |
| `nav` | Список пунктов |
| `navItem` | Пункт меню |
| `navItemActive` | Активный пункт |
| `icon` | Круг-заглушка под иконку |
| `calendarCard` | Карточка «Календарь» внизу сайдбара |

**AccountProfileBanner** — `src/widgets/account-layout/styles/AccountProfileBanner.module.css`

| Класс | Элемент |
|-------|---------|
| `banner` | Полоса с аватаром и именем |
| `avatar` | Круг аватара |
| `name` | Имя пользователя |
| `subtitle` | Подпись под именем |

---

## Виджет: секции контента кабинета

Общий паттерн: в каждом файле есть класс `section` — обёртка секции.

| Файл | Секция на сайте |
|------|-----------------|
| `src/widgets/account-personal-data/styles/PersonalDataSection.module.css` | Личные данные |
| `src/widgets/account-events/styles/AccountEventsSection.module.css` | Мои события |
| `src/widgets/account-achievements/styles/AchievementsSection.module.css` | Достижения |
| `src/widgets/account-notifications/styles/NotificationsSection.module.css` | Уведомления |

---

## Сущности кабинета (карточки и поля)

Эти блоки живут в `src/entities/account/ui/*.module.css` — их переиспользуют секции кабинета.

### Карточка события

**Файл:** `src/entities/account/ui/EventCard.module.css`

| Класс | Элемент |
|-------|---------|
| `card` | Карточка события |
| `date` | Дата в углу |
| `body` | Текстовая часть |
| `title` | Название |
| `result` | Результат / описание |
| `actions` | Ряд кнопок |
| `button` | Кнопка на карточке |
| `buttonDisabled` | Неактивная кнопка |

### Карточка достижения

**Файл:** `src/entities/account/ui/AchievementCard.module.css`

| Класс | Элемент |
|-------|---------|
| `card` | Карточка |
| `icon` | Круг под иконку |
| `title` | Заголовок |
| `description` | Текст |
| `progressRow` | Строка с прогресс-баром |
| `progressTrack` | Фон полосы прогресса |
| `progressBar` | Заполнение |
| `progressText` | Подпись прогресса |

### Карточка уведомления

**Файл:** `src/entities/account/ui/NotificationCard.module.css`

| Класс | Элемент |
|-------|---------|
| `card` | Карточка |
| `cardRead` | Состояние «прочитано» (приглушение) |
| `body` | Текстовая колонка |
| `title` | Заголовок |
| `description` | Текст |
| `actions` | Колонка кнопок справа |
| `button` | Кнопка |
| `buttonDisabled` | Неактивная кнопка |

### Поле профиля (лейбл + значение / инпут)

**Файл:** `src/entities/account/ui/ProfileField.module.css`

| Класс | Элемент |
|-------|---------|
| `field` | Одно поле целиком |
| `label` | Подпись |
| `value` | Только чтение |
| `input` | Редактируемое поле |

---

## Фича: модальное окно входа / регистрации

**Файл:** `src/features/AuthModal/styles/AuthModal.module.css`

| Класс | Элемент |
|-------|---------|
| `modal` | Ширина окна (передаётся на общий Modal) |
| `panel` | Светлая панель с формой |
| `title` | Заголовок «Войти» / «Регистрация» |
| `form` | Форма |
| `actionButton` | Крупные кнопки (вход, Госуслуги, VK, регистрация) |
| `separator` | Текст «или» |
| `switchRow` | Строка «Нет аккаунта?» |
| `switchLabel` | Текст подсказки |
| `switchButton` | Ссылка «Зарегистрироваться» |
| `registerSubmitRow` | Обёртка кнопки отправки при регистрации |
| `error` | Сообщение об ошибке |

Общая подложка модалки (затемнение экрана): `src/shared/ui/modal/Modal.module.css` — класс `overlay`; внутренний контейнер контента — `content`.

---

## Общие UI-компоненты (shared)

Используются на разных страницах; правки затронут все места использования.

| Файл | Классы | Назначение |
|------|--------|------------|
| `src/shared/ui/button/Button.module.css` | `button`, `primary`, `secondary`, `sm`, `md`, `fullWidth` | Кнопки (+ модификаторы варианта и размера) |
| `src/shared/ui/container/Container.module.css` | `container` | Центрирование и max-width контента |
| `src/shared/ui/section/Section.module.css` | `section`, `head`, `headCentered`, `title`, `content` | Обёртка секции с заголовком |
| `src/shared/ui/logo/Logo.module.css` | `logo` | Логотип в шапке |
| `src/shared/ui/text-field/TextField.module.css` | `input` | Поле ввода в формах |
| `src/shared/ui/modal/Modal.module.css` | `overlay`, `content` | Подложка и контейнер любой модалки |

---

## Быстрый поиск по смыслу

| Нужно поменять… | Смотреть файл |
|-----------------|---------------|
| Цвета и отступы по всему сайту | `src/app/styles/index.css` |
| Шапку, меню | `src/widgets/header/styles/Header.module.css` |
| Подвал | `src/widgets/footer/styles/Footer.module.css` |
| Попап входа | `src/features/AuthModal/styles/AuthModal.module.css` + `Modal.module.css` |
| Сетку главной (отступы страницы) | `HomePage.module.css` |
| Макет кабинета (сайдбар + контент) | `AccountPage.module.css` + `AccountSidebar` + `AccountProfileBanner` |
| Кнопки везде | `Button.module.css` |

---

*Документ можно дополнять при появлении новых экранов: добавьте строку в таблицу с путём к `*.module.css` и списком классов.*
