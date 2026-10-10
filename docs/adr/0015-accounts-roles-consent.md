# ADR-0015: Konta zakładane przez trenera, rola trenera i zgoda wymagana do aktywacji

- **Status:** przyjęta 2026-10-10 (właściciel: zgoda jako warunek aktywacji, rolę trenera nadaje administrator); warunkowość zgody do potwierdzenia przez prawnika

## Kontekst

Aplikacja służy do zapisywania treningów i pomiarów ciała, więc bez przetwarzania danych o zdrowiu nie spełnia swojego celu. Trener zna podstawowe dane podopiecznych i chce sam zakładać im konta; zostaje też zaproszenie linkiem ([ADR-0008](0008-accounts-and-invitations.md)), a każda osoba może założyć konto osobiste bez trenera. Zakładanie kont i wysyłka e-maili przez trenera to furtka do nadużyć (konta na cudze adresy, spam). Operacje administracyjne wykonują funkcje Vercel ([ADR-0014](0014-server-functions-and-email.md)).

## Decyzja

1. **Zgoda na dane o zdrowiu jest warunkiem aktywacji konta** (zastępuje dobrowolność tej zgody z [ADR-0012](0012-personal-and-health-data.md), pkt 2). Jedno niezaznaczone pole wyboru z opisem danych (waga, obwody, samopoczucie) i informacją, że bez zgody konto pozostaje nieaktywne. Profil `users/{uid}` przechowuje stan, wersję treści i czas serwera zgody; reguły Firestore wpuszczają do danych tylko konto z zaakceptowaną zgodą. Nowa wersja treści wymaga ponownej akceptacji.
2. **Wycofanie zgody** w Ustawieniach dezaktywuje konto: dane zostają, ale nie da się ich czytać ani zapisywać do ponownej zgody; Ustawienia proponują usunięcie konta. Udostępnienie danych trenerowi pozostaje osobną zgodą ([ADR-0012](0012-personal-and-health-data.md)).
3. **Rolę trenera nadaje administrator** (zastępuje samodzielne włączanie roli z [ADR-0005](0005-data-model-and-access.md), pkt 3), z limitem 30 podopiecznych na trenera.
4. **Konto zakładane przez trenera:** trener podaje imię i e-mail; funkcja zakłada konto bez hasła, tworzy kartę podopiecznego i zaproszenie do współpracy. Podopieczny dostaje link do ustawienia hasła (ważny 7 dni, trener może wysłać go ponownie albo skopiować), a po zalogowaniu akceptuje zgodę i współpracę. Konto nieaktywowane w 30 dni usuwa codzienne zadanie (Vercel Cron) razem z kartą.
5. **Adres, który ma już konto:** trener nie zakłada drugiego konta — podopieczny dostaje zaproszenie do współpracy i sam je akceptuje; jego dotychczasowe dane zostają jego.
6. **Karta podopiecznego** (dane trenera, w dokumencie współpracy): imię, e-mail, cel treningowy, notatka trenera. Bez kontuzji i innych danych o zdrowiu.
7. **Usunięcie konta** w Ustawieniach przez funkcję Vercel: po ponownym zalogowaniu usuwa dane użytkownika, współprace i konto logowania (zastępuje usuwanie w przeglądarce z [ADR-0008](0008-accounts-and-invitations.md), pkt 6). Wymagane przed pierwszym użytkownikiem spoza właściciela.
8. **Polityka prywatności i treść zgody:** projekt przygotowuje zespół, właściciel konsultuje go z prawnikiem przed otwarciem rejestracji.

## Rozważane warianty

**Zgoda na dane o zdrowiu**

| Wariant | Zalety | Wady |
|---|---|---|
| **Warunek aktywacji (wybrany)** | Zgodne z celem aplikacji; brak kont, które nie mogą działać | Ryzyko uznania zgody za niedobrowolną (art. 7 ust. 4 RODO) — do oceny prawnika |
| Zgoda dobrowolna, bez niej tylko dziennik treningów | Najbezpieczniejsze prawnie | Dwa tryby aplikacji do utrzymania; mała wartość konta bez pomiarów |

**Rola trenera**

| Wariant | Zalety | Wady |
|---|---|---|
| **Nadawana przez administratora (wybrany)** | Brak nadużyć zakładania kont i wysyłki e-maili | Ręczne zatwierdzanie każdego trenera |
| Włączana samodzielnie | Zero pracy administratora | Furtka do spamu i blokady konta Brevo |

**Konta nieaktywowane**

| Wariant | Zalety | Wady |
|---|---|---|
| **Link 7 dni, usunięcie po 30 dniach (wybrany)** | Nie przechowujemy danych osób bez zgody | Zadanie cykliczne do utrzymania |
| Bez usuwania | Prostsze | Dane osób bez zgody zostają w bazie |

## Konsekwencje

- Testy reguł: dostęp do danych bez profilu, bez zgody i po wycofaniu zgody; zapis profilu cudzego, z czasem klienta i z nieznanym polem.
- Funkcje: zakładanie konta tylko przez trenera w limicie, istniejący adres jako zaproszenie, sprzątanie po 30 dniach, usunięcie konta.

## Warunek rewizji

Opinia prawna uznająca zgodę warunkową za niedopuszczalną (wtedy wariant dobrowolny) albo trenerzy zgłaszający się w liczbie, której nie da się zatwierdzać ręcznie.
