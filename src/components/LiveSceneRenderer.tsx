import React, { useState } from "react";
import { BarChart3, TrendingUp, Check } from "lucide-react";
import { MockupContentData, SampleId } from "../types/studio";
import { InlineEditable } from "./InlineEditable";

interface LiveSceneRendererProps {
  sampleId: SampleId;
  data: MockupContentData;
  isExporting?: boolean;
  onUpdateData: <K extends keyof MockupContentData>(
    scene: K,
    patch: Partial<MockupContentData[K]>
  ) => void;
}

function parseChartValues(raw: string, fallback: number[]): number[] {
  const nums = raw
    .split(/[,\s]+/)
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n));
  return nums.length >= 2 ? nums.slice(0, 14) : fallback;
}

function sanitizeHex(hex: string, fallback = "#2563EB"): string {
  return /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : fallback;
}

const ACCENT_OPTIONS = ["#2563EB", "#10B981", "#8B5CF6", "#F97316", "#E11D48", "#06B6D4"];

export const LiveSceneRenderer: React.FC<LiveSceneRendererProps> = ({
  sampleId,
  data,
  isExporting = false,
  onUpdateData,
}) => {
  const [chartPopoverOpen, setChartPopoverOpen] = useState(false);

  if (sampleId === "saas") {
    const d = data.saas;
    const accent = sanitizeHex(d.accentColor);
    const series = parseChartValues(d.chartValues, [16, 21, 25, 23, 32, 39, 43, 49]);
    const min = Math.min(...series);
    const max = Math.max(...series);
    const span = Math.max(1, max - min);

    const w = 520;
    const h = 110;
    const padX = 14;
    const padY = 14;
    const pts = series.map((val, idx) => {
      const x = padX + (idx / (series.length - 1)) * (w - padX * 2);
      const y = h - padY - ((val - min) / span) * (h - padY * 2);
      return { x: Math.round(x), y: Math.round(y), val };
    });

    let linePath = `M${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const cx = Math.round((pts[i - 1].x + pts[i].x) / 2);
      linePath += ` C${cx} ${pts[i - 1].y}, ${cx} ${pts[i].y}, ${pts[i].x} ${pts[i].y}`;
    }
    const areaPath = `${linePath} L${pts[pts.length - 1].x} ${h} L${pts[0].x} ${h} Z`;

    return (
      <div className="relative w-full bg-[#0B0E14] text-slate-100 flex text-left select-none">
        {/* Left Navigation Sidebar */}
        <div className="hidden sm:flex w-[124px] shrink-0 bg-[#0F131B] border-r border-[#1E2532] p-3 flex-col gap-3">
          <div className="flex items-center gap-2">
            <span
              className="w-5 h-5 rounded-md flex items-center justify-center text-white shrink-0"
              style={{ backgroundColor: accent }}
            >
              <Check className="w-3 h-3 stroke-[2.8]" />
            </span>
            <InlineEditable
              value={d.brandName}
              onChange={(v) => onUpdateData("saas", { brandName: v })}
              className="text-[11px] font-bold text-slate-50 truncate block"
            />
          </div>
          <div className="space-y-1 text-[10px] text-slate-400 pt-1">
            <div className="px-2 py-1.5 rounded bg-[#182030] text-slate-100 font-medium">
              Overview
            </div>
            <div className="px-2 py-1">Revenue Cohort</div>
            <div className="px-2 py-1">Subscriptions</div>
            <div className="px-2 py-1">Retention</div>
          </div>
        </div>

        {/* Main Dashboard Area */}
        <div className="flex-1 min-w-0 p-3.5 sm:p-4 space-y-3">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <InlineEditable
                as="div"
                value={d.headerTitle}
                onChange={(v) => onUpdateData("saas", { headerTitle: v })}
                className="text-xs sm:text-sm font-bold text-slate-50 leading-snug"
              />
              <InlineEditable
                as="div"
                value={d.headerSubtitle}
                onChange={(v) => onUpdateData("saas", { headerSubtitle: v })}
                className="text-[10px] text-slate-400 mt-0.5 truncate"
              />
            </div>
            <div
              className="shrink-0 px-2.5 py-1 rounded-md text-[10px] font-semibold text-white"
              style={{ backgroundColor: accent }}
            >
              <InlineEditable
                value={d.ctaLabel}
                onChange={(v) => onUpdateData("saas", { ctaLabel: v })}
              />
            </div>
          </div>

          {/* 3 KPI Cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-lg bg-[#111622] border border-[#1E2532] min-w-0">
              <InlineEditable
                as="div"
                value={d.kpi1Label}
                onChange={(v) => onUpdateData("saas", { kpi1Label: v })}
                className="text-[9px] text-slate-400 truncate"
              />
              <InlineEditable
                as="div"
                value={d.kpi1Value}
                onChange={(v) => onUpdateData("saas", { kpi1Value: v })}
                className="text-sm sm:text-base font-bold text-slate-50 mt-0.5 font-mono-tabular"
              />
              <InlineEditable
                as="div"
                value={d.kpi1Delta}
                onChange={(v) => onUpdateData("saas", { kpi1Delta: v })}
                className="text-[9px] font-semibold text-emerald-400 mt-0.5 truncate"
              />
            </div>

            <div className="p-2.5 rounded-lg bg-[#111622] border border-[#1E2532] min-w-0">
              <InlineEditable
                as="div"
                value={d.kpi2Label}
                onChange={(v) => onUpdateData("saas", { kpi2Label: v })}
                className="text-[9px] text-slate-400 truncate"
              />
              <InlineEditable
                as="div"
                value={d.kpi2Value}
                onChange={(v) => onUpdateData("saas", { kpi2Value: v })}
                className="text-sm sm:text-base font-bold text-slate-50 mt-0.5 font-mono-tabular"
              />
              <InlineEditable
                as="div"
                value={d.kpi2Delta}
                onChange={(v) => onUpdateData("saas", { kpi2Delta: v })}
                className="text-[9px] font-semibold text-emerald-400 mt-0.5 truncate"
              />
            </div>

            <div className="p-2.5 rounded-lg bg-[#111622] border border-[#1E2532] min-w-0">
              <InlineEditable
                as="div"
                value={d.kpi3Label}
                onChange={(v) => onUpdateData("saas", { kpi3Label: v })}
                className="text-[9px] text-slate-400 truncate"
              />
              <InlineEditable
                as="div"
                value={d.kpi3Value}
                onChange={(v) => onUpdateData("saas", { kpi3Value: v })}
                className="text-sm sm:text-base font-bold text-slate-50 mt-0.5 font-mono-tabular"
              />
              <InlineEditable
                as="div"
                value={d.kpi3Delta}
                onChange={(v) => onUpdateData("saas", { kpi3Delta: v })}
                className="text-[9px] font-semibold text-blue-400 mt-0.5 truncate"
              />
            </div>
          </div>

          {/* Interactive Chart Card */}
          <div className="relative p-3 rounded-lg bg-[#111622] border border-[#1E2532]">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <InlineEditable
                as="div"
                value={d.chartTitle}
                onChange={(v) => onUpdateData("saas", { chartTitle: v })}
                className="text-[10px] font-semibold text-slate-200"
              />
              {!isExporting && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setChartPopoverOpen((open) => !open);
                  }}
                  className="text-[9px] font-medium text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                >
                  {chartPopoverOpen ? "Close" : "Edit chart"}
                </button>
              )}
            </div>

            <div
              onClick={(e) => {
                e.stopPropagation();
                setChartPopoverOpen(true);
              }}
              title="Click to edit chart data & style"
              className="cursor-pointer rounded hover:bg-white/[0.02] transition-colors"
            >
              <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[96px] overflow-visible">
                <defs>
                  <linearGradient id="saasLiveGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accent} stopOpacity="0.38" />
                    <stop offset="100%" stopColor={accent} stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[25, 52, 80].map((gy) => (
                  <line
                    key={gy}
                    x1={0}
                    y1={gy}
                    x2={w}
                    y2={gy}
                    stroke="#1A2130"
                    strokeWidth="1"
                  />
                ))}

                {d.chartType === "bar" ? (
                  pts.map((pt, idx) => {
                    const slotW = (w - padX * 2) / pts.length;
                    const barW = Math.min(34, Math.max(10, slotW * 0.58));
                    const bx = padX + idx * slotW + (slotW - barW) / 2;
                    const bh = Math.max(10, h - pt.y);
                    const by = h - bh;
                    return (
                      <g key={idx}>
                        <rect
                          x={bx}
                          y={by}
                          width={barW}
                          height={bh}
                          rx="4"
                          fill={accent}
                          fillOpacity={idx === pts.length - 1 ? 1 : 0.62}
                        />
                        <text
                          x={bx + barW / 2}
                          y={Math.max(10, by - 4)}
                          textAnchor="middle"
                          fill="#94A3B8"
                          fontSize="9"
                        >
                          {pt.val}
                        </text>
                      </g>
                    );
                  })
                ) : (
                  <>
                    <path d={areaPath} fill="url(#saasLiveGrad)" />
                    <path
                      d={linePath}
                      stroke={accent}
                      strokeWidth="2.5"
                      fill="none"
                      strokeLinecap="round"
                    />
                    {pts.map((pt, idx) => (
                      <circle
                        key={idx}
                        cx={pt.x}
                        cy={pt.y}
                        r={idx === pts.length - 1 ? 4.5 : 2.5}
                        fill={idx === pts.length - 1 ? "#FFFFFF" : accent}
                        stroke={accent}
                        strokeWidth={idx === pts.length - 1 ? 2 : 1}
                      />
                    ))}
                  </>
                )}
              </svg>
            </div>

            {/* Inline Chart Popover */}
            {chartPopoverOpen && !isExporting && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-2 top-8 z-30 w-64 p-3 rounded-lg bg-[#14151C] border border-[#2C2D3A] shadow-2xl space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-white">Chart Data & Style</span>
                  <button
                    type="button"
                    onClick={() => setChartPopoverOpen(false)}
                    className="text-[10px] text-blue-400 hover:text-white cursor-pointer"
                  >
                    Done
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => onUpdateData("saas", { chartType: "area" })}
                    className={`flex items-center justify-center gap-1 py-1.5 rounded text-[11px] font-medium border cursor-pointer ${
                      d.chartType === "area"
                        ? "bg-blue-600/20 border-blue-500 text-white"
                        : "bg-[#1A1B24] border-[#292A36] text-zinc-400"
                    }`}
                  >
                    <TrendingUp className="w-3 h-3" />
                    Area
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateData("saas", { chartType: "bar" })}
                    className={`flex items-center justify-center gap-1 py-1.5 rounded text-[11px] font-medium border cursor-pointer ${
                      d.chartType === "bar"
                        ? "bg-blue-600/20 border-blue-500 text-white"
                        : "bg-[#1A1B24] border-[#292A36] text-zinc-400"
                    }`}
                  >
                    <BarChart3 className="w-3 h-3" />
                    Bars
                  </button>
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1">
                    Values (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={d.chartValues}
                    onChange={(e) => onUpdateData("saas", { chartValues: e.target.value })}
                    className="w-full px-2 py-1 rounded bg-[#0D0E13] border border-[#292A36] text-[11px] font-mono-tabular text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  {ACCENT_OPTIONS.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => onUpdateData("saas", { accentColor: hex })}
                      className={`w-5 h-5 rounded border cursor-pointer ${
                        accent.toLowerCase() === hex.toLowerCase()
                          ? "border-white scale-110"
                          : "border-white/20"
                      }`}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Activity Rows */}
          <div className="p-2.5 rounded-lg bg-[#111622] border border-[#1E2532] space-y-1.5 text-[10px]">
            <div className="flex items-center justify-between gap-2">
              <InlineEditable
                value={d.row1Name}
                onChange={(v) => onUpdateData("saas", { row1Name: v })}
                className="font-semibold text-slate-100"
              />
              <InlineEditable
                value={d.row1Plan}
                onChange={(v) => onUpdateData("saas", { row1Plan: v })}
                className="text-slate-400 hidden sm:inline"
              />
              <InlineEditable
                value={d.row1Amount}
                onChange={(v) => onUpdateData("saas", { row1Amount: v })}
                className="font-semibold text-emerald-400 font-mono-tabular"
              />
            </div>
            <div className="h-px bg-[#1A2130]" />
            <div className="flex items-center justify-between gap-2">
              <InlineEditable
                value={d.row2Name}
                onChange={(v) => onUpdateData("saas", { row2Name: v })}
                className="font-semibold text-slate-100"
              />
              <InlineEditable
                value={d.row2Plan}
                onChange={(v) => onUpdateData("saas", { row2Plan: v })}
                className="text-slate-400 hidden sm:inline"
              />
              <InlineEditable
                value={d.row2Amount}
                onChange={(v) => onUpdateData("saas", { row2Amount: v })}
                className="font-semibold text-emerald-400 font-mono-tabular"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (sampleId === "mobile") {
    const d = data.mobile;
    const accent = sanitizeHex(d.accentColor);
    const series = parseChartValues(d.chartValues, [18, 22, 29, 27, 36, 44]);
    const min = Math.min(...series);
    const max = Math.max(...series);
    const span = Math.max(1, max - min);
    const w = 190;
    const h = 54;
    const pts = series.map((v, i) => ({
      x: Math.round(6 + (i / (series.length - 1)) * (w - 12)),
      y: Math.round(h - 8 - ((v - min) / span) * (h - 16)),
    }));
    let path = `M${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const cx = Math.round((pts[i - 1].x + pts[i].x) / 2);
      path += ` C${cx} ${pts[i - 1].y}, ${cx} ${pts[i].y}, ${pts[i].x} ${pts[i].y}`;
    }

    return (
      <div className="relative w-full bg-[#090B10] text-slate-100 px-4 pt-10 pb-5 space-y-3 text-left select-none">
        <div>
          <InlineEditable
            as="div"
            value={d.subtitle}
            onChange={(v) => onUpdateData("mobile", { subtitle: v })}
            className="text-[10px] text-slate-400"
          />
          <InlineEditable
            as="div"
            value={d.balance}
            onChange={(v) => onUpdateData("mobile", { balance: v })}
            className="text-xl font-bold text-white font-mono-tabular mt-0.5"
          />
          <InlineEditable
            as="div"
            value={d.delta}
            onChange={(v) => onUpdateData("mobile", { delta: v })}
            className="text-[10px] font-semibold text-emerald-400 mt-0.5"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div
            className="py-1.5 px-2 rounded-lg text-center text-[11px] font-semibold text-white"
            style={{ backgroundColor: accent }}
          >
            <InlineEditable
              value={d.primaryBtn}
              onChange={(v) => onUpdateData("mobile", { primaryBtn: v })}
            />
          </div>
          <div className="py-1.5 px-2 rounded-lg text-center text-[11px] font-semibold text-slate-200 bg-[#161B26] border border-[#232B3A]">
            <InlineEditable
              value={d.secondaryBtn}
              onChange={(v) => onUpdateData("mobile", { secondaryBtn: v })}
            />
          </div>
        </div>

        {/* Sparkline */}
        <div className="relative p-2.5 rounded-xl bg-[#121722] border border-[#1F2736]">
          <InlineEditable
            as="div"
            value={d.chartTitle}
            onChange={(v) => onUpdateData("mobile", { chartTitle: v })}
            className="text-[9px] text-slate-400 mb-1"
          />
          <div
            onClick={(e) => {
              e.stopPropagation();
              setChartPopoverOpen((open) => !open);
            }}
            title="Click to edit sparkline values"
            className="cursor-pointer"
          >
            <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-12">
              <path d={path} stroke="#38BDF8" strokeWidth="2.4" fill="none" strokeLinecap="round" />
              <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="3.5" fill="#38BDF8" />
            </svg>
          </div>

          {chartPopoverOpen && !isExporting && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="mt-2 p-2 rounded-lg bg-[#0D1018] border border-[#2B3548] space-y-1.5"
            >
              <div className="flex items-center justify-between text-[10px] text-slate-300">
                <span>Chart Values</span>
                <button
                  type="button"
                  onClick={() => setChartPopoverOpen(false)}
                  className="text-blue-400 cursor-pointer"
                >
                  Done
                </button>
              </div>
              <input
                type="text"
                value={d.chartValues}
                onChange={(e) => onUpdateData("mobile", { chartValues: e.target.value })}
                className="w-full px-2 py-1 rounded bg-[#090B10] border border-[#252D3D] text-[10px] font-mono-tabular text-white focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Activity */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-bold text-slate-100">Recent Activity</div>
          {[
            {
              t: d.activity1Title,
              s: d.activity1Sub,
              a: d.activity1Amount,
              k: "1" as const,
              pos: true,
            },
            {
              t: d.activity2Title,
              s: d.activity2Sub,
              a: d.activity2Amount,
              k: "2" as const,
              pos: false,
            },
            {
              t: d.activity3Title,
              s: d.activity3Sub,
              a: d.activity3Amount,
              k: "3" as const,
              pos: false,
            },
          ].map((item) => (
            <div
              key={item.k}
              className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#11151F] border border-[#1B2230]"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-6 h-6 rounded-md bg-[#1E293B] text-[10px] font-bold text-blue-400 flex items-center justify-center shrink-0">
                  {(item.t.trim()[0] || "A").toUpperCase()}
                </span>
                <div className="min-w-0">
                  <InlineEditable
                    as="div"
                    value={item.t}
                    onChange={(v) =>
                      onUpdateData("mobile", {
                        [`activity${item.k}Title`]: v,
                      } as Partial<MockupContentData["mobile"]>)
                    }
                    className="text-[10px] font-semibold text-slate-100 truncate"
                  />
                  <InlineEditable
                    as="div"
                    value={item.s}
                    onChange={(v) =>
                      onUpdateData("mobile", {
                        [`activity${item.k}Sub`]: v,
                      } as Partial<MockupContentData["mobile"]>)
                    }
                    className="text-[8px] text-slate-500 truncate"
                  />
                </div>
              </div>
              <InlineEditable
                value={item.a}
                onChange={(v) =>
                  onUpdateData("mobile", {
                    [`activity${item.k}Amount`]: v,
                  } as Partial<MockupContentData["mobile"]>)
                }
                className={`text-[10px] font-bold font-mono-tabular shrink-0 ${
                  item.pos ? "text-emerald-400" : "text-slate-200"
                }`}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (sampleId === "code") {
    const d = data.code;
    return (
      <div className="w-full bg-[#0D1117] text-slate-100 p-4 sm:p-5 space-y-4 text-left select-none">
        <InlineEditable
          as="div"
          multiline
          value={d.codeText}
          onChange={(v) => onUpdateData("code", { codeText: v })}
          className="font-mono-tabular text-[11px] sm:text-xs leading-relaxed text-[#E6EDF3] whitespace-pre-wrap block"
        />
        <div className="px-3 py-2 rounded-lg bg-[#161B22] border border-[#30363D]">
          <InlineEditable
            value={d.statusText}
            onChange={(v) => onUpdateData("code", { statusText: v })}
            className="font-mono-tabular text-[10px] sm:text-[11px] text-[#3FB950] block"
          />
        </div>
      </div>
    );
  }

  if (sampleId === "ecommerce") {
    const d = data.ecommerce;
    const accent = sanitizeHex(d.accentColor, "#1C1917");
    return (
      <div className="w-full bg-[#FAFAF9] text-stone-900 text-left select-none">
        <div className="px-4 py-2.5 bg-white border-b border-stone-200 flex items-center justify-between">
          <InlineEditable
            lightSurface
            value={d.brandName}
            onChange={(v) => onUpdateData("ecommerce", { brandName: v })}
            className="text-xs sm:text-sm font-bold tracking-tight text-stone-900"
          />
          <div className="hidden sm:flex items-center gap-4 text-[10px] text-stone-500">
            <span>New Arrivals</span>
            <span>Objects</span>
          </div>
          <span
            className="px-2.5 py-1 rounded-md text-[10px] font-semibold text-white"
            style={{ backgroundColor: accent }}
          >
            Cart (2)
          </span>
        </div>

        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <div className="aspect-[4/4.3] rounded-xl bg-stone-200 p-4 flex flex-col items-center justify-center relative">
            <div className="w-24 h-24 rounded-full bg-stone-50 shadow-sm" />
            <div
              className="w-14 h-16 rounded-lg -mt-4 shadow-md"
              style={{ backgroundColor: accent }}
            />
            <span className="mt-4 text-[9px] font-semibold tracking-wider text-stone-500 uppercase">
              {d.brandName} · Edition
            </span>
          </div>

          <div className="space-y-2.5">
            <InlineEditable
              lightSurface
              as="div"
              value={d.badgeText}
              onChange={(v) => onUpdateData("ecommerce", { badgeText: v })}
              className="text-[9px] font-semibold tracking-wider text-stone-500 uppercase"
            />
            <InlineEditable
              lightSurface
              as="div"
              value={d.productName}
              onChange={(v) => onUpdateData("ecommerce", { productName: v })}
              className="text-lg sm:text-xl font-bold text-stone-900 leading-tight"
            />
            <div className="flex items-baseline gap-2.5">
              <InlineEditable
                lightSurface
                value={d.price}
                onChange={(v) => onUpdateData("ecommerce", { price: v })}
                className="text-base font-bold text-stone-900 font-mono-tabular"
              />
              <InlineEditable
                lightSurface
                value={d.shippingNote}
                onChange={(v) => onUpdateData("ecommerce", { shippingNote: v })}
                className="text-[10px] font-semibold text-emerald-700"
              />
            </div>

            <InlineEditable
              lightSurface
              multiline
              as="p"
              value={d.description}
              onChange={(v) => onUpdateData("ecommerce", { description: v })}
              className="text-[10px] sm:text-[11px] text-stone-600 leading-relaxed"
            />

            <div
              className="py-2 px-3 rounded-lg text-center text-[11px] font-semibold text-white"
              style={{ backgroundColor: accent }}
            >
              <InlineEditable
                value={d.ctaLabel}
                onChange={(v) => onUpdateData("ecommerce", { ctaLabel: v })}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2 rounded-lg bg-white border border-stone-200">
                <InlineEditable
                  lightSurface
                  as="div"
                  value={d.metric1Label}
                  onChange={(v) => onUpdateData("ecommerce", { metric1Label: v })}
                  className="text-[8px] font-semibold text-stone-500 uppercase"
                />
                <InlineEditable
                  lightSurface
                  as="div"
                  value={d.metric1Value}
                  onChange={(v) => onUpdateData("ecommerce", { metric1Value: v })}
                  className="text-xs font-bold text-stone-900 font-mono-tabular mt-0.5"
                />
              </div>
              <div className="p-2 rounded-lg bg-white border border-stone-200">
                <InlineEditable
                  lightSurface
                  as="div"
                  value={d.metric2Label}
                  onChange={(v) => onUpdateData("ecommerce", { metric2Label: v })}
                  className="text-[8px] font-semibold text-stone-500 uppercase"
                />
                <InlineEditable
                  lightSurface
                  as="div"
                  value={d.metric2Value}
                  onChange={(v) => onUpdateData("ecommerce", { metric2Value: v })}
                  className="text-xs font-bold text-stone-900 font-mono-tabular mt-0.5"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (sampleId === "ai") {
    const d = data.ai;
    const accent = sanitizeHex(d.accentColor);
    return (
      <div className="w-full bg-[#090A0F] text-slate-100 flex text-left select-none">
        <div className="hidden sm:flex w-[124px] shrink-0 bg-[#0E1017] border-r border-[#1E2230] p-3 flex-col gap-2.5">
          <InlineEditable
            value={d.brandName}
            onChange={(v) => onUpdateData("ai", { brandName: v })}
            className="text-[11px] font-bold text-slate-50 truncate"
          />
          <div
            className="py-1.5 px-2 rounded-md text-[10px] font-semibold text-white text-center"
            style={{ backgroundColor: accent }}
          >
            + New Thread
          </div>
          <div className="text-[9px] text-slate-500 font-semibold pt-1">WORKFLOWS</div>
          <div className="text-[10px] text-slate-300 bg-[#161A26] px-2 py-1 rounded truncate">
            Growth Root-Cause
          </div>
          <div className="text-[10px] text-slate-400 px-2 truncate">SQL Cohort Builder</div>
        </div>

        <div className="flex-1 min-w-0 p-3.5 sm:p-4 space-y-2.5">
          <div className="p-2.5 rounded-lg bg-[#121520] border border-[#22283A]">
            <div className="text-[9px] font-semibold text-slate-400 mb-0.5">YOU ASKED</div>
            <InlineEditable
              multiline
              as="div"
              value={d.promptText}
              onChange={(v) => onUpdateData("ai", { promptText: v })}
              className="text-[11px] text-slate-100 leading-snug"
            />
          </div>

          <div className="p-3 rounded-lg bg-[#0F131D] border border-[#252C40] space-y-2">
            <InlineEditable
              as="div"
              value={d.analysisHeader}
              onChange={(v) => onUpdateData("ai", { analysisHeader: v })}
              className="text-[9px] font-bold text-blue-400 uppercase tracking-wider"
            />
            <InlineEditable
              as="div"
              value={d.finding1Title}
              onChange={(v) => onUpdateData("ai", { finding1Title: v })}
              className="text-xs font-semibold text-slate-100"
            />
            <InlineEditable
              multiline
              as="div"
              value={d.finding1Body}
              onChange={(v) => onUpdateData("ai", { finding1Body: v })}
              className="text-[10px] text-slate-400 leading-relaxed"
            />

            <div className="p-2.5 rounded-md bg-[#090C12] border border-[#1E2536] font-mono-tabular text-[9px] space-y-1">
              <InlineEditable
                as="div"
                value={d.codeLine1}
                onChange={(v) => onUpdateData("ai", { codeLine1: v })}
                className="text-[#79C0FF] truncate"
              />
              <InlineEditable
                as="div"
                value={d.codeLine2}
                onChange={(v) => onUpdateData("ai", { codeLine2: v })}
                className="text-slate-200 truncate"
              />
              <InlineEditable
                as="div"
                value={d.codeLine3}
                onChange={(v) => onUpdateData("ai", { codeLine3: v })}
                className="text-emerald-400 truncate"
              />
            </div>

            <div className="pt-0.5">
              <span
                className="inline-block px-2.5 py-1 rounded bg-[#182235] border text-[10px] font-semibold text-blue-300"
                style={{ borderColor: accent }}
              >
                <InlineEditable
                  value={d.ctaLabel}
                  onChange={(v) => onUpdateData("ai", { ctaLabel: v })}
                />
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // social
  const d = data.social;
  const accent = sanitizeHex(d.accentColor);
  return (
    <div className="w-full bg-[#111216] text-slate-100 p-5 sm:p-6 space-y-4 text-left select-none">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
          style={{ backgroundColor: accent }}
        >
          <InlineEditable
            value={d.initials}
            onChange={(v) => onUpdateData("social", { initials: v })}
          />
        </div>
        <div className="min-w-0">
          <InlineEditable
            as="div"
            value={d.authorName}
            onChange={(v) => onUpdateData("social", { authorName: v })}
            className="text-sm font-bold text-white"
          />
          <InlineEditable
            as="div"
            value={d.handle}
            onChange={(v) => onUpdateData("social", { handle: v })}
            className="text-[11px] text-slate-400"
          />
        </div>
      </div>

      <div className="space-y-2">
        <InlineEditable
          as="div"
          value={d.headline}
          onChange={(v) => onUpdateData("social", { headline: v })}
          className="text-base sm:text-lg font-bold text-white leading-snug"
        />
        <InlineEditable
          multiline
          as="div"
          value={d.body}
          onChange={(v) => onUpdateData("social", { body: v })}
          className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap"
        />
      </div>

      <div className="p-3 rounded-xl bg-[#171920] border border-[#262936]">
        <InlineEditable
          as="div"
          value={d.statsEyebrow}
          onChange={(v) => onUpdateData("social", { statsEyebrow: v })}
          className="text-[9px] font-semibold text-slate-400 tracking-wider uppercase mb-1.5"
        />
        <div className="grid grid-cols-3 gap-2 text-xs sm:text-sm font-bold">
          <InlineEditable
            value={d.stat1}
            onChange={(v) => onUpdateData("social", { stat1: v })}
            className="text-emerald-400"
          />
          <InlineEditable
            value={d.stat2}
            onChange={(v) => onUpdateData("social", { stat2: v })}
            className="text-white"
          />
          <InlineEditable
            value={d.stat3}
            onChange={(v) => onUpdateData("social", { stat3: v })}
            className="text-blue-400"
          />
        </div>
      </div>

      <InlineEditable
        as="div"
        value={d.footerMeta}
        onChange={(v) => onUpdateData("social", { footerMeta: v })}
        className="text-[11px] text-slate-500"
      />
    </div>
  );
};
