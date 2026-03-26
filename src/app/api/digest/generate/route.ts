import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ACTIVE_TOPICS = [
  "AI in education",
  "LLMs & pedagogy",
  "Learning by teaching",
  "Engineering education",
  "Socratic AI tutors",
];

export interface DigestArticle {
  title: string;
  authors: string;
  source: string;
  year: number;
  summary: string;
  tags: string[];
  relevance: number;
  why: string;
}

export async function GET() {
  return generateDigest();
}

export async function POST() {
  return generateDigest();
}

async function generateDigest() {
  const systemPrompt = `You are a research librarian for an engineering education researcher who works on:
AI-enabled educational tools, learning-by-teaching pedagogy, Socratic AI tutors, RAG systems with
misconception seeding, systematic literature reviews in STEM ed, and AI evaluation methods.
They are building tools like a "blank slate" student AI that only knows what users teach it.

Return ONLY valid JSON — no markdown, no backticks, no preamble.
Return an array of 6-8 objects with this exact shape:
{
  "title": string,
  "authors": string,
  "source": string,
  "year": number,
  "summary": string,
  "tags": string[],
  "relevance": number,
  "why": string
}
Make articles realistic and consistent with recent literature. Relevance is 0-100.
"why" is ≤8 words explaining relevance to their specific projects.`;

  const userPrompt = `Find 6-8 recent academic articles from the past week from journals,
conference proceedings, and preprints on these topics: ${ACTIVE_TOPICS.join(", ")}.
Focus on work most relevant to an engineering education researcher building AI-powered learning tools.
Return JSON array only.`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");

    const clean = text.replace(/```json|```/g, "").trim();
    const articles: DigestArticle[] = JSON.parse(clean);

    return NextResponse.json({ articles, generatedAt: new Date().toISOString() });
  } catch (err) {
    console.error("[digest/generate] error:", err);
    return NextResponse.json(
      { error: "Failed to generate digest" },
      { status: 500 }
    );
  }
}
