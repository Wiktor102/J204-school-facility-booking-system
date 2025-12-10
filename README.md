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

### ⚠️ Wymagania wstępne

- Środowisko Docker

### 📥 1. Klonowanie repozytorium

```bash
git clone https://github.com/Wiktor102/J204-school-facility-booking-system.git
cd J204-school-facility-booking-system
```

### ⚙️ 2. Konfiguracja środowiska

Skonfiguruj w katalogu głównym plik zmiennych środowiskowych `.env`. Możesz skopiować plik `.env.example` i dostosować wartości.

Poniżej znajduje się szczegółowy opis dostępnych zmiennych środowiskowych używanych przez aplikację w przypadku uruchomienia za pomocą Docker Compose.

Zalecenie: w środowisku produkcyjnym zawsze ustawiaj bezpieczne wartości dla sekretów (np. `SESSION_SECRET`) i innych haseł.

| Zmienna | Opis | Przykład / Domyślna |
|---|---|---|
| `NODE_ENV` | Tryb uruchomienia aplikacji. Wpływa na logowanie i inne zachowania. | `development` (domyślnie) |
| `PORT` | Port HTTP, na którym nasłuchuje aplikacja. | `3000` |
| `TZ` | Strefa czasowa używana przez aplikację. | `Europe/Warsaw` |
| `DB_PORT` | Port **zewnętrzny** kontenera serwera bazy danych. Wewnętrzny zawsze `3306`. | `3306` |
| `DB_NAME` | Nazwa bazy danych. | `facility_booking` |
| `DB_USER` | Nazwa użytkownika bazy danych używana przez aplikację. | `booking_user` |
| `DB_PASSWORD` | Hasło użytkownika bazy danych. | (brak / ustawione przez Ciebie) |
| `DB_ROOT_PASSWORD` | Hasło roota bazy. | `root_password_here` |
| `SESSION_SECRET` | Sekret sesji (używany przez Express session). Ustaw losowy, długi ciąg znaków w produkcji. | `change_me` (zmienić w produkcji) |
| `SESSION_MAX_AGE` | Maksymalny czas trwania sesji w ms (liczba całkowita). | `86400000` (24 godziny) |

### 🐳 3. Uruchomienie kontenerów

Poniższa komenda uruchamia zarówno aplikację jak i bazę danych.

```bash
docker compose up -d --build
```

Serwer powinien nasłuchiwać np. na `http://localhost:3000` (dokładny port zależy od konfiguracji).

### 🗄️ 4. Inicjalizacja bazy danych (tylko przy pierwszym uruchomieniu)

W katalogu `scripts/` znajduje się plik `schema.sql` zawierający definicję tabel oraz `seed.mjs` do wypełniania bazy przykładowymi danymi. Masz 2 opcje:

1. Uruchomić skrypt `schema.sql` w bazie danych (np. przez klienta SQL lub narzędzie linii komend). Stworzona zostanie wyłącznie struktura (tabele). Dane początkowe należy wprowadzić samodzielnie.
2. (Zalecane) uruchom skrypt seedujący, który zarówno wczyta strukturę jak i przykładowe dane: `node .\scripts\seed.mjs`. **UWAGA: przed wykonaniem skryptu należy zainstalować zależności `npm i`**.

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
