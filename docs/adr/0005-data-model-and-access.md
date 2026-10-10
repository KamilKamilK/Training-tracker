# ADR-0005: Model danych użytkowników i dostęp trenera

- **Status:** proponowana 2026-10-10 — czeka na akceptację właściciela

## Kontekst

Dziś dane są w kolekcjach głównych (`workouts`, `measurements`, `weekPlans`) i należą do jednego właściciela ([ADR-0003](0003-owner-authentication.md)). W wersji docelowej każdy użytkownik ma własne dane, a trener widzi dane podopiecznych tylko w czasie aktywnej współpracy. Ograniczenia Firestore: reguła nie filtruje wyników — zapytanie musi dać się udowodnić regułą z góry; jedna reguła może wykonać najwyżej 10 wywołań `get`/`exists` (20 dla zapisów wsadowych i transakcji).

Trzy powiązane pytania: gdzie leżą dane, jak trener uzyskuje do nich dostęp i skąd aplikacja wie o rolach.

## Decyzja (rekomendacja)

1. **Dane w podkolekcjach użytkownika:** `users/{uid}/sessions`, `measurements`, `checkins`, `programs`; profil w `users/{uid}`.
2. **Dostęp trenera przez dokument współpracy** `coaching/{coachUid}_{athleteUid}` ze statusem `active`. Reguła podkolekcji podopiecznego sprawdza `exists()`/`get()` tego dokumentu. Szczegóły podopiecznego trener czyta zapytaniami w jego podkolekcjach; lista podopiecznych na pulpicie trenera czyta podsumowania `coaches/{coachUid}/athletes/{athleteUid}` utrzymywane przez Cloud Functions ([ADR-0009](0009-cloud-functions-aggregates.md)).
3. **Role jako profil, uprawnienia z relacji:** `roles: ['athlete', 'coach']` w `users/{uid}` decyduje tylko o widokach; dostęp do cudzych danych wynika wyłącznie z aktywnej współpracy zaakceptowanej przez podopiecznego. Rolę trenera użytkownik włącza sam; limity planu (etap komercyjny) egzekwuje funkcja.

## Rozważane warianty

**Struktura danych**

| Wariant | Zalety | Wady |
|---|---|---|
| **Podkolekcje `users/{uid}/…` (rekomendowany)** | Właściciel wynika ze ścieżki — proste reguły i testy A/B; łatwy eksport i usunięcie konta (RODO) | Zapytania przez wielu użytkowników wymagają `collectionGroup` i dodatkowego pola do reguł |
| Kolekcje główne z polem `ownerId` | Jedno zapytanie przez wszystkich użytkowników | Każde zapytanie musi filtrować po `ownerId`, błąd w filtrze to odmowa lub wyciek; trudniejsze usunięcie konta |
| Organizacje (`orgs/{orgId}/…`) dla studiów z wieloma trenerami | Gotowe na kluby i siłownie | YAGNI — brak takiego klienta; komplikuje reguły od pierwszego dnia |

**Dostęp trenera**

| Wariant | Zalety | Wady |
|---|---|---|
| **`exists()` na dokumencie współpracy + podsumowania z funkcji (rekomendowany)** | Zakończenie współpracy odcina dostęp natychmiast; jedno źródło prawdy; pulpit to jedno zapytanie | Szczegóły podopiecznego to osobne zapytanie na podopiecznego; podsumowania wymagają funkcji |
| Pole `coachIds` w każdym dokumencie podopiecznego | Zapytanie `collectionGroup` po wszystkich podopiecznych naraz | Zmiana trenera wymaga przepisania wszystkich dokumentów; ryzyko niespójności |
| Lista podopiecznych w custom claims tokenu | Brak odczytów w regułach | Limit 1000 bajtów tokenu; zmiana widoczna dopiero po odświeżeniu tokenu |

**Role**

| Wariant | Zalety | Wady |
|---|---|---|
| **Profil + uprawnienia z relacji (rekomendowany)** | Rola nie daje dostępu sama w sobie — brak eskalacji uprawnień; prosta rejestracja trenera | Weryfikacja „prawdziwego trenera” (np. certyfikatu) poza systemem |
| Role nadawane przez administratora (custom claims) | Kontrola, kto jest trenerem | Ręczna praca przy każdej rejestracji; wolniejszy start pilotażu |

## Konsekwencje

- Obecne dane przechodzą jednorazowo do `users/{uid}/…` ([ADR-0007](0007-exercises-and-sets.md)); kolekcja `owners` znika po migracji.
- Każda podkolekcja ma testy reguł: własne, cudze, trener z aktywną, zaproszoną i zakończoną współpracą.
- Po zakończeniu współpracy dane zostają u podopiecznego, a podsumowanie u trenera jest usuwane przez funkcję.

## Warunek rewizji

Klient z kilkoma trenerami wspólnie prowadzącymi podopiecznych (organizacje) albo pulpit trenera wymagający zapytań, których nie da się oprzeć na podsumowaniach.
