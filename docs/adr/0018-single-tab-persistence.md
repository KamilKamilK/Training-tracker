# ADR-0018: Trwała pamięć Firestore dla jednej karty

- **Status:** przyjęta 2026-11-07 przez właściciela repozytorium; zastępuje wyłącznie wybór zarządcy kart w pkt 3 [ADR-0010](0010-web-app-architecture.md)

## Kontekst

Mechanizm współdzielonej pamięci `persistentMultipleTabManager` może po odświeżeniu pozostawić aktywną dzierżawę poprzedniej strony w IndexedDB. Nowa strona czeka wtedy na jej wygaśnięcie, co opóźnia pierwsze zapytanie Firestore i otwarcie dziennika o kilka sekund.

[Dokumentacja Firebase](https://firebase.google.com/docs/firestore/manage-data/enable-offline#web) udostępnia osobne tryby trwałej pamięci dla jednej i wielu kart.

## Decyzja

Trwała pamięć Firestore jest dostępna dla jednej karty:

1. Użyć `persistentLocalCache({ tabManager: persistentSingleTabManager(undefined) })` w `src/lib/firebaseConfig.ts`. Nie włączać `forceOwnership`: wymuszenie własności może przerwać działanie pamięci w innych kartach.
2. Trwałą pamięć IndexedDB udostępniać jednej karcie. Kolejne karty mogą pracować z siecią i synchronizować dane przez serwer; przy zajętej pamięci SDK przechodzi w nich na pamięć ulotną.
3. Zaakceptować ograniczenie: niewysłane zapisy Firestore w karcie z pamięcią ulotną mogą zginąć po jej zamknięciu lub odświeżeniu bez odzyskania sieci. Do pracy offline używać jednej karty dziennika. Szkic rozpoczętego treningu nadal przechowuje dotychczasowy `LocalStorageService`.
4. Zachować istniejące dane IndexedDB oraz kontrakty dokumentów Firestore i kluczy LocalStorage. Zmiana nie wymaga migracji danych ani zmiany reguł dostępu. Odczyt istniejącej pamięci i zachowanie niewysłanych zapisów należy potwierdzić testem przed wdrożeniem.
5. Zachować limit 5 sekund w asercjach E2E. Warunkiem wdrożenia jest przejście pełnego zestawu z `--repeat-each=20`, testy odświeżania i pracy offline oraz aktualizacja opisu offline w `ARCHITECTURE.md` i instrukcji testów ręcznych.

## Rozważane warianty

| Wariant | Zalety | Koszty i ograniczenia |
|---|---|---|
| **Trwała pamięć jednej karty (wybrany)** | Połączenie bez oczekiwania na dzierżawę poprzedniej karty; trwała kolejka offline w karcie posiadającej IndexedDB | Pozostałe karty nie zachowują niewysłanych zapisów po zamknięciu |
| Pozostawić wiele kart i sprawdzić nowszy SDK | Zachowanie wspólnej trwałej pamięci dla wszystkich kart | Aktualizacja wymaga ponowienia pomiarów; komunikat o dłuższym łączeniu sam nie usuwa przyczyny |
| Pamięć wyłącznie ulotna dla wszystkich kart | Brak dzierżawy IndexedDB | Utrata trwałej kolejki offline we wszystkich kartach |

## Konsekwencje

- Przyjęcie oznacza zgodę na ograniczenie trwałej pracy offline do jednej karty, opisane w pkt 3.
- Testy obejmują: wielokrotne odświeżenia jednej karty, dwie karty online, odświeżenie drugiej karty przy zajętej pamięci, zachowanie zapisów offline w karcie z IndexedDB oraz odczyt pamięci utworzonej przez dotychczasowy tryb wielu kart.
- Testy używają wyłącznie emulatorów. Powtórzenia pełnego zestawu uruchamia polecenie: `npx firebase emulators:exec --only auth,firestore --project demo-training-tracker "npx playwright test --repeat-each=20"`.
- Pozostałe ustalenia ADR-0010 nadal obowiązują.

## Warunek rewizji

Potrzeba trwałej pracy offline w kilku kartach jednocześnie, utrata trwałości po zwykłym odświeżeniu jednej karty albo potwierdzona poprawka mechanizmu dzierżawy w Firebase SDK.
