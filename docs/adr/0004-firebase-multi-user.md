# ADR-0004: Firebase jako platforma dla wersji z wieloma użytkownikami

- **Status:** przyjęta 2026-10-10

## Kontekst

Aplikacja ma obsłużyć wielu użytkowników w rolach trenera i podopiecznego ([ROADMAP](../ROADMAP.md)). Obecnie działa na Firebase bez własnego backendu ([ADR-0002](0002-spa-firebase.md)). Właściciel zdecydował 2026-10-10, że najpierw powstaje poprawna wersja webowa, a wersja mobilna jest odłożona.

## Decyzja

- Wersja z wieloma użytkownikami zostaje na Firebase: Authentication, Cloud Firestore, Cloud Storage (zdjęcia) i Cloud Functions (operacje, których nie może wykonać klient — szczegóły w [ADR-0009](0009-cloud-functions-aggregates.md)).
- Aplikacja webowa (SPA na Vercel) jest jedynym klientem; wersja mobilna (PWA, Capacitor) nie jest planowana do odwołania tej decyzji przez właściciela.
- Granicą bezpieczeństwa pozostają `firestore.rules` (oraz `storage.rules`), z testami na emulatorze dla każdej ścieżki.

## Rozważane warianty

| Wariant | Zalety | Wady |
|---|---|---|
| **Firebase (wybrany)** | Zapis offline i synchronizacja wbudowane; dane na żywo dla trenera; obecny kod, reguły i testy zostają; niski koszt na starcie | Analizy wymagają funkcji lub liczenia w kliencie; złożone reguły dla relacji trener–podopieczny; zależność od jednego dostawcy |
| PostgreSQL w usłudze (np. Supabase) | Model relacyjny, analizy w SQL, możliwy własny hosting | Brak gotowego offline; przepisanie warstwy danych i testów |
| Własne API + PostgreSQL | Pełna kontrola logiki i uprawnień | Najwięcej pracy i utrzymania serwera |

## Konsekwencje

- Model danych i uprawnienia projektujemy pod ograniczenia Firestore (zapytania muszą dać się udowodnić regułom, limit wywołań `get`/`exists` w regule) — [ADR-0005](0005-data-model-and-access.md).
- Cloud Functions wymagają planu Blaze z budżetem i alertami kosztów — [ADR-0009](0009-cloud-functions-aggregates.md).

## Warunek rewizji

Raporty obejmujące wielu podopiecznych naraz, których nie da się utrzymać funkcjami, albo miesięczny koszt Firebase powyżej progu ustalonego przez właściciela.
