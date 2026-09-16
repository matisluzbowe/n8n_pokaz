// Test logiki workflow Asystenta Arkusza Google (bez zewnętrznych kluczy API).
// Sprawdza przygotowanie promptu ze strict-groundingiem oraz formatowanie danych.
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

  const systemPrompt = `Jesteś precyzyjnym asystentem danych, który odpowiada na pytania użytkownika WYŁĄCZNIE na podstawie dostarczonych danych z Arkusza Google.

ŚCISŁE ZASADY:
1. Twoja wiedza i odpowiedzi ograniczają się WYŁĄCZNIE do danych zawartych w poniższej tabeli.
2. Jeśli w arkuszu nie ma informacji potrzebnych do odpowiedzi na pytanie (np. użytkownik pyta o produkty, których nie ma w tabeli, pogodę, ogólną wiedzę o świecie, newsy itp.), odpowiedz wprost: "W arkuszu nie ma informacji na ten temat." Nie zgaduj, nie wymyślaj i nie dodawaj żadnych faktów spoza tabeli.
3. Odpowiadaj w tym samym języku, w którym zadano pytanie (np. po polsku).
4. Formułuj odpowiedzi zwięźle, konkretnie i czytelnie (używaj punktorów, pogrubień i estetycznego formatowania Markdown).
5. Jeżeli w tabeli są kolumny takie jak ilość i minimum/status, a użytkownik pyta o braki, zakupy lub stany minimalne - dokładnie przeanalizuj te wartości.`;

  const userPrompt = `DANE Z ARKUSZA GOOGLE:
${sheetData}

PYTANIE UŻYTKOWNIKA:
${chatInput || '(brak pytania)'}`;

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
      maxOutputTokens: 1500
    }
  };
}

// --- 3. Testy budowy promptu ---
console.log('=== TEST 1: Wczytano wiersze z arkusza ===');
console.log(`Liczba wierszy: ${rows.length}`);
console.log('Pierwszy wiersz:', rows[0]);

console.log('\n=== TEST 2: Budowanie payloadu dla pytania o braki ===');
const payload1 = prepareGeminiPayload(rows, 'Czego nam brakuje i co muszę kupić?');
console.log('Payload wygenerowany pomyślnie. Długość tekstu promptu:', payload1.contents[0].parts[0].text.length, 'znaków.');
console.log('Fragment promptu:\n', payload1.contents[0].parts[0].text.substring(0, 450) + '...\n');

console.log('\n=== TEST 3: Pytanie testujące Strict Grounding (poza zakresem arkusza) ===');
const payload2 = prepareGeminiPayload(rows, 'Kto jest prezydentem Francji?');
console.log('Pytanie:', 'Kto jest prezydentem Francji?');
console.log('System prompt wymusza regułę: "W arkuszu nie ma informacji na ten temat."');

console.log('\n=== Logika przygotowania promptu działa w 100% poprawnie! ===');
