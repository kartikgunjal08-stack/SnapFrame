import { MockupContentData, SampleId } from "../types/studio";

export const DEFAULT_MOCKUP_DATA: MockupContentData = {
  saas: {
    brandName: "MetricPulse",
    headerTitle: "Executive Revenue Summary",
    headerSubtitle: "Real-time net MRR & expansion metrics across 142 workspaces",
    ctaLabel: "Export Report",
    accentColor: "#2563EB",
    kpi1Label: "Monthly Recurring Revenue",
    kpi1Value: "$48,920",
    kpi1Delta: "+18.4% vs last 30 days",
    kpi2Label: "Active Paid Teams",
    kpi2Value: "1,284",
    kpi2Delta: "+94 new teams this week",
    kpi3Label: "Net Dollar Retention",
    kpi3Value: "114.2%",
    kpi3Delta: "Top decile benchmark",
    chartTitle: "Net Growth Trajectory (Last 8 Weeks)",
    chartType: "area",
    chartValues: "16, 21, 25, 23, 32, 39, 43, 49",
    row1Name: "Northwind Logistics",
    row1Plan: "Annual Scale Plan",
    row1Amount: "+$2,400",
    row2Name: "Verve Studio Berlin",
    row2Plan: "Team Pro (12 seats)",
    row2Amount: "+$588",
  },
  mobile: {
    subtitle: "Total Portfolio Balance",
    balance: "$24,815.40",
    delta: "+$1,420.10 (+6.07%) this month",
    primaryBtn: "Transfer",
    secondaryBtn: "Deposit",
    accentColor: "#2563EB",
    chartTitle: "Treasury Yield · 4.85% APY",
    chartValues: "18, 22, 29, 27, 36, 44",
    activity1Title: "Stripe Payout",
    activity1Sub: "Today · 09:42 AM",
    activity1Amount: "+$2,450",
    activity2Title: "Vercel Pro Hosting",
    activity2Sub: "Yesterday · Auto-pay",
    activity2Amount: "-$20.00",
    activity3Title: "Figma Organization",
    activity3Sub: "Nov 12 · Card 4821",
    activity3Amount: "-$45.00",
  },
  code: {
    codeText: `export async function generateMockup(canvas: HTMLElement) {
  const blob = await renderHighDpiPng(canvas, {
    pixelRatio: 3,
    preservePerspective: true,
    shadowDepth: 'dramatic',
  });

  return downloadAsset(blob, 'launch-card-3x.png');
}`,
    statusText: "PASS  Exported 3600×2250px lossless PNG in 142ms (0 server calls)",
  },
  ecommerce: {
    brandName: "ATELIER NORD",
    badgeText: "STUDIO LIGHTING · IN STOCK",
    productName: "Kanso Ceramic Lamp",
    price: "$280.00",
    shippingNote: "Free worldwide shipping",
    description:
      "Hand-thrown matte stoneware base paired with a warm diffused opal glass shade. Dimmable 2700K LED.",
    ctaLabel: "Add to Bag — $280",
    accentColor: "#1C1917",
    metric1Label: "CONVERSION RATE",
    metric1Value: "4.82% (+1.1%)",
    metric2Label: "TODAY REVENUE",
    metric2Value: "$6,440",
  },
  ai: {
    brandName: "ContextAgent",
    promptText: "Summarize why Pro upgrades jumped 24% after adding 1-click exports.",
    analysisHeader: "COPILOT ANALYSIS · 14,200 SESSIONS SCANNED",
    finding1Title: "1. Time-to-value dropped from 4m 10s to 38 seconds",
    finding1Body:
      "Users who exported a graphic within their first minute converted at 3.4x higher rates.",
    codeLine1: "SELECT cohort_week, COUNT(*) AS exports, AVG(upgrade_rate) AS conv",
    codeLine2: "FROM studio_events WHERE action = 'export_3x_png'",
    codeLine3: "-- Result: +24.3% lift across 1,840 organic workspaces",
    ctaLabel: "Apply Recommendation",
    accentColor: "#2563EB",
  },
  social: {
    initials: "AK",
    authorName: "Aarav Kulkarni",
    handle: "@aaravbuilds · Founder, ShipFast Labs",
    headline: "Small, focused tools beat bloated platforms.",
    body: "We replaced 4 separate design subscriptions with\none clean browser mockup studio — zero logins,\ninstant 3x PNG exports, and 150+ templates.",
    statsEyebrow: "VERIFIED IMPACT · 30-DAY LAUNCH LOG",
    stat1: "14,820 exports",
    stat2: "38s avg workflow",
    stat3: "$0 server cost",
    footerMeta: "9:14 AM · Nov 14, 2026 · 1,420 Reposts · 6,890 Likes",
    accentColor: "#2563EB",
  },
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function wrapLines(text: string, maxChars: number, maxLines: number): string[] {
  const explicit = text.split(/\r?\n/);
  const lines: string[] = [];
  for (const para of explicit) {
    if (!para.trim()) {
      lines.push("");
      continue;
    }
    const words = para.split(/\s+/);
    let current = "";
    for (const w of words) {
      if ((current + " " + w).trim().length <= maxChars) {
        current = (current + " " + w).trim();
      } else {
        if (current) lines.push(current);
        current = w;
      }
      if (lines.length >= maxLines) break;
    }
    if (current && lines.length < maxLines) {
      lines.push(current);
    }
    if (lines.length >= maxLines) break;
  }
  return lines.slice(0, maxLines);
}

function parseChartValues(raw: string, fallback: number[]): number[] {
  const nums = raw
    .split(/[,\s]+/)
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n));
  if (nums.length < 2) return fallback;
  return nums.slice(0, 16);
}

function sanitizeHex(hex: string, fallback = "#2563EB"): string {
  return /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : fallback;
}

function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function buildSaasSvg(d: MockupContentData["saas"]): string {
  const accent = sanitizeHex(d.accentColor);
  const series = parseChartValues(d.chartValues, [16, 21, 25, 23, 32, 39, 43, 49]);
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = Math.max(1, max - min);

  const chartLeft = 304;
  const chartRight = 1122;
  const chartTop = 336;
  const chartBottom = 516;
  const chartW = chartRight - chartLeft;
  const chartH = chartBottom - chartTop;

  const points = series.map((val, idx) => {
    const x =
      series.length === 1 ? chartLeft + chartW / 2 : chartLeft + (idx / (series.length - 1)) * chartW;
    const norm = (val - min) / span;
    const y = chartBottom - 16 - norm * (chartH - 36);
    return { x: Math.round(x), y: Math.round(y), val };
  });

  let chartMarkup = "";
  if (d.chartType === "bar") {
    const slotW = chartW / series.length;
    const barW = Math.min(54, Math.max(16, Math.floor(slotW * 0.56)));
    chartMarkup = points
      .map((pt, idx) => {
        const bx = Math.round(chartLeft + idx * slotW + (slotW - barW) / 2);
        const bh = Math.max(18, chartBottom - pt.y);
        const by = chartBottom - bh;
        const isLast = idx === points.length - 1;
        return `<rect x="${bx}" y="${by}" width="${barW}" height="${bh}" rx="6" fill="${accent}" fill-opacity="${
          isLast ? "1" : "0.62"
        }"/><text x="${bx + Math.round(barW / 2)}" y="${
          by - 8
        }" text-anchor="middle" fill="#94A3B8" font-family="sans-serif" font-size="11">${escapeXml(
          String(pt.val)
        )}</text>`;
      })
      .join("");
  } else {
    let linePath = `M${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cx = Math.round((prev.x + curr.x) / 2);
      linePath += ` C${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    const areaPath = `${linePath} L${points[points.length - 1].x} ${chartBottom} L${points[0].x} ${chartBottom} Z`;
    const lastPt = points[points.length - 1];
    const dots = points
      .map(
        (pt, idx) =>
          `<circle cx="${pt.x}" cy="${pt.y}" r="${idx === points.length - 1 ? 6 : 3.5}" fill="${
            idx === points.length - 1 ? "#FFFFFF" : accent
          }" stroke="${accent}" stroke-width="${idx === points.length - 1 ? 3 : 1.5}"/>`
      )
      .join("");
    chartMarkup = `<path d="${areaPath}" fill="url(#areaGrad)"/>
      <path d="${linePath}" stroke="${accent}" stroke-width="3.2" fill="none" stroke-linecap="round"/>
      ${dots}
      <text x="${lastPt.x}" y="${Math.max(chartTop - 4, lastPt.y - 12)}" text-anchor="middle" fill="#E2E8F0" font-family="sans-serif" font-size="12" font-weight="600">${escapeXml(
        String(lastPt.val)
      )}</text>`;
  }

  return svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760" viewBox="0 0 1200 760" fill="none">
  <rect width="1200" height="760" fill="#0B0E14"/>
  <rect x="0" y="0" width="230" height="760" fill="#0F131B"/>
  <line x1="230" y1="0" x2="230" y2="760" stroke="#1E2532" stroke-width="1"/>
  <rect x="28" y="34" width="28" height="28" rx="7" fill="${accent}"/>
  <path d="M36 48L42 54L50 42" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="68" y="54" fill="#F8FAFC" font-family="sans-serif" font-size="18" font-weight="700">${escapeXml(
    d.brandName.slice(0, 16) || "MetricPulse"
  )}</text>
  <rect x="24" y="96" width="182" height="36" rx="8" fill="#182030"/>
  <text x="42" y="119" fill="#F8FAFC" font-family="sans-serif" font-size="14" font-weight="600">Overview</text>
  <text x="42" y="160" fill="#94A3B8" font-family="sans-serif" font-size="14">Revenue Cohort</text>
  <text x="42" y="198" fill="#94A3B8" font-family="sans-serif" font-size="14">Subscriptions</text>
  <text x="42" y="236" fill="#94A3B8" font-family="sans-serif" font-size="14">Churn Analysis</text>
  <text x="42" y="274" fill="#94A3B8" font-family="sans-serif" font-size="14">API Usage</text>

  <text x="272" y="56" fill="#F8FAFC" font-family="sans-serif" font-size="22" font-weight="700">${escapeXml(
    d.headerTitle
  )}</text>
  <text x="272" y="80" fill="#64748B" font-family="sans-serif" font-size="13">${escapeXml(
    d.headerSubtitle
  )}</text>
  <rect x="1010" y="36" width="146" height="36" rx="8" fill="${accent}"/>
  <text x="1083" y="59" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-size="13" font-weight="600">${escapeXml(
    d.ctaLabel.slice(0, 18)
  )}</text>

  <rect x="272" y="112" width="280" height="124" rx="12" fill="#111622" stroke="#1E2532"/>
  <text x="296" y="144" fill="#94A3B8" font-family="sans-serif" font-size="13">${escapeXml(d.kpi1Label)}</text>
  <text x="296" y="186" fill="#F8FAFC" font-family="sans-serif" font-size="34" font-weight="700">${escapeXml(d.kpi1Value)}</text>
  <text x="296" y="214" fill="#34D399" font-family="sans-serif" font-size="13" font-weight="600">${escapeXml(d.kpi1Delta)}</text>

  <rect x="574" y="112" width="280" height="124" rx="12" fill="#111622" stroke="#1E2532"/>
  <text x="598" y="144" fill="#94A3B8" font-family="sans-serif" font-size="13">${escapeXml(d.kpi2Label)}</text>
  <text x="598" y="186" fill="#F8FAFC" font-family="sans-serif" font-size="34" font-weight="700">${escapeXml(d.kpi2Value)}</text>
  <text x="598" y="214" fill="#34D399" font-family="sans-serif" font-size="13" font-weight="600">${escapeXml(d.kpi2Delta)}</text>

  <rect x="876" y="112" width="280" height="124" rx="12" fill="#111622" stroke="#1E2532"/>
  <text x="900" y="144" fill="#94A3B8" font-family="sans-serif" font-size="13">${escapeXml(d.kpi3Label)}</text>
  <text x="900" y="186" fill="#F8FAFC" font-family="sans-serif" font-size="34" font-weight="700">${escapeXml(d.kpi3Value)}</text>
  <text x="900" y="214" fill="#60A5FA" font-family="sans-serif" font-size="13" font-weight="600">${escapeXml(d.kpi3Delta)}</text>

  <rect x="272" y="260" width="884" height="296" rx="12" fill="#111622" stroke="#1E2532"/>
  <text x="298" y="296" fill="#F8FAFC" font-family="sans-serif" font-size="16" font-weight="600">${escapeXml(
    d.chartTitle
  )}</text>
  <line x1="298" y1="340" x2="1128" y2="340" stroke="#1A2130" stroke-width="1"/>
  <line x1="298" y1="400" x2="1128" y2="400" stroke="#1A2130" stroke-width="1"/>
  <line x1="298" y1="460" x2="1128" y2="460" stroke="#1A2130" stroke-width="1"/>
  <line x1="298" y1="520" x2="1128" y2="520" stroke="#1A2130" stroke-width="1"/>

  <defs>
    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.38"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  ${chartMarkup}

  <rect x="272" y="580" width="884" height="140" rx="12" fill="#111622" stroke="#1E2532"/>
  <text x="298" y="614" fill="#94A3B8" font-family="sans-serif" font-size="13" font-weight="600">RECENT ACTIVITY</text>
  <text x="298" y="652" fill="#F8FAFC" font-family="sans-serif" font-size="14" font-weight="600">${escapeXml(d.row1Name)}</text>
  <text x="580" y="652" fill="#94A3B8" font-family="sans-serif" font-size="14">${escapeXml(d.row1Plan)}</text>
  <text x="1128" y="652" text-anchor="end" fill="#34D399" font-family="sans-serif" font-size="14" font-weight="600">${escapeXml(d.row1Amount)}</text>
  <line x1="298" y1="670" x2="1128" y2="670" stroke="#1A2130" stroke-width="1"/>
  <text x="298" y="698" fill="#F8FAFC" font-family="sans-serif" font-size="14" font-weight="600">${escapeXml(d.row2Name)}</text>
  <text x="580" y="698" fill="#94A3B8" font-family="sans-serif" font-size="14">${escapeXml(d.row2Plan)}</text>
  <text x="1128" y="698" text-anchor="end" fill="#34D399" font-family="sans-serif" font-size="14" font-weight="600">${escapeXml(d.row2Amount)}</text>
</svg>`);
}

function buildMobileSvg(d: MockupContentData["mobile"]): string {
  const accent = sanitizeHex(d.accentColor);
  const series = parseChartValues(d.chartValues, [18, 22, 29, 27, 36, 44]);
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = Math.max(1, max - min);

  const left = 54;
  const right = 384;
  const top = 304;
  const bottom = 398;
  const pts = series.map((v, i) => {
    const x = series.length === 1 ? (left + right) / 2 : left + (i / (series.length - 1)) * (right - left);
    const y = bottom - ((v - min) / span) * (bottom - top);
    return { x: Math.round(x), y: Math.round(y) };
  });
  let path = `M${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const cx = Math.round((pts[i - 1].x + pts[i].x) / 2);
    path += ` C${cx} ${pts[i - 1].y}, ${cx} ${pts[i].y}, ${pts[i].x} ${pts[i].y}`;
  }
  const last = pts[pts.length - 1];

  const badge1 = (d.activity1Title.trim()[0] || "A").toUpperCase();
  const badge2 = (d.activity2Title.trim()[0] || "B").toUpperCase();
  const badge3 = (d.activity3Title.trim()[0] || "C").toUpperCase();

  return svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="440" height="920" viewBox="0 0 440 920" fill="none">
  <rect width="440" height="920" fill="#090B10"/>
  <text x="32" y="72" fill="#94A3B8" font-family="sans-serif" font-size="14">${escapeXml(d.subtitle)}</text>
  <text x="32" y="114" fill="#FFFFFF" font-family="sans-serif" font-size="40" font-weight="700">${escapeXml(d.balance)}</text>
  <text x="32" y="144" fill="#34D399" font-family="sans-serif" font-size="14" font-weight="600">${escapeXml(d.delta)}</text>

  <rect x="32" y="176" width="180" height="46" rx="12" fill="${accent}"/>
  <text x="122" y="205" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-size="15" font-weight="600">${escapeXml(d.primaryBtn)}</text>
  <rect x="228" y="176" width="180" height="46" rx="12" fill="#161B26" stroke="#232B3A"/>
  <text x="318" y="205" text-anchor="middle" fill="#E2E8F0" font-family="sans-serif" font-size="15" font-weight="600">${escapeXml(d.secondaryBtn)}</text>

  <rect x="32" y="250" width="376" height="190" rx="18" fill="#121722" stroke="#1F2736"/>
  <text x="54" y="284" fill="#94A3B8" font-family="sans-serif" font-size="13">${escapeXml(d.chartTitle)}</text>
  <path d="${path}" stroke="#38BDF8" stroke-width="3" fill="none" stroke-linecap="round"/>
  <circle cx="${last.x}" cy="${last.y}" r="5" fill="#38BDF8"/>
  <text x="54" y="422" fill="#64748B" font-family="sans-serif" font-size="12">Live updated · ${series.length} data points</text>

  <text x="32" y="482" fill="#F8FAFC" font-family="sans-serif" font-size="17" font-weight="700">Recent Activity</text>

  <rect x="32" y="502" width="376" height="74" rx="14" fill="#11151F" stroke="#1B2230"/>
  <rect x="48" y="519" width="40" height="40" rx="10" fill="#1E293B"/>
  <text x="68" y="544" text-anchor="middle" fill="#60A5FA" font-family="sans-serif" font-size="16" font-weight="700">${escapeXml(badge1)}</text>
  <text x="104" y="535" fill="#F8FAFC" font-family="sans-serif" font-size="15" font-weight="600">${escapeXml(d.activity1Title)}</text>
  <text x="104" y="556" fill="#64748B" font-family="sans-serif" font-size="12">${escapeXml(d.activity1Sub)}</text>
  <text x="392" y="544" text-anchor="end" fill="#34D399" font-family="sans-serif" font-size="15" font-weight="700">${escapeXml(d.activity1Amount)}</text>

  <rect x="32" y="590" width="376" height="74" rx="14" fill="#11151F" stroke="#1B2230"/>
  <rect x="48" y="607" width="40" height="40" rx="10" fill="#1E293B"/>
  <text x="68" y="632" text-anchor="middle" fill="#FBBF24" font-family="sans-serif" font-size="16" font-weight="700">${escapeXml(badge2)}</text>
  <text x="104" y="623" fill="#F8FAFC" font-family="sans-serif" font-size="15" font-weight="600">${escapeXml(d.activity2Title)}</text>
  <text x="104" y="644" fill="#64748B" font-family="sans-serif" font-size="12">${escapeXml(d.activity2Sub)}</text>
  <text x="392" y="632" text-anchor="end" fill="#E2E8F0" font-family="sans-serif" font-size="15" font-weight="600">${escapeXml(d.activity2Amount)}</text>

  <rect x="32" y="678" width="376" height="74" rx="14" fill="#11151F" stroke="#1B2230"/>
  <rect x="48" y="695" width="40" height="40" rx="10" fill="#1E293B"/>
  <text x="68" y="720" text-anchor="middle" fill="#34D399" font-family="sans-serif" font-size="16" font-weight="700">${escapeXml(badge3)}</text>
  <text x="104" y="711" fill="#F8FAFC" font-family="sans-serif" font-size="15" font-weight="600">${escapeXml(d.activity3Title)}</text>
  <text x="104" y="732" fill="#64748B" font-family="sans-serif" font-size="12">${escapeXml(d.activity3Sub)}</text>
  <text x="392" y="720" text-anchor="end" fill="#E2E8F0" font-family="sans-serif" font-size="15" font-weight="600">${escapeXml(d.activity3Amount)}</text>

  <rect x="130" y="886" width="180" height="5" rx="3" fill="#334155"/>
</svg>`);
}

function buildCodeSvg(d: MockupContentData["code"]): string {
  const rawLines = d.codeText.split(/\r?\n/).slice(0, 9);
  const linesMarkup = rawLines
    .map((line, i) => {
      const y = 76 + i * 42;
      const trimmed = line.trim();
      const color = trimmed.startsWith("//") || trimmed.startsWith("#")
        ? "#8B949E"
        : trimmed.startsWith("export") || trimmed.startsWith("import") || trimmed.startsWith("const") || trimmed.startsWith("return") || trimmed.startsWith("async") || trimmed.startsWith("function")
          ? "#79C0FF"
          : "#E6EDF3";
      return `<text x="48" y="${y}" fill="#6E7681" font-family="monospace" font-size="19">${i + 1}</text>
              <text x="96" y="${y}" fill="${color}" font-family="monospace" font-size="19" xml:space="preserve">${escapeXml(line.slice(0, 68))}</text>`;
    })
    .join("\n");

  return svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="960" height="560" viewBox="0 0 960 560" fill="none">
  <rect width="960" height="560" fill="#0D1117"/>
  ${linesMarkup}
  <rect x="48" y="468" width="864" height="48" rx="8" fill="#161B22" stroke="#30363D"/>
  <text x="72" y="498" fill="#3FB950" font-family="monospace" font-size="16">${escapeXml(d.statusText.slice(0, 74))}</text>
</svg>`);
}

function buildEcommerceSvg(d: MockupContentData["ecommerce"]): string {
  const accent = sanitizeHex(d.accentColor, "#1C1917");
  const descLines = wrapLines(d.description, 52, 2);

  return svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760" viewBox="0 0 1200 760" fill="none">
  <rect width="1200" height="760" fill="#FAFAF9"/>
  <rect x="0" y="0" width="1200" height="72" fill="#FFFFFF"/>
  <line x1="0" y1="72" x2="1200" y2="72" stroke="#E7E5E4"/>
  <text x="56" y="44" fill="#1C1917" font-family="sans-serif" font-size="20" font-weight="700">${escapeXml(d.brandName)}</text>
  <text x="450" y="43" fill="#57534E" font-family="sans-serif" font-size="14" font-weight="500">New Arrivals</text>
  <text x="580" y="43" fill="#57534E" font-family="sans-serif" font-size="14" font-weight="500">Collection</text>
  <text x="692" y="43" fill="#57534E" font-family="sans-serif" font-size="14" font-weight="500">Objects</text>
  <rect x="1030" y="20" width="114" height="34" rx="8" fill="${accent}"/>
  <text x="1087" y="42" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-size="13" font-weight="600">Cart (2)</text>

  <rect x="56" y="108" width="540" height="596" rx="18" fill="#E7E5E4"/>
  <rect x="116" y="170" width="420" height="440" rx="14" fill="#D6D3D1"/>
  <circle cx="326" cy="340" r="110" fill="#FAFAF9"/>
  <rect x="266" y="430" width="120" height="120" rx="12" fill="${accent}"/>
  <text x="88" y="670" fill="#57534E" font-family="sans-serif" font-size="13" font-weight="600">${escapeXml(d.brandName.toUpperCase())} · SIGNATURE SERIES</text>

  <text x="644" y="156" fill="#78716C" font-family="sans-serif" font-size="13" font-weight="600">${escapeXml(d.badgeText)}</text>
  <text x="644" y="206" fill="#1C1917" font-family="sans-serif" font-size="38" font-weight="700">${escapeXml(d.productName)}</text>
  <text x="644" y="252" fill="#1C1917" font-family="sans-serif" font-size="26" font-weight="600">${escapeXml(d.price)}</text>
  <text x="772" y="250" fill="#16A34A" font-family="sans-serif" font-size="14" font-weight="600">${escapeXml(d.shippingNote)}</text>

  <text x="644" y="306" fill="#57534E" font-family="sans-serif" font-size="15">${escapeXml(descLines[0] || "")}</text>
  <text x="644" y="330" fill="#57534E" font-family="sans-serif" font-size="15">${escapeXml(descLines[1] || "")}</text>

  <text x="644" y="388" fill="#1C1917" font-family="sans-serif" font-size="13" font-weight="600">FINISH</text>
  <circle cx="662" cy="422" r="16" fill="#F5F5F4" stroke="${accent}" stroke-width="2"/>
  <circle cx="706" cy="422" r="16" fill="${accent}"/>
  <circle cx="750" cy="422" r="16" fill="#A8A29E"/>

  <rect x="644" y="476" width="496" height="54" rx="10" fill="${accent}"/>
  <text x="892" y="509" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-size="15" font-weight="600">${escapeXml(d.ctaLabel)}</text>

  <rect x="644" y="556" width="240" height="92" rx="12" fill="#FFFFFF" stroke="#E7E5E4"/>
  <text x="668" y="592" fill="#78716C" font-family="sans-serif" font-size="12">${escapeXml(d.metric1Label)}</text>
  <text x="668" y="626" fill="#1C1917" font-family="sans-serif" font-size="24" font-weight="700">${escapeXml(d.metric1Value)}</text>

  <rect x="900" y="556" width="240" height="92" rx="12" fill="#FFFFFF" stroke="#E7E5E4"/>
  <text x="924" y="592" fill="#78716C" font-family="sans-serif" font-size="12">${escapeXml(d.metric2Label)}</text>
  <text x="924" y="626" fill="#1C1917" font-family="sans-serif" font-size="24" font-weight="700">${escapeXml(d.metric2Value)}</text>
</svg>`);
}

function buildAiSvg(d: MockupContentData["ai"]): string {
  const accent = sanitizeHex(d.accentColor);
  const bodyLines = wrapLines(d.finding1Body, 76, 2);

  return svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760" viewBox="0 0 1200 760" fill="none">
  <rect width="1200" height="760" fill="#090A0F"/>
  <rect x="0" y="0" width="250" height="760" fill="#0E1017"/>
  <line x1="250" y1="0" x2="250" y2="760" stroke="#1E2230"/>
  <text x="28" y="48" fill="#F8FAFC" font-family="sans-serif" font-size="17" font-weight="700">${escapeXml(d.brandName.slice(0, 18))}</text>
  <rect x="24" y="76" width="202" height="38" rx="9" fill="${accent}"/>
  <text x="125" y="100" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-size="13" font-weight="600">+ New Thread</text>
  <text x="28" y="154" fill="#64748B" font-family="sans-serif" font-size="11" font-weight="600">RECENT WORKFLOWS</text>
  <rect x="20" y="170" width="210" height="36" rx="8" fill="#161A26"/>
  <text x="34" y="193" fill="#E2E8F0" font-family="sans-serif" font-size="13">Growth Root-Cause</text>
  <text x="34" y="232" fill="#94A3B8" font-family="sans-serif" font-size="13">SQL Cohort Builder</text>
  <text x="34" y="268" fill="#94A3B8" font-family="sans-serif" font-size="13">Landing Copy Audit</text>

  <rect x="310" y="54" width="830" height="78" rx="14" fill="#121520" stroke="#22283A"/>
  <text x="336" y="88" fill="#94A3B8" font-family="sans-serif" font-size="12" font-weight="600">YOU ASKED</text>
  <text x="336" y="114" fill="#F8FAFC" font-family="sans-serif" font-size="15">${escapeXml(d.promptText.slice(0, 74))}</text>

  <rect x="310" y="158" width="830" height="432" rx="16" fill="#0F131D" stroke="#252C40"/>
  <text x="338" y="198" fill="#60A5FA" font-family="sans-serif" font-size="13" font-weight="700">${escapeXml(d.analysisHeader)}</text>
  <text x="338" y="240" fill="#E2E8F0" font-family="sans-serif" font-size="16" font-weight="600">${escapeXml(d.finding1Title.slice(0, 68))}</text>
  <text x="338" y="268" fill="#94A3B8" font-family="sans-serif" font-size="14">${escapeXml(bodyLines[0] || "")}</text>
  <text x="338" y="288" fill="#94A3B8" font-family="sans-serif" font-size="14">${escapeXml(bodyLines[1] || "")}</text>

  <rect x="338" y="310" width="774" height="148" rx="12" fill="#090C12" stroke="#1E2536"/>
  <text x="362" y="346" fill="#79C0FF" font-family="monospace" font-size="14">${escapeXml(d.codeLine1.slice(0, 72))}</text>
  <text x="362" y="376" fill="#E2E8F0" font-family="monospace" font-size="14">${escapeXml(d.codeLine2.slice(0, 72))}</text>
  <text x="362" y="406" fill="#34D399" font-family="monospace" font-size="14">${escapeXml(d.codeLine3.slice(0, 72))}</text>
  <text x="362" y="436" fill="#94A3B8" font-family="monospace" font-size="13">Executed in 42ms · Verified locally</text>

  <text x="338" y="496" fill="#E2E8F0" font-family="sans-serif" font-size="16" font-weight="600">Recommended Next Action</text>
  <rect x="338" y="526" width="214" height="34" rx="8" fill="#182235" stroke="${accent}"/>
  <text x="445" y="548" text-anchor="middle" fill="#93C5FD" font-family="sans-serif" font-size="12" font-weight="600">${escapeXml(d.ctaLabel.slice(0, 24))}</text>

  <rect x="310" y="618" width="830" height="72" rx="14" fill="#121520" stroke="#283046"/>
  <text x="338" y="660" fill="#64748B" font-family="sans-serif" font-size="15">Ask a follow-up question or attach a CSV / SQL table...</text>
  <rect x="1032" y="634" width="90" height="40" rx="9" fill="${accent}"/>
  <text x="1077" y="659" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-size="13" font-weight="600">Send</text>
</svg>`);
}

function buildSocialSvg(d: MockupContentData["social"]): string {
  const accent = sanitizeHex(d.accentColor);
  const bodyLines = wrapLines(d.body, 50, 3);

  return svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="960" height="600" viewBox="0 0 960 600" fill="none">
  <rect width="960" height="600" fill="#111216"/>
  <circle cx="108" cy="108" r="36" fill="${accent}"/>
  <text x="108" y="116" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-size="22" font-weight="700">${escapeXml(
    d.initials.slice(0, 3).toUpperCase() || "SF"
  )}</text>
  <text x="164" y="102" fill="#F8FAFC" font-family="sans-serif" font-size="22" font-weight="700">${escapeXml(d.authorName)}</text>
  <text x="164" y="130" fill="#94A3B8" font-family="sans-serif" font-size="15">${escapeXml(d.handle)}</text>

  <text x="72" y="216" fill="#F8FAFC" font-family="sans-serif" font-size="30" font-weight="600">${escapeXml(d.headline.slice(0, 48))}</text>
  <text x="72" y="264" fill="#CBD5E1" font-family="sans-serif" font-size="24">${escapeXml(bodyLines[0] || "")}</text>
  <text x="72" y="302" fill="#CBD5E1" font-family="sans-serif" font-size="24">${escapeXml(bodyLines[1] || "")}</text>
  <text x="72" y="340" fill="#CBD5E1" font-family="sans-serif" font-size="24">${escapeXml(bodyLines[2] || "")}</text>

  <rect x="72" y="392" width="816" height="106" rx="14" fill="#171920" stroke="#262936"/>
  <text x="104" y="434" fill="#94A3B8" font-family="sans-serif" font-size="13" font-weight="600">${escapeXml(d.statsEyebrow)}</text>
  <text x="104" y="472" fill="#34D399" font-family="sans-serif" font-size="22" font-weight="700">${escapeXml(d.stat1)}</text>
  <text x="360" y="472" fill="#F8FAFC" font-family="sans-serif" font-size="22" font-weight="700">${escapeXml(d.stat2)}</text>
  <text x="640" y="472" fill="#60A5FA" font-family="sans-serif" font-size="22" font-weight="700">${escapeXml(d.stat3)}</text>

  <text x="72" y="548" fill="#64748B" font-family="sans-serif" font-size="14">${escapeXml(d.footerMeta)}</text>
</svg>`);
}

export function buildSampleSvg(sampleId: SampleId, data: MockupContentData): string {
  switch (sampleId) {
    case "saas":
      return buildSaasSvg(data.saas);
    case "mobile":
      return buildMobileSvg(data.mobile);
    case "code":
      return buildCodeSvg(data.code);
    case "ecommerce":
      return buildEcommerceSvg(data.ecommerce);
    case "ai":
      return buildAiSvg(data.ai);
    case "social":
      return buildSocialSvg(data.social);
  }
}
