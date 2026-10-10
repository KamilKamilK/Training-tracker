# ADR-0011: Środowiska, hosting i monitoring błędów

- **Status:** proponowana 2026-10-10 — czeka na akceptację właściciela

## Kontekst

Jest jeden projekt Firebase (`training-tracker-6d13b`, produkcja) i lokalne emulatory. Aplikacja jest na Vercel, który tworzy podgląd dla każdego pull requesta — ale podgląd łączy się z produkcyjnym Firebase. Przy wielu użytkownikach potrzebne jest miejsce do sprawdzenia zmian na prawdziwej infrastrukturze bez ryzyka dla danych klientów oraz informacja o błędach, które występują u użytkowników.

## Decyzja (rekomendacja)

1. **Trzy środowiska:** emulatory (praca lokalna i testy), projekt `staging` (podglądy Vercel i odbiór zmian), projekt `production`. Zmienne `VITE_*` w Vercel osobno dla Preview i Production. Reguły i funkcje wdrażane najpierw na staging.
2. **Hosting zostaje na Vercel.** Logowanie przez `signInWithPopup` działa przy domenie Vercel; gdyby potrzebne było przekierowanie (`signInWithRedirect`), ścieżkę `/__/auth/` przekierowujemy do Firebase przez rewrites Vercel, zgodnie z zaleceniami Firebase dla przeglądarek blokujących dane stron trzecich.
3. **Monitoring błędów:** Sentry (plan darmowy, region UE) z wyłączonym przesyłaniem danych osobowych i treści żądań; zgłaszane są tylko wyjątki i ślady stosu. Włączany przed pierwszymi użytkownikami spoza właściciela.

## Rozważane warianty

**Środowiska**

| Wariant | Zalety | Wady |
|---|---|---|
| **Emulatory + staging + produkcja (rekomendowany)** | Podglądy PR nie dotykają danych klientów; reguły i funkcje sprawdzone przed produkcją | Drugi projekt do skonfigurowania (logowanie, domeny, budżet) |
| Emulatory + produkcja | Najprostsze | Podgląd PR pracuje na danych produkcyjnych; pierwsze wdrożenie reguł od razu u klientów |

**Hosting**

| Wariant | Zalety | Wady |
|---|---|---|
| **Vercel (rekomendowany)** | Już działa, podglądy PR, prosta konfiguracja | Drugi dostawca obok Firebase; dla logowania przekierowaniem potrzebne rewrites |
| Firebase Hosting | Jedna platforma; domena logowania zgodna z domeną aplikacji | Podglądy PR wymagają konfiguracji kanałów i akcji GitHub (limit minut) |

**Monitoring błędów**

| Wariant | Zalety | Wady |
|---|---|---|
| **Sentry z wyłączonymi danymi osobowymi (rekomendowany)** | Gotowe grupowanie błędów i powiadomienia; darmowy plan wystarcza | Zewnętrzny procesor danych — wpis w polityce prywatności |
| Własne logowanie do Firestore lub Cloud Logging | Dane u jednego dostawcy | Brak grupowania i alertów; koszt zapisów |
| Brak monitoringu | Zero konfiguracji | Błędy u trenerów i podopiecznych pozostają niewidoczne |

## Konsekwencje

- `.env.example` i README opisują zmienne dla każdego środowiska; testy E2E uruchamiane na emulatorach, odbiór ręczny na staging.
- Sentry wymaga zgody w polityce prywatności ([ADR-0012](0012-personal-and-health-data.md)).

## Warunek rewizji

Zmiana dostawcy hostingu albo potrzeba testów obciążeniowych na osobnym środowisku.
