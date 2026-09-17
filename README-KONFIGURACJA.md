# 📊 Inteligentny Asystent Arkusza Google (n8n + AI) – Instrukcja Konfiguracji

Ten projekt to gotowy workflow n8n, który przekształca Twój Arkusz Google w **inteligentnego asystenta AI ze ścisłym groundingiem (Strict Grounding)**.

### Co potrafi asystent?
- **Odpowiada na dowolne pytania w języku naturalnym** na temat danych w podpiętym Arkuszu Google (np. *„Czego nam brakuje i co muszę dokupić?”*, *„Ile mamy makaronu?”*, *„Co mogę przygotować na obiad z tego co mamy?”*).
- **Automatycznie dopasowuje język odpowiedzi (PL / EN):**
  - Jeśli zapytasz po polsku → odpowie po polsku.
  - Jeśli zapytasz po angielsku → odpowie po angielsku.
  - Dane w arkuszu zawsze pozostają spójne i zapisywane po polsku (dokładnie tak, jak w nagłówkach i wierszach tabeli).
- **Modyfikuje arkusz w locie na podstawie poleceń:**
  - **Dodaje nowe produkty:** samoczynnie dobiera brakujące parametry (kategoria, jednostka, lokalizacja, data ważności, minimum) bez irytującego dopytywania użytkownika.
  - **Aktualizuje ilości:** np. *„Kupiłem 2 kartony mleka, zaktualizuj stan”* – asystent sam obliczy nową sumę i zaktualizuje arkusz.
  - **Zdejmuje ze stanu:** np. *„Zużyłem passatę, zdejmij ze stanu”* – asystent ustawi ilość na 0.
  - **Obsługuje wiele produktów naraz:** np. *„Kupiłem 2 mleka i chleb pełnoziarnisty”* – zaktualizuje istniejący produkt i od razu dopisze nowy w jednej operacji.
- **Ścisłe uziemienie (Strict Grounding):** asystent pilnuje kontekstu Twojego arkusza – odrzuca pytania niezwiązane z magazynem/kuchnią (np. polityka, pogoda).
- **Wbudowane okno czatu n8n:** rozmawiasz z asystentem bezpośrednio w przeglądarce (lokalnie, bez konieczności stawiania tuneli, rejestracji numerów czy instalacji aplikacji zewnętrznych).

> 💡 **Wskazówka architektoniczna (Demo vs Produkcja):**  
> Na cele demonstracyjne wykorzystujemy wbudowany **Chat Trigger** n8n, ponieważ działa natychmiastowo i lokalnie. W warunkach produkcyjnych ten sam trigger można bez trudu zamienić na węzeł **Telegram** lub **WhatsApp**, aby mieć zdalny dostęp do arkusza bezpośrednio ze smartfona (np. stojąc w sklepie).

---

## 📁 Co jest w tym folderze

| Plik | Do czego służy |
|------|----------------|
| `start-n8n.bat` | Uruchamia lokalny serwer n8n jednym kliknięciem (Windows) |
| `start-n8n.ps1` | Skrypt PowerShell uruchamiający n8n w środowisku lokalnym |
| `workflow-spizarnia-chat.json` | Gotowy workflow asystenta do zaimportowania w n8n |
| `test-logika.js` | Skrypt Node.js testujący budowę promptu, parsowanie i reguły biznesowe offline |
| `README-KONFIGURACJA.md` | Ten plik – kompletny przewodnik krok po kroku |

---

## ✅ CHECKLISTA – Parametry do uzupełnienia

Wystarczy skonfigurować dwa połączenia: **Google Sheets** oraz **Google Gemini**:

| # | Parametr | Skąd go wziąć | Gdzie wkleić w n8n |
|---|----------|---------------|--------------------|
| 1 | **ID Arkusza Google** | Z paska adresu URL otwartego arkusza (pomiędzy `/d/` a `/edit`) | Węzły **Google Sheets (Read)** oraz **Google Sheets (Append or Update)** → pole **Document** (tryb *By ID*) |
| 2 | **Nazwa zakładki** | Z dolnej zakładki arkusza (np. `Arkusz1` lub `Spizarnia`) | Węzły **Google Sheets (Read)** oraz **Google Sheets (Append or Update)** → pole **Sheet Name** |
| 3 | **Google Client ID & Secret** | Google Cloud Console → *Credentials → OAuth client ID* | Poświadczenie n8n: **Google Sheets OAuth2 API** |
| 4 | **Gemini API Key** | Google AI Studio → https://aistudio.google.com/apikey | Poświadczenie n8n: **Google Gemini(PaLM) Api** |

---

## ▶️ KROK 1 – Uruchom serwer n8n

Możesz uruchomić serwer na dwa proste sposoby:
- **Sposób 1 (najprostszy):** Kliknij dwukrotnie w plik `start-n8n.bat` w folderze projektu.
- **Sposób 2 (przez terminal):** Otwórz PowerShell w tym folderze i wpisz:
  ```powershell
  powershell -ExecutionPolicy Bypass -File .\start-n8n.ps1
  ```

Gdy w oknie terminala pojawi się informacja o uruchomieniu, otwórz w przeglądarce:
👉 **http://localhost:5678**

*(Przy pierwszym uruchomieniu n8n poprosi o założenie konta lokalnego – podaj dowolny e-mail i hasło).*

> Aby zatrzymać serwer: naciśnij **Ctrl + C** w oknie terminala lub zamknij okno.

---

## 📊 KROK 2 – Przygotuj swój Arkusz Google

### 1. Skąd wziąć ID Arkusza?
Otwórz swój arkusz w przeglądarce. Pasek adresu URL ma następującą strukturę:
```text
https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0
                                       ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                                   TO JEST ID ARKUSZA
```
Skopiuj długi ciąg znaków znajdujący się dokładnie pomiędzy `/d/` a `/edit`.

### 2. Sprawdź nazwę zakładki
Sprawdź na dole arkusza dokładną nazwę zakładki (karty), np.:
- `Arkusz1` (domyślna nazwa w polskim Google Sheets),
- `Spizarnia` lub `Sheet1`.

> ⚠️ **Ważne:** Nazwa zakładki musi się zgadzać co do litery i wielkości znaków.

---

## 🔑 KROK 3 – Połącz n8n z Google Sheets

1. Wejdź na https://console.cloud.google.com.
2. Utwórz nowy projekt (np. `n8n-assistant`).
3. Włącz dwa API w sekcji *APIs & Services → Library*:
   - **Google Sheets API**
   - **Google Drive API**
4. Przejdź do **APIs & Services → OAuth consent screen**:
   - Wybierz typ: **External**.
   - W sekcji **Test users** dodaj swój adres Gmail (ten, na którym masz arkusz).
5. Przejdź do **Credentials → Create Credentials → OAuth client ID**:
   - Typ aplikacji: **Web application**.
   - W polu **Authorized redirect URIs** wklej dokładnie:
     ```
     http://localhost:5678/rest/oauth2-credential/callback
     ```
   - Skopiuj wygenerowane **Client ID** i **Client Secret**.
6. W n8n (http://localhost:5678):
   - Otwórz menu **Credentials** (ikona klucza po lewej stronie) → **Add Credential**.
   - Wyszukaj i wybierz: **Google Sheets OAuth2 API**.
   - Wklej swoje **Client ID** i **Client Secret**.
   - Kliknij przycisk **Sign in with Google**, wybierz konto i zezwól na dostęp.
   - Kliknij **Save**.

---

## 🤖 KROK 4 – Połącz n8n z Google Gemini API

1. Wejdź na stronę: https://aistudio.google.com/apikey i zaloguj się kontem Google.
2. Kliknij **Create API key** i skopiuj wygenerowany klucz.
3. W n8n:
   - Wejdź w **Credentials → Add Credential**.
   - Wyszukaj: **Google Gemini(PaLM) Api**.
   - Wklej skopiowany klucz w pole **API Key** i kliknij **Save**.

---

## 📥 KROK 5 – Import i dostosowanie workflow w n8n

1. W n8n kliknij menu **… (trzy kropki w prawym górnym rogu) → Import from File**.
2. Wybierz plik `workflow-spizarnia-chat.json`.
3. Skonfiguruj węzły według poniższych wskazówek:

---

### A. Węzeł `Google Sheets (Read)` – Odczyt stanu magazynu
1. Otwórz węzeł **Google Sheets (Read)**.
2. W polu **Credential to connect with** wybierz swoje poświadczenie Google Sheets.
3. W polu **Document**:
   - Kliknij na przełącznik trybu wyboru dokumentu i wybierz **By ID** (lub kliknij ikonę ołówka/trybu i wklej bezpośrednio ID).
   - Wklej skopiowane w Kroku 2 **ID arkusza**.
4. W polu **Sheet Name**:
   - Wybierz tryb **By Name** (lub wpisz z ręki).
   - Wpisz dokładną nazwę zakładki, np. `Arkusz1` lub `Spizarnia`.
5. Kliknij **Test step**, aby upewnić się, że n8n prawidłowo odczytuje wiersze z Twojej tabeli.

---

### B. Węzeł `Google Sheets (Append or Update)` – Zapis zmian i odświeżenie mapowania kolumn
Ten węzeł odpowiada za aktualizację istniejących pozycji oraz dopisywanie nowych produktów. Aby działał w 100% poprawnie, n8n musi poprawnie pobrać listę kolumn z Twojego arkusza:

1. Otwórz węzeł **Google Sheets (Append or Update)**.
2. W polu **Credential to connect with** wybierz to samo poświadczenie Google Sheets.
3. W polu **Document**: wybierz tryb **By ID** i wklej to samo **ID arkusza**.
4. W polu **Sheet Name**: wpisz tę samą nazwę zakładki (np. `Arkusz1` lub `Spizarnia`).
5. ⚠️ **Kluczowy trik z mapowaniem kolumn (Manual -> Auto):**
   - W n8n po pierwszym wklejeniu ID arkusza lista kolumn w pamięci podręcznej może być pusta lub nieodświeżona.
   - W sekcji **Columns**:
     1. Zmień chwilowo **Mapping Column Mode** na **Map Manually** (lub kliknij ikonę odświeżania obok pól kolumn) – spowoduje to, że n8n natychmiast odpyta arkusz i zaczyta nazwy nagłówków (`Lp.`, `Produkt`, `Kategoria`, `Ilość`, `Jednostka`, itp.).
     2. Następnie przełącz z powrotem na: **Auto-map Input Data**.
     3. W polu **Matching Column** wybierz lub wpisz: **`Lp.`**.
        *(Dzięki temu n8n wie, że kolumna `Lp.` jest unikalnym kluczem wiersza – jeśli wiersz o danym `Lp.` istnieje, n8n go zaktualizuje; jeśli jest wolny, zostanie wypełniony).*

---

### C. Węzeł `Google Gemini AI` – Wybór modelu i obsługa limitów zapytań (Błąd 429)

Węzeł **Google Gemini AI** to elastyczny węzeł HTTP Request wysyłający zapytania bezpośrednio do Gemini API.

#### 1. Gdzie zmienić model Gemini?
W węźle **Google Gemini AI** w polu **URL** znajduje się adres endpointu:
```text
https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent
                                                         ^^^^^^^^^^^^^^^^
                                                        TUTAJ ZMIENIASZ MODEL
```
Możesz podmienić nazwę modelu na dowolny model udostępniony w Google AI Studio:
- **`gemini-2.0-flash`** *(rekomendowany domyślnie)* – najszybszy, świetnie zachowuje strukturę JSON, nie dopytuje użytkownika i natychmiast uzupełnia arkusz.
- **`gemini-1.5-flash`** – bardzo popularny, wysoce stabilny model produkcyjny z dużym dziennym limitem.
- **`gemini-1.5-pro`** – model o głębszym rozumowaniu, jeśli masz bardzo skomplikowane relacje w arkuszu.

#### 2. Limity planu darmowego (Free Tier) i błąd 429 ("Too Many Requests")
Jeśli zobaczysz komunikat o treści:
> *„The service is receiving too many requests from you. You exceeded your current quota... Please retry in 34s. Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 20, model: ...”*

Oznacza to, że został osiągnięty limit zapytań darmowego poziomu (Free Tier):
- **Limit RPM (Requests Per Minute):** darmowy poziom pozwala na ok. 15 zapytań na minutę.
- **Limit RPD (Requests Per Day):** 1 500 zapytań na dobę.
- Gdy zadasz kilka pytań z rzędu bardzo szybko, Google nakłada chwilową przerwę (tzw. rate limit cooldown, np. 20–40 sekund).

#### 3. Wbudowane zabezpieczenie przed limitem (`Retry On Fail`):
Nasz workflow posiada wbudowaną automatyczną obsługę takich sytuacji. W węźle **Google Gemini AI** w sekcji **Options** skonfigurowane są parametry:
- **Retry On Fail:** `true` (włączone)
- **Max Tries:** `3`
- **Wait Between Tries:** `5000` (5 sekund)

Dzięki temu, w przypadku chwilowego przeciążenia API lub nałożenia limitu n8n nie zgłasza błędu użytkownikowi, lecz automatycznie odczekuje i ponawia zapytanie.

---

## 💬 Przykładowe zapytania do przetestowania (Live Demo)

Po zapisaniu workflow kliknij na dole n8n przycisk **Open Chat** i wypróbuj polecenia:

### 1. Aktualizacja istniejącego produktu:
> *„Kupiłem dzisiaj 2 kartony mleka, zaktualizuj stan w arkuszu”*  
*(Asystent sprawdzi poprzednią ilość mleka w tabeli, doda 2 i zaktualizuje odpowiedni wiersz)*

### 2. Zdjęcie produktu ze stanu:
> *„Zużyłem passatę pomidorową, zdejmij ze stanu”*  
*(Asystent ustawi ilość na 0, zmieni status na ⚠ Uzupełnij i potwierdzi zmianę)*

### 3. Dodanie nowego produktu (bez dopytywania o parametry):
> *„Dodaj do spiżarni chleb pełnoziarnisty”*  
*(Asystent sam przypisze kategorię 'Pieczywo', jednostkę 'szt.', miejsce 'Szafka dolna', oszacuje datę ważności i od razu zapisze wiersz)*

### 4. Kilka produktów naraz (Batch update):
> *„Kupiłem 2 kartony mleka i opakowanie kawy ziarnistej”*  
*(Asystent zaktualizuje mleko i jednocześnie dopisze kawę z domyślnymi parametrami)*

### 5. Pytania w języku angielskim (Wielojęzyczność):
> *„I bought 3 packs of spaghetti pasta, update stock”*  
*(Asystent odpowie po angielsku: „Stock updated: Makaron spaghetti is now...”, a w arkuszu poprawnie zaktualizuje polskie kolumny)*

### 6. Pytanie o braki magazynowe:
> *„Czego nam brakuje i co muszę kupić w sklepie?”*  
*(Asystent porówna ilości z progami minimum i wylistuje brakujące pozycje)*

### 7. Pytanie kulinarne / dedukcja:
> *„Chcę zrobić naleśniki, czego mi brakuje ze spiżarni?”*  
*(Asystent sprawdzi czy masz mleko, mąkę, jajka i wskaże brakujące składniki)*

### 8. Pytanie niezwiązane z tematem (Strict Grounding):
> *„Jaka jest dzisiaj pogoda w Warszawie?”*  
*(Asystent kulturalnie odmówi odpowiedzi, pilnując kontekstu Twojego arkusza)*

---

## 📱 Zastąpienie wbudowanego czatu przez Telegram / WhatsApp

Gdy zechcesz przenieść asystenta do codziennego użytku mobilnego:
1. Zastąp węzeł **Chat Trigger** węzłem **Telegram Trigger** (lub **WhatsApp Trigger**).
2. Podłącz webhooka pod bota Telegram (utworzonego przez `@BotFather`).
3. W węzłach wyjściowych (`Format Update Confirmation` oraz `Format Chat Response`) podłącz węzeł wysyłania wiadomości tekstowej (`Telegram node → Send Text Message`).
4. Gotowe! Masz dostęp do swoich arkuszy bezpośrednio ze swojego smartfona.
