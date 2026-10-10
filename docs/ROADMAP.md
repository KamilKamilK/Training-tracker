# Dziennik Treningowy — wizja i plan rozwoju

**Status:** kierunek przyjęty 2026-10-10 — Firebase zostaje, najpierw wersja webowa, wersja mobilna odłożona ([ADR-0004](adr/0004-firebase-multi-user.md)). Decyzje do etapów 1–3 przyjęte; projekt zostaje na darmowym planie Spark ([Decyzje](#decyzje)).

## Wizja

Aplikacja dla trenerów personalnych i ich podopiecznych, która zastępuje arkusz Excela:

- **Trener** układa plan na kilka tygodni, przypisuje go podopiecznym i widzi, co faktycznie zrobili: ciężary, powtórzenia, RIR, regularność, pomiary.
- **Podopieczny** otwiera aplikację na siłowni, widzi dzisiejszy trening z zadanymi wartościami i wynikami z poprzedniego razu, zapisuje serie także bez zasięgu i widzi swoje postępy.
- **Model biznesowy:** trener płaci abonament zależny od liczby podopiecznych; podopieczny korzysta za darmo. Osoba bez trenera może prowadzić własny dziennik — tak jak dziś.

Główna przewaga nad Excelem: plan i wykonanie są w jednym miejscu, porównanie „zadane / wykonane” i postęp liczą się same, a podopieczny ma wygodny widok na telefonie.

## Stan wyjściowy

Co już działa: zapis treningu z szablonu z szkicem odpornym na odświeżenie, plan tygodnia, historia, pomiary, logowanie Google, reguły Firestore z walidacją, adresy URL zakładek, dane na żywo i praca offline na otwartej stronie, testy jednostkowe, reguł i end-to-end ([ADR-0002](adr/0002-spa-firebase.md), [ADR-0003](adr/0003-owner-authentication.md)).

Co ogranicza rozwój:

| Ograniczenie | Gdzie | Skutek |
|---|---|---|
| Jeden właściciel danych, kolekcje w korzeniu bazy | `firestore.rules`, serwisy `src/features/*/*.service.ts` | Brak kont dla wielu osób i ról |
| Ćwiczenie to tekst, a ciężar i powtórzenia to napisy | `src/types/workout.types.ts` | Nie da się policzyć postępu dla ćwiczenia (e1RM, objętość) ani porównać z planem |
| Szablony w LocalStorage | `src/features/templates/useTemplates.ts` | Szablony znikają przy zmianie urządzenia; trener nie może ich udostępnić |
| Plan tygodnia jako jeden dokument z nazwami szablonów | `src/features/plan/useWeekPlan.ts` | Brak planów wielotygodniowych z progresją |
| Tylko logowanie Google, bez rejestracji | `src/features/auth/` | Osoby bez konta Google nie mogą korzystać z aplikacji |

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
| `users/{uid}/measurements`, `checkins` | pomiary, check-iny (zapis wymaga zgody na dane o zdrowiu) | jak wyżej |
| `users/{uid}/programs/{id}` | przypisany plan (kopia) z datą startu | właściciel; trener, który go przypisał |
| `coaching/{coachId}_{athleteId}` | status współpracy (zaproszona, aktywna, zakończona), daty | obie strony |
| `coaches/{uid}/programTemplates`, `exercises` | szablony planów i własne ćwiczenia trenera | trener |
| `exercises/{id}` | biblioteka globalna: nazwa, partie mięśniowe, sprzęt, wideo | wszyscy zalogowani (odczyt) |
| `invites/{token}` | zaproszenie: losowy token 128-bit, trener, ważność ≤ 7 dni, jednorazowe użycie ([ADR-0008](adr/0008-accounts-and-invitations.md)) | tworzy trener; odczyt pojedynczego dokumentu z linku, lista zabroniona |

Obecne dane właściciela przechodzą jednorazowo do `users/{uid}/…` skryptem migracji (napisy na liczby, nazwy ćwiczeń dopasowane do biblioteki) — po akceptacji właściciela i z kopią zapasową.

## Decyzje

Wszystkie decyzje potrzebne do etapów 1–3 są przyjęte (2026-10-10):

| ADR | Decyzja |
|---|---|
| [0004](adr/0004-firebase-multi-user.md) | Firebase; najpierw wersja webowa, mobilna odłożona |
| [0005](adr/0005-data-model-and-access.md) | Dane w `users/{uid}/…`; dostęp trenera przez zaakceptowaną współpracę; role jako profil |
| [0006](adr/0006-training-programs.md) | Plan wielotygodniowy; przypisanie jako kopia; progresja wartościami |
| [0007](adr/0007-exercises-and-sets.md) | Biblioteka ćwiczeń, serie liczbowe, migracja skryptem z trybem próbnym |
| [0008](adr/0008-accounts-and-invitations.md) | Google albo e-mail z hasłem, potwierdzenie adresu, reset hasła; zaproszenie linkiem bez serwera |
| [0009](adr/0009-cloud-functions-aggregates.md) | Plan Spark bez Cloud Functions; postęp liczony w przeglądarce; zdjęcia po zmianie planu |
| [0010](adr/0010-web-app-architecture.md), [0011](adr/0011-environments-hosting-monitoring.md) | Architektura aplikacji webowej; emulatory i produkcja, Vercel |
| [0012](adr/0012-personal-and-health-data.md) | Dobrowolne, zrozumiałe zgody; dane o zdrowiu tylko dla własnego trenera; eksport i usunięcie konta |

Backlog decyzji: otwieranie aplikacji bez sieci ([ADR-0013](adr/0013-offline-app-shell.md), odłożona razem z wersją mobilną); plan Blaze (warunki w ADR-0009); model cenowy i operator płatności — przed etapem 5.

## Etapy

Rozmiar: S — kilka dni, M — 1–2 tygodnie, L — 3+ tygodnie pracy jednej osoby.

| Etap | Zakres | Gotowe, gdy | Rozmiar |
|---|---|---|---|
| **0. Fundament** | Schematy Zod, routing, nasłuchy danych, cache offline i podział kodu według funkcji — wdrożone ([ADR-0010](adr/0010-web-app-architecture.md)); testy E2E Playwright na emulatorach i na zbudowanej wersji — wdrożone (`e2e/`, [ADR-0011](adr/0011-environments-hosting-monitoring.md)) | Scenariusze z checklisty mają testy E2E, aplikacja działa offline na otwartej stronie | M |
| **1. Wiele kont, nowy model danych** | Ekran „Zaloguj / Zarejestruj” (Google albo e-mail z hasłem, potwierdzenie adresu, reset hasła); profil i zgody; dane w `users/{uid}/…`; biblioteka ćwiczeń; serie liczbowe; szablony w Firestore; migracja obecnych danych | Dwa konta nie widzą swoich danych (testy reguł A/B), konto bez potwierdzonego adresu nie ma dostępu, dane właściciela przeniesione bez strat | L |
| **2. Postęp** | Wyniki z poprzedniego razu przy ćwiczeniu; wykresy e1RM, rekordy, objętość tygodniowa, regularność; trend wagi; minutnik przerwy | Podopieczny widzi postęp dla dowolnego ćwiczenia z historii; obliczenia mają testy jednostkowe | M |
| **3. Trener** | Rola trenera; zaproszenia linkiem (reguły Firestore); lista podopiecznych z sygnałami; kreator planu wielotygodniowego z kopiowaniem i progresją; przypisanie planu; „zadane / wykonane”; komentarze; check-iny; import CSV/Excel | Pilotaż: 2–3 trenerów prowadzi realnych podopiecznych przez 4 tygodnie bez arkusza | L |
| **4. Mobile — odłożony** | Do wznowienia decyzją właściciela ([ADR-0004](adr/0004-firebase-multi-user.md)); wtedy PWA, a później Capacitor | — | M |
| **5. Produkt komercyjny** | Abonamenty i limity podopiecznych; strona produktu; regulamin, polityka prywatności, umowa powierzenia; eksport i usunięcie danych; język angielski; panel administratora | Pierwszy trener płaci za abonament, a żądanie usunięcia konta wykonuje się bez ręcznej pracy | L |

Kolejność: 0 → 1 → 2 → 3 → 5. Etapy 1 i 2 mają wartość także bez trenerów (lepszy dziennik), więc dają szybki efekt; etap 3 warto zacząć od rozmów z 3–5 trenerami o tym, jak dziś prowadzą plany w Excelu i czego im brakuje.

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
| Wymogi RODO dla danych o zdrowiu | ADR-0012 i konsultacja prawna przed pierwszym trenerem |
| Limity darmowego planu Spark przy wielu podopiecznych | Odczyt tylko potrzebnych danych (limity zapytań), monitoring zużycia w konsoli; plan Blaze według warunku w ADR-0009 |
