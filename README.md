# 💪 Dziennik Treningowy

Aplikacja webowa do śledzenia treningów, planu tygodnia i pomiarów ciała.
Projekt prywatny: jeden właściciel danych, dostęp po zalogowaniu kontem Google.

---

## 🚀 Funkcjonalności

- 🏋️ **Rejestrowanie treningów** z szablonów — serie z ciężarem, powtórzeniami i RIR
- 💾 **Szkic treningu w przeglądarce** — wpisane serie przetrwają odświeżenie strony
- 📅 **Plan tygodnia** i **historia treningów**
- 📋 **Szablony** domyślne i własne (własne zapisywane w przeglądarce)
- ⚖️ **Pomiary ciała** — waga i obwód talii, zmiany w czasie
- 🔐 **Logowanie Google**, dane w Cloud Firestore dostępne tylko dla właściciela
- 📱 **Responsywny, ciemny interfejs**

Architektura i decyzje: [docs/DECISIONS.md](docs/DECISIONS.md).

---

## 🧰 Stack technologiczny

React 19, TypeScript (strict), Vite 7, Tailwind CSS 3, Lucide React, Firebase (Authentication, Cloud Firestore); testy: Vitest, Testing Library, emulator Firestore.

---

## 🧑‍💻 Uruchomienie lokalne

Wymagania: Node.js 22, a do emulatorów, testów reguł i testów end-to-end — Java 21. Przeglądarkę dla testów end-to-end instaluje się raz: `npx playwright install chromium`.

```bash
git clone https://github.com/KamilKamilK/Training-tracker.git
cd Training-tracker
npm install
cp .env.example .env   # uzupełnij konfiguracją projektu Firebase
npm run dev            # http://localhost:5173
```

Praca bez dotykania danych produkcyjnych: ustaw `VITE_USE_EMULATORS=true` w `.env`, uruchom `npm run emulators` w osobnym terminalu, a potem `npm run dev`. Dokument właściciela (patrz niżej) utwórz w emulatorze Firestore.

| Polecenie | Działanie |
|---|---|
| `npm run dev` | serwer deweloperski Vite |
| `npm run lint` | ESLint |
| `npm run build` | typecheck (`tsc -b`) i build produkcyjny do `dist/` |
| `npm test` | testy jednostkowe (Vitest) |
| `npm run test:rules` | testy `firestore.rules` i skryptów danych (`scripts/`) na emulatorze Firestore |
| `npm run test:e2e` | testy end-to-end (Playwright) zbudowanej aplikacji na emulatorach |
| `npm run emulators` | emulatory Authentication i Firestore do pracy lokalnej |

Po sklonowaniu włącz hook `pre-push`, który uruchamia te kontrole przy każdym pushu (testy reguł i end-to-end — gdy zmiana ich dotyczy): `git config core.hooksPath .githooks` ([opis](.githooks/README.md)). CI (`.github/workflows/ci.yml`) wykonuje te same kroki, ale uruchamiane jest ręcznie w zakładce Actions (limit minut GitHub Actions).

---

## 🔐 Konfiguracja Firebase (jednorazowo, konsola Firebase)

1. **Authentication → Sign-in method:** włącz dostawców **Google** i **Email/Password** (bez „Email link”).
2. **Authentication → Settings → Authorized domains:** dodaj domenę hostingu (np. `training-tracker-six.vercel.app`).
3. **Authentication → Settings:**
   - **Password policy:** wymagaj co najmniej 8 znaków, wielkiej i małej litery oraz cyfry (ta sama zasada co w formularzu rejestracji);
   - **User actions:** włącz **Email enumeration protection**, aby logowanie i reset hasła nie zdradzały, czy konto istnieje.
4. **Authentication → Templates:** ustaw język polski i nazwę aplikacji w e-mailach weryfikacji adresu i resetu hasła.
5. Zaloguj się w aplikacji — zobaczysz ekran „nie ma dostępu”. W **Authentication → Users** skopiuj swój UID.
6. **Firestore → Data:** utwórz kolekcję `owners` z dokumentem o ID równym UID (bez pól).
7. Wdróż reguły: `npx firebase deploy --only firestore:rules` (wymaga `npx firebase login`). Reguły wpuszczają tylko konta z potwierdzonym adresem e-mail i zaakceptowaną zgodą na dane o zdrowiu.
8. Po zalogowaniu aplikacja prosi o imię i zgodę na dane o zdrowiu — po jej zaakceptowaniu konto jest aktywne ([ADR-0015](docs/adr/0015-accounts-roles-consent.md)). Zgodę można wycofać w **Ustawieniach** (`/settings`), co dezaktywuje konto.

### Przeniesienie danych do `users/{uid}/…` (jednorazowo)

Aplikacja czyta dane konta z `users/{uid}/sessions`, `measurements`, `weekPlans` i `templates` ([ADR-0016](docs/adr/0016-roles-views-exercise-library.md)). Dane zapisane wcześniej w kolekcjach `workouts`, `measurements` i `weekPlans` kopiuje skrypt — bez zmiany i bez usuwania oryginałów:

1. Zaloguj się do Google Cloud: `gcloud auth application-default login` (konto z dostępem do projektu).
2. Próba bez zapisu: `node scripts/migrate-to-users.ts --project training-tracker-6d13b --uid <UID>` — pokazuje liczbę dokumentów do skopiowania i konflikty.
3. Zapis: to samo polecenie z `--apply`; na końcu skrypt sprawdza, że każdy dokument ma identyczną kopię. Ponowne uruchomienie kopiuje tylko brakujące dokumenty.

Szablony własne zapisane w przeglądarce aplikacja przenosi sama przy pierwszym uruchomieniu nowej wersji w tej przeglądarce.

Zasady dostępu: [ADR-0003](docs/adr/0003-owner-authentication.md); konta i logowanie: [ADR-0008](docs/adr/0008-accounts-and-invitations.md); zgoda i aktywacja konta: [ADR-0015](docs/adr/0015-accounts-roles-consent.md).

---

## 🌐 Dostęp online

Aplikacja jest hostowana na Vercel: https://training-tracker-six.vercel.app/ — zmienne `VITE_*` z `.env.example` ustaw w ustawieniach projektu Vercel. `vercel.json` kieruje każdy adres (np. `/history`) do aplikacji, więc odświeżenie zakładki działa.
