// Test logiki workflow Asystenta Arkusza Google (dwukierunkowy: Q&A + modyfikacje arkusza).
// Sprawdza przygotowanie promptu ze strukturyzacją JSON oraz obsługę intencji.

// --- 1. Przykładowe dane w pamięci (do symulacji wierszy z Google Sheets) ---
const rows = [
  { Produkt: 'Mąka pszenna', Ilosc: '2', Jednostka: 'kg', Minimum: '1', Kategoria: 'Sypkie' },
  { Produkt: 'Mleko', Ilosc: '0', Jednostka: 'l', Minimum: '2', Kategoria: 'Nabiał' },
  { Produkt: 'Jajka', Ilosc: '4', Jednostka: 'szt', Minimum: '10', Kategoria: 'Nabiał' },
  { Produkt: 'Passata pomidorowa', Ilosc: '1', Jednostka: 'szt', Minimum: '3', Kategoria: 'Przetwory' },
  { Produkt: 'Kawa ziarnista', Ilosc: '0', Jednostka: 'kg', Minimum: '1', Kategoria: 'Napoje' }
];

// --- 2. Logika z węzła "Przygotuj prompt i dane" ---
function prepareGeminiPayload(rows, chatInput) {
  const allRows = rows.filter(r => r && Object.keys(r).length > 0);
  const firstRow = allRows[0] || {};
  const prodKey = Object.keys(firstRow).find(k => k.toLowerCase().includes('produkt') || k.toLowerCase().includes('product')) || 'Produkt';

  const stockedRows = allRows.filter(r => r[prodKey] && String(r[prodKey]).trim().length > 0);
  const activeRows = stockedRows.length > 0 ? stockedRows : allRows;

  const sheetData = JSON.stringify(activeRows, null, 2);
  const columnsList = Object.keys(firstRow).join(', ') || 'Lp., Produkt, Kategoria, Ilość, Jednostka, Minimum, Data ważności, Miejsce, Status';

  const getUniqueValues = (fieldKeywords) => {
    const key = Object.keys(firstRow).find(k => fieldKeywords.some(w => k.toLowerCase().includes(w)));
    if (!key) return [];
    return [...new Set(activeRows.map(r => r[key]).filter(Boolean))];
  };

  const existingUnits = getUniqueValues(['jednostka', 'unit', 'jm']);
  const existingCategories = getUniqueValues(['kategoria', 'category']);
  const existingLocations = getUniqueValues(['lokalizacja', 'miejsce', 'location']);

  let formatInfo = `KOLUMNY W TWOIM ARKUSZU: ${columnsList}\n`;
  if (existingUnits.length) formatInfo += `UŻYWANE W TABELI JEDNOSTKI: ${existingUnits.join(', ')}\n`;
  if (existingCategories.length) formatInfo += `UŻYWANE W TABELI KATEGORIE: ${existingCategories.join(', ')}\n`;
  if (existingLocations.length) formatInfo += `UŻYWANE W TABELI MIEJSCA/LOKALIZACJE: ${existingLocations.join(', ')}\n`;

  const systemPrompt = `Jesteś inteligentnym asystentem domowej spiżarni i magazynu, zintegrowanym z Arkuszem Google.
Twoim zadaniem jest odpowiadanie na pytania kulinarne i magazynowe oraz ZARZĄDZANIE STANEM W ARKUSZU (dodawanie produktów, zmiana ilości, zdejmowanie ze stanu).

${formatInfo}
ZASADY JĘZYKOWE I FORMATOWANIA (BARDZO WAŻNE):
1. JĘZYK ODPOWIEDZI DLA UŻYTKOWNIKA (pole "reply"):
   - Odpowiadaj DOKŁADNIE w tym języku, w którym użytkownik napisał wiadomość:
     * Jeśli użytkownik pisze po angielsku -> odpowiedz w "reply" po angielsku (np. "✅ Updated stock: Mleko UHT is now 8 pcs", "To make pancakes you need flour, milk, and eggs...").
     * Jeśli użytkownik pisze po polsku -> odpowiedz w "reply" po polsku (np. "✅ Zaktualizowałem stan: Mleko UHT ma teraz 8 szt.", "Do naleśników potrzebujesz mąki, mleka i jajek...").
   - W treści "reply" (niezależnie od języka odpowiedzi) nazwy produktów, kategorii i lokalizacji podawaj tak, jak występują w arkuszu (czyli po polsku, np. Makaron spaghetti, Szafka górna, Nabiał), aby użytkownik łatwo odnalazł je w tabeli.

2. DANE W ARKUSZU (pole "row"):
   - Arkusz Google jest prowadzony w języku polskim!
   - W obiekcie "row" WSZYSTKIE wartości i klucze MUSZĄ BYĆ PO POLSKU, dokładnie w stylu i wartościach występujących w tabeli (np. Kategoria: "Makarony i kasze", Jednostka: "opak.", Miejsce: "Szafka górna", Status: "✔ OK" lub "⚠ Uzupełnij").
   - Nawet jeśli użytkownik wydał polecenie po angielsku (np. "Add jasmine rice 1 kg to pantry"), w obiekcie "row" wpisz po polsku: Produkt: "Ryż jaśminowy", Jednostka: "kg", Miejsce: "Spiżarnia", Kategoria: "Makarony i kasze".
   - Dla istniejących produktów w polu "Produkt" użyj DOKŁADNIE oryginalnej polskiej nazwy z tabeli.
   - JEDNOSTKI: Używaj wyłącznie skrótów jednostek z arkusza (${existingUnits.join(', ') || 'opak., kg, puszka, słoik, but., szt., kostka'}).
   - KATEGORIE I MIEJSCA: Przypisuj wyłącznie wartości z listy występującej w arkuszu.
   - LICZBY: W kolumnie ilości oraz minimum wpisuj wyłącznie czyste liczby (np. 1 lub 0.5), bez dopisywania jednostki.
   - STATUS: Jeśli Ilość <= Minimum, ustaw "⚠ Uzupełnij". Jeśli Ilość > Minimum, ustaw "✔ OK".
   - DATA WAŻNOŚCI: W formacie YYYY-MM-DD. Jeśli użytkownik nie podał, oszacuj rozsądny termin.
   - KOMPLETNOŚĆ WIERSZA: W obiekcie "row" zwróć DOKŁADNIE klucze odpowiadające kolumnom arkusza (${columnsList}). NIE dodawaj dodatkowych metadanych.

TWOJE ZADANIA:
1. MODYFIKACJA STANU (np. "kupiłem 2 mleka", "I bought 2 cartons of milk", "zmień ilość jajek na 10", "zdejmij ze stanu mleko", "used up the pasta, remove it", "dodaj ryż jaśminowy 1 kg"):
   - Ustaw pole "action": "update".
   - W polu "reply" napisz zwięzłe, przyjazne potwierdzenie w języku użytkownika (PL lub EN).
   - W obiekcie "row" podaj dane wiersza do zapisu/aktualizacji (zawsze po polsku, tak jak w arkuszu).

2. PYTANIA I PRZEPISY (np. "chcę zrobić naleśniki, czego brakuje?", "I want to make pancakes, do I have the ingredients?", "co mogę ugotować?", "what are we running low on?", "ile mamy jajek?"):
   - Ustaw pole "action": "answer".
   - Pole "row" ustaw na null.
   - W polu "reply" udziel wyczerpującej, sformatowanej w Markdown odpowiedzi w języku pytania użytkownika (użyj wiedzy kulinarnej i porównaj składniki ze stanem spiżarni w tabeli).

3. TEMATY NIEZWIĄZANE (np. polityka, historia, pogoda):
   - Ustaw pole "action": "answer", "row": null.
   - W polu "reply" odmów w języku pytania użytkownika:
     * Po polsku: "W arkuszu nie ma informacji na ten temat - pomagam wyłącznie w sprawdzaniu i aktualizacji zapasów oraz planowaniu kuchni."
     * Po angielsku: "There is no information about this in the sheet - I only assist with checking and updating pantry inventory and meal planning."

ODPOWIADAJ WYŁĄCZNIE W POPRAWNYM FORMACIE JSON:
{
  "action": "update" | "answer",
  "reply": "tekst odpowiedzi lub potwierdzenia dla użytkownika (w języku pytania: PL lub EN)",
  "row": { "Lp.": 71, "Produkt": "...", "Kategoria": "...", "Ilość": 1, "Jednostka": "...", "Minimum": 1, "Data ważności": "2027-12-31", "Miejsce": "...", "Status": "..." } // lub null gdy action=="answer"
}`;

  const userPrompt = `DANE Z ARKUSZA GOOGLE (GOOGLE SHEET DATA):\n${sheetData}\n\nPOLECENIE / WIADOMOŚĆ UŻYTKOWNIKA (USER MESSAGE):\n${chatInput || '(brak pytania)'}`;

  const fullPrompt = `${systemPrompt}\n\n========================================\n${userPrompt}`;

  return {
    contents: [
      {
        parts: [
          { text: fullPrompt }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
      maxOutputTokens: 8192
    }
  };
}

// --- 3. Logika z węzła "Parsuj decyzję AI" ---
function parseDecision(aiResponseJson) {
  let parsed = null;
  try {
    const raw = typeof aiResponseJson === 'string' ? aiResponseJson : JSON.stringify(aiResponseJson);
    parsed = JSON.parse(raw);
  } catch(e) {
    return [{ action: 'answer', reply: 'Błąd parsowania.' }];
  }

  if (parsed.action === 'update') {
    const rowList = Array.isArray(parsed.rows) ? parsed.rows : (parsed.row && typeof parsed.row === 'object' ? [parsed.row] : []);
    if (rowList.length > 0) {
      return rowList.map(r => ({
        ...r,
        action: 'update',
        reply: parsed.reply || '✅ Zaktualizowano arkusz.'
      }));
    }
  }

  return [{
    action: 'answer',
    reply: parsed.reply || 'Brak odpowiedzi.'
  }];
}

// --- 4. Logika z węzła "Oczyść wiersz przed zapisem" ---
function cleanRowBeforeSave(sheetRows, inputs) {
  const validColumns = sheetRows.length > 0 ? Object.keys(sheetRows[0]).filter(k => k && !k.startsWith('_')) : [];
  const prodKey = validColumns.find(k => k.toLowerCase().includes('produkt') || k.toLowerCase().includes('product')) || 'Produkt';
  const lpKey = validColumns.find(k => k.toLowerCase().includes('lp')) || 'Lp.';
  const qtyKey = validColumns.find(k => k.toLowerCase().includes('ilość') || k.toLowerCase().includes('ilosc')) || 'Ilość';
  const minKey = validColumns.find(k => k.toLowerCase().includes('minimum') || k.toLowerCase().includes('min')) || 'Minimum';
  const statusKey = validColumns.find(k => k.toLowerCase().includes('status')) || 'Status';

  const occupiedRows = sheetRows.map(r => ({ ...r }));
  const inputArray = Array.isArray(inputs) ? inputs : [inputs];
  const results = [];

  for (const input of inputArray) {
    const cleanRow = {};
    const productName = input[prodKey] || input.Produkt || '';
    const existingRow = occupiedRows.find(r => r && r[prodKey] && String(r[prodKey]).trim().toLowerCase() === String(productName).trim().toLowerCase());

    if (validColumns.length > 0) {
      for (const col of validColumns) {
        if (input[col] !== undefined) {
          cleanRow[col] = input[col];
        } else if (existingRow && existingRow[col] !== undefined) {
          cleanRow[col] = existingRow[col];
        }
      }
    } else {
      for (const [key, value] of Object.entries(input)) {
        if (key !== 'action' && key !== 'reply' && !key.startsWith('_')) {
          cleanRow[key] = value;
        }
      }
    }

    if (existingRow && existingRow[lpKey]) {
      cleanRow[lpKey] = existingRow[lpKey];
    } else {
      const emptyRow = occupiedRows.find(r => r && (!r[prodKey] || String(r[prodKey]).trim() === ''));
      if (emptyRow && emptyRow[lpKey] !== undefined && String(emptyRow[lpKey]).trim() !== '') {
        const parsedLp = parseInt(String(emptyRow[lpKey]), 10);
        cleanRow[lpKey] = !isNaN(parsedLp) ? parsedLp : emptyRow[lpKey];
        emptyRow[prodKey] = productName;
      } else {
        const maxLp = occupiedRows.reduce((max, r) => {
          const val = parseInt(r && r[lpKey], 10);
          return !isNaN(val) && val > max ? val : max;
        }, 0);
        cleanRow[lpKey] = maxLp + 1;
        occupiedRows.push({ [lpKey]: cleanRow[lpKey], [prodKey]: productName });
      }
    }

    if (cleanRow[qtyKey] !== undefined) {
      const num = parseFloat(String(cleanRow[qtyKey]).replace(',', '.'));
      if (!isNaN(num)) cleanRow[qtyKey] = num;
    }
    if (cleanRow[minKey] !== undefined) {
      const num = parseFloat(String(cleanRow[minKey]).replace(',', '.'));
      if (!isNaN(num)) cleanRow[minKey] = num;
    }

    if (statusKey && cleanRow[qtyKey] !== undefined && cleanRow[minKey] !== undefined) {
      const qty = Number(cleanRow[qtyKey]);
      const min = Number(cleanRow[minKey]);
      if (!isNaN(qty) && !isNaN(min)) {
        cleanRow[statusKey] = (qty <= min) ? '⚠ Uzupełnij' : '✔ OK';
      }
    }

    results.push(cleanRow);
  }

  return Array.isArray(inputs) ? results : results[0];
}

// --- 5. Testy symulacyjne ---
console.log('=== TEST 1: Przygotowanie payloadu dla polecenia "kupiłem 2 mleka" ===');
const p1 = prepareGeminiPayload(rows, 'Kupiłem dzisiaj 2 mleka, zaktualizuj stan');
console.log('Wymuszony format: application/json, długość promptu:', p1.contents[0].parts[0].text.length);

console.log('\n=== TEST 2: Symulacja odpowiedzi Gemini dla modyfikacji stanu ===');
const simUpdate = JSON.stringify({
  action: "update",
  reply: "✅ Dodałem Ryż jaśminowy (1 kg) do spiżarni.",
  row: {
    'Lp.': 71,
    'Produkt': "Ryż jaśminowy",
    'Kategoria': "Makarony i kasze",
    'Ilość': 1,
    'Jednostka': "kg",
    'Minimum': 1,
    'Data ważności': "2027-12-31",
    'Miejsce': "Spiżarnia",
    'Status': "✔ OK"
  }
});
const parsedUpdate = parseDecision(simUpdate);
console.log('Wynik parsowania decyzji (zawiera jeszcze metadane):', Object.keys(parsedUpdate));

console.log('\n=== TEST 3: Dodanie nowego produktu do pierwszego pustego wiersza w tabeli ===');
const tableWithEmptyRows = [
  { 'Lp.': 1, 'Produkt': 'Makaron spaghetti', 'Kategoria': 'Makarony i kasze', 'Ilość': 4, 'Jednostka': 'opak.', 'Minimum': 2, 'Data ważności': '2027-06-01', 'Miejsce': 'Szafka górna', 'Status': '✔ OK' },
  { 'Lp.': 70, 'Produkt': 'Czosnek', 'Kategoria': 'Inne', 'Ilość': 3, 'Jednostka': 'szt.', 'Minimum': 1, 'Data ważności': '2026-11-01', 'Miejsce': 'Spiżarnia', 'Status': '✔ OK' },
  { 'Lp.': 71, 'Produkt': '', 'Kategoria': '', 'Ilość': '', 'Jednostka': '', 'Minimum': '', 'Data ważności': '', 'Miejsce': '', 'Status': '' },
  { 'Lp.': 72, 'Produkt': '', 'Kategoria': '', 'Ilość': '', 'Jednostka': '', 'Minimum': '', 'Data ważności': '', 'Miejsce': '', 'Status': '' }
];

const [cleanedNewItem] = cleanRowBeforeSave(tableWithEmptyRows, parsedUpdate);
console.log('Oczyszczony wiersz do zapisu w arkuszu (nowy produkt trafił do pustego wiersza):');
console.log(cleanedNewItem);
if (cleanedNewItem['Lp.'] !== 71) {
  throw new Error(`BŁĄD: Nowy produkt powinien otrzymać Lp. 71 z pierwszego pustego wiersza, a otrzymał: ${cleanedNewItem['Lp.']}`);
}
if (cleanedNewItem.action || cleanedNewItem.reply) {
  throw new Error('BŁĄD: Pola action lub reply wyciekły do arkusza!');
}
if (cleanedNewItem.Status !== '⚠ Uzupełnij') {
  throw new Error('BŁĄD: Niepoprawny status dla Ilość <= Minimum!');
}
console.log('✅ Nowy produkt pomyślnie trafił do pierwszego pustego wiersza tabeli (Lp. 71)!');

console.log('\n=== TEST 3b: Aktualizacja istniejącego produktu (zachowanie oryginalnego Lp.) ===');
const simExistingUpdate = {
  Produkt: 'Makaron spaghetti',
  'Ilość': 6,
  action: 'update',
  reply: '✅ Zaktualizowano makaron'
};
const cleanedExisting = cleanRowBeforeSave(tableWithEmptyRows, simExistingUpdate);
console.log('Zaktualizowany istniejący produkt:');
console.log(cleanedExisting);
if (cleanedExisting['Lp.'] !== 1) {
  throw new Error(`BŁĄD: Istniejący produkt powinien zachować Lp. 1, a otrzymał: ${cleanedExisting['Lp.']}`);
}
if (cleanedExisting['Ilość'] !== 6 || cleanedExisting.Status !== '✔ OK') {
  throw new Error('BŁĄD: Niepoprawna ilość lub status dla zaktualizowanego produktu!');
}
console.log('✅ Istniejący produkt zachował swoje oryginalne Lp. 1!');

console.log('\n=== TEST 3c: Nowy produkt gdy brak pustych wierszy w tabeli (maxLp + 1) ===');
const tableFull = [
  { 'Lp.': 1, 'Produkt': 'Makaron spaghetti', 'Kategoria': 'Makarony i kasze', 'Ilość': 4, 'Jednostka': 'opak.', 'Minimum': 2, 'Data ważności': '2027-06-01', 'Miejsce': 'Szafka górna', 'Status': '✔ OK' },
  { 'Lp.': 70, 'Produkt': 'Czosnek', 'Kategoria': 'Inne', 'Ilość': 3, 'Jednostka': 'szt.', 'Minimum': 1, 'Data ważności': '2026-11-01', 'Miejsce': 'Spiżarnia', 'Status': '✔ OK' }
];
const [cleanedFull] = cleanRowBeforeSave(tableFull, parsedUpdate);
if (cleanedFull['Lp.'] !== 71) {
  throw new Error(`BŁĄD: Przy braku wolnych wierszy powinien otrzymać max + 1 (71), a otrzymał: ${cleanedFull['Lp.']}`);
}
console.log('✅ Przy braku wolnych wierszy poprawnie wyliczono maxLp + 1 (71)!');

console.log('\n=== TEST 4: Symulacja odpowiedzi Gemini dla pytania po polsku o przepis ===');
const simAnswerPL = JSON.stringify({
  action: "answer",
  reply: "Do naleśników potrzebujesz mąki, mleka i jajek. W spiżarni masz mąkę i jajka, ale brakuje mleka!",
  row: null
});
const [parsedAnswerPL] = parseDecision(simAnswerPL);
console.log('Wynik parsowania dla czatu (PL):', parsedAnswerPL.reply);

console.log('\n=== TEST 5: Symulacja odpowiedzi Gemini na pytanie po angielsku ===');
const pEN = prepareGeminiPayload(rows, 'I want to make pancakes, do I have the ingredients?');
console.log('Prompt dla pytania EN przygotowany pomyślnie, długość:', pEN.contents[0].parts[0].text.length);

const simAnswerEN = JSON.stringify({
  action: "answer",
  reply: "To make pancakes, you need flour, milk, and eggs. Checking your pantry:\n- **Mąka pszenna** (Szafka dolna): 2 kg available\n- **Jajka** (Lodówka): 4 pcs available\n- **Mleko**: 0 l (missing!)\nYou are missing **Mleko**.",
  row: null
});
const [parsedAnswerEN] = parseDecision(simAnswerEN);
console.log('Wynik parsowania odpowiedzi AI po angielsku (z polskimi nazwami z tabeli):');
console.log(parsedAnswerEN.reply);
if (!parsedAnswerEN.reply.includes('Mąka pszenna') || !parsedAnswerEN.reply.includes('Mleko')) {
  throw new Error('BŁĄD: Odpowiedź w języku angielskim powinna zachować polskie nazwy produktów z tabeli!');
}
console.log('✅ Odpowiedź jest po angielsku, a nazwy produktów i lokalizacji pozostały po polsku!');

console.log('\n=== TEST 6: Symulacja polecenia modyfikacji arkusza wydanego po angielsku ===');
const simUpdateFromEN = JSON.stringify({
  action: "update",
  reply: "✅ Updated stock: Makaron spaghetti is now 6 pcs.",
  row: {
    'Produkt': 'Makaron spaghetti',
    'Ilość': 6,
    'Jednostka': 'opak.',
    'Kategoria': 'Makarony i kasze',
    'Miejsce': 'Szafka górna'
  }
});
const parsedUpdateEN = parseDecision(simUpdateFromEN);
const [cleanedFromEN] = cleanRowBeforeSave(tableWithEmptyRows, parsedUpdateEN);
console.log('Wiersz zapisywany w arkuszu (dane w arkuszu pozostały po polsku):');
console.log(cleanedFromEN);
if (cleanedFromEN['Produkt'] !== 'Makaron spaghetti' || cleanedFromEN['Kategoria'] !== 'Makarony i kasze') {
  throw new Error('BŁĄD: Dane w obiekcie do zapisu w arkuszu muszą być po polsku!');
}
if (cleanedFromEN['Lp.'] !== 1) {
  throw new Error('BŁĄD: Wiersz powinien dopasować istniejący produkt o Lp. 1!');
}
console.log('✅ Potwierdzenie po angielsku, a dane do arkusza w 100% po polsku!');

console.log('\n=== TEST 7: Symulacja aktualizacji istniejącego produktu ORAZ dodania nowego z auto-domyślnymi parametrami (bez dopytywania) ===');
const simMultiUpdate = JSON.stringify({
  action: "update",
  reply: "✅ Stock updated: Makaron spaghetti is now 7 szt. and added Chleb pełnoziarnisty (1 szt.) to Szafka dolna.",
  rows: [
    {
      Produkt: "Makaron spaghetti",
      'Ilość': 7,
      Jednostka: "opak.",
      Kategoria: "Makarony i kasze",
      Miejsce: "Szafka górna"
    },
    {
      Produkt: "Chleb pełnoziarnisty",
      'Ilość': 1,
      Jednostka: "szt.",
      Kategoria: "Pieczywo",
      Miejsce: "Szafka dolna",
      Minimum: 1,
      "Data ważności": "2026-09-22"
    }
  ]
});

const parsedMulti = parseDecision(simMultiUpdate);
if (parsedMulti.length !== 2) {
  throw new Error(`BŁĄD: Oczekiwano 2 wierszy po parsowaniu, otrzymano: ${parsedMulti.length}`);
}

const cleanedMulti = cleanRowBeforeSave(tableWithEmptyRows, parsedMulti);
console.log('Wynik oczyszczenia wielu wierszy z jednego polecenia:');
console.log(cleanedMulti);

const pastaRow = cleanedMulti.find(r => r.Produkt === 'Makaron spaghetti');
const breadRow = cleanedMulti.find(r => r.Produkt === 'Chleb pełnoziarnisty');

if (!pastaRow || pastaRow['Lp.'] !== 1 || pastaRow['Ilość'] !== 7) {
  throw new Error('BŁĄD: Makaron spaghetti powinien zachować Lp. 1 i mieć ilość 7!');
}
if (!breadRow || breadRow['Lp.'] !== 71) {
  throw new Error(`BŁĄD: Nowy produkt Chleb pełnoziarnisty powinien otrzymać wolny wiersz Lp. 71, otrzymano: ${breadRow && breadRow['Lp.']}`);
}
if (breadRow.Jednostka !== 'szt.' || breadRow.Miejsce !== 'Szafka dolna' || breadRow.Status !== '⚠ Uzupełnij') {
  throw new Error('BŁĄD: Błędne parametry domyślne dla chleba!');
}
console.log('✅ Wiele produktów zaktualizowanych/dodanych naraz z auto-domyślnymi wartościami (bez zadawania pytań)!');

console.log('\n=== Wszystkie testy logiki przebiegły w 100% pomyślnie! ===');
