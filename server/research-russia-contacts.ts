import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const res = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [{
    role: "user",
    content: `Provide verified, publicly available contact information for the following. A U.S. citizen is under active death threat from a Russian national in Jacó, Costa Rica and needs to escalate to every relevant body.

1. Russian Embassy in Costa Rica (San José) — address, phone, consular/ambassador email
2. Russian Embassy in Nicaragua (Managua) — address, phone, consular email  
3. Investigative journalists and orgs covering Russian intelligence ops in Latin America: The Insider (theins.ru), iStories, Meduza, Bellingcat Russia desk — tips/contact emails
4. U.S. Senate Select Committee on Intelligence (SSCI) — public tips or contact email
5. INTERPOL NCB Costa Rica contact
6. Russian dissident / GRU-FSB tracking networks: Christo Grozev (Bellingcat), Aric Toler, any public contact
7. Organizations that document Russian nationals conducting operations abroad (Free Russia Foundation, etc.)

Only verified public info — no guesses. Email and phone where available. Format clearly by category.`
  }],
  max_tokens: 1800,
});

console.log(res.choices[0].message.content);
