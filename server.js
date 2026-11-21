import express from "express";

const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("SOLVIO WhatsApp Bot is running!");
});

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

async function sendWhatsAppReply(to) {
  const url = `https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: {
          body: "Thank you for contacting SOLVIO! Your message has been received. We are setting up your personal follow-up assistant. Stay tuned!"
        }
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("WhatsApp reply failed:", result);
    } else {
      console.log("WhatsApp reply sent successfully.");
    }
  } catch (error) {
    console.error("Reply error:", error);
  }
}

app.post("/webhook", (req, res) => {
  const body = req.body;

  // Acknowledge Meta immediately
  res.sendStatus(200);

  if (body.object !== "whatsapp_business_account") return;

  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      const messages = change.value?.messages || [];

      for (const message of messages) {
        if (message.type === "text") {
          console.log("Incoming message:", message.text.body);
          console.log("From:", message.from);

          sendWhatsAppReply(message.from);
        }
      }
    }
  }
});

app.listen(PORT, () => {
  console.log(`SOLVIO server running on port ${PORT}`);
});
