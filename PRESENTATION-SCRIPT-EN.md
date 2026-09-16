# 🎤 Presentation Script — "Intelligent Spreadsheet Assistant with n8n & AI"

**Duration:** ~15 minutes  
**Language level:** Intermediate English (clear syntax, simple vocabulary)  
**Format:** Read the text out loud. Text in `[SQUARE BRACKETS]` are stage directions — things to **do or show**, not to read.

> Speaking tips: read slowly, pause at each `— pause —`, and look at the audience during the questions. Total spoken text is about 2,000 words, which fits comfortably in 15 minutes with the live demo.

---

## PART 1 — Opening (about 1 minute)

Good morning, everyone. Thank you for being here.

Today I want to show you **n8n** — an open and powerful tool for building automated workflows — together with a practical example I built with it: an **AI-powered assistant that knows everything about a spreadsheet**.

— pause —

The example comes from daily life: a smart assistant that monitors my **home pantry spreadsheet** and helps me with shopping, recipes, and inventory. I can ask it anything in plain language through a chat window, and it answers strictly using the data in my spreadsheet.

Let me show you how it works and why this pattern is so exciting.

---

## PART 2 — What is n8n? (about 2 minutes)

Here is n8n on the screen.

[ON SCREEN: open the n8n canvas with the workflow, but do not zoom in yet]

n8n is a **workflow automation platform**. A workflow works like a modern digital assembly line. On one end, an event *triggers* it — this is called a **trigger**. Then the data flows from one station to the next. 

Each station is a **node**, and every node does one specific job: it can read a file, fetch data from Google Sheets, call an AI model, make a calculation, or send a notification.

— pause —

You connect nodes visually with lines and arrows. Most configuration is done through clean input forms, so you get all the power of code without having to build a web server or write hundreds of lines of boilerplate.

[ACTION: point at two or three nodes on the screen with the mouse]

Everything you see here is one lightweight workflow. Let's look at what this particular workflow achieves.

---

## PART 3 — The problem and the idea (about 1 minute)

Here is the situation this workflow solves. 

We all work with spreadsheets — whether it's inventory at work, tracking orders, or managing food supplies at home. But opening a spreadsheet on a phone, scrolling through dozens of rows, and checking numbers manually is slow and frustrating.

— pause —

So I asked: what if I could just **send a message in plain English or Polish** and get an immediate answer?

What if I could ask: *"What are we running low on?"*, or *"Can we make pasta tonight with what we have?"*, or *"How much coffee is left?"* — and receive an accurate answer in two seconds?

And just as importantly: **how do we make sure the AI does not hallucinate or make things up?**

That is our goal. Now let's look at the machinery behind it.

---

## PART 4 — The big picture & The trigger (about 2 minutes)

[ON SCREEN: show the full workflow from left to right]

Let's follow the journey of a single question through the workflow.

**Step one: The Trigger.**  
The workflow starts with a trigger node. 

[ACTION: point at the Chat Trigger node]

For demonstration purposes today, I am using **n8n's built-in chat trigger**. It gives us an instant chat widget directly in the browser with zero external setup. 

However, in a real-world or production setup, you can easily swap this trigger for **Telegram, WhatsApp, or Slack**. That means you, your family, or your team can access the exact same assistant remotely from your smartphone anytime, anywhere. You send a quick WhatsApp message while standing in the grocery store aisle, and the assistant replies instantly.

— pause —

**Step two: Reading the source of truth.**  
Next, n8n connects to **Google Sheets**. It fetches all current rows from our inventory sheet in real time.

[ACTION: point at the Google Sheets node]

**Step three: Context preparation & Strict Grounding.**  
This Code node takes the user's question and packages the spreadsheet data together with strict system instructions for the AI.

[ACTION: point at the "Przygotuj prompt i dane" Code node]

We instruct the AI with **Strict Grounding**: it is allowed to answer **only and exclusively** based on the provided spreadsheet rows. If someone asks about something not in the sheet, the AI is instructed to say: *"There is no information about this in the sheet"*. No hallucinations, no guessing.

**Step four: Google Gemini AI.**  
The packaged data is sent to Google's Gemini model via a fast API call to analyze the question against the sheet data.

[ACTION: point at the Gemini AI node]

**Step five: Clean reply.**  
Finally, n8n formats the AI's response and sends it back to the chat.

Four simple steps: Chat in, Google Sheets read, Gemini analysis, Chat out. 

Now let's see it live!

---

## PART 5 — Live demo, part one: Natural language queries (about 2.5 minutes)

[ACTION: have the Google Sheet open in one tab, and the n8n chat window open in another tab]

Let me show you our sample data first.

[ON SCREEN: open the Google Sheet]

Here is our pantry sheet. We have columns for **Product**, **Current Amount**, **Unit**, **Minimum Threshold**, and **Category**. Notice that milk is at 0, eggs are at 4 (while minimum is 10), and coffee is at 0.

[ON SCREEN: switch to the n8n chat window]

Now let's talk to our assistant like a human. I won't use special codes or commands. I will just ask:

**"Czego nam brakuje i co muszę kupić w sklepie?"** *(or in English: "What is running low and what do I need to buy?")*

[ACTION: type the question into the chat, press enter, and wait a moment]

— pause —

Look at the answer. In just two seconds:
- The assistant checked all rows against their minimum levels.
- It immediately identified that we are out of Milk and Coffee, and that Eggs are below our threshold.
- It formatted everything into a clean, bulleted shopping list with units!

Notice what just happened: I didn't have to write custom filtering logic or hardcoded scripts. The AI understood the column headers and the data relationships naturally.

---

## PART 6 — Live demo, part two: Smart reasoning & Strict Grounding test (about 2.5 minutes)

Now let's try two even more interesting tests.

First, let's test **reasoning over the data**:

[ACTION: type into the chat:]  
**"Na podstawie produktów, które mamy w spiżarni, co mogę dzisiaj ugotować na obiad?"**  
*(English: "Based only on what we currently have in our pantry, what can I cook for dinner?")*

[ACTION: press enter and wait for the response]

— pause —

Look at what it does. It looks at the items that have positive quantities: flour, pasta, canned tomatoes, rice, and oil. It says: *"You have pasta, passata, and oil, so you can easily make spaghetti with tomato sauce!"* It didn't suggest dishes that require milk or coffee, because it checked the amounts.

— pause —

Now, here is the most crucial test for any enterprise AI application: **Strict Grounding and safety**.

What happens if I ask a question completely unrelated to this spreadsheet?

[ACTION: type into the chat:]  
**"Kto jest prezydentem Francji?"** *(English: "Who is the president of France?")*

[ACTION: press enter]

— pause —

Look at the response:  
**"W arkuszu nie ma informacji na ten temat."** *(The sheet contains no information on this topic.)*

[ON SCREEN: highlight this answer in the chat]

This is a critical moment. Most standard AI chatbots would happily answer questions about French politics, give general cooking advice from the internet, or make up numbers. 

By designing our prompt with strict boundary enforcement, we guarantee that our assistant remains **a dedicated, reliable interface to our specific database**, and nothing else.

---

## PART 7 — A look under the hood (about 2 minutes)

Let's look inside the n8n canvas to see how simple this really is.

[ON SCREEN: switch back to the n8n canvas and double-click the "Przygotuj prompt i dane" node]

Here you can see the JavaScript code. It does three things:
1. It takes the array of rows from Google Sheets.
2. It grabs the user's message from the Chat Trigger.
3. It combines them into a prompt with our strict grounding rules and sets the model temperature to 0.1 for high precision and zero randomness.

[ACTION: close the code node and click on the "Gemini AI" node]

Here, n8n sends this JSON payload straight to Google Gemini's REST API using standard credentials. 

And notice: **the entire orchestration runs locally on my machine**. n8n handles the state, the authentication, and the pipeline. If I want to change the spreadsheet, I only change one ID.

---

## PART 8 — Real-world & business applications (about 1 minute)

We used a kitchen pantry as an intuitive example today, but consider the business implications of this exact same architecture:

- **Warehouse & Inventory:** A warehouse manager can ask WhatsApp: *"How many pallets of item X do we have in Zone B?"*
- **Sales & CRM:** A sales rep on the road can ask Telegram: *"What was the last contact date for client ABC?"*
- **HR & Operations:** An employee can ask: *"Who is on call this weekend?"*

You don't need to build expensive custom apps or portals. You take an existing spreadsheet or database, connect n8n, plug in an LLM with strict grounding, attach a messaging channel like WhatsApp or Slack, and you have an enterprise-grade interactive data assistant in an afternoon.

---

## PART 9 — Closing & Q&A (about 30 seconds)

To sum up:
We built an intelligent, chat-driven assistant that connects directly to Google Sheets and uses Google Gemini for reasoning. 
It understands natural language, respects strict data boundaries, and can be connected to internal web chats, Telegram, or WhatsApp for mobile access.

Thank you very much for your time. I would be happy to answer any questions!

[ACTION: open the floor for questions]

---

## 🗒️ Quick timing guide

| Part | Topic | Time |
|------|-------|------|
| 1 | Opening | 1:00 |
| 2 | What is n8n | 2:00 |
| 3 | The problem & the idea | 1:00 |
| 4 | The big picture & Trigger (Demo vs Telegram/WhatsApp) | 2:00 |
| 5 | Live demo: Shopping list & natural language | 2:30 |
| 6 | Live demo: Reasoning & Strict Grounding test | 2:30 |
| 7 | Under the hood & prompt structure | 2:00 |
| 8 | Business & practical applications | 1:00 |
| 9 | Closing + Q&A | 0:30 |
| **Total** | | **~15:00** |

---

## 💡 Backup plan (if the live demo fails)

If the internet or API connection hiccups during the presentation:
1. **Stay calm and say:** *"Let's look at the result from an execution I ran just before this session."*
2. In n8n, click on the **Executions** history tab on the left to show the saved inputs, the exact Gemini response, and output data.
3. Open the Google Sheet and explain how the columns map to the prompt in the code node.
4. If needed, run `node test-logika.js` in the terminal to demonstrate the prompt generation offline!

> **Tip:** Perform one test run in the chat 5 minutes before your talk so that the n8n Executions log has a fresh, successful execution ready to display.
