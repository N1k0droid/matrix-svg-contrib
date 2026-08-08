export interface ThemePalette {
  bg: string;
  ce: string;
  cb: string;
  rainHead: string;
  rainTrail: string;
  flashPhosphor: string;
  c1: string;
  c2: string;
  c3: string;
  c4: string;
  legendColor: string;
}

export interface MatrixConfig {
  grid: {
    sizeCell: number;       // Passo centro-centro delle celle (default: 16)
    sizeDot: number;        // Dimensione del quadratino (default: 12)
    borderRadius: number;   // Raggio angoli smussati (default: 2)
    paddingX: number;       // Margine esterno orizzontale (default: 8)
    paddingY: number;       // Margine esterno verticale (default: 8)
  };
  animation: {
    minDuration: number;    // Durata minima cascata in secondi (default: 3.8)
    maxDuration: number;    // Durata massima cascata in secondi (default: 5.8)
    maxDelay: number;       // Ritardo massimo iniziale in secondi (default: 4.8)
  };
  themes: {
    dark: ThemePalette;
    light: ThemePalette;
  };
}

export const defaultConfig: MatrixConfig = {
  grid: {
    sizeCell: 16,
    sizeDot: 12,
    borderRadius: 2,
    paddingX: 8,
    paddingY: 8,
  },
  animation: {
    minDuration: 3.8,
    maxDuration: 5.8,
    maxDelay: 4.8,
  },
  themes: {
    dark: {
      bg: "#090d0a",
      ce: "#101712",
      cb: "#090d0a",
      rainHead: "rgba(40, 220, 80, 0.25)",
      rainTrail: "rgba(0, 140, 50, 0.12)",
      flashPhosphor: "#26e646",
      c1: "#0a3a1b",
      c2: "#006622",
      c3: "#00a838",
      c4: "#22d744",
      legendColor: "rgba(38, 230, 70, 0.65)",
    },
    light: {
      bg: "#ffffff",
      ce: "#e1e4e8",
      cb: "#ffffff",
      rainHead: "#00aa38",
      rainTrail: "rgba(0, 140, 45, 0.45)",
      flashPhosphor: "#00802b",
      c1: "#7ce39b",
      c2: "#26b95c",
      c3: "#138a3c",
      c4: "#0a5424",
      legendColor: "#24292e",
    },
  },
};
