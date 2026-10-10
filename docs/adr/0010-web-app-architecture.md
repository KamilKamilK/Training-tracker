# ADR-0010: Architektura aplikacji webowej — routing, dane, offline, walidacja

- **Status:** przyjęta 2026-10-10

## Kontekst

Nawigacja to dziś stan zakładki w `TrainingTracker.tsx` — brak adresów URL, więc nie ma linku do treningu, podopiecznego ani zaproszenia. Dane są wczytywane jednorazowo (`getDocs`) w hookach, bez pamięci podręcznej offline. Walidacja odczytu to ręczne funkcje w `src/utils/parse.utils.ts`, a ten sam kształt powtarzają typy i reguły. Wersja z rolami będzie miała wiele widoków (Dzisiaj, Historia, Postęp, Podopieczni, Kreator planu).

## Decyzja (rekomendacja)

1. **Routing:** React Router z trasami per widok i rolą (`/today`, `/history`, `/progress`, `/coach/athletes/:id`, `/invite/:token`); strony ładowane leniwie.
2. **Dane:** nasłuchy Firestore (`onSnapshot`) w hookach per widok, bez dodatkowej biblioteki pamięci podręcznej — Firestore SDK sam trzyma cache i aktualizuje dane na żywo.
3. **Offline:** `persistentLocalCache` z `persistentMultipleTabManager` (IndexedDB, wiele kart); czyszczenie pamięci (`terminate` + `clearIndexedDbPersistence`) przy wylogowaniu, aby dane nie zostały na wspólnym komputerze.
4. **Walidacja:** schematy Zod jako jedno źródło typów (`z.infer`) i walidacji odczytu, formularzy i wejścia funkcji; zastępują ręczne parsery.
5. **Struktura kodu:** podział według funkcji (`src/features/<obszar>/` z komponentami, hookami i serwisami), wspólne komponenty w `src/components/common/`.

## Rozważane warianty

**Pobieranie danych**

| Wariant | Zalety | Wady |
|---|---|---|
| **Nasłuchy Firestore w hookach (rekomendowany)** | Dane na żywo (trener widzi zapis podopiecznego od razu); jeden cache — SDK; działa offline | Trzeba pilnować odpinania nasłuchów; koszt odczytu przy każdej zmianie dokumentu |
| TanStack Query nad Firestore | Znane wzorce cache, retry, stany ładowania | Drugi cache obok cache Firestore; nasłuchy na żywo wymagają ręcznej integracji |
| Jednorazowe odczyty jak dziś | Najprostsze | Brak aktualizacji na żywo; dane nieaktualne między widokami |

**Walidacja**

| Wariant | Zalety | Wady |
|---|---|---|
| **Zod (rekomendowany)** | Typ i walidacja z jednego schematu; użycie w kliencie i funkcjach; licencja MIT, aktywnie rozwijany | Nowa zależność (kilkanaście kB w bundlu, mniej w wariancie `zod/mini`) |
| Ręczne parsery jak dziś | Brak zależności | Typ, parser i formularz opisują ten sam kształt trzy razy — łatwo o rozjazd |
| Valibot | Mniejszy bundle | Mniejsza popularność i ekosystem |

**Routing**

| Wariant | Zalety | Wady |
|---|---|---|
| **React Router (rekomendowany)** | Standard dla SPA na React; leniwe ładowanie tras; licencja MIT | Kolejna zależność |
| TanStack Router | Typowane parametry tras | Mniejsza popularność; więcej konfiguracji |
| Własny stan zakładek jak dziś | Brak zależności | Brak linków, przycisku „wstecz” i podziału kodu |

## Konsekwencje

- Przebudowa nawigacji i hooków danych w etapie 0, przed modelem z wieloma użytkownikami.
- Testy E2E (Playwright na emulatorach, także na zbudowanej wersji) obejmują trasy obu ról.

## Warunek rewizji

Wydajność list przy dużej liczbie dokumentów albo koszt odczytów nasłuchów powyżej progu — wtedy paginacja i odczyty jednorazowe dla historii.
