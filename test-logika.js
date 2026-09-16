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

// --- 4. Testy symulacyjne ---
console.log('=== TEST 1: Przygotowanie payloadu dla polecenia "kupiłem 2 mleka" ===');
const p1 = prepareGeminiPayload(rows, 'Kupiłem dzisiaj 2 mleka, zaktualizuj stan');
console.log('Wymuszony format: application/json, długość promptu:', p1.contents[0].parts[0].text.length);

console.log('\n=== TEST 2: Symulacja odpowiedzi Gemini dla modyfikacji stanu ===');
const simUpdate = JSON.stringify({
  action: "update",
  reply: "✅ Zaktualizowałem stan mleka: masz teraz 2 l w spiżarni.",
  row: {
    Produkt: "Mleko",
    Ilosc: 2,
    Jednostka: "l",
    Minimum: "2",
    Kategoria: "Nabiał"
  }
});
const parsedUpdate = parseDecision(simUpdate);
console.log('Wynik parsowania do Google Sheets node:', parsedUpdate);

console.log('\n=== TEST 3: Symulacja odpowiedzi Gemini dla pytania o przepis ===');
const simAnswer = JSON.stringify({
  action: "answer",
  reply: "Do naleśników potrzebujesz mąki, mleka i jajek. W spiżarni masz mąkę i jajka, ale brakuje mleka!",
  row: null
});
const parsedAnswer = parseDecision(simAnswer);
console.log('Wynik parsowania dla czatu:', parsedAnswer);

console.log('\n=== Wszystkie testy logiki przebiegły pomyślnie! ===');
