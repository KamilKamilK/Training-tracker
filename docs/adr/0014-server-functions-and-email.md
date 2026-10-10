# ADR-0014: Kod serwerowy w funkcjach Vercel i własna wysyłka e-maili

- **Status:** przyjęta 2026-10-10 (właściciel: funkcje Vercel, Brevo po zakupie domeny; do tego czasu e-maile z Firebase)

## Kontekst

Konto zakładane przez trenera, usuwanie konta razem z danymi i sprzątanie nieaktywnych kont ([ADR-0015](0015-accounts-roles-consent.md)) wymagają operacji z uprawnieniami administratora (Firebase Admin SDK), których nie da się bezpiecznie wykonać w przeglądarce. Cloud Functions wymagają planu Blaze, a projekt zostaje na darmowym planie Spark ([ADR-0009](0009-cloud-functions-aggregates.md)). Aplikacja jest już na Vercel Hobby ([ADR-0011](0011-environments-hosting-monitoring.md)), który w darmowym planie uruchamia funkcje serwerowe i zadania cykliczne (raz dziennie).

Właściciel chce wysyłać e-maile samodzielnie, niezależnie od szablonów Firebase. Bez własnej domeny z rekordami SPF i DKIM dostawca e-maili nie może wiarygodnie podpisywać wiadomości, więc trafiałyby do spamu.

## Decyzja

1. **Kod serwerowy w funkcjach Vercel** (`api/` w tym repozytorium), region Frankfurt (`fra1`). Firebase zostaje na planie Spark; funkcje łączą się z nim przez Firebase Admin SDK.
2. **Uwierzytelnienie każdego wywołania:** funkcja weryfikuje token ID Firebase z nagłówka `Authorization` i sprawdza uprawnienia (np. rola trenera) po stronie serwera; dane wejściowe waliduje schemat Zod. Limit wywołań na użytkownika zapisany w Firestore.
3. **Poświadczenie Admin SDK:** klucz konta serwisowego z wąskimi rolami (Firebase Authentication Admin, Cloud Datastore User) w zmiennej środowiskowej Vercel oznaczonej jako Sensitive, tylko dla środowiska Production; wymiana raz w roku. Klucz nigdy nie trafia do repozytorium ani do zmiennych `VITE_*`.
4. **E-maile:** docelowo Brevo z nadawcą w domenie właściciela (SPF, DKIM, DMARC), wysyłane z funkcji Vercel przez jeden moduł z interfejsem niezależnym od dostawcy. Do zakupu domeny weryfikację adresu i reset hasła wysyła Firebase (szablony po polsku), a link do ustawienia hasła dla konta założonego przez trenera trener może też skopiować i przekazać sam.
5. **Strona obsługi linków z e-maili w aplikacji** (`/konto/akcja`) powstaje razem z własną domeną; do tego czasu linki prowadzą na domyślną stronę Firebase.

## Rozważane warianty

**Kod serwerowy**

| Wariant | Zalety | Wady |
|---|---|---|
| **Funkcje Vercel (wybrany)** | Darmowe w planie Hobby; ten sam dostawca i wdrożenie co aplikacja; region w UE | Plan Hobby tylko do użytku niekomercyjnego; klucz konta serwisowego poza Google Cloud |
| Cloud Functions na planie Blaze | Natywna integracja z Firebase (wyzwalacze, brak klucza) | Karta płatnicza, koszty bez twardego limitu |
| Cloudflare Workers | Hojny darmowy limit | Trzeci dostawca; Admin SDK nie działa w tym środowisku bez obejść |
| Bez serwera | Zero utrzymania | Brak kont zakładanych przez trenera, własnych e-maili i pełnego usuwania konta |

**Poświadczenie**

| Wariant | Zalety | Wady |
|---|---|---|
| **Klucz konta serwisowego jako zmienna Sensitive (wybrany)** | Prosta konfiguracja | Stały klucz do ochrony i wymiany |
| Federacja tożsamości Vercel → Google (OIDC) | Brak stałego klucza | Złożona konfiguracja w Google Cloud |

**E-maile**

| Wariant | Zalety | Wady |
|---|---|---|
| **Brevo z własną domeną, do tego czasu Firebase (wybrany)** | Niezależność od szablonów Firebase; firma z UE; darmowy limit 300 dziennie | Wymaga domeny; limit dzielony z innymi aplikacjami na tym samym koncie Brevo |
| Resend | Prosty interfejs, 3000 miesięcznie za darmo | Firma z USA |
| Tylko szablony Firebase | Już działa | Ograniczona treść i wygląd; nadawca w domenie `firebaseapp.com` |

## Konsekwencje

- Każda funkcja ma testy jednostkowe (uwierzytelnienie, uprawnienia, walidacja, limit) na emulatorach; odpowiedzi błędów mają kod, bez szczegółów wyjątku.
- Brevo: osobny klucz API i osobna domena nadawcy dla tej aplikacji.
- Domena aplikacji (`app.<domena>` na Vercel) i strona `/konto/akcja` czekają na zakup domeny; do tego czasu adres `training-tracker-six.vercel.app`.

## Warunek rewizji

Użytek komercyjny (zmiana planu Vercel albo hostingu, wtedy federacja OIDC zamiast klucza), potrzeba wyzwalaczy Firestore albo limit wywołań funkcji Vercel Hobby.
