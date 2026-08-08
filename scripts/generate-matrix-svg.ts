import fs from "fs";
import path from "path";
import { defaultConfig, MatrixConfig } from "../config";

interface ContributionDay {
  x: number;
  y: number;
  date: string;
  count: number;
  level: number; // 0, 1, 2, 3, 4
}

// PRNG deterministico per varianza casuale coerente
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// 1. Recupero dati reali da GitHub GraphQL API (con fallback per i test locali)
async function getContributionData(username: string, token?: string): Promise<ContributionDay[]> {
  if (!token) {
    console.log("ℹ️ Nessun GITHUB_TOKEN trovato: Generazione dati di test realistici per il rendering locale.");
    const days: ContributionDay[] = [];
    const baseDate = new Date(2025, 7, 1);
    
    for (let x = 0; x < 53; x++) {
      for (let y = 0; y < 7; y++) {
        const currentDate = new Date(baseDate);
        currentDate.setDate(baseDate.getDate() + (x * 7 + y));
        
        const isContribution = (x * 7 + y) % 3 === 0 || (x + y) % 5 === 0;
        const level = isContribution ? Math.floor(seededRandom(x * 7 + y) * 4) + 1 : 0;
        days.push({
          x,
          y,
          date: currentDate.toISOString().split("T")[0],
          count: level * 3,
          level,
        });
      }
    }
    return days;
  }

  console.log(`📡 Recupero dati di contribuzione reali per @${username} via GraphQL API...`);
  const query = `
    query($login: String!) {
      user(login: $login) {
        contributionsCollection {
          contributionCalendar {
            weeks {
              contributionDays {
                contributionCount
                contributionLevel
                weekday
                date
              }
            }
          }
        }
      }
    }
  `;

  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "matrix-svg-contrib-generator",
    },
    body: JSON.stringify({ query, variables: { login: username } }),
  });

  if (!response.ok) {
    throw new Error(`Errore API GitHub: ${response.statusText}`);
  }

  const json = await response.json();
  if (json.errors) {
    throw new Error(`Errore GraphQL: ${JSON.stringify(json.errors)}`);
  }

  const weeks = json.data.user.contributionsCollection.contributionCalendar.weeks;
  const days: ContributionDay[] = [];

  weeks.forEach((week: any, x: number) => {
    week.contributionDays.forEach((day: any) => {
      const levelMap: Record<string, number> = {
        NONE: 0,
        FIRST_QUARTILE: 1,
        SECOND_QUARTILE: 2,
        THIRD_QUARTILE: 3,
        FOURTH_QUARTILE: 4,
      };

      days.push({
        x,
        y: day.weekday,
        date: day.date,
        count: day.contributionCount,
        level: levelMap[day.contributionLevel] ?? 0,
      });
    });
  });

  return days;
}

// 2. Generatore dell'SVG Matrix Rain basato sulla configurazione personalizzabile
function generateMatrixSvg(
  days: ContributionDay[],
  theme: "dark" | "light" | "auto",
  version: "v1" | "v2" = "v1",
  cfg: MatrixConfig = defaultConfig
): string {
  const { sizeCell, sizeDot, borderRadius, paddingX, paddingY } = cfg.grid;
  const { minDuration, maxDuration, maxDelay } = cfg.animation;

  const margin = (sizeCell - sizeDot) / 2;
  const maxCol = Math.max(...days.map((d) => d.x), 52) + 1; // 53 colonne
  const maxRow = 7;

  const offsetX = version === "v2" ? 24 : 0;
  const offsetY = version === "v2" ? 20 : 0;

  const gridWidth = maxCol * sizeCell;
  const gridHeight = maxRow * sizeCell;

  const width = gridWidth + offsetX + paddingX * 2;
  const height = gridHeight + offsetY + paddingY * 2;

  const viewBox = `-${paddingX} -${paddingY} ${width} ${height}`;

  // Parametri pioggia Matrix per ciascuna colonna
  const colParams: Record<number, { delay: number; duration: number }> = {};
  for (let c = 0; c < maxCol; c++) {
    const rDelay = seededRandom(c * 37 + 11) * maxDelay;
    const rDur = minDuration + seededRandom(c * 91 + 43) * (maxDuration - minDuration);
    colParams[c] = {
      delay: rDelay,
      duration: rDur,
    };
  }

  // Legenda mesi e giorni per V2
  let monthLabelsSvg = "";
  let dayLabelsSvg = "";

  if (version === "v2") {
    const dayNames = ["S", "M", "T", "W", "T", "F", "S"];
    dayLabelsSvg = dayNames
      .map((name, y) => {
        const yPos = offsetY + y * sizeCell + margin + 9;
        return `<text class="legend-text" x="4" y="${yPos}">${name}</text>`;
      })
      .join("\n    ");

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let lastMonth = -1;
    const monthLabels: { x: number; name: string }[] = [];

    for (let c = 0; c < maxCol; c++) {
      const firstDay = days.find((d) => d.x === c && d.y === 0) || days.find((d) => d.x === c);
      if (firstDay && firstDay.date) {
        const monthIndex = new Date(firstDay.date).getMonth();
        if (monthIndex !== lastMonth) {
          monthLabels.push({ x: c, name: monthNames[monthIndex] });
          lastMonth = monthIndex;
        }
      }
    }

    monthLabelsSvg = monthLabels
      .map(({ x, name }) => {
        const xPos = offsetX + x * sizeCell + margin;
        return `<text class="legend-text" x="${xPos}" y="12">${name}</text>`;
      })
      .join("\n    ");
  }

  const darkTheme = cfg.themes.dark;
  const lightTheme = cfg.themes.light;

  const styles = `
    :root {
      ${
        theme === "dark" || theme === "auto"
          ? `
        --bg: ${darkTheme.bg};
        --ce: ${darkTheme.ce};
        --cb: ${darkTheme.cb};
        --rain-head: ${darkTheme.rainHead};
        --rain-trail: ${darkTheme.rainTrail};
        --flash-phosphor: ${darkTheme.flashPhosphor};
        --c1: ${darkTheme.c1};
        --c2: ${darkTheme.c2};
        --c3: ${darkTheme.c3};
        --c4: ${darkTheme.c4};
        --legend-color: ${darkTheme.legendColor};
      `
          : ""
      }
      ${
        theme === "light"
          ? `
        --bg: ${lightTheme.bg};
        --ce: ${lightTheme.ce};
        --cb: ${lightTheme.cb};
        --rain-head: ${lightTheme.rainHead};
        --rain-trail: ${lightTheme.rainTrail};
        --flash-phosphor: ${lightTheme.flashPhosphor};
        --c1: ${lightTheme.c1};
        --c2: ${lightTheme.c2};
        --c3: ${lightTheme.c3};
        --c4: ${lightTheme.c4};
        --legend-color: ${lightTheme.legendColor};
      `
          : ""
      }
    }

    ${
      theme === "auto"
        ? `
      @media (prefers-color-scheme: light) {
        :root {
          --bg: ${lightTheme.bg};
          --ce: ${lightTheme.ce};
          --cb: ${lightTheme.cb};
          --rain-head: ${lightTheme.rainHead};
          --rain-trail: ${lightTheme.rainTrail};
          --flash-phosphor: ${lightTheme.flashPhosphor};
          --c1: ${lightTheme.c1};
          --c2: ${lightTheme.c2};
          --c3: ${lightTheme.c3};
          --c4: ${lightTheme.c4};
          --legend-color: ${lightTheme.legendColor};
        }
      }
    `
        : ""
    }

    rect.cell {
      shape-rendering: geometricPrecision;
      stroke-width: 1px;
      stroke: var(--cb);
      fill: var(--ce);
      width: ${sizeDot}px;
      height: ${sizeDot}px;
      rx: ${borderRadius}px;
      ry: ${borderRadius}px;
    }

    .legend-text {
      font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
      font-size: 9px;
      font-weight: 700;
      fill: var(--legend-color);
      letter-spacing: 0.3px;
    }

    @keyframes matrixLoop {
      0% { fill: var(--ce); }
      20% { fill: var(--rain-head); }
      45% { fill: var(--rain-trail); }
      80% { fill: var(--ce); }
      100% { fill: var(--ce); }
    }

    @keyframes lockPhosphor1 {
      0% { fill: var(--ce); }
      25% { fill: var(--flash-phosphor); filter: drop-shadow(0 0 2px var(--flash-phosphor)); }
      55% { fill: var(--c1); filter: none; }
      100% { fill: var(--c1); filter: none; }
    }
    @keyframes lockPhosphor2 {
      0% { fill: var(--ce); }
      25% { fill: var(--flash-phosphor); filter: drop-shadow(0 0 3px var(--flash-phosphor)); }
      55% { fill: var(--c2); filter: none; }
      100% { fill: var(--c2); filter: none; }
    }
    @keyframes lockPhosphor3 {
      0% { fill: var(--ce); }
      25% { fill: var(--flash-phosphor); filter: drop-shadow(0 0 4px var(--flash-phosphor)); }
      55% { fill: var(--c3); filter: none; }
      100% { fill: var(--c3); filter: none; }
    }
    @keyframes lockPhosphor4 {
      0% { fill: var(--ce); }
      25% { fill: var(--flash-phosphor); filter: drop-shadow(0 0 5px var(--flash-phosphor)); }
      55% { fill: var(--c4); filter: drop-shadow(0 0 1px var(--c4)); }
      100% { fill: var(--c4); filter: drop-shadow(0 0 1px var(--c4)); }
    }

    .rain-loop {
      animation-name: matrixLoop;
      animation-iteration-count: infinite;
      animation-timing-function: ease-in-out;
    }

    .lock-1 { animation-name: lockPhosphor1; animation-fill-mode: forwards; animation-timing-function: ease-out; }
    .lock-2 { animation-name: lockPhosphor2; animation-fill-mode: forwards; animation-timing-function: ease-out; }
    .lock-3 { animation-name: lockPhosphor3; animation-fill-mode: forwards; animation-timing-function: ease-out; }
    .lock-4 { animation-name: lockPhosphor4; animation-fill-mode: forwards; animation-timing-function: ease-out; }
  `;

  const rects = days.map((day) => {
    const xPos = offsetX + day.x * sizeCell + margin;
    const yPos = offsetY + day.y * sizeCell + margin;

    const param = colParams[day.x] || { delay: 0, duration: 4.5 };
    const rowOffset = (day.y / maxRow) * (param.duration * 0.45);
    const hitTime = (param.delay + rowOffset).toFixed(2);
    const durationStr = param.duration.toFixed(2);

    let className = "cell ";
    let inlineStyle = "";

    if (day.level === 0) {
      className += "rain-loop";
      inlineStyle = `animation-duration: ${durationStr}s; animation-delay: ${hitTime}s;`;
    } else {
      className += `lock-${day.level}`;
      inlineStyle = `animation-duration: ${durationStr}s; animation-delay: ${hitTime}s;`;
    }

    return `<rect class="${className}" x="${xPos}" y="${yPos}" style="${inlineStyle}" />`;
  });

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}">
  <desc>Matrix Rain Contribution Graph generated by matrix-svg-contrib (${version.toUpperCase()})</desc>
  <style>
    ${styles}
  </style>
  <rect x="-${paddingX}" y="-${paddingY}" width="${width}" height="${height}" fill="var(--bg)" rx="6" />
  ${version === "v2" ? `<g class="legends">${monthLabelsSvg}\n    ${dayLabelsSvg}\n  </g>` : ""}
  <g class="cells">
    ${rects.join("\n    ")}
  </g>
</svg>
  `.trim();
}

async function main() {
  const username = process.env.GITHUB_USERNAME || "N1k0droid";
  const token = process.env.METRICS_TOKEN || process.env.GITHUB_TOKEN;

  const days = await getContributionData(username, token);

  const distDir = path.join(process.cwd(), "dist");
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  const v1Dark = generateMatrixSvg(days, "dark", "v1");
  const v1Light = generateMatrixSvg(days, "light", "v1");
  const v1Auto = generateMatrixSvg(days, "auto", "v1");

  const v2Dark = generateMatrixSvg(days, "dark", "v2");
  const v2Light = generateMatrixSvg(days, "light", "v2");
  const v2Auto = generateMatrixSvg(days, "auto", "v2");

  fs.writeFileSync(path.join(distDir, "matrix-rain-dark.svg"), v1Dark);
  fs.writeFileSync(path.join(distDir, "matrix-rain-light.svg"), v1Light);
  fs.writeFileSync(path.join(distDir, "matrix-rain.svg"), v1Auto);

  fs.writeFileSync(path.join(distDir, "matrix-rain-v2-dark.svg"), v2Dark);
  fs.writeFileSync(path.join(distDir, "matrix-rain-v2-light.svg"), v2Light);
  fs.writeFileSync(path.join(distDir, "matrix-rain-v2.svg"), v2Auto);

  console.log("✅ File SVG V1 e V2 generati con successo in dist/:");
  console.log("  [V1 Clean]: dist/matrix-rain-dark.svg, dist/matrix-rain-light.svg");
  console.log("  [V2 Legend]: dist/matrix-rain-v2-dark.svg, dist/matrix-rain-v2-light.svg");
}

main().catch((err) => {
  console.error("❌ Errore durante la generazione:", err);
  process.exit(1);
});
