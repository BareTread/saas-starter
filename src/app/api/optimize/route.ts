import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const runtime = "edge";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model  = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function POST(req: Request) {
  try {
    const { prompt, goal } = await req.json();

    if (!prompt || !goal) {
      return NextResponse.json(
        { error: "Missing prompt or goal" },
        { status: 400 }
      );
    }

    const systemPrompt = `
Return **JSON only** like:
[
  {"text":"...", "score":<0-100>},
  ...
]

• Rewrite the user prompt so it best achieves: "${goal}"
• Produce exactly 3 distinct variants.
• For each variant, estimate a Rouge-L score (0-100) vs. the goal.
`;

    const { response } = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: `${systemPrompt}\n\nUSER_PROMPT:\n${prompt}` }] }
      ],
      generationConfig: { temperature: 0.7 }
    });

    const variants = JSON.parse(response.text());
    return NextResponse.json({ variants });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
