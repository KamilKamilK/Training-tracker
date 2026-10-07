# Dziennik Treningowy — wizja i plan rozwoju

**Status:** propozycja z 2026-10-07, czeka na decyzje właściciela (część [Decyzje przed etapem 1](#decyzje-przed-etapem-1)). Kierunek obowiązuje dopiero po przyjęciu odpowiednich ADR w [DECISIONS.md](DECISIONS.md).

## Wizja

Aplikacja dla trenerów personalnych i ich podopiecznych, która zastępuje arkusz Excela:

- **Trener** układa plan na kilka tygodni, przypisuje go podopiecznym i widzi, co faktycznie zrobili: ciężary, powtórzenia, RIR, regularność, pomiary.
- **Podopieczny** otwiera aplikację na siłowni, widzi dzisiejszy trening z zadanymi wartościami i wynikami z poprzedniego razu, zapisuje serie także bez zasięgu i widzi swoje postępy.
- **Model biznesowy:** trener płaci abonament zależny od liczby podopiecznych; podopieczny korzysta za darmo. Osoba bez trenera może prowadzić własny dziennik — tak jak dziś.

Główna przewaga nad Excelem: plan i wykonanie są w jednym miejscu, porównanie „zadane / wykonane” i postęp liczą się same, a podopieczny ma wygodny widok na telefonie.

## Stan wyjściowy

Co już działa: zapis treningu z szablonu z szkicem odpornym na odświeżenie, plan tygodnia, historia, pomiary, logowanie Google, reguły Firestore z walidacją, testy jednostkowe i testy reguł ([ADR-0002](adr/0002-spa-firebase.md), [ADR-0003](adr/0003-owner-authentication.md)).

Co ogranicza rozwój:

| Ograniczenie | Gdzie | Skutek |
|---|---|---|
| Jeden właściciel danych, kolekcje w korzeniu bazy | `firestore.rules`, `src/services/firebase/` | Brak kont dla wielu osób i ról |
| Ćwiczenie to tekst, a ciężar i powtórzenia to napisy | `src/types/workout.types.ts` | Nie da się policzyć postępu dla ćwiczenia (e1RM, objętość) ani porównać z planem |
| Szablony w LocalStorage | `src/hooks/useTemplates.ts` | Szablony znikają przy zmianie urządzenia; trener nie może ich udostępnić |
| Plan tygodnia jako jeden dokument z nazwami szablonów | `src/hooks/useWeekPlan.ts` | Brak planów wielotygodniowych z progresją |
| Nawigacja przez stan zakładki, bez adresów URL | `src/components/TrainingTracker.tsx` | Nie da się podać linku do treningu, podopiecznego ani zaproszenia |
| Brak pracy offline poza szkicem | konfiguracja Firestore | Na siłowni bez zasięgu nie widać planu ani historii |

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
- Szybki zapis serii, minutnik przerwy, odhaczanie serii, praca offline z synchronizacją.
- Trening spoza planu (dzisiejsze szablony) — dziennik bez trenera działa dalej.
- Postęp: wykres e1RM i najlepszej serii dla ćwiczenia, rekordy, tygodniowa objętość (tonaż, serie na partię mięśniową), regularność wobec planu, waga z średnią 7-dniową, obwody, zdjęcia sylwetki.
- Cotygodniowy check-in dla trenera (samopoczucie, sen, waga, zdjęcia, komentarz).

**Trener**
- Lista podopiecznych z sygnałami: ostatni trening, regularność w tygodniu, brak check-inu, spadek wyników.
- Kreator planu: tygodnie → dni → ćwiczenia z parametrami; kopiowanie tygodnia, progresja (np. +2,5 kg lub −1 RIR co tydzień), biblioteka własnych planów i ćwiczeń.
- Przypisanie planu z datą startu; przypisany plan to kopia, więc zmiany w szablonie nie przepisują historii podopiecznego.
- Podgląd wykonania „zadane / wykonane”, komentarze do treningu, odpowiedź na check-in.
- **Import planu z Excela/CSV** według prostego wzoru i eksport do PDF — najkrótsza droga przejścia z arkusza.
- Powiadomienia: zakończony trening, nowy check-in, pominięty trening.

**Wspólne:** konto przez Google lub link e-mail, profil, zaproszenie linkiem, eksport i usunięcie danych (RODO), język polski i angielski.

## Model danych (szkic dla wariantu Firestore)

| Ścieżka | Zawartość | Kto ma dostęp |
|---|---|---|
| `users/{uid}` | profil, role, ustawienia | właściciel konta |
| `users/{uid}/sessions/{id}` | wykonany trening: data, odnośnik do dnia planu, ćwiczenia z `exerciseId`, serie liczbowe (`weight`, `reps`, `rir`, `done`) | właściciel; trener z aktywną współpracą |
| `users/{uid}/measurements`, `checkins` | pomiary, check-iny, odnośniki do zdjęć w Cloud Storage | jak wyżej |
| `users/{uid}/programs/{id}` | przypisany plan (kopia) z datą startu | właściciel; trener, który go przypisał |
| `coaching/{coachId}_{athleteId}` | status współpracy (zaproszona, aktywna, zakończona), daty | obie strony |
| `coaches/{uid}/programTemplates`, `exercises` | szablony planów i własne ćwiczenia trenera | trener |
| `exercises/{id}` | biblioteka globalna: nazwa, partie mięśniowe, sprzęt, wideo | wszyscy zalogowani (odczyt) |
| `invites/{token}` | zaproszenie z datą wygaśnięcia; tworzy i realizuje Cloud Function | tylko serwer |

Obecne dane właściciela przechodzą jednorazowo do `users/{uid}/…` skryptem migracji (napisy na liczby, nazwy ćwiczeń dopasowane do biblioteki) — po akceptacji właściciela i z kopią zapasową.

## Decyzje przed etapem 1

Każda decyzja to osobny ADR przyjęty przed implementacją.

**1. Backend i baza danych (ADR-0004)**

| Wariant | Zalety | Wady |
|---|---|---|
| **A. Firebase dalej** (Firestore + Cloud Functions + Storage) | Zapis offline i synchronizacja wbudowane — kluczowe na siłowni; podgląd trenera w czasie rzeczywistym; obecny kod, reguły i testy zostają; niski koszt na starcie | Agregaty (e1RM, objętość) trzeba liczyć w funkcjach lub w kliencie; reguły dla relacji trener–podopieczny są złożone; zależność od jednego dostawcy |
| B. PostgreSQL w usłudze (np. Supabase: Postgres, Auth, RLS, Storage) | Model relacyjny pasuje do planów i serii; analizy w SQL; możliwy własny hosting | Brak gotowego offline — trzeba zbudować kolejkę zapisów; przepisanie warstwy danych i testów reguł |
| C. Własne API (np. Symfony lub Node) + PostgreSQL | Pełna kontrola nad logiką, uprawnieniami i rozliczeniami | Najwięcej pracy i utrzymania serwera; offline do zbudowania |

**Rekomendacja: A** dla etapów 1–4 — najmniejszy koszt dojścia do pilotażu z trenerami i najlepsza praca offline. Warunek rewizji: raporty dla wielu podopiecznych naraz, których nie da się rozsądnie policzyć funkcjami, albo koszt odczytów Firestore powyżej ustalonego progu.

**2. Wersja mobilna (ADR-0005).** Rekomendacja: najpierw **PWA** (instalacja na ekranie głównym, trwały cache Firestore offline, powiadomienia web push przez FCM — na iOS od 16.4 po instalacji), później ta sama aplikacja React w **Capacitor** do App Store i Google Play, jeśli trenerzy będą tego oczekiwać. Osobna aplikacja natywna dopiero, gdy PWA/Capacitor okaże się niewystarczające.

**3. Model biznesowy i rozliczenia (ADR-0006).** Do ustalenia: progi cenowe (np. darmowo do 3 podopiecznych), okres próbny, faktury, operator płatności (np. Stripe przez rozszerzenie Firebase).

**4. Dane osobowe i zdrowotne (ADR-0007).** Waga, obwody i zdjęcia sylwetki mogą być danymi o zdrowiu w rozumieniu RODO: wyraźna zgoda podopiecznego, umowa powierzenia z trenerem, region UE (`europe-central2` już jest), eksport i usunięcie konta, regulamin i polityka prywatności — przed pierwszym płacącym trenerem; warto skonsultować z prawnikiem.

## Etapy

Rozmiar: S — kilka dni, M — 1–2 tygodnie, L — 3+ tygodnie pracy jednej osoby.

| Etap | Zakres | Gotowe, gdy | Rozmiar |
|---|---|---|---|
| **0. Fundament** | Scalenie obecnego PR i konfiguracja Firebase (KNOWN_ISSUES #1); hook `pre-push` zamiast CI (#14); routing z adresami URL (React Router); pobieranie danych przez TanStack Query; schematy Zod zamiast ręcznej walidacji; osobny projekt Firebase dla środowiska testowego; monitoring błędów (np. Sentry); testy E2E Playwright na emulatorach; ADR-0004 i ADR-0005 | Każda zmiana przechodzi bramkę lokalnie, scenariusze z checklisty mają testy E2E, decyzje przyjęte | M |
| **1. Wiele kont, nowy model danych** | Rejestracja i profil; dane w `users/{uid}/…`; biblioteka ćwiczeń; serie liczbowe; szablony w Firestore; migracja obecnych danych; trwały cache offline | Dwa konta nie widzą swoich danych (testy reguł A/B), dane właściciela przeniesione bez strat, aplikacja działa w trybie samolotowym | L |
| **2. Postęp** | Wyniki z poprzedniego razu przy ćwiczeniu; wykresy e1RM, rekordy, objętość tygodniowa, regularność; trend wagi; zdjęcia sylwetki w Cloud Storage; minutnik przerwy | Podopieczny widzi postęp dla dowolnego ćwiczenia z historii; obliczenia mają testy jednostkowe | M |
| **3. Trener** | Rola trenera; zaproszenia (Cloud Function); lista podopiecznych z sygnałami; kreator planu wielotygodniowego z kopiowaniem i progresją; przypisanie planu; „zadane / wykonane”; komentarze; check-iny; import CSV/Excel | Pilotaż: 2–3 trenerów prowadzi realnych podopiecznych przez 4 tygodnie bez arkusza | L |
| **4. Mobile** | PWA (manifest, service worker, instalacja, web push); powiadomienia trenera i podopiecznego; później Capacitor | Instalacja na Android i iOS, powiadomienie o zakończonym treningu dociera do trenera | M |
| **5. Produkt komercyjny** | Abonamenty i limity podopiecznych; strona produktu; regulamin, polityka prywatności, umowa powierzenia; eksport i usunięcie danych; język angielski; panel administratora | Pierwszy trener płaci za abonament, a żądanie usunięcia konta wykonuje się bez ręcznej pracy | L |

Etapy 1 i 2 mają wartość także bez trenerów (lepszy dziennik), więc dają szybki efekt; etap 3 warto zacząć od rozmów z 3–5 trenerami o tym, jak dziś prowadzą plany w Excelu i czego im brakuje.

## Jakość — zasady przekrojowe

- Każda kolekcja i rola ma testy reguł z przypadkami „własne / cudze / trener z aktywną i zakończoną współpracą” ([AGENTS.md](../AGENTS.md#4-bezpieczeństwo)).
- Logika obliczeń (e1RM, objętość, progresja) jako czyste funkcje w `src/utils/` z testami; ten sam kod w kliencie i w Cloud Functions.
- Komponenty interfejsu wspólne dla obu ról (karta treningu, tabela serii, wykres) w `src/components/common/`.
- Środowiska: emulatory lokalnie, projekt testowy, produkcja; migracje danych jako skrypty z trybem próbnym i kopią zapasową.
- Mierzenie: czas zapisu serii, błędy z monitoringu, koszt odczytów Firestore na aktywnego użytkownika.

## Ryzyka

| Ryzyko | Ograniczenie |
|---|---|
| Złożoność reguł Firestore dla relacji trener–podopieczny | Uprawnienia przez dokument `coaching`, testy A/B dla każdej ścieżki, zapisy wrażliwe (zaproszenia, rozliczenia) tylko przez Cloud Functions |
| Migracja obecnych danych | Skrypt z trybem próbnym, kopia eksportu Firestore, porównanie liczby treningów i serii przed i po |
| Trenerzy nie porzucą Excela | Import arkusza, eksport do PDF, pilotaż przed etapem 5 |
| Wymogi RODO dla danych o zdrowiu | ADR-0007 i konsultacja prawna przed pierwszym płacącym klientem |
| Koszt Firestore przy wielu podopiecznych | Agregaty liczone raz (Cloud Functions), limity zapytań, monitoring kosztów |
