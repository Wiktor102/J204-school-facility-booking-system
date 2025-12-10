# 🐳 Uruchamianie aplikacji za pomocą Docker

Ta instrukcja opisuje sposób uruchomienia całej aplikacji (serwer + baza danych) przy użyciu Docker Compose.

## ⚠️ Wymagania wstępne

- Środowisko Docker (Docker Desktop lub Docker Engine + Docker Compose)

## 📥 1. Klonowanie repozytorium

```bash
git clone https://github.com/Wiktor102/J204-school-facility-booking-system.git
cd J204-school-facility-booking-system
```

## ⚙️ 2. Konfiguracja środowiska

Skonfiguruj w katalogu głównym plik zmiennych środowiskowych `.env`. Możesz skopiować plik `.env.example` i dostosować wartości.

Poniżej znajduje się szczegółowy opis dostępnych zmiennych środowiskowych używanych przez aplikację w przypadku uruchomienia za pomocą Docker Compose.

> **Zalecenie**: w środowisku produkcyjnym zawsze ustawiaj bezpieczne wartości dla sekretów (np. `SESSION_SECRET`) i innych haseł.

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

## 🐳 3. Uruchomienie kontenerów

Poniższa komenda uruchamia zarówno aplikację jak i bazę danych.

```bash
docker compose up -d --build
```

Serwer powinien nasłuchiwać np. na `http://localhost:3000` (dokładny port zależy od konfiguracji).

## 🗄️ 4. Inicjalizacja bazy danych (tylko przy pierwszym uruchomieniu)

W katalogu `scripts/` znajduje się plik `schema.sql` zawierający definicję tabel oraz `seed.mjs` do wypełniania bazy przykładowymi danymi. Masz 2 opcje:

1. Uruchomić skrypt `schema.sql` w bazie danych (np. przez klienta SQL lub narzędzie linii komend). Stworzona zostanie wyłącznie struktura (tabele). Dane początkowe należy wprowadzić samodzielnie.
2. (Zalecane) uruchom skrypt seedujący, który zarówno wczyta strukturę jak i przykładowe dane: `node .\scripts\seed.mjs`. **UWAGA: przed wykonaniem skryptu należy zainstalować zależności `npm i`**.

Domyślne konta utworzone przez skrypt `seed.mjs`:

```text
Administrator:
  Email: admin@szkola.pl
  Hasło: Admin123!

Uczeń (przykładowy użytkownik):
  Email: student@example.com
  Hasło: Student123!
```

Uwaga: Możesz zmienić te wartości modyfikując plik `scripts/seed.mjs` przed uruchomieniem skryptu seedującego (hasła są hashowane przy użyciu bcrypt).

## 🛑 Zatrzymywanie kontenerów

```bash
docker compose down
```

Aby usunąć również wolumeny (dane bazy danych):

```bash
docker compose down -v
```
