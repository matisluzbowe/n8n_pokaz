# Presentation Script: n8n Pantry Assistant with Google Sheets & AI

**Note:** Text in `[BRACKETS]` shows what to click or show on screen. Read the rest out loud in a relaxed, normal speaking voice.

---

## 1. Intro (What is this project?)

Hi everyone. Today I want to show you a project I built in n8n. 

It is a simple AI assistant connected directly to a Google Spreadsheet. 

In my case, I use it for home inventory — basically a kitchen pantry spreadsheet with about 70 items: things like pasta, milk, flour, canned food, and spices. 

We all know that opening a large spreadsheet on a phone and scrolling through rows while shopping is annoying. So my goal was simple:
- I want to talk to the spreadsheet in normal language.
- I want to ask questions like *"What are we running low on?"* or *"Can I make pancakes with what we have?"*.
- And I also want to **update the sheet through chat**, like saying *"I just bought 2 cartons of milk, update the stock"*, or *"We ran out of cheese, set it to zero"*.

Let me show you how this is set up in n8n.

---

## 2. Walkthrough of the Nodes

[ON SCREEN: Show the n8n canvas with the full workflow]

Here is the workflow. As you can see, data simply moves from left to right through a few connected nodes. Let’s go through them one by one.

### Node 1: Chat Trigger
[ACTION: Point at the Chat Trigger node]  
This is where the user sends a message.  
A quick note here: for everyday use, you could easily replace this node with **Telegram or WhatsApp**. That way, you could just text your pantry from your phone while standing in a grocery store. For this presentation, I am using n8n’s built-in chat because it runs right here in the browser and is easy to show on screen.

### Node 2: Google Sheets (Read)
[ACTION: Point at the Google Sheets node]  
Whenever a message comes in, this node reads the current data from my Google Sheet. This way, the AI always sees the real, up-to-date numbers before answering.

### Node 3: Prepare Prompt & Data (Code Node)
[ACTION: Point at the "Prepare Prompt & Data" node]  
This is a small JavaScript node. It reads the sheet columns, the units we use (like kilograms, bottles, or pieces), and packages everything for the AI model.  
It also sets a very important rule: **the AI is only allowed to answer based on the sheet**. It cannot make things up or guess.

### Node 4: Google Gemini AI
[ACTION: Point at the "Google Gemini AI" node]  
This node calls Google Gemini. Gemini reads the user's message and decides: is this just a question, or does the user want to change something in the spreadsheet? It gives us back a clean, structured decision.

### Node 5: Router (If Node)
[ACTION: Point at the "Check Action (Modify Sheet?)" node]  
Here we split the path:
- If the user just asked a question, it skips the spreadsheet update and sends the text back to the chat.
- If the user asked to add or change a product, it goes to the update branch.

### Node 6: Clean Row Before Save (Code Node)
[ACTION: Point at the "Clean Row Before Save" node]  
This is a small helper node that protects the spreadsheet. It makes sure no extra temporary data gets written into the sheet. It also checks the numbers, keeps the correct item number (`Lp.`), and automatically sets the status: if the quantity is at or below minimum, it marks it as *"Restock"*, otherwise *"OK"*.

### Node 7: Google Sheets (Append or Update)
[ACTION: Point at the "Google Sheets (Append or Update)" node]  
This node takes the cleaned row and updates the existing product or fills in the next empty row in the table. Then, a confirmation message is sent back to the chat.

Now let’s look at how it works live.

---

## 3. Live Demo

[ACTION: Open Google Sheets on the left side of the screen and the n8n chat on the right side]

On the left is my pantry spreadsheet with 70 items. On the right is the chat. Let's test a few real examples.

### Test 1: Checking what we need to buy
Let's ask what is running low.

[ACTION: Type into the chat:]  
`Czego nam brakuje i co muszę dokupić w sklepie?`  
*(What are we running low on and what do I need to buy?)*

[ACTION: Press Enter]

Look at the answer: in a couple of seconds, it checked all 70 items against their minimum levels. It tells me right away that we need things like basmati rice, rye flour, butter, and spices, and it even tells me which shelf they belong to.

### Test 2: Checking a recipe
Now let's ask a cooking question.

[ACTION: Type into the chat:]  
`Chcę zrobić naleśniki, czy mam wszystkie składniki?`  
*(I want to make pancakes, do I have all the ingredients?)*

[ACTION: Press Enter]

The model knows what ingredients go into classic pancakes — flour, milk, eggs, sugar, and oil. It checked the spreadsheet and confirmed:
- We have flour in the lower cabinet,
- Milk in the pantry,
- Eggs in the fridge,
- Sugar and oil are available too.  
So it confirms we have everything we need.

### Test 3: Updating an item live
Now let’s actually change the spreadsheet from the chat.  
Look at **Row 56** in the Google Sheet: `Mleko UHT` currently has a quantity of `6`. Let's say I just bought 2 more cartons.

[ACTION: Type into the chat:]  
`Kupiłem dzisiaj 2 mleka UHT, zaktualizuj stan w arkuszu`  
*(I bought 2 UHT milks today, update the stock in the sheet)*

[ACTION: Press Enter]

[ACTION: Point at row 56 in the spreadsheet]  
Look at row 56 on the left: the quantity just changed from 6 to 8.  
And the chat confirms: *"Updated stock: Mleko UHT is now 8 pcs"*.

### Test 4: Setting an item to zero (Restock status)
Now look at **Row 57**: `Ser żółty` (cheese). Let’s say we finished it.

[ACTION: Type into the chat:]  
`Zużyłem cały ser żółty, zdejmij ze stanu`  
*(I used up all the yellow cheese, take it off stock)*

[ACTION: Press Enter]

[ACTION: Point at row 57 in the spreadsheet]  
In row 57:
- The quantity dropped to `0`.
- And the status automatically changed to `⚠ Uzupełnij` (Restock), because 0 is below our minimum.  
All other columns like category and fridge location stayed exactly the same.

### Test 5: Off-topic question (No hallucinations)
What happens if I ask something completely unrelated?

[ACTION: Type into the chat:]  
`Kto jest prezydentem Francji?`  
*(Who is the president of France?)*

[ACTION: Press Enter]

The assistant replies: *"There is no information about this in the sheet"*.  
It refuses to answer off-topic questions, so we know it won't hallucinate or get confused.

---

## 4. Ideas for the Future & How This Was Built

To finish up, two quick thoughts:

First, how you could expand this:  
You could easily add image recognition. Instead of typing what you bought, you could just take a photo of your supermarket receipt, a picture of the groceries on your counter, or a photo inside your fridge. A vision model can read the products from the image and update the sheet automatically.

Second, how this was actually built:  
You don't need to manually click and write all these workflows from scratch anymore. You can just ask an AI model in Visual Studio Code or Antigravity.  
For this project, I used **Gemini Pro inside Antigravity** with access to skills. The AI practically built the workflow, the code nodes, and the validation logic for me, and my job was simply testing it and tweaking the details together with the model.

---

## 5. Wrap Up

That’s basically it: n8n handles the automation, Google Sheets holds the data, and Gemini does the thinking.

Thank you, and if you have any questions, I’d be happy to answer!
