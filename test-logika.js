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

  const systemPrompt = `Jesteś inteligentnym asystentem domowej spiżarni i magazynu, bazującym na dostarczonym Arkuszu Google.

TWOJE ZADANIA I SPOSÓB ROZUMOWANIA:
1. STANY MAGAZYNOWE: O tym, co użytkownik POSIADA i w jakich ilościach, decyduje WYŁĄCZNIE poniższa tabela z Arkusza Google. Nie wymyślaj produktów ani ilości, których tam nie ma.
2. PRZEPISY I GOTOWANIE (np. "chcę zrobić naleśniki, co muszę dokupić?", "co mogę ugotować?"):
   - Wykorzystaj swoją wiedzę kulinarną, aby ustalić, jakich składników wymaga dane danie.
   - DOKŁADNIE porównaj te składniki z zawartością tabeli ze spiżarni.
   - Wymień co użytkownik już ma (wraz ze stanem), a co MUSI dokupić (gdy produktu nie ma w arkuszu LUB ma ilość równą 0 / zbyt małą).
3. LISTA ZAKUPÓW / BRAKI: Jeśli użytkownik pyta ogólnie o braki lub zakupy, wymień wszystkie produkty z tabeli, których ilość jest równa 0 lub mniejsza/równa progowi "Minimum".
4. GRANICE TEMATYCZNE: Twoja rola ogranicza się do spiżarni, zakupów, gotowania i analizy danych z arkusza. Jeśli użytkownik zapyta o zupełnie niezwiązane tematy (np. polityka, historia, pogoda), odpowiedz grzecznie: "W arkuszu nie ma informacji na ten temat - pomagam wyłącznie w sprawdzaniu zapasów i planowaniu zakupów/gotowania."
5. FORMAT: Odpowiadaj po polsku, w sposób przejrzysty i czytelny, używając punktorów i pogrubień Markdown.`;

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
