# ADR-0008: Konta, logowanie i zaproszenia

- **Status:** przyjęta 2026-10-10 (właściciel: Google albo e-mail z hasłem; zaproszenie linkiem; plan Spark)

## Kontekst

Dziś jedyną metodą logowania jest Google, a dostęp ma tylko konto z kolekcji `owners` ([ADR-0003](0003-owner-authentication.md)). W wersji z wieloma użytkownikami każdy zakłada konto sam, a podopieczny trafia do trenera przez zaproszenie, które akceptuje ([ADR-0005](0005-data-model-and-access.md)). Projekt zostaje na planie Spark, bez Cloud Functions ([ADR-0009](0009-cloud-functions-aggregates.md)), więc wszystkie zabezpieczenia muszą wynikać z Firebase Authentication i reguł Firestore.

## Decyzja

1. **Logowanie:** Google albo e-mail i hasło (Firebase Authentication). Ekran z zakładkami „Zaloguj” i „Zarejestruj”, link „Nie pamiętasz hasła?” (reset e-mailem z Firebase).
2. **Rejestracja e-mailem:** adres e-mail, hasło i powtórzenie hasła; walidacja w formularzu (Zod) i w Firebase — polityka haseł w konsoli: co najmniej 8 znaków, wielka i mała litera, cyfra. Pokaż/ukryj hasło.
3. **Potwierdzenie adresu:** po rejestracji Firebase wysyła link weryfikacyjny; reguły Firestore wymagają `request.auth.token.email_verified == true` (konta Google są zweryfikowane od razu). Do potwierdzenia aplikacja pokazuje ekran „Sprawdź skrzynkę” z ponownym wysłaniem.
4. **Bezpieczne komunikaty:** włączona ochrona przed wyliczaniem kont (email enumeration protection); błędne logowanie daje jeden komunikat „Nieprawidłowy e-mail lub hasło”, bez informacji, czy konto istnieje. Limit prób zapewnia Firebase Authentication.
5. **Zaproszenie linkiem:** trener tworzy dokument `invites/{token}`, gdzie `token` to losowy identyfikator 128-bitowy (`crypto.getRandomValues`); pola: `coachUid`, `expiresAt` (najwyżej 7 dni), `usedBy` (puste). Reguły: tworzy tylko zalogowany trener ze swoim `coachUid`; odczyt pojedynczego dokumentu dla zalogowanego (lista zabroniona, więc tokenów nie da się wyszukać); akceptacja to zapis wsadowy, który tworzy `coaching/{coachUid}_{athleteUid}` i ustawia `usedBy` — reguła sprawdza ważność, jednorazowość i zgodność trenera (`getAfter()`). Link `/invite/{token}` trener kopiuje i wysyła sam (komunikator, SMS).
6. **Usunięcie konta:** w aplikacji, po ponownym zalogowaniu: eksport danych (JSON), usunięcie podkolekcji użytkownika i współprac zapisem wsadowym, potem `deleteUser`.
7. **Sesja:** wylogowanie czyści pamięć podręczną Firestore ([ADR-0010](0010-web-app-architecture.md)).

## Rozważane warianty

**Logowanie**

| Wariant | Zalety | Wady |
|---|---|---|
| **Google albo e-mail z hasłem (wybrany)** | Znany wzorzec; działa z każdym adresem; hasło jako dodatkowe zabezpieczenie | Reset hasła i ryzyko słabych haseł — ograniczone polityką haseł i weryfikacją adresu |
| Google albo link e-mail bez hasła | Brak haseł | Link może trafić do spamu; mniej znany wzorzec |
| Tylko Google | Już wdrożone | Wyklucza osoby bez konta Google |

**Zaproszenia**

| Wariant | Zalety | Wady |
|---|---|---|
| **Losowy token w Firestore, zasady w regułach (wybrany)** | Działa na planie Spark; tokenu nie da się odgadnąć ani wyszukać; jednorazowość i ważność wymusza serwer reguł | Reguły akceptacji bardziej złożone — wymagają testów każdej ścieżki |
| Token tworzony przez Cloud Function | Prostsze reguły | Wymaga planu Blaze |
| Krótki kod do przepisania | Wygodny przy spotkaniu | Da się odgadnąć bez limitu prób po stronie serwera |

## Konsekwencje

- W konsoli Firebase: włączenie dostawcy „Email/Password”, polityka haseł, ochrona przed wyliczaniem kont, szablony e-maili weryfikacji i resetu po polsku z nazwą aplikacji.
- Testy reguł: zaproszenie wygasłe, użyte, cudze, lista zaproszeń, konto bez potwierdzonego adresu.

## Warunek rewizji

Wymaganie logowania firmowego (SSO), publikacja w App Store (Sign in with Apple) albo przejście na plan Blaze (zaproszenia i usuwanie konta przez Cloud Functions).
