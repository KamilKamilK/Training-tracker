# Dziennik Treningowy — wizja i plan rozwoju

**Status:** kierunek przyjęty 2026-10-10 — Firebase zostaje, najpierw wersja webowa, wersja mobilna odłożona ([ADR-0004](adr/0004-firebase-multi-user.md)). Decyzje do etapów 1–3 przyjęte; Firebase zostaje na darmowym planie Spark, kod serwerowy działa w funkcjach Vercel ([Decyzje](#decyzje)).

## Wizja

Aplikacja dla trenerów personalnych i ich podopiecznych, która zastępuje arkusz Excela:

- **Trener** układa plan na kilka tygodni, przypisuje go podopiecznym i widzi, co faktycznie zrobili: ciężary, powtórzenia, RIR, regularność, pomiary.
- **Podopieczny** otwiera aplikację na siłowni, widzi dzisiejszy trening z zadanymi wartościami i wynikami z poprzedniego razu, zapisuje serie także bez zasięgu i widzi swoje postępy.
- **Model biznesowy:** trener płaci abonament zależny od liczby podopiecznych; podopieczny korzysta za darmo. Osoba bez trenera może prowadzić własny dziennik — tak jak dziś.

Główna przewaga nad Excelem: plan i wykonanie są w jednym miejscu, porównanie „zadane / wykonane” i postęp liczą się same, a podopieczny ma wygodny widok na telefonie.

## Stan wyjściowy

Co już działa: zapis treningu z szablonu ze szkicem odpornym na odświeżenie, plan tygodnia, historia, pomiary, szablony własne w koncie, logowanie Google albo e-mailem z hasłem (potwierdzenie adresu, reset hasła), zgoda na dane o zdrowiu i Ustawienia, dane każdego konta w `users/{uid}/…`, reguły Firestore z walidacją, adresy URL zakładek, dane na żywo i praca offline na otwartej stronie, testy jednostkowe, reguł i end-to-end. Budowa aplikacji: [ARCHITECTURE.md](ARCHITECTURE.md).

Co ogranicza rozwój:

| Ograniczenie | Gdzie | Skutek |
|---|---|---|
| Dostęp tylko z listy `owners`; pole `roles` istnieje, ale aplikacja go nie używa | `firestore.rules`, `src/features/auth/` | Brak kont trenera i podopiecznego ([ADR-0016](adr/0016-roles-views-exercise-library.md)) |
| Ćwiczenie to tekst, a ciężar i powtórzenia to napisy | `src/types/workout.types.ts` | Nie da się policzyć postępu dla ćwiczenia (e1RM, objętość) ani porównać z planem |
| Plan tygodnia jako jeden dokument z identyfikatorami szablonów | `src/features/plan/useWeekPlan.ts` | Brak planów wielotygodniowych z progresją |
| Brak kodu serwerowego | brak katalogu `api/` | Nie da się usunąć konta, założyć konta podopiecznego ani nadać roli z aplikacji ([ADR-0014](adr/0014-server-functions-and-email.md)) |

## Role i uprawnienia

Jedno konto może mieć obie role (np. trener, który sam trenuje).

| Działanie | Podopieczny | Trener | Administrator |
|---|---|---|---|
| Własne treningi, pomiary, check-iny | odczyt i zapis | odczyt i zapis | — |
| Treningi i pomiary podopiecznego | — | odczyt; komentarze | tylko na zgłoszenie wsparcia |
| Biblioteka ćwiczeń | odczyt | własne ćwiczenia: zapis | ćwiczenia globalne |
| Plany treningowe | odczyt przypisanych | tworzenie, kopiowanie, przypisywanie | — |
| Zaproszenie i zakończenie współpracy | akceptacja, zakończenie | wysłanie, zakończenie | — |
| Abonament | — | zarządzanie | wgląd |

Zasada: trener widzi dane podopiecznego tylko podczas aktywnej współpracy; po jej zakończeniu dane zostają u podopiecznego.

## Funkcje docelowe

**Podopieczny**
- „Dzisiaj”: trening z planu z zadanymi seriami (powtórzenia, zakres, RIR/RPE, tempo, przerwa, uwagi, wideo techniki) i wynikami z poprzedniego razu przy każdym ćwiczeniu.
- Szybki zapis serii, minutnik przerwy, odhaczanie serii, praca offline na otwartej stronie z synchronizacją.
- Trening spoza planu (dzisiejsze szablony) — dziennik bez trenera działa dalej.
- Postęp: wykres e1RM i najlepszej serii dla ćwiczenia, rekordy, tygodniowa objętość (tonaż, serie na partię mięśniową), regularność wobec planu, waga ze średnią 7-dniową, obwody; zdjęcia sylwetki po przejściu na plan Blaze ([ADR-0009](adr/0009-cloud-functions-aggregates.md)).
- Cotygodniowy check-in dla trenera (samopoczucie, sen, waga, komentarz).

**Trener**
- Lista podopiecznych z sygnałami: ostatni trening, regularność w tygodniu, brak check-inu, spadek wyników.
- Kreator planu: tygodnie → dni → ćwiczenia z parametrami; kopiowanie tygodnia, progresja (np. +2,5 kg lub −1 RIR co tydzień), biblioteka własnych planów i ćwiczeń.
- Przypisanie planu z datą startu; przypisany plan to kopia, więc zmiany w szablonie nie przepisują historii podopiecznego.
- Podgląd wykonania „zadane / wykonane”, komentarze do treningu, odpowiedź na check-in.
- **Import planu z Excela/CSV** według prostego wzoru i eksport do PDF — najkrótsza droga przejścia z arkusza.
- Sygnały na pulpicie: zakończony trening, nowy check-in, pominięty trening (powiadomienia push — z wersją mobilną).

**Wspólne:** konto przez Google albo e-mail z hasłem (rejestracja, potwierdzenie adresu, reset hasła), profil, zaproszenie linkiem, dobrowolne zgody na dane o zdrowiu i udostępnienie trenerowi, eksport i usunięcie danych (RODO), język polski i angielski.

## Model danych (szkic, szczegóły w [ADR-0005](adr/0005-data-model-and-access.md))

| Ścieżka | Zawartość | Kto ma dostęp |
|---|---|---|
| `users/{uid}` | profil, role, ustawienia | właściciel konta |
| `users/{uid}/sessions/{id}` | wykonany trening: data, odnośnik do dnia planu, ćwiczenia z `exerciseId`, serie liczbowe (`weight`, `reps`, `rir`, `done`) | właściciel; trener z aktywną współpracą |
| `users/{uid}/templates/{id}`, `weekPlans/default_week_plan` | szablony treningów i plan tygodnia konta | właściciel |
| `users/{uid}/measurements`, `checkins` | pomiary, check-iny (zapis wymaga zgody na dane o zdrowiu) | jak wyżej |
| `users/{uid}/programs/{id}` | przypisany plan (kopia) z datą startu | właściciel; trener, który go przypisał |
| `coaching/{coachId}_{athleteId}` | status współpracy (zaproszona, aktywna, zakończona), daty | obie strony |
| `coaches/{uid}/programTemplates`, `exercises` | szablony planów i własne ćwiczenia trenera | trener |
| `exercises/{id}` | biblioteka globalna: nazwa, partie mięśniowe, sprzęt, wideo | wszyscy zalogowani (odczyt) |
| `invites/{token}` | zaproszenie: losowy token 128-bit, trener, ważność ≤ 7 dni, jednorazowe użycie ([ADR-0008](adr/0008-accounts-and-invitations.md)) | tworzy trener; odczyt pojedynczego dokumentu z linku, lista zabroniona |

Obecne dane właściciela przechodzą do `users/{uid}/…` w dwóch krokach ([ADR-0016](adr/0016-roles-views-exercise-library.md)): przeniesienie bez zmiany kształtu (`scripts/migrate-to-users.ts`), potem serie liczbowe i `exerciseId` po wgraniu biblioteki — każdy krok z trybem próbnym, po akceptacji właściciela.

## Decyzje

Wszystkie decyzje potrzebne do etapów 1–3 są przyjęte (2026-10-10):

| ADR | Decyzja |
|---|---|
| [0004](adr/0004-firebase-multi-user.md) | Firebase; najpierw wersja webowa, mobilna odłożona |
| [0005](adr/0005-data-model-and-access.md) | Dane w `users/{uid}/…`; dostęp trenera przez zaakceptowaną współpracę; role jako profil |
| [0006](adr/0006-training-programs.md) | Plan wielotygodniowy; przypisanie jako kopia; progresja wartościami |
| [0007](adr/0007-exercises-and-sets.md) | Biblioteka ćwiczeń, serie liczbowe, migracja skryptem z trybem próbnym |
| [0008](adr/0008-accounts-and-invitations.md) | Google albo e-mail z hasłem, potwierdzenie adresu, reset hasła; zaproszenie linkiem |
| [0009](adr/0009-cloud-functions-aggregates.md) | Plan Spark bez Cloud Functions; postęp liczony w przeglądarce; zdjęcia po zmianie planu |
| [0010](adr/0010-web-app-architecture.md), [0011](adr/0011-environments-hosting-monitoring.md) | Architektura aplikacji webowej; emulatory i produkcja, Vercel |
| [0012](adr/0012-personal-and-health-data.md) | Zrozumiałe zgody; dane o zdrowiu tylko dla własnego trenera; eksport i usunięcie konta |
| [0014](adr/0014-server-functions-and-email.md) | Funkcje Vercel z Firebase Admin SDK; e-maile przez Brevo po zakupie domeny |
| [0015](adr/0015-accounts-roles-consent.md) | Zgoda na dane o zdrowiu warunkiem aktywacji; rola trenera od administratora; konta zakładane przez trenera; usunięcie konta |

Backlog decyzji: zdjęcia sylwetki (Cloud Storage na planie Blaze albo inny dostawca); drugi dostawca chmury, np. Azure z kolejką zadań — gdy pojawi się praca w tle (eksporty, przeliczanie statystyk), wymaga nowego ADR; własna domena: e-maile przez Brevo, adres aplikacji i strona `/konto/akcja` ([ADR-0014](adr/0014-server-functions-and-email.md)); otwieranie aplikacji bez sieci ([ADR-0013](adr/0013-offline-app-shell.md), odłożona razem z wersją mobilną); plan Blaze (warunki w ADR-0009); model cenowy i operator płatności — przed etapem 5.

## Etapy

Rozmiar: S — kilka dni, M — 1–2 tygodnie, L — 3+ tygodnie pracy jednej osoby.

| Etap | Zakres | Gotowe, gdy | Rozmiar |
|---|---|---|---|
| **0. Fundament** | Schematy Zod, routing, nasłuchy danych, cache offline i podział kodu według funkcji — wdrożone ([ADR-0010](adr/0010-web-app-architecture.md)); testy E2E Playwright na emulatorach i na zbudowanej wersji — wdrożone (`e2e/`, [ADR-0011](adr/0011-environments-hosting-monitoring.md)) | Scenariusze z checklisty mają testy E2E, aplikacja działa offline na otwartej stronie | M |
| **1. Wiele kont, nowy model danych** | **Wdrożone:** ekran „Zaloguj / Zarejestruj” (Google albo e-mail z hasłem, potwierdzenie adresu, reset hasła); profil, zgoda wymagana do aktywacji, Ustawienia; dane w `users/{uid}/…` i szablony w Firestore (migracja, krok 1 — dane właściciela przeniesione na produkcji 2026-10-21: 3 treningi, 2 pomiary, plan tygodnia). **Zostało:** biblioteka ćwiczeń; serie liczbowe i `exerciseId` (migracja, krok 2); usunięcie starych kolekcji; usunięcie konta (funkcja Vercel) — szczegóły w [Najbliższych krokach](#najbliższe-kroki) | Dwa konta nie widzą swoich danych (testy reguł A/B), konto bez potwierdzonego adresu nie ma dostępu, dane właściciela przeniesione bez strat | L |
| **2. Postęp** | Wyniki z poprzedniego razu przy ćwiczeniu; wykresy e1RM, rekordy, objętość tygodniowa, regularność; trend wagi; minutnik przerwy | Podopieczny widzi postęp dla dowolnego ćwiczenia z historii; obliczenia mają testy jednostkowe | M |
| **3. Trener** | Rola trenera nadawana przez administratora; konta zakładane przez trenera i zaproszenia linkiem ([ADR-0015](adr/0015-accounts-roles-consent.md)); lista podopiecznych z sygnałami; kreator planu wielotygodniowego z kopiowaniem i progresją; przypisanie planu; „zadane / wykonane”; komentarze; check-iny; import CSV/Excel | Pilotaż: 2–3 trenerów prowadzi realnych podopiecznych przez 4 tygodnie bez arkusza | L |
| **4. Mobile — odłożony** | Do wznowienia decyzją właściciela ([ADR-0004](adr/0004-firebase-multi-user.md)); wtedy PWA, a później Capacitor | — | M |
| **5. Produkt komercyjny** | Abonamenty i limity podopiecznych (do 30 podopiecznych w roli nadanej przez administratora, powyżej — abonament dla trenera, jeśli potwierdzą to rozmowy z trenerami; [ADR-0015](adr/0015-accounts-roles-consent.md)); strona produktu; regulamin, polityka prywatności, umowa powierzenia; eksport i usunięcie danych; język angielski; panel administratora | Pierwszy trener płaci za abonament, a żądanie usunięcia konta wykonuje się bez ręcznej pracy | L |

Kolejność: 0 → 1 → 2 → 3 → 5. Etapy 1 i 2 mają wartość także bez trenerów (lepszy dziennik), więc dają szybki efekt; etap 3 warto zacząć od rozmów z 3–5 trenerami o tym, jak dziś prowadzą plany w Excelu i czego im brakuje.

## Najbliższe kroki

Kolejność pracy do końca etapu 1 i na początek etapu 2. 🖐️ — właściciel, 💻 — programista lub agent. Wykonany krok usuwamy z listy.

| # | Krok | Wykonanie | Zależy od | Gotowe, gdy |
|---|---|---|---|---|
| 1 | **Sprawdzenie po wdrożeniu (migracja, krok 1).** Reguły, kopia danych i wdrożenie są wykonane; zostało porównanie w aplikacji — według [README](../README.md#przeniesienie-danych-do-usersuid-jednorazowo), krok 6 | 🖐️ | — | Wdrożona wersja pokazuje te same treningi, pomiary, plan i szablony co przed wdrożeniem |
| 2 | **Usunięcie starych kolekcji** z reguł, a potem z bazy, po kilku dniach normalnego używania nowej wersji ([KNOWN_ISSUES #21](KNOWN_ISSUES.md)) | 🖐️💻 | 1 | Reguły zawierają tylko `users` i `owners` |
| 3 | **Biblioteka ćwiczeń** ([ADR-0016](adr/0016-roles-views-exercise-library.md), pkt 6). Najpierw arkusz 120–150 ćwiczeń z free-exercise-db i z obecnych szablonów (nazwa PL/EN, partie mięśni, sprzęt) do przeglądu przez właściciela. Potem kolekcja `exercises` z regułami (odczyt dla aktywnych kont, zapis tylko przez skrypt administratora) i testami. Na koniec skrypt wgrania z trybem próbnym | 💻🖐️ | — | Zatwierdzona lista jest w `exercises` na produkcji |
| 4 | **Serie liczbowe i `exerciseId` (migracja, krok 2)** ([ADR-0007](adr/0007-exercises-and-sets.md)). Nowe schematy Zod i reguły, formularz serii przyjmujący liczby (także z przecinkiem), szablony domyślne rozdzielone na ćwiczenie i zalecenie. Tabela mapowań „nazwa → `exerciseId`” do przeglądu przez właściciela, skrypt z trybem próbnym i raportem liczby sesji i serii | 💻🖐️ | 3 | Każdy trening ma ćwiczenia z `exerciseId` i liczbowe serie, a raport liczby sesji i serii zgadza się przed i po |
| 5 | **Etap 2: postęp.** Wyniki z poprzedniego razu przy ćwiczeniu, e1RM, rekordy, objętość tygodniowa — jako czyste funkcje z testami | 💻 | 4 | Jak w tabeli etapów |
| 6 | **Funkcje Vercel i usunięcie konta** ([ADR-0014](adr/0014-server-functions-and-email.md), [ADR-0015](adr/0015-accounts-roles-consent.md), pkt 7): katalog `api/`, weryfikacja tokenu, klucz serwisowy w Vercel. Wymagane przed pierwszym użytkownikiem spoza właściciela | 💻🖐️ | — (równolegle z 5) | Usunięcie konta w Ustawieniach usuwa dane i konto logowania, co potwierdzają testy |
| 7 | **Sprawy z długim czasem oczekiwania:** projekt polityki prywatności i treści zgody do konsultacji z prawnikiem ([ADR-0012](adr/0012-personal-and-health-data.md), [ADR-0015](adr/0015-accounts-roles-consent.md), pkt 8); rozmowy z 3–5 trenerami przed etapem 3 | 🖐️ | — (zacząć teraz) | Opinia prawna i notatki z rozmów są gotowe przed etapem 3 |

Dlaczego tak:

- Bibliotekę wgrywamy przed serią liczbową, bo mapowanie nazw wymaga istniejących `exerciseId`.
- Etap 2 daje wartość bez trenerów i korzysta z nowego modelu, więc sprawdza go w praktyce przed etapem 3.
- Usunięcie konta i opinia prawna blokują otwarcie rejestracji dla innych osób, więc nie mogą czekać na koniec etapu 3.

Między krokami warto zamykać drobne punkty z [KNOWN_ISSUES.md](KNOWN_ISSUES.md). Najpierw #19, bo przypadkowo zatrzymuje poprawny push, potem #20, #16, #22 i #18.

## Jakość — zasady przekrojowe

- Każda kolekcja i rola ma testy reguł z przypadkami „własne / cudze / trener z aktywną i zakończoną współpracą” ([AGENTS.md](../AGENTS.md#4-bezpieczeństwo)).
- Logika obliczeń (e1RM, objętość, progresja) jako czyste funkcje z testami, gotowe do użycia także po stronie serwera.
- Komponenty interfejsu wspólne dla obu ról (karta treningu, tabela serii, wykres) w `src/components/common/`.
- Środowiska: emulatory lokalnie i produkcja ([ADR-0011](adr/0011-environments-hosting-monitoring.md)); migracje danych jako skrypty z trybem próbnym i kopią zapasową.
- Mierzenie: czas zapisu serii, zużycie odczytów Firestore na aktywnego użytkownika.

## Ryzyka

| Ryzyko | Ograniczenie |
|---|---|
| Złożoność reguł Firestore dla relacji trener–podopieczny | Uprawnienia przez dokument `coaching`, testy A/B dla każdej ścieżki, w tym zaproszenia wygasłe, użyte i cudze |
| Migracja obecnych danych | Skrypt z trybem próbnym, kopia eksportu Firestore, porównanie liczby treningów i serii przed i po |
| Trenerzy nie porzucą Excela | Import arkusza, eksport do PDF, pilotaż przed etapem 5 |
| Wymogi RODO dla danych o zdrowiu, zgoda jako warunek aktywacji konta | ADR-0012, ADR-0015; polityka prywatności i konsultacja prawna przed otwarciem rejestracji dla innych osób |
| Limity darmowego planu Spark przy wielu podopiecznych | Odczyt tylko potrzebnych danych (limity zapytań), monitoring zużycia w konsoli; plan Blaze według warunku w ADR-0009 |
