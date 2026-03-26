import { NextResponse } from "next/server";
import { Resend } from "resend";
import { renderDigestEmail } from "@/emails/digest-template";
import type { DigestArticle } from "@/app/api/digest/generate/route";

export const runtime = "nodejs";
export const maxDuration = 120;

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: Request) {
  // Verify the request is from Vercel Cron (in production)
  const authHeader = request.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const toEmail = process.env.DIGEST_TO_EMAIL;
  if (!toEmail) {
    return NextResponse.json(
      { error: "DIGEST_TO_EMAIL not configured" },
      { status: 500 }
    );
  }

  try {
    // 1. Generate the digest
    console.log("[cron/digest] Generating digest...");
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000";

    const digestRes = await fetch(`${baseUrl}/api/digest/generate`);
    if (!digestRes.ok) {
      throw new Error(`Digest generation failed: ${digestRes.status}`);
    }

    const { articles } = (await digestRes.json()) as {
      articles: DigestArticle[];
      generatedAt: string;
    };

    if (!articles?.length) {
      throw new Error("No articles returned from digest generator");
    }

    // 2. Build email
    const dateStr = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "America/New_York",
    });

    const html = renderDigestEmail(articles, dateStr);

    // 3. Send via Resend
    console.log(`[cron/digest] Sending to ${toEmail}...`);
    const { data, error } = await resend.emails.send({
      from: "Research Digest <digest@yourdomain.com>", // update with your verified Resend domain
      to: [toEmail],
      subject: `Research Digest — ${dateStr}`,
      html,
    });

    if (error) {
      throw new Error(`Resend error: ${JSON.stringify(error)}`);
    }

    console.log(`[cron/digest] Sent successfully. ID: ${data?.id}`);
    return NextResponse.json({
      success: true,
      emailId: data?.id,
      articleCount: articles.length,
      sentTo: toEmail,
      sentAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[cron/digest] Failed:", err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
