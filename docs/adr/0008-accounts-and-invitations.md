# ADR-0008: Konta, logowanie i zaproszenia

- **Status:** proponowana 2026-10-10 — czeka na akceptację właściciela

## Kontekst

Dziś jedyną metodą logowania jest Google (`signInWithPopup`), a dostęp ma tylko konto z kolekcji `owners` ([ADR-0003](0003-owner-authentication.md)). Podopieczni trenerów nie zawsze mają konto Google lub nie chcą go używać. Trener musi zaprosić podopiecznego, a podopieczny — zaakceptować współpracę ([ADR-0005](0005-data-model-and-access.md)). Konto musi dać się usunąć razem z danymi.

## Decyzja (rekomendacja)

1. **Logowanie:** Google oraz link logowania wysyłany e-mailem (Firebase „email link”, bez hasła). Apple dopiero przy wersji mobilnej.
2. **Zaproszenie:** trener tworzy je przez Cloud Function (`createInvite`), która zapisuje `invites/{token}` z datą wygaśnięcia (7 dni) i jednym użyciem; link `/invite/{token}` po zalogowaniu wywołuje `acceptInvite`, która tworzy dokument współpracy. Klient nie może zapisać `invites` ani `coaching` bezpośrednio.
3. **Usunięcie konta:** funkcja `deleteAccount` usuwa podkolekcje użytkownika, pliki w Storage, współprace i konto Auth; przed usunięciem eksport danych do pobrania (JSON).
4. **Sesja:** wylogowanie czyści lokalną pamięć podręczną Firestore ([ADR-0010](0010-web-app-architecture.md)).

## Rozważane warianty

**Metody logowania**

| Wariant | Zalety | Wady |
|---|---|---|
| **Google + link e-mail (rekomendowany)** | Brak haseł do utrzymania i resetowania; działa dla każdego adresu e-mail | Link musi dojść (skrzynka, spam); logowanie na innym urządzeniu wymaga ponownego podania adresu |
| Google + e-mail i hasło | Znany wzorzec | Reset hasła, polityka haseł, ryzyko przejęcia konta przez słabe hasło |
| Tylko Google | Najprostsze, już wdrożone | Wyklucza podopiecznych bez konta Google |

**Zaproszenia**

| Wariant | Zalety | Wady |
|---|---|---|
| **Token przez Cloud Function (rekomendowany)** | Jednorazowy, wygasający, niemożliwy do podrobienia z klienta; reguły pozostają proste (brak zapisu klienta) | Wymaga Cloud Functions (plan Blaze) |
| Zapis zaproszenia przez klienta, akceptacja regułą | Bez funkcji | Reguły muszą weryfikować adres e-mail i status — łatwo o lukę; trudno egzekwować jednorazowość |
| Kod do przepisania (np. 6 znaków) | Wygodny przy osobistym spotkaniu | Krótki kod można odgadnąć — wymaga limitu prób w funkcji |

## Konsekwencje

- Ekran logowania z dwiema metodami i obsługą powrotu z linku e-mail; testy dla wygasłego, użytego i cudzego zaproszenia.
- Wysyłka e-maili przez Firebase Auth (link logowania) nie wymaga osobnej usługi; e-maile z zaproszeniem — przez rozszerzenie „Trigger Email” lub link kopiowany przez trenera (decyzja przy implementacji etapu 3).

## Warunek rewizji

Wymaganie logowania firmowego (SSO) albo publikacja w App Store (wymóg Sign in with Apple przy logowaniu przez innych dostawców).
