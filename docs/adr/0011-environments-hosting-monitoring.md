# ADR-0011: Środowiska, hosting i monitoring błędów

- **Status:** przyjęta 2026-10-10 (właściciel: jedno środowisko i darmowe usługi do czasu pełnego dopracowania aplikacji)

## Kontekst

Jest jeden projekt Firebase (`training-tracker-6d13b`, produkcja) i lokalne emulatory. Aplikacja jest na Vercel w darmowym planie Hobby, który tworzy podgląd dla każdego pull requesta. Właściciel chce najpierw w pełni poprawnie zbudować aplikację, korzystając wyłącznie z darmowych usług, zanim pojawią się kolejne środowiska i narzędzia.

## Decyzja

1. **Dwa środowiska:** emulatory Firebase (praca lokalna, testy reguł, testy E2E) i produkcja. Bez osobnego projektu testowego (staging).
2. **Podglądy Vercel nie logują się do produkcji:** ich domeny nie są dodawane do „Authorized domains” w Firebase, więc podgląd PR nie ma dostępu do danych produkcyjnych. Zmiany widoczne dla użytkownika sprawdzamy lokalnie na emulatorach (`npm run dev` z `VITE_USE_EMULATORS=true`) i na zbudowanej wersji (`npm run build` + `vite preview`).
3. **Hosting zostaje na Vercel (Hobby).**
4. **Bez zewnętrznego monitoringu błędów** na tym etapie; błędy zbierają testy automatyczne i ręczne przed wdrożeniem.

## Rozważane warianty

**Środowiska**

| Wariant | Zalety | Wady |
|---|---|---|
| **Emulatory + produkcja (wybrany)** | Brak dodatkowej konfiguracji i kosztów; emulatory odtwarzają reguły i logowanie | Pierwsze wdrożenie reguł i funkcji trafia od razu na produkcję; podglądy PR bez logowania |
| Emulatory + staging + produkcja | Podglądy PR z logowaniem na danych testowych; odbiór przed produkcją | Drugi projekt do utrzymania (logowanie, domeny, reguły) |

**Hosting (wszystkie warianty mają plan darmowy)**

| Wariant | Zalety | Wady |
|---|---|---|
| **Vercel Hobby (wybrany)** | Już działa; podglądy PR i wdrożenie z `main` bez konfiguracji | Plan Hobby jest przeznaczony do użytku niekomercyjnego; drugi dostawca obok Firebase |
| Firebase Hosting (Spark) | Jedna platforma i jedna konsola; domena aplikacji zgodna z domeną logowania; użycie komercyjne dozwolone w limitach planu | Podglądy PR wymagają GitHub Actions (limit minut) lub ręcznego `firebase hosting:channel:deploy` |
| Cloudflare Pages | Podglądy PR, duże limity transferu w planie darmowym | Trzeci dostawca; konfiguracja od zera |

**Monitoring błędów**

| Wariant | Zalety | Wady |
|---|---|---|
| **Brak na tym etapie (wybrany)** | Zero konfiguracji i zewnętrznych procesorów danych | Błąd u użytkownika (np. pusta strona) nie jest zgłaszany automatycznie |
| Sentry (plan darmowy, bez danych osobowych) | Grupowanie błędów i powiadomienia | Zewnętrzny procesor danych — wpis w polityce prywatności |

## Konsekwencje

- Zbudowana wersja musi być sprawdzana w przeglądarce przed wdrożeniem (KNOWN_ISSUES #15) — to główne zabezpieczenie przy braku stagingu i monitoringu.
- Reguły Firestore wdrażamy na produkcję dopiero po przejściu testów reguł na emulatorze.

## Warunek rewizji

Pierwszy użytkownik spoza właściciela (monitoring błędów i staging) albo pierwszy płacący klient — przed nim zmiana hostingu na Firebase Hosting lub Cloudflare Pages albo Vercel Pro, bo plan Hobby nie obejmuje użytku komercyjnego.
