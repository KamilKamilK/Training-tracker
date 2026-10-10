# ADR-0003: Logowanie Google i dostęp tylko dla właściciela danych

- **Status:** przyjęta 2026-10-07

## Kontekst

Aplikacja nie ma backendu ([ADR-0002](0002-spa-firebase.md)), więc o dostępie do danych decydują wyłącznie reguły Firestore. Konfiguracja Firebase jest publiczna (trafia do bundla), więc reguła bez uwierzytelnienia daje dostęp każdemu. Dane należą do jednego właściciela; kolekcje `workouts`, `measurements` i `weekPlans` już zawierają jego dane.

## Decyzja

- **Logowanie:** Firebase Authentication, dostawca Google (`signInWithPopup`) — `src/features/auth/auth.service.ts`.
- **Właściciel:** konto, którego UID ma dokument w kolekcji `owners`. Dokument tworzy właściciel w konsoli Firebase; reguły pozwalają użytkownikowi tylko odczytać własny dokument `owners/{uid}` i nie pozwalają na zapis.
- **Reguły (`firestore.rules`):** odczyt i zapis kolekcji danych tylko dla właściciela; każdy zapis jest walidowany (wymagane i dozwolone pola, typy, długości, zakresy pomiarów); pozostałe ścieżki są zamknięte.
- **Aplikacja:** `App` pokazuje ekran logowania, ekran braku dostępu albo dziennik — dane są pobierane dopiero po potwierdzeniu właściciela.
- **Weryfikacja:** testy reguł na emulatorze (`npm run test:rules`).

## Rozważane warianty

| Wariant | Ocena |
|---|---|
| Dane w `users/{uid}/…` dla każdego konta | Wymaga migracji istniejących dokumentów; wielu użytkowników nie jest wymaganiem (warunek rewizji ADR-0002) |
| Pole `ownerId` w każdym dokumencie | Również wymaga migracji istniejących danych |
| UID lub e-mail właściciela wpisany w `firestore.rules` | Dane osobowe w repozytorium i zmiana reguł przy każdej zmianie konta |
| E-mail i hasło | Dodatkowe hasło do utrzymania; konto Google już istnieje |

## Konsekwencje

- Istniejące dane działają bez migracji.
- Uruchomienie wymaga jednorazowej konfiguracji w konsoli: dostawca Google, autoryzowana domena hostingu, dokument `owners/{uid}`, wdrożenie reguł ([README](../../README.md#-konfiguracja-firebase-jednorazowo-konsola-firebase)).
- Szablony własne pozostają w LocalStorage przeglądarki, bez zmian.

## Warunek rewizji

Drugi użytkownik z własnymi danymi — wtedy dane przechodzą do `users/{uid}/…` z migracją.
