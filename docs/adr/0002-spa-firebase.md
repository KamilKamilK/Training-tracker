# ADR-0002: SPA bez własnego backendu, dane w Cloud Firestore

- **Status:** przyjęta 2026-10-07

## Kontekst

Aplikacja to prywatny dziennik treningowy jednego użytkownika, używany głównie na telefonie. Dane (treningi, pomiary, plan tygodnia) muszą być dostępne z wielu urządzeń, a utrzymanie serwera jest niepożądane.

## Decyzja

- **Frontend:** React 19, TypeScript (`strict`), Vite, Tailwind CSS 3, Recharts, ikony `lucide-react`; budowany statycznie (`npm run build`) i hostowany na Vercel.
- **Dane:** Cloud Firestore (`europe-central2`), kolekcje `workouts`, `measurements`, `weekPlans`. Dostęp wyłącznie przez SDK `firebase` w warstwie `src/services/firebase/`.
- **Dane lokalne:** LocalStorage przez `LocalStorageService` — szkic bieżącego treningu i szablony użytkownika (`STORAGE_KEYS`).
- **Bezpieczeństwo:** brak backendu, więc granicą bezpieczeństwa są reguły `firestore.rules`; konfiguracja Firebase przez zmienne `VITE_*`.
- **Warstwy:** `types` → `services` → `hooks` → `components`; komponenty nie wołają Firestore bezpośrednio.

## Rozważane warianty

| Wariant | Ocena |
|---|---|
| Tylko LocalStorage | Brak synchronizacji między urządzeniami i ryzyko utraty danych przy czyszczeniu przeglądarki |
| Własne API + baza | Koszt utrzymania serwera nieproporcjonalny do jednego użytkownika |
| Firebase Data Connect (PostgreSQL) | SDK jest wygenerowane w `src/dataconnect-generated/`, ale nieużywane; Firestore wystarcza dla obecnego modelu |

## Konsekwencje

- Każda reguła dostępu i walidacji danych musi być w `firestore.rules` — kod frontendu można ominąć.
- Dostęp tylko dla właściciela wymaga uwierzytelnienia (Firebase Authentication).
- Zmiana kształtu dokumentów wymaga zgodności z danymi już zapisanymi w Firestore.

## Warunek rewizji

Drugi użytkownik z własnymi danymi, potrzeba logiki serwerowej (np. powiadomienia, eksporty) albo limity darmowego planu Firebase.
