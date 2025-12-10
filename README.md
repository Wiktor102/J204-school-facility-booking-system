# 🏫 System rezerwacji obiektów szkolnych

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Projekt zaliczeniowy z przedmiotu **INT02 – Aplikacje internetowe**. Celem aplikacji jest umożliwienie uczniom oraz administratorom szkoły wygodnego zarządzania rezerwacjami sprzętu szkolnego.

## 📝 Opis projektu

Aplikacja to serwerowa aplikacja WWW zbudowana w oparciu o Node.js, Express i TypeScript. Użytkownicy mogą tworzyć konta, logować się, przeglądać dostępność zasobów w kalendarzu oraz rezerwować wybrane obiekty. Administratorzy mają rozszerzone uprawnienia – mogą zarządzać użytkownikami, rezerwacjami oraz listą dostępnego sprzętu.

Warstwa widoku została przygotowana z użyciem szablonów **EJS** oraz własnych arkuszy stylów (SCSS/CSS). Dane są przechowywane w relacyjnej bazie danych (MariaDB), a struktura tabel znajduje się w pliku `scripts/schema.sql`.

## ✅ Funkcjonalności

- **Autoryzacja i uwierzytelnianie**
  - Logowanie i wylogowywanie użytkowników.
  - Sesje użytkownika i middleware sprawdzający uprawnienia.

- **Zarządzanie rezerwacjami**
  - Przegląd dostępnych terminów w kalendarzu.
  - Tworzenie rezerwacji wybranego obiektu.
  - Podgląd własnych rezerwacji w widoku „Moje rezerwacje”.

- **Panel administratora**
  - Podgląd wszystkich rezerwacji.
  - Akceptowanie / odrzucanie / usuwanie rezerwacji.
  - Zarządzanie zasobami - dodawanie, edycja, usuwanie.

- **Widoki i interfejs**
  - Główny dashboard użytkownika z podsumowaniem.
  - Kalendarz z zaznaczonymi rezerwacjami.
  - Responsywny frontend oparty na SCSS → CSS.

## 🚀 Instrukcja instalacji i uruchomienia

### 📥 1. Klonowanie repozytorium

```bash
git clone https://github.com/Wiktor102/J204-school-facility-booking-system.git
cd J204-school-facility-booking-system
```

### 🐳 Uruchomienie za pomocą Docker (zalecane)

Najprostszym sposobem uruchomienia aplikacji jest użycie Docker Compose, który uruchamia zarówno aplikację jak i bazę danych w kontenerach.

👉 **Szczegółowa instrukcja znajduje się w pliku [docker.md](docker.md).**

---

### 💻 Uruchomienie w trybie deweloperskim

W trybie deweloperskim aplikacja Node.js uruchamiana jest lokalnie na komputerze, natomiast baza danych działa w kontenerze Docker.

#### ⚠️ Wymagania wstępne

- **Node.js** (v18 lub nowszy)
- **npm** (instalowany razem z Node.js)
- **Docker** (do uruchomienia bazy danych)

#### ⚙️ 1. Konfiguracja środowiska

Utwórz plik `.env` w katalogu głównym projektu (możesz skopiować `.env.example`).

> **Ważne**: Podczas uruchamiania aplikacji lokalnie (poza Dockerem), zmienne środowiskowe są odczytywane z pliku `.env` przez bibliotekę `dotenv`. Gdy aplikacja działa w kontenerze Docker, zmienne są przekazywane bezpośrednio przez Docker Compose.

Minimalna konfiguracja dla trybu deweloperskiego:

```env
# Tryb uruchomienia
NODE_ENV=development

# Port aplikacji
PORT=3000

# Konfiguracja bazy danych
DB_HOST=localhost
DB_PORT=3306
DB_NAME=facility_booking
DB_USER=booking_user
DB_PASSWORD=twoje_haslo
DB_ROOT_PASSWORD=root_password_here

# Sesja
SESSION_SECRET=development_secret_change_in_production
SESSION_MAX_AGE=86400000

# Strefa czasowa
TZ=Europe/Warsaw
```

| Zmienna | Opis | Przykład / Domyślna |
|---|---|---|
| `NODE_ENV` | Tryb uruchomienia aplikacji. | `development` |
| `PORT` | Port HTTP, na którym nasłuchuje aplikacja. | `3000` |
| `TZ` | Strefa czasowa używana przez aplikację. | `Europe/Warsaw` |
| `DB_HOST` | Host bazy danych. Lokalnie: `localhost`, w Dockerze: nazwa serwisu. | `localhost` |
| `DB_PORT` | Port bazy danych. | `3306` |
| `DB_NAME` | Nazwa bazy danych. | `facility_booking` |
| `DB_USER` | Nazwa użytkownika bazy danych. | `booking_user` |
| `DB_PASSWORD` | Hasło użytkownika bazy danych. | (ustaw własne) |
| `DB_ROOT_PASSWORD` | Hasło roota bazy (wymagane przez kontener MariaDB). | (ustaw własne) |
| `SESSION_SECRET` | Sekret sesji (używany przez Express session). | `change_me` |
| `SESSION_MAX_AGE` | Maksymalny czas trwania sesji w ms. | `86400000` |

#### 🗄️ 2. Uruchomienie bazy danych

Uruchom **tylko** kontener z bazą danych:

```bash
docker compose up -d mariadb
```

Poczekaj, aż baza danych będzie gotowa (możesz sprawdzić status: `docker compose ps`).

#### 📦 3. Instalacja zależności

```bash
npm install
```

#### 🌱 4. Inicjalizacja bazy danych (tylko przy pierwszym uruchomieniu)

Uruchom skrypt seedujący, który utworzy tabele i wypełni bazę przykładowymi danymi:

```bash
npm run seed
```

Domyślne konta utworzone przez skrypt `seed.mjs`:

- Administrator:
  - Email: `admin@szkola.pl`
  - Hasło: `Admin123!`
- Uczeń (przykładowy użytkownik):
  - Email: `student@example.com`
  - Hasło: `Student123!`

Uwaga: Możesz zmienić te wartości modyfikując plik `scripts/seed.mjs` przed uruchomieniem skryptu seedującego (hasła są hashowane przy użyciu bcrypt).

Alternatywnie możesz ręcznie wykonać skrypt `scripts/schema.sql` w kliencie SQL.

#### 🚀 5. Uruchomienie aplikacji

Uruchom serwer deweloperski z automatycznym przeładowaniem (hot reload):

```bash
npm run dev
```

Aplikacja będzie dostępna pod adresem `http://localhost:3000`.

#### 📝 Dodatkowe komendy

| Komenda | Opis |
|---|---|
| `npm run dev` | Uruchamia serwer deweloperski z hot reload |
| `npm run build` | Kompiluje TypeScript do JavaScript |
| `npm run start` | Uruchamia skompilowaną aplikację (produkcja) |
| `npm run lint` | Sprawdza kod pod kątem błędów ESLint |
| `npm run pretty` | Formatuje kod za pomocą Prettier |
| `npm run sass` | Kompiluje pliki SCSS do CSS |

---

## 🔗 Lista endpointów (REST / HTTP)

### 📌 Główne trasy

- `GET /` – strona główna / przekierowanie na dashboard lub logowanie.

### 🔐 Uwierzytelnianie (`src/routes/auth.ts`)

- `GET /login` – formularz logowania.
- `POST /login` – logowanie użytkownika.
- `POST /register` – rejestracja nowego użytkownika.
- `GET /logout` – wylogowanie użytkownika.

### 📅 Rezerwacje (`src/routes/booking.ts`)

- `GET /equipment/:id/calendar` – widok kalendarza dla wybranego sprzętu.
- `POST /bookings` – utworzenie nowej rezerwacji.
- `DELETE /bookings/:id` – anulowanie rezerwacji.
- `GET /my-bookings` – podgląd własnych rezerwacji („Moje rezerwacje").

### 📊 Dashboard (`src/routes/dashboard.ts`)

- `GET /dashboard` – panel użytkownika z podsumowaniem.

### 🛡️ Panel administratora (`src/routes/admin.ts`)

- `GET /admin` – główny dashboard administratora.
- `GET /admin/bookings` – podgląd wszystkich rezerwacji.
- `DELETE /admin/bookings/:id` – usunięcie rezerwacji.
- `POST /admin/equipment` – dodanie nowego sprzętu.
- `PATCH /admin/equipment/:id` – edycja sprzętu.
- `POST /admin/blocked-slots` – utworzenie blokady terminu.
- `DELETE /admin/blocked-slots/:id` – usunięcie blokady terminu.
- `GET /admin/export` – eksport danych do pliku CSV.

---

## 🧰 Technologie

- **Język**: TypeScript
- **Platforma**: Node.js
- **Framework**: Express
- **Silnik szablonów**: EJS
- **Baza danych**: relacyjna baza SQL (MariaDB)
- **Warstwa danych**: repozytoria (`src/repositories/*`), modele (`src/models/*`)
- **Stylowanie**: SCSS → CSS (`public/scss`, `public/css`)
- **Walidacja i logika biznesowa**: usługi w `src/services/*`, walidatory w `src/utils/validators.ts`
- **Obsługa błędów i middleware**: `src/middleware/*`

---

## 👥 Autorzy

Projekt wykonany jako **projekt szkolny** w ramach przedmiotu INT02.

- **Autor**: Wiktor (GitHub: `Wiktor102`)
- **Rola**: implementacja backendu, frontend (EJS + SCSS), konfiguracja bazy danych oraz kontenerów Docker.

Wszelkie sugestie dotyczące usprawnień, nowych funkcjonalności lub poprawek mile widziane poprzez zgłoszenia (Issues) w repozytorium GitHub.

## Licencja 📑

Projekt jest udostępniony na licencji MIT. Szczegóły licencji znajdują się w pliku `LICENSE` w katalogu głównym repozytorium.

TL;DR: możesz korzystać, modyfikować i rozpowszechniać oprogramowanie, pod warunkiem zachowania informacji o prawach autorskich i licencji. Projekt dostarczany jest „tak jak jest”, bez gwarancji.
