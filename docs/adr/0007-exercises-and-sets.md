# ADR-0007: Biblioteka ćwiczeń, serie liczbowe i migracja obecnych danych

- **Status:** proponowana 2026-10-10 — czeka na akceptację właściciela

## Kontekst

Ćwiczenie jest dziś tekstem (np. „Wyciskanie Smith dodatnia 15° – 5x (12/10/10/8/8)”), który miesza nazwę z zaleceniem, a ciężar, powtórzenia i RIR są napisami (`src/types/workout.types.ts`). Bez stałego identyfikatora ćwiczenia i liczb nie da się policzyć postępu (e1RM, rekordy, objętość) ani porównać z planem. Istniejące treningi właściciela trzeba przenieść bez strat.

## Decyzja (rekomendacja)

1. **Biblioteka globalna** `exercises/{id}` (nazwa PL/EN, partie mięśniowe, sprzęt, opcjonalne wideo) zarządzana przez administratora, plus **ćwiczenia własne trenera** w `coaches/{uid}/exercises`. Plan i sesja odwołują się do `exerciseId`; zalecenia (serie, zakres powtórzeń) są osobnymi polami planu.
2. **Serie jako liczby:** `weight` (kg, liczba), `reps` (liczba całkowita), `rir` (liczba lub brak), `done` (bool). Pusta wartość to brak pola, nie pusty napis.
3. **Migracja jednorazowym skryptem** (Firebase Admin SDK, uruchamiany lokalnie) z trybem próbnym: eksport kopii, dopasowanie nazw do biblioteki (tabela mapowań przeglądana przez właściciela), konwersja napisów na liczby, raport różnic (liczba sesji i serii przed i po). Rekordy nie do dopasowania trafiają do ćwiczeń własnych.

## Rozważane warianty

**Ćwiczenia**

| Wariant | Zalety | Wady |
|---|---|---|
| **Biblioteka globalna + własne trenera (rekomendowany)** | Spójne nazwy i statystyki; trener nie czeka na administratora | Utrzymanie biblioteki globalnej; dwa źródła w wyszukiwarce |
| Tylko ćwiczenia własne każdego trenera | Pełna swoboda, brak utrzymania | Brak wspólnych statystyk i treści; każdy trener zaczyna od zera |
| Wolny tekst z dopasowaniem przy wyświetlaniu | Brak zmian w zapisie | Literówki rozbijają historię ćwiczenia; postęp niewiarygodny |

**Migracja**

| Wariant | Zalety | Wady |
|---|---|---|
| **Skrypt Admin SDK z trybem próbnym (rekomendowany)** | Jednorazowy, przeglądany, z kopią i raportem; kod aplikacji nie nosi starego formatu | Wymaga uruchomienia przez właściciela z poświadczeniami serwisowymi |
| Migracja w aplikacji przy pierwszym logowaniu | Bez narzędzi po stronie właściciela | Kod migracji zostaje w aplikacji; reguły muszą dopuszczać stary i nowy format; trudny do powtórzenia przy błędzie |
| Odczyt obu formatów bez migracji | Brak ryzyka utraty danych | Podwójny model na zawsze; statystyki muszą rozumieć napisy |

## Konsekwencje

- Formularz serii przyjmuje liczby (z przecinkiem dziesiętnym) i waliduje zakresy także w regułach.
- Szablony domyślne z `src/constants/workoutTemplates.ts` są rozdzielane na ćwiczenie z biblioteki i zalecenie.
- Migracja wymaga zgody właściciela na konkretne zmiany w produkcji (AGENTS.md, pkt 5).

## Warunek rewizji

Potrzeba ćwiczeń o innej strukturze serii (np. czas, dystans, interwały) — wtedy seria dostaje typ.
