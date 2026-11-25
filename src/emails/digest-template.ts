import type { DigestArticle } from "@/app/api/digest/generate/route";

function sourceColor(source: string): string {
  const s = source.toLowerCase();
  if (s.includes("arxiv") || s.includes("preprint") || s.includes("ssrn"))
    return "#633806";
  if (
    s.includes("conference") ||
    s.includes("proceedings") ||
    s.includes("asee") ||
    s.includes("fie")
  )
    return "#3C3489";
  return "#085041";
}

function sourceBg(source: string): string {
  const s = source.toLowerCase();
  if (s.includes("arxiv") || s.includes("preprint") || s.includes("ssrn"))
    return "#FAEEDA";
  if (
    s.includes("conference") ||
    s.includes("proceedings") ||
    s.includes("asee") ||
    s.includes("fie")
  )
    return "#EEEDFE";
  return "#E1F5EE";
}

function relevanceDots(score: number): string {
  const filled = Math.min(5, Math.max(1, Math.round(score / 20)));
  return Array.from({ length: 5 }, (_, i) =>
    i < filled
      ? `<span style="color:#378ADD;font-size:10px;">●</span>`
      : `<span style="color:#DDDDDD;font-size:10px;">●</span>`
  ).join(" ");
}

export function renderDigestEmail(
  articles: DigestArticle[],
  dateStr: string
): string {
  const articleBlocks = articles
    .map(
      (a, i) => `
    <tr>
      <td style="padding: 24px 0; border-bottom: 1px solid #EEEEEE;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <span style="
                display: inline-block;
                font-size: 11px;
                font-weight: 600;
                padding: 2px 10px;
                border-radius: 4px;
                background: ${sourceBg(a.source)};
                color: ${sourceColor(a.source)};
                margin-bottom: 10px;
              ">${a.source}</span>
              <span style="margin-left: 8px; font-size: 12px; color: #999999;">${relevanceDots(a.relevance)}</span>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 4px;">
              <p style="margin: 0; font-size: 15px; font-weight: 600; color: #1F3864; line-height: 1.4;">
                ${i + 1}. ${a.title}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 10px;">
              <p style="margin: 0; font-size: 12px; color: #999999;">
                ${a.authors} · ${a.year}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 10px;">
              <p style="margin: 0; font-size: 14px; color: #444444; line-height: 1.6;">
                ${a.summary}
              </p>
            </td>
          </tr>
          <tr>
            <td>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  ${(a.tags || [])
                    .map(
                      (tag) => `
                    <td style="padding-right: 6px;">
                      <span style="
                        display: inline-block;
                        font-size: 11px;
                        padding: 2px 8px;
                        background: #F5F5F5;
                        border-radius: 999px;
                        color: #666666;
                      ">${tag}</span>
                    </td>`
                    )
                    .join("")}
                  ${
                    a.why
                      ? `<td style="padding-left: 4px;">
                      <span style="font-size: 11px; color: #185FA5; font-style: italic;">${a.why}</span>
                    </td>`
                      : ""
                  }
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Research Digest — ${dateStr}</title>
</head>
<body style="margin: 0; padding: 0; background: #F7F7F7; font-family: Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #F7F7F7; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">

          <!-- Header -->
          <tr>
            <td style="background: #1F3864; border-radius: 8px 8px 0 0; padding: 28px 32px;">
              <p style="margin: 0 0 4px; font-size: 11px; color: #8BAFD4; text-transform: uppercase; letter-spacing: 1px;">Daily research digest</p>
              <h1 style="margin: 0 0 4px; font-size: 22px; font-weight: 700; color: #FFFFFF;">${dateStr}</h1>
              <p style="margin: 0; font-size: 13px; color: #8BAFD4;">${articles.length} articles · AI & engineering education</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background: #FFFFFF; padding: 8px 32px 24px; border-radius: 0 0 8px 8px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                ${articleBlocks}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 0; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #AAAAAA;">
                Sent by NAIEve · Automated research digest · Weekdays at noon ET
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
