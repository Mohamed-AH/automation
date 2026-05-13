import markdown
from weasyprint import HTML, CSS
from pathlib import Path

md_path = Path(__file__).parent / "submission.md"
pdf_path = Path(__file__).parent / "submission.pdf"

md_text = md_path.read_text(encoding="utf-8")
body_html = markdown.markdown(md_text, extensions=["tables", "fenced_code"])

html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

  :root {{
    --accent:   #1a1a2e;
    --accent2:  #16213e;
    --highlight:#e94560;
    --light-bg: #f8f9fc;
    --border:   #e2e6f0;
    --text:     #1c1c2e;
    --muted:    #6b7280;
  }}

  * {{ box-sizing: border-box; margin: 0; padding: 0; }}

  @page {{
    size: A4;
    margin: 18mm 18mm 22mm 18mm;
    @bottom-center {{
      content: counter(page);
      font-family: 'Inter', sans-serif;
      font-size: 9pt;
      color: #9ca3af;
    }}
  }}

  body {{
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 10.5pt;
    line-height: 1.7;
    color: var(--text);
    background: #fff;
  }}

  /* ── Cover header ── */
  .cover {{
    background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 60%, #0f3460 100%);
    color: #fff;
    padding: 36pt 36pt 28pt 36pt;
    margin: -18mm -18mm 28pt -18mm;
    border-bottom: 4pt solid var(--highlight);
  }}
  .cover-tag {{
    font-size: 7.5pt;
    font-weight: 600;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    color: rgba(255,255,255,0.55);
    margin-bottom: 10pt;
  }}
  .cover-title {{
    font-size: 24pt;
    font-weight: 700;
    line-height: 1.2;
    margin-bottom: 8pt;
  }}
  .cover-sub {{
    font-size: 11pt;
    color: rgba(255,255,255,0.75);
    font-weight: 300;
  }}
  .cover-dot {{
    display: inline-block;
    width: 6pt;
    height: 6pt;
    background: var(--highlight);
    border-radius: 50%;
    margin: 0 6pt;
    vertical-align: middle;
  }}

  /* ── Section headings ── */
  h1 {{
    font-size: 20pt;
    font-weight: 700;
    color: var(--accent);
    margin: 24pt 0 6pt 0;
    padding-bottom: 6pt;
    border-bottom: 2.5pt solid var(--highlight);
    page-break-after: avoid;
  }}

  h2 {{
    font-size: 14pt;
    font-weight: 600;
    color: var(--accent2);
    margin: 20pt 0 6pt 0;
    page-break-after: avoid;
  }}

  h3 {{
    font-size: 11.5pt;
    font-weight: 600;
    color: var(--highlight);
    margin: 14pt 0 4pt 0;
    page-break-after: avoid;
  }}

  h4 {{
    font-size: 10.5pt;
    font-weight: 600;
    color: var(--text);
    margin: 12pt 0 4pt 0;
    page-break-after: avoid;
  }}

  /* ── Body text ── */
  p {{
    margin: 0 0 9pt 0;
    orphans: 3;
    widows: 3;
  }}

  strong {{ font-weight: 600; color: var(--accent); }}
  em {{ font-style: italic; color: var(--muted); }}

  /* ── Links ── */
  a {{
    color: var(--highlight);
    text-decoration: none;
    border-bottom: 0.5pt solid rgba(233,69,96,0.3);
  }}

  /* ── Lists ── */
  ul, ol {{
    margin: 0 0 9pt 0;
    padding-left: 18pt;
  }}
  li {{
    margin-bottom: 4pt;
    line-height: 1.6;
  }}
  li > ul, li > ol {{
    margin-top: 3pt;
    margin-bottom: 3pt;
  }}

  /* ── Code ── */
  code {{
    font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
    font-size: 8.5pt;
    background: var(--light-bg);
    border: 0.5pt solid var(--border);
    border-radius: 3pt;
    padding: 1pt 4pt;
    color: #d6336c;
  }}

  pre {{
    background: var(--accent);
    border-left: 3.5pt solid var(--highlight);
    border-radius: 5pt;
    padding: 12pt 14pt;
    margin: 10pt 0 14pt 0;
    overflow-x: auto;
    page-break-inside: avoid;
  }}
  pre code {{
    font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
    font-size: 8pt;
    line-height: 1.55;
    background: none;
    border: none;
    padding: 0;
    color: #a8d8ea;
    white-space: pre;
  }}

  /* ── Horizontal rule ── */
  hr {{
    border: none;
    border-top: 1pt solid var(--border);
    margin: 20pt 0;
  }}

  /* ── Blockquote ── */
  blockquote {{
    border-left: 3pt solid var(--highlight);
    background: var(--light-bg);
    margin: 10pt 0;
    padding: 10pt 14pt;
    border-radius: 0 4pt 4pt 0;
    font-style: italic;
    color: var(--muted);
    page-break-inside: avoid;
  }}

  /* ── Tables ── */
  table {{
    width: 100%;
    border-collapse: collapse;
    margin: 10pt 0 14pt 0;
    font-size: 9.5pt;
    page-break-inside: avoid;
  }}
  thead tr {{
    background: var(--accent);
    color: #fff;
  }}
  th {{
    padding: 7pt 10pt;
    font-weight: 600;
    text-align: left;
    font-size: 9pt;
    letter-spacing: 0.3px;
  }}
  td {{
    padding: 6pt 10pt;
    border-bottom: 0.5pt solid var(--border);
    vertical-align: top;
  }}
  tbody tr:nth-child(even) {{ background: var(--light-bg); }}
  tbody tr:hover {{ background: #eef2ff; }}

  /* ── Metric callout cards ── */
  .metrics {{
    display: flex;
    flex-wrap: wrap;
    gap: 10pt;
    margin: 12pt 0 16pt 0;
  }}
  .metric-card {{
    background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%);
    color: #fff;
    border-radius: 6pt;
    padding: 12pt 16pt;
    min-width: 100pt;
    flex: 1;
    page-break-inside: avoid;
  }}
  .metric-value {{
    font-size: 18pt;
    font-weight: 700;
    color: #fff;
    line-height: 1.1;
  }}
  .metric-label {{
    font-size: 7.5pt;
    font-weight: 500;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: rgba(255,255,255,0.6);
    margin-top: 3pt;
  }}

  /* ── Pill badges ── */
  .badge {{
    display: inline-block;
    background: rgba(233,69,96,0.12);
    color: var(--highlight);
    border: 0.5pt solid rgba(233,69,96,0.3);
    border-radius: 20pt;
    padding: 1pt 7pt;
    font-size: 8pt;
    font-weight: 600;
    letter-spacing: 0.3px;
  }}

  /* ── Section divider ── */
  .part-header {{
    background: var(--light-bg);
    border-left: 4pt solid var(--highlight);
    padding: 8pt 14pt;
    margin: 24pt 0 10pt 0;
    border-radius: 0 4pt 4pt 0;
    page-break-after: avoid;
  }}
  .part-header p {{
    font-size: 8pt;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--highlight);
    margin: 0;
  }}

  /* remove the h1 rendered from markdown since we have a cover */
  .content > h1:first-child {{ display: none; }}
</style>
</head>
<body>

<!-- ─── Cover ─── -->
<div class="cover">
  <div class="cover-tag">Single Grain &nbsp;·&nbsp; Open Challenge</div>
  <div class="cover-title">General 000<br>Automation Engineer</div>
  <div class="cover-sub">JDE Work Order Automation &nbsp;<span class="cover-dot"></span>&nbsp; Mohamed AH</div>
</div>

<!-- ─── Metrics banner ─── -->
<div class="metrics">
  <div class="metric-card">
    <div class="metric-value">4,448</div>
    <div class="metric-label">PDFs Uploaded</div>
  </div>
  <div class="metric-card">
    <div class="metric-value">100%</div>
    <div class="metric-label">Success Rate</div>
  </div>
  <div class="metric-card">
    <div class="metric-value">14 mo</div>
    <div class="metric-label">Production Run</div>
  </div>
  <div class="metric-card">
    <div class="metric-value">6</div>
    <div class="metric-label">Automated Stages</div>
  </div>
</div>

<!-- ─── Markdown body ─── -->
<div class="content">
{body_html}
</div>

</body>
</html>"""

HTML(string=html, base_url=str(Path(__file__).parent)).write_pdf(
    str(pdf_path),
    stylesheets=[],
    uncompressed_pdf=False,
)
print(f"PDF written to: {pdf_path}")
