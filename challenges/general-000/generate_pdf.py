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
    margin: 12mm 14mm 16mm 14mm;
    @bottom-center {{
      content: counter(page);
      font-family: sans-serif;
      font-size: 8pt;
      color: #9ca3af;
    }}
  }}

  body {{
    font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif;
    font-size: 9.5pt;
    line-height: 1.52;
    color: var(--text);
    background: #fff;
  }}

  /* ── Cover header ── */
  .cover {{
    background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 60%, #0f3460 100%);
    color: #fff;
    padding: 18pt 22pt 14pt 22pt;
    margin: -12mm -14mm 14pt -14mm;
    border-bottom: 3pt solid var(--highlight);
  }}
  .cover-top {{
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }}
  .cover-tag {{
    font-size: 7pt;
    font-weight: 600;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: rgba(255,255,255,0.5);
    margin-bottom: 6pt;
  }}
  .cover-title {{
    font-size: 20pt;
    font-weight: 700;
    line-height: 1.15;
    margin-bottom: 5pt;
  }}
  .cover-sub {{
    font-size: 9.5pt;
    color: rgba(255,255,255,0.7);
    font-weight: 300;
  }}
  .cover-link {{
    margin-top: 8pt;
  }}
  .cover-link a {{
    color: rgba(255,255,255,0.8);
    font-size: 8pt;
    font-weight: 500;
    border-bottom: 0.5pt solid rgba(255,255,255,0.3);
    text-decoration: none;
    letter-spacing: 0.3px;
  }}
  .cover-dot {{
    display: inline-block;
    width: 5pt;
    height: 5pt;
    background: var(--highlight);
    border-radius: 50%;
    margin: 0 5pt;
    vertical-align: middle;
  }}

  /* ── Metrics row ── */
  .metrics {{
    display: flex;
    gap: 7pt;
    margin: 10pt 0 12pt 0;
  }}
  .metric-card {{
    background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%);
    color: #fff;
    border-radius: 5pt;
    padding: 8pt 10pt;
    flex: 1;
    page-break-inside: avoid;
  }}
  .metric-value {{
    font-size: 15pt;
    font-weight: 700;
    line-height: 1.1;
  }}
  .metric-label {{
    font-size: 6.5pt;
    font-weight: 500;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    color: rgba(255,255,255,0.55);
    margin-top: 2pt;
  }}

  /* ── Headings ── */
  h1 {{
    font-size: 15pt;
    font-weight: 700;
    color: var(--accent);
    margin: 14pt 0 4pt 0;
    padding-bottom: 4pt;
    border-bottom: 2pt solid var(--highlight);
    page-break-after: avoid;
  }}
  h2 {{
    font-size: 11pt;
    font-weight: 700;
    color: var(--accent2);
    margin: 10pt 0 3pt 0;
    page-break-after: avoid;
  }}
  h3 {{
    font-size: 9.5pt;
    font-weight: 700;
    color: var(--highlight);
    margin: 8pt 0 2pt 0;
    page-break-after: avoid;
  }}
  h4 {{
    font-size: 9pt;
    font-weight: 600;
    color: var(--text);
    margin: 7pt 0 2pt 0;
    page-break-after: avoid;
  }}

  /* ── Body ── */
  p {{ margin: 0 0 5pt 0; orphans: 3; widows: 3; }}
  strong {{ font-weight: 600; color: var(--accent); }}
  em {{ font-style: italic; color: var(--muted); }}

  a {{
    color: var(--highlight);
    text-decoration: none;
    border-bottom: 0.5pt solid rgba(233,69,96,0.3);
  }}

  ul, ol {{ margin: 0 0 5pt 0; padding-left: 14pt; }}
  li {{ margin-bottom: 2pt; line-height: 1.45; }}
  li > ul, li > ol {{ margin-top: 2pt; margin-bottom: 2pt; }}

  /* ── Code ── */
  code {{
    font-family: 'Courier New', monospace;
    font-size: 7.5pt;
    background: var(--light-bg);
    border: 0.5pt solid var(--border);
    border-radius: 2pt;
    padding: 0.5pt 3pt;
    color: #d6336c;
  }}
  pre {{
    background: var(--accent);
    border-left: 3pt solid var(--highlight);
    border-radius: 4pt;
    padding: 7pt 10pt;
    margin: 5pt 0 8pt 0;
    page-break-inside: avoid;
  }}
  pre code {{
    font-family: 'Courier New', monospace;
    font-size: 7.5pt;
    line-height: 1.45;
    background: none;
    border: none;
    padding: 0;
    color: #a8d8ea;
    white-space: pre;
  }}

  hr {{
    border: none;
    border-top: 0.5pt solid var(--border);
    margin: 8pt 0;
  }}

  /* ── Tables ── */
  table {{
    width: 100%;
    border-collapse: collapse;
    margin: 5pt 0 8pt 0;
    font-size: 8pt;
    page-break-inside: avoid;
  }}
  thead tr {{ background: var(--accent); color: #fff; }}
  th {{
    padding: 5pt 8pt;
    font-weight: 600;
    text-align: left;
    font-size: 7.5pt;
    letter-spacing: 0.2px;
  }}
  td {{
    padding: 4pt 8pt;
    border-bottom: 0.5pt solid var(--border);
    vertical-align: top;
  }}
  tbody tr:nth-child(even) {{ background: var(--light-bg); }}

  /* hide the h1 from markdown — we render it in the cover */
  .content > h1:first-child {{ display: none; }}
</style>
</head>
<body>

<!-- Cover -->
<div class="cover">
  <div class="cover-tag">Single Grain &nbsp;·&nbsp; Open Challenge &nbsp;·&nbsp; General 000</div>
  <div class="cover-title">Automation Engineer</div>
  <div class="cover-sub">JDE Work Order Automation &nbsp;<span class="cover-dot"></span>&nbsp; Mohamed AH</div>
  <div class="cover-link">
    <a href="https://github.com/Mohamed-AH/automation">github.com/Mohamed-AH/automation</a>
  </div>
</div>

<!-- Metrics -->
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

<!-- Body -->
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

import pypdf
pages = len(pypdf.PdfReader(str(pdf_path)).pages)
print(f"PDF written to: {pdf_path}  ({pages} pages)")
