# 📊 Inteligentny Asystent Arkusza Google (n8n + AI) – instrukcja konfiguracji

Ten projekt to gotowy workflow n8n, który przekształca Twój Arkusz Google w **inteligentnego asystenta AI ze ścisłym groundingiem (Strict Grounding)**.

### Co potrafi asystent?
- **Odpowiada na dowolne pytania w języku naturalnym** na temat danych w podpiętym Arkuszu Google (np. *„Czego nam brakuje i co muszę dokupić?”*, *„Ile mamy makaronu?”*, *„Co mogę przygotować na obiad z tego co mamy?”*).
- **Modyfikuje arkusz w locie na podstawie poleceń:**
  - Dodaje nowe produkty (np. *„Dodaj do spiżarni: Czosnek, 3 sztuki, minimum 1, kategoria Warzywa”*).
  - Aktualizuje ilości (np. *„Kupiłem 2 kartony mleka, zaktualizuj stan”* – asystent sam obliczy nową sumę i zaktualizuje arkusz).
  - Zdejmuje ze stanu (np. *„Zużyłem passatę, zdejmij ze stanu”* – asystent ustawi ilość na 0).
- **Ścisłe uziemienie (Strict Grounding):** asystent pilnuje kontekstu Twojej spiżarni i magazynu – odrzuca pytania niezwiązane z danymi w arkuszu.
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

Możesz uruchomić serwer na dwa proste sposoby:
- **Sposób 1 (najprostszy):** Kliknij dwukrotnie w plik `start-n8n.bat` w folderze projektu.
- **Sposób 2 (przez terminal):** Otwórz PowerShell w tym folderze i wpisz:
  ```powershell
  powershell -ExecutionPolicy Bypass -File .\start-n8n.ps1
  ```

Gdy w oknie pojawi się informacja o uruchomieniu, otwórz w przeglądarce:
👉 **http://localhost:5678**

Przy pierwszym uruchomieniu n8n poprosi o założenie konta (e-mail + hasło – to konto lokalne na Twoim komputerze).

> Aby zatrzymać serwer: naciśnij **Ctrl + C** w oknie terminala lub po prostu zamknij to okno.

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

> 💡 **Model:** Domyślnie węzeł w workflow używa modelu `gemini-3.6-flash`. W razie potrzeby zmiany modelu wystarczy otworzyć węzeł **Gemini AI (Analiza arkusza)** i w polu URL zmienić nazwę modelu na wybraną (np. `gemini-3.6-flash` lub `gemini-2.0-flash`).

---

## 📥 KROK 5 – Zaimportuj workflow i przetestuj

1. W n8n kliknij **… (trzy kropki w prawym górnym rogu) → Import from File**.
2. Wybierz plik `workflow-spizarnia-chat.json`.
3. Podłącz poświadczenia do oznaczonych węzłów:
   - Węzeł **Odczyt arkusza (Google Sheets)** → wybierz swoje poświadczenie Google Sheets, wklej ID arkusza i nazwę zakładki (np. `Spizarnia`).
   - Węzeł **Zapis / Aktualizacja arkusza** → wybierz to samo poświadczenie Google Sheets, wklej to samo ID arkusza oraz tę samą nazwę zakładki.
   - Węzeł **Gemini AI (Analiza i decyzja)** → wybierz swoje poświadczenie Google Gemini.
4. Kliknij **Save**.
5. Na dole edytora kliknij **Open Chat** (lub kliknij węzeł `Chat Trigger` → **Test chat**).

---

## 💬 Przykładowe zapytania do przetestowania (Live Demo)

1. **Modyfikacja stanu (zmiana ilości):**
   > *„Kupiłem dzisiaj 2 kartony mleka, zaktualizuj stan w arkuszu”*  
   *(Asystent sprawdzi ile było mleka, doda 2 i zaktualizuje komórkę w Arkuszu Google)*

2. **Zdjęcie ze stanu:**
   > *„Zużyłem passatę pomidorową, zdejmij ze stanu”*  
   *(Asystent ustawi ilość produktu na 0 i potwierdzi zmianę)*

3. **Dodanie nowego produktu:**
   > *„Dodaj do spiżarni: Czosnek, 3 sztuki, minimum 1, kategoria Warzywa”*  
   *(Asystent dopisze nowy wiersz na końcu arkusza)*

4. **Pytanie o stany i braki:**
   > *„Czego nam brakuje i co muszę kupić w sklepie?”*  
   *(Asystent porówna ilości z progami minimum i zwróci listę braków)*

5. **Pytanie kulinarne / dedukcja:**
   > *„Chcę zrobić naleśniki, czego mi brakuje?”*  
   *(Asystent ustali składniki i wskaże, co masz, a co trzeba dokupić)*

---

## 📱 Zastąpienie wbudowanego czatu przez Telegram / WhatsApp

Gdy zechcesz przenieść asystenta do codziennego użytku mobilnego:
1. Zastąp węzeł **Chat Trigger** węzłem **Telegram Trigger** (lub **WhatsApp Trigger**).
2. Podłącz webhooka pod bota Telegram (utworzonego przez `@BotFather`).
3. Zastąp węzeł wyjściowy wysłaniem wiadomości tekstowej do czatu Telegram (`Telegram node → Send Text Message`).
4. Gotowe! Masz dostęp do swoich arkuszy bezpośrednio z telefonu komórkowego.
