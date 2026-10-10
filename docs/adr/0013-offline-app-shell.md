# ADR-0013: Otwieranie aplikacji bez sieci (service worker)

- **Status:** odłożona 2026-10-10 (właściciel: na siłowni jest Wi-Fi; otwieranie bez sieci wraca razem z wersją mobilną po pełnej wersji webowej)

## Kontekst

Dane są w pamięci podręcznej Firestore, a zakładki pobierane po zalogowaniu ([ADR-0010](0010-web-app-architecture.md)), więc praca offline działa na stronie otwartej wcześniej z siecią. Otwarcie lub odświeżenie strony bez sieci kończy się błędem przeglądarki, bo pliki aplikacji nie są zapisane lokalnie (KNOWN_ISSUES #17). Na telefonie przeglądarka często przeładowuje kartę po przełączeniu aplikacji. Wersja mobilna (instalacja, powiadomienia, sklepy) jest odłożona ([ADR-0004](0004-firebase-multi-user.md)).

## Decyzja (rekomendacja)

Service worker zapisujący pliki aplikacji (`vite-plugin-pwa`, strategia „precache” zbudowanych plików), bez manifestu instalacji i bez powiadomień:

1. Po pierwszej wizycie z siecią strona otwiera się bez sieci; dane i logowanie pochodzą z istniejących pamięci Firebase.
2. Nowa wersja po wdrożeniu: komunikat „Dostępna nowa wersja — odśwież”; bez automatycznego przeładowania w trakcie treningu.
3. `vercel.json`: `sw.js` bez pamięci podręcznej przeglądarki, aby aktualizacje docierały.
4. Test end-to-end: wizyta z siecią, potem otwarcie strony offline pokazuje dane.

Moment wdrożenia: od razu, jeśli właściciel zwykle trenuje bez zasięgu; w przeciwnym razie po etapie 1.

## Rozważane warianty

| Wariant | Zalety | Wady |
|---|---|---|
| **Service worker dla plików aplikacji (rekomendowany)** | Aplikacja otwiera się w trybie samolotowym; gotowe narzędzie (MIT); mała zmiana | Po wdrożeniu telefon najpierw pokazuje starą wersję — potrzebny komunikat o aktualizacji; trudniejsze diagnozowanie błędów z nieaktualnej wersji |
| Pełna PWA (manifest, instalacja, powiadomienia) | Ikona na ekranie, odczucie aplikacji | Zakres wersji mobilnej, odłożonej w ADR-0004 |
| Bez zmian | Zero pracy i ryzyka nieaktualnej wersji | Offline działa tylko na stronie już otwartej; na telefonie zwykle nie działa |

## Konsekwencje

- Każde wdrożenie trafia do użytkownika po odświeżeniu z komunikatu; zmiany modelu danych (etap 1) muszą obsłużyć sytuację, w której stara wersja aplikacji działa jeszcze przez chwilę.

## Warunek rewizji

Wznowienie wersji mobilnej (ADR-0004) — wtedy service worker staje się częścią PWA.
