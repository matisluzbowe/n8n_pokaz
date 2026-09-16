# 📊 Inteligentny Asystent Arkusza Google (n8n + AI) – instrukcja konfiguracji

Ten projekt to gotowy workflow n8n, który przekształca Twój Arkusz Google w **inteligentnego asystenta AI ze ścisłym groundingiem (Strict Grounding)**.

### Co potrafi asystent?
- **Odpowiada na dowolne pytania w języku naturalnym** na temat danych w podpiętym Arkuszu Google (np. *„Czego nam brakuje i co muszę dokupić?”*, *„Ile mamy makaronu?”*, *„Co mogę przygotować na obiad z tego co mamy?”*).
- **Ścisłe uziemienie (Strict Grounding):** model AI (Google Gemini) posiada sztywną instrukcję korzystania **wyłącznie** z danych w arkuszu. Jeśli zapytasz go o cokolwiek spoza arkusza (np. ogólne wiadomości ze świata, pogodę czy produkty spoza tabeli), asystent odpowie wprost: *„W arkuszu nie ma informacji na ten temat”* (brak halucynacji).
- **Wbudowane okno czatu n8n:** rozmawiasz z asystentem bezpośrednio w przeglądarce (lokalnie, bez konieczności stawiania tuneli, rejestracji numerów czy instalacji aplikacji zewnętrznych).

> 💡 **Wskazówka architektoniczna (Demo vs Produkcja):**  
> Na cele demonstracyjne wykorzystujemy wbudowany **Chat Trigger** n8n, ponieważ działa natychmiastowo i lokalnie. W warunkach produkcyjnych ten sam trigger można bez trudu zamienić na węzeł **Telegram** lub **WhatsApp**, aby mieć zdalny dostęp do arkusza bezpośrednio ze smartfona (np. stojąc w sklepie).

---

## 📁 Co jest w tym folderze

| Plik | Do czego służy |
|------|----------------|
| `start-n8n.ps1` | Uruchamia lokalny serwer n8n (bez praw admina) |
| `workflow-spizarnia-chat.json` | Gotowy workflow asystenta do zaimportowania w n8n |
| `test-logika.js` | Skrypt Node.js testujący budowę promptu i parsowanie offline |
| `PRESENTATION-SCRIPT-EN.md` | Kompletny, 15-minutowy skrypt prezentacji po angielsku z demo na żywo |
| `README-KONFIGURACJA.md` | Ten plik |

---

## ✅ CHECKLISTA – parametry do uzupełnienia

Wystarczy uzupełnić poświadczenia dla **Google Sheets** oraz **Google Gemini**:

| # | Parametr | Skąd go wziąć | Gdzie wkleić w n8n |
|---|----------|---------------|--------------------|
| 1 | **ID Arkusza Google** | Z adresu URL arkusza: `.../spreadsheets/d/`**`TO_JEST_ID`**`/edit` | W węźle **Odczyt arkusza (Google Sheets)** → pole **Document** |
| 2 | **Google Client ID** + **Client Secret** | Google Cloud Console → *APIs & Services → Credentials → OAuth client ID* | Poświadczenie **Google Sheets OAuth2 API** |
| 3 | **Gemini API Key** | Google AI Studio → https://aistudio.google.com/apikey | Poświadczenie **Google Gemini(PaLM) Api** → pole **API Key** |

---

## ▶️ KROK 1 – Uruchom serwer n8n

1. Otwórz **PowerShell** w tym folderze.
2. Wpisz i zatwierdź:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\start-n8n.ps1
   ```
3. Otwórz w przeglądarce:
   👉 **http://localhost:5678**
4. Przy pierwszym uruchomieniu n8n poprosi o założenie lokalnego konta właściciela (e-mail + hasło).

> Aby zatrzymać serwer: naciśnij **Ctrl + C** w oknie terminala.

---

## 📊 KROK 2 – Wskaż swój Arkusz Google

1. Otwórz swój gotowy arkusz w Google Sheets (https://sheets.google.com).
2. Sprawdź dokładną nazwę zakładki (na dole ekranu), z której asystent ma czytać dane (np. `Spizarnia`, `Arkusz1` itp.). Wpiszesz ją później w węźle n8n.
3. Skopiuj **ID arkusza** z paska adresu przeglądarki:
   ```
   https://docs.google.com/spreadsheets/d/TU_JEST_ID_ARKUSZA/edit
   ```
   Zapisz sobie fragment `TU_JEST_ID_ARKUSZA` – wkleisz go w węźle w n8n (KROK 5).

---

## 🔑 KROK 3 – Połącz n8n z Google Sheets

1. Wejdź na https://console.cloud.google.com.
2. Utwórz nowy projekt (np. `n8n-assistant`).
3. Włącz dwa API: **Google Sheets API** oraz **Google Drive API**.
4. Przejdź do **APIs & Services → OAuth consent screen**:
   - Wybierz typ: **External**.
   - W sekcji **Test users** dodaj swój adres Gmail.
5. Przejdź do **Credentials → Create Credentials → OAuth client ID**:
   - Typ aplikacji: **Web application**.
   - W **Authorized redirect URIs** wklej dokładnie:
     ```
     http://localhost:5678/rest/oauth2-credential/callback
     ```
   - Skopiuj wygenerowane **Client ID** i **Client Secret**.
6. W n8n (http://localhost:5678):
   - Wejdź w **Credentials → Add Credential → Google Sheets OAuth2 API**.
   - Wklej Client ID i Client Secret, kliknij **Sign in with Google** i zezwól na dostęp.

---

## 🤖 KROK 4 – Połącz n8n z Google Gemini API

1. Wejdź na https://aistudio.google.com/apikey i zaloguj się kontem Google.
2. Kliknij **Create API key** i skopiuj klucz (Google AI Studio oferuje bezpłatny pakiet zapytań).
3. W n8n:
   - Wejdź w **Credentials → Add Credential → Google Gemini(PaLM) Api**.
   - Wklej klucz w pole **API Key** i zapisz.

---

## 📥 KROK 5 – Zaimportuj workflow i przetestuj

1. W n8n kliknij **… (trzy kropki w prawym górnym rogu) → Import from File**.
2. Wybierz plik `workflow-spizarnia-chat.json`.
3. Podłącz poświadczenia:
   - Węzeł **Odczyt arkusza (Google Sheets)** → wybierz swoje poświadczenie Google Sheets, wklej ID arkusza i upewnij się, że nazwa arkusza to `Spizarnia`.
   - Węzeł **Gemini AI (Analiza arkusza)** → wybierz swoje poświadczenie Google Gemini.
4. Kliknij **Save**.
5. Na dole edytora kliknij **Open Chat** (lub kliknij węzeł `Chat Trigger` → **Test chat**).

---

## 💬 Przykładowe zapytania do przetestowania (Live Demo)

1. **Pytanie o stany i braki:**
   > *„Czego nam brakuje i co muszę kupić w sklepie?”*  
   *(Asystent porówna ilości z progami minimum i zwróci listę braków wraz z jednostkami)*

2. **Pytanie analityczne / dedukcja:**
   > *„Na podstawie produktów, które mamy w spiżarni, co mogę dzisiaj ugotować na obiad?”*  
   *(Asystent sprawdzi tylko produkty, których ilość > 0 i zaproponuje danie)*

3. **Test Strict Grounding (bezpieczeństwo i brak halucynacji):**
   > *„Kto jest prezydentem Francji?”*  
   *(Odpowiedź: „W arkuszu nie ma informacji na ten temat.”)*

---

## 📱 Zastąpienie wbudowanego czatu przez Telegram / WhatsApp

Gdy zechcesz przenieść asystenta do codziennego użytku mobilnego:
1. Zastąp węzeł **Chat Trigger** węzłem **Telegram Trigger** (lub **WhatsApp Trigger**).
2. Podłącz webhooka pod bota Telegram (utworzonego przez `@BotFather`).
3. Zastąp węzeł wyjściowy wysłaniem wiadomości tekstowej do czatu Telegram (`Telegram node → Send Text Message`).
4. Gotowe! Masz dostęp do swoich arkuszy bezpośrednio z telefonu komórkowego.
