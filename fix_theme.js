const fs = require("fs");
const path = require("path");

const cssPath = path.join(__dirname, "frontend", "src", "index.css");
let content = fs.readFileSync(cssPath, "utf8");

const rootStart = ":root {";
const rootEnd = "}";
let rootStartIdx = content.indexOf(rootStart);
if (rootStartIdx === -1) { console.error(":root start not found"); process.exit(1); }

// find closing brace after :root
let depth = 0;
let i = rootStartIdx + rootStart.length;
for (; i < content.length; i++) {
  if (content[i] === "{") depth++;
  else if (content[i] === "}") {
    if (depth === 0) break;
    depth--;
  }
}
const rootEndIdx = i + 1; // include closing }

const oldRoot = content.slice(rootStartIdx, rootEndIdx);
console.log("Found :root block:", oldRoot.split("\n").length, "lines, starts at char", rootStartIdx);

const newRoot = `:root,
[data-theme="dark"] {
  /* ===== Premium Dark theme tokens ===== */
  --bg-page: #0B0F19;
  --bg-surface: #111827;
  --bg-surface-alt: #151C2C;
  --border-subtle: #1E293D;
  --border-strong: #2A364F;

  --text-primary: #F8FAFC;
  --text-secondary: #94A3B8;
  --text-tertiary: #64748B;

  --primary: #F59E0B;
  --primary-hover: #D97706;
  --primary-light: #FED7AA;

  --accent-green: #10B981;
  --accent-olive: #7C3AED;
  --accent-gray: #64748B;
  --accent-cyan: #38BDF8;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 18px;

  --accent: var(--primary);

  --bg: var(--bg-page);
  --surface: var(--bg-surface);
  --navbar: #111827;
  --text-muted: var(--text-tertiary);
  --border: var(--border-subtle);
  --shadow: 0 4px 20px rgba(0, 0, 0, 0.35);

  --color-background: 11 15 25;
  --color-card: 21 28 44;
  --color-navbar: 17 24 39;
  --color-text-primary: 248 250 252;
  --color-text-secondary: 148 163 184;
  --color-text-tertiary: 100 116 140;
  --color-border: 30 41 61;
  --color-hover: 30 41 61;
  --color-input: 21 28 44;
  --color-table-header: 17 24 39;

  --accent-green-soft: 16 185 129;
  --accent-red: #EF4444;
  --accent-amber: #F59E0B;
  --status-success: 16 185 129;
  --status-danger: 239 68 68;
  --status-warning: 245 158 11;
  --status-info: 56 189 248;

  --brand-primary: 245 158 11;
  --brand-primary-hover: 217 119 6;
  --brand-primary-light: 254 215 170;
  --brand-secondary: 37 99 235;
  --brand-secondary-hover: 29 78 216;
  --brand-secondary-light: 219 234 254;
  --brand-accent: 124 58 237;
  --brand-accent-hover: 109 40 217;
  --brand-success: 16 185 129;
  --brand-success-hover: 5 150 105;
  --brand-success-light: 209 252 231;
  --brand-danger: 239 68 68;
  --brand-danger-hover: 220 38 38;
  --brand-danger-light: 254 226 226;
  --brand-warning: 245 158 11;
  --brand-warning-hover: 217 119 6;
  --brand-warning-light: 253 230 138;
  --brand-info: 56 189 248;
  --brand-info-hover: 2 132 199;
  --brand-info-light: 224 242 254;
}`;

content = content.slice(0, rootStartIdx) + newRoot + content.slice(rootEndIdx);
console.log("Replaced :root block.");

// --- B: color-scheme ---
content = content.replace(
  '[data-theme="light"] { color-scheme: light; }',
  '[data-theme="dark"] { color-scheme: dark; }'
);
content = content.replace(".light { color-scheme: light; }", ".dark { color-scheme: dark; }");

// --- C: line 160 ring-primary -> ring-amber-400/50 ring-offset-[#0B0F19] ---
content = content.replace(
  "@apply outline-none ring-2 ring-primary ring-offset-2 ring-offset-\\[#F8FAFC\\];",
  "@apply outline-none ring-2 ring-amber-400/50 ring-offset-2 ring-offset-\\[#0B0F19\\];"
);

// --- D: line 299 radial gradient ---
content = content.replace(
  "background: radial-gradient(circle, rgba(255, 255, 255, 0.5) 10%, transparent 10.01%);",
  "background: radial-gradient(circle, rgba(255, 255, 255, 0.08) 10%, transparent 10.01%);"
);

// --- E: .dark-card rules (two occurrences) ---
// First: make them use bg-surface-alt or similar; we'll add bg-[#151C2C]
content = content.replace(
  /\.dark-card\s*\{/g,
  ".dark-card {\n    background: #151C2C;"
);

// --- F: second :root --ds-* block (lines ~864-884) ---
const dsRegex = /:root\s*\{[^}]*--ds-[^}]*\}/;
const dsMatch = content.match(dsRegex);
if (dsMatch) {
  console.log("Found ds block:", dsMatch[0].split("\n").length, "lines");
  const newDs = `:root {
  --ds-bg:#0B0F19; --ds-surface:#111827; --ds-navy:#F8FAFC; --ds-grey:#64748B; --ds-border:#1E293D; --ds-blue:#2563EB; --ds-blue-deep:#1D4ED8; --ds-blue-soft:rgba(37,99,235,0.12); --ds-green:#10B981; --ds-green-soft:rgba(16,185,129,0.12); --ds-amber:#F59E0B; --ds-amber-soft:rgba(245,158,11,0.12); --ds-amber-text:#D97706; --ds-red:#EF4444; --ds-red-soft:rgba(239,68,68,0.12); --ds-purple:#7C3AED; --ds-purple-soft:rgba(124,58,237,0.12); --ds-shadow:0 4px 20px rgba(0,0,0,0.35); --ds-radius:18px;
}`;
  content = content.replace(dsRegex, newDs);
  console.log("Replaced ds block.");
}

// --- G: class replacements ---
content = content.replace(/\bbg-white\b/g, "bg-card");
content = content.replace(/\btext-black\b/g, "text-text-primary");

// Replace common light text colors with text-text-primary
const lightTextClasses = [
  "text-gray-900", "text-slate-800", "text-slate-900", "text-gray-800",
  "text-amber-700", "text-blue-900", "text-neutral-800", "text-stone-800",
  "text-zinc-800", "text-zinc-900"
];
for (const cls of lightTextClasses) {
  const regex = new RegExp("\\b" + cls.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "g");
  content = content.replace(regex, "text-text-primary");
}

// --- H: stat-card::before gradient ---
content = content.replace(
  "from-amber-400/20",
  "from-amber-400/5"
);

// --- J: .btn-primary shim ---
content = content.replace(
  /\.btn-primary\s*\{[^}]*background:\s*var\(--ds-blue\)/,
  `.btn-primary {\n    background: var(--primary);`
);
content = content.replace(
  /\.btn-primary:hover\s*\{[^}]*background:\s*#1D4ED8/,
  `.btn-primary:hover {\n    background: #D97706;`
);

// --- K: accent-tile colors (ensure dark text) ---
// These are fine as-is per task, but ensure text is dark
// accent-tile--green, --amber, --cyan, --purple, --olive
content = content.replace(
  /(\.accent-tile--\w+[^}]*\{[^}]*background:\s*var\(--accent-\w+\))/g,
  "$1\n    color: #0B0F19;"
);

// --- Final leftover light hex cleanup ---
const leftovers = ["#FFFFFF", "#F8FAFC", "#0F172A", "#E2E8F0", "#2563EB"];
const foundLeftovers = [];
for (const hex of leftovers) {
  // count remaining occurrences (excluding comments)
  const matches = content.match(new RegExp(hex.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"));
  if (matches) {
    // filter out comment-only occurrences
    const lines = content.split("\n");
    for (const line of lines) {
      if (line.trim().startsWith("//") || line.trim().startsWith("/*")) continue;
      if (line.includes(hex)) {
        foundLeftovers.push(hex);
        break;
      }
    }
  }
}

if (foundLeftovers.length > 0) {
  console.log("Leftover light hexes found:", [...new Set(foundLeftovers)]);
} else {
  console.log("No leftover light hexes in non-comment code.");
}

fs.writeFileSync(cssPath, content, "utf8");
console.log("WROTE index.css - Total lines:", content.split("\n").length);
console.log("Leftover light hexes in non-comment code:", foundLeftovers.length > 0 ? [...new Set(foundLeftovers)] : "none");
