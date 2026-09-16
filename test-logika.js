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
  const sheetData = JSON.stringify(rows, null, 2);
  const existingColumns = rows.length > 0 ? Object.keys(rows[0]).join(', ') : 'Produkt, Ilosc, Jednostka, Minimum, Kategoria';

  const systemPrompt = `Jesteś inteligentnym asystentem domowej spiżarni i magazynu, zintegrowanym z Arkuszem Google.
Twoim celem jest odpowiadanie na pytania oraz ZARZĄDZANIE STANEM W ARKUSZU (dodawanie produktów, zmiana ilości, zdejmowanie ze stanu).

KOLUMNY W TWOIM ARKUSZU TO: ${existingColumns}

TWOJE ZADANIA:
1. JEŚLI UŻYTKOWNIK CHCE ZMODYFIKOWAĆ STAN (np. "kupiłem 2 mleka", "zmień ilość jajek na 10", "zdejmij ze stanu mleko", "zużyłem passatę", "dodaj czosnek 3 sztuki"):
   - Ustaw pole "action": "update".
   - W polu "reply" napisz przyjazne potwierdzenie wykonania operacji (np. "✅ Zaktualizowałem stan: Mleko ma teraz 4 l" lub "✅ Zdjąłem Mleko ze stanu (ilość: 0 l)" lub "✅ Dodałem Czosnek (3 szt) do spiżarni").
   - W obiekcie "row" podaj zaktualizowany wiersz. Użyj DOKŁADNIE takich samych nazw kluczy jak kolumny arkusza:
     * Nazwa produktu w polu "Produkt" (dla istniejącego produktu użyj DOKŁADNIE takiej nazwy jak w tabeli, np. "Mleko", dla nowego podaj nową nazwę).
     * "Ilosc": nowa obliczona wartość liczbowa (np. "zdejmij ze stanu" -> 0; "zużyłem 1 passatę" z 1 -> 0; "kupiłem 2 mleka" przy obecnych 0 -> 2).
     * Pozostałe kolumny (np. Jednostka, Minimum, Kategoria) zachowaj z tabeli, a dla nowych produktów uzupełnij logicznymi wartościami.

2. JEŚLI UŻYTKOWNIK ZADAJE PYTANIE (np. "co na obiad?", "chcę zrobić naleśniki czy mam składniki?", "czego brakuje?", "ile mamy jajek?"):
   - Ustaw pole "action": "answer".
   - Pole "row" ustaw na null.
   - W polu "reply" udziel wyczerpującej, sformatowanej w Markdown odpowiedzi, wykorzystując wiedzę kulinarną i porównując ją ze stanem spiżarni.

3. TEMATY NIEZWIĄZANE (np. polityka, pogoda):
   - Ustaw pole "action": "answer", "row": null.
   - W polu "reply" odmów: "W arkuszu nie ma informacji na ten temat - pomagam wyłącznie w sprawdzaniu i aktualizacji zapasów oraz planowaniu kuchni."

ODPOWIEDZ WYŁĄCZNIE W FORMACIE JSON o strukturze:
{
  "action": "update" | "answer",
  "reply": "tekst odpowiedzi dla użytkownika",
  "row": { "Produkt": "...", "Ilosc": 0, ... } // lub null gdy action=="answer"
}`;

  const userPrompt = `DANE Z ARKUSZA GOOGLE:\n${sheetData}\n\nPOLECENIE / WIADOMOŚĆ UŻYTKOWNIKA:\n${chatInput || '(brak pytania)'}`;

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
    return { action: 'answer', reply: 'Błąd parsowania.' };
  }

  if (parsed.action === 'update' && parsed.row) {
    return {
      ...parsed.row,
      action: 'update',
      reply: parsed.reply || '✅ Zaktualizowano arkusz.'
    };
  }

  return {
    action: 'answer',
    reply: parsed.reply || 'Brak odpowiedzi.'
  };
}

// --- 4. Logika z węzła "Oczyść wiersz przed zapisem" ---
function cleanRowBeforeSave(sheetRows, input) {
  const validColumns = sheetRows.length > 0 ? Object.keys(sheetRows[0]).filter(k => k && !k.startsWith('_')) : [];
  const cleanRow = {};

  const prodKey = validColumns.find(k => k.toLowerCase().includes('produkt') || k.toLowerCase().includes('product')) || 'Produkt';
  const lpKey = validColumns.find(k => k.toLowerCase().includes('lp')) || 'Lp.';
  const qtyKey = validColumns.find(k => k.toLowerCase().includes('ilość') || k.toLowerCase().includes('ilosc')) || 'Ilość';
  const minKey = validColumns.find(k => k.toLowerCase().includes('minimum') || k.toLowerCase().includes('min')) || 'Minimum';
  const statusKey = validColumns.find(k => k.toLowerCase().includes('status')) || 'Status';

  const productName = input[prodKey] || input.Produkt || '';
  const existingRow = sheetRows.find(r => r[prodKey] && String(r[prodKey]).trim().toLowerCase() === String(productName).trim().toLowerCase());

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
  } else if (!cleanRow[lpKey]) {
    const maxLp = sheetRows.reduce((max, r) => {
      const val = parseInt(r[lpKey], 10);
      return !isNaN(val) && val > max ? val : max;
    }, 0);
    cleanRow[lpKey] = maxLp + 1;
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

  return cleanRow;
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

console.log('\n=== TEST 3: Oczyszczenie wiersza przed wysłaniem do Google Sheets ===');
const userTableRows = [
  { 'Lp.': 1, 'Produkt': 'Makaron spaghetti', 'Kategoria': 'Makarony i kasze', 'Ilość': 4, 'Jednostka': 'opak.', 'Minimum': 2, 'Data ważności': '2027-06-01', 'Miejsce': 'Szafka górna', 'Status': '✔ OK' },
  { 'Lp.': 70, 'Produkt': 'Czosnek', 'Kategoria': 'Inne', 'Ilość': 3, 'Jednostka': 'szt.', 'Minimum': 1, 'Data ważności': '2026-11-01', 'Miejsce': 'Spiżarnia', 'Status': '✔ OK' }
];

const cleaned = cleanRowBeforeSave(userTableRows, parsedUpdate);
console.log('Oczyszczony wiersz do zapisu w arkuszu:');
console.log(cleaned);
if (cleaned.action || cleaned.reply) {
  throw new Error('BŁĄD: Pola action lub reply wyciekły do arkusza!');
}
if (cleaned.Status !== '⚠ Uzupełnij') {
  throw new Error('BŁĄD: Niepoprawny status dla Ilość <= Minimum!');
}
console.log('✅ Pola action i reply zostały pomyślnie odcięte!');
console.log('✅ Status został automatycznie skorygowany wg reguły ilości i minimum!');

console.log('\n=== TEST 4: Symulacja odpowiedzi Gemini dla pytania o przepis ===');
const simAnswer = JSON.stringify({
  action: "answer",
  reply: "Do naleśników potrzebujesz mąki, mleka i jajek. W spiżarni masz mąkę i jajka, ale brakuje mleka!",
  row: null
});
const parsedAnswer = parseDecision(simAnswer);
console.log('Wynik parsowania dla czatu:', parsedAnswer.reply);

console.log('\n=== Wszystkie testy logiki przebiegły w 100% pomyślnie! ===');
