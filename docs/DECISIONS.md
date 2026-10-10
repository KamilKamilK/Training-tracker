# Dziennik Treningowy — rejestr decyzji architektonicznych

Indeks decyzji. Każda decyzja ma krótki dokument ADR w [`adr/`](adr/).

## Zasady zmiany decyzji

1. Nowa decyzja lub zmiana obowiązującej powstaje jako ADR ze statusem **proponowana**. Implementacja zaczyna się po zmianie statusu na **przyjęta** przez właściciela repozytorium.
2. Przyjętego ADR nie edytujemy merytorycznie. Zmienia go nowy ADR, a stary dostaje status **zastąpiona** z numerem następcy.
3. W tej samej zmianie aktualizujemy indeks, zadania w [KNOWN_ISSUES.md](KNOWN_ISSUES.md) i [AGENTS.md](../AGENTS.md), jeśli decyzja ich dotyczy.
4. Sekcje ADR: Status, Kontekst, Decyzja, Rozważane warianty, Konsekwencje, Warunek rewizji. Limit: 150 linii.

## Decyzje

| ADR | Decyzja | Status |
|---|---|---|
| [0001](adr/0001-documentation-and-agents.md) | Dokumentacja: jeden cel na dokument, jeden fakt w jednym miejscu; wspólne instrukcje agentów w `AGENTS.md` | Przyjęta 2026-10-07 |
| [0002](adr/0002-spa-firebase.md) | SPA React + TypeScript bez własnego backendu; dane w Cloud Firestore, szkic treningu w LocalStorage | Przyjęta 2026-10-07 |
| [0003](adr/0003-owner-authentication.md) | Logowanie Google; dostęp do danych tylko dla właściciela z kolekcji `owners`; walidacja zapisów w `firestore.rules` | Przyjęta 2026-10-07 |
| [0004](adr/0004-firebase-multi-user.md) | Wersja z wieloma użytkownikami na Firebase (Auth, Firestore, Storage, Cloud Functions); najpierw tylko aplikacja webowa, wersja mobilna odłożona | Przyjęta 2026-10-10 |
| [0005](adr/0005-data-model-and-access.md) | Dane w `users/{uid}/…`; dostęp trenera przez dokument współpracy, odczyt per podopieczny; role jako profil, uprawnienia z relacji | Przyjęta 2026-10-10 |
| [0006](adr/0006-training-programs.md) | Plan wielotygodniowy trenera; przypisanie jako kopia; progresja zapisana wartościami | Przyjęta 2026-10-10 |
| [0007](adr/0007-exercises-and-sets.md) | Biblioteka ćwiczeń (globalna + trenera), serie liczbowe, migracja skryptem z trybem próbnym | Przyjęta 2026-10-10 |
| [0008](adr/0008-accounts-and-invitations.md) | Google albo e-mail z hasłem (potwierdzenie adresu, reset, polityka haseł); zaproszenie linkiem z losowym tokenem w regułach; usunięcie konta w aplikacji | Przyjęta 2026-10-10 |
| [0009](adr/0009-cloud-functions-aggregates.md) | Plan Spark bez Cloud Functions; postęp liczony w przeglądarce; zdjęcia sylwetki po zmianie planu | Przyjęta 2026-10-10 |
| [0010](adr/0010-web-app-architecture.md) | React Router, nasłuchy Firestore, cache offline w IndexedDB, schematy Zod | Przyjęta 2026-10-10 |
| [0011](adr/0011-environments-hosting-monitoring.md) | Emulatory i produkcja bez stagingu; hosting Vercel Hobby; bez zewnętrznego monitoringu do pierwszego użytkownika spoza właściciela | Przyjęta 2026-10-10 |
| [0012](adr/0012-personal-and-health-data.md) | Dobrowolne, zrozumiałe zgody na dane o zdrowiu i udostępnienie tylko własnemu trenerowi, z wycofaniem w każdej chwili; eksport i usunięcie danych | Przyjęta 2026-10-10 |
| [0013](adr/0013-offline-app-shell.md) | Service worker zapisujący pliki aplikacji, aby otwierała się bez sieci | Odłożona 2026-10-10 — razem z wersją mobilną |
