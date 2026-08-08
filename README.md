# 🟩 Matrix SVG Contribution Generator

[![GitHub Action](https://img.shields.io/badge/GitHub%20Action-Matrix%20SVG-00ff66?style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com/N1k0droid/matrix-svg-contrib)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://github.com/N1k0droid/matrix-svg-contrib/blob/main/LICENSE)

A custom, animated **Matrix Rain** contribution graph generator for your GitHub Profile README.

Instead of standard contribution graphs, `matrix-svg-contrib` animates your GitHub activity as a digital rain code cascade. Empty days continuously loop matrix code pulses, while your actual contribution days fall down with the cascade and lock into phosphor green cells!

---

## ✨ Features

* 🌧️ **Matrix Code Rain Cascade:** Cascading columns with non-repeating, pseudo-random timing.
* ⚡ **Phosphor Green Lock-In:** Contribution days fall down with the rain and lock permanently into place.
* 🌓 **Dark & Light Mode Support:** Automatic theme switching with calibrated high-contrast light mode.
* 📌 **Two Layout Versions:**
  * **V1 (Minimal):** Clean $53 \times 7$ grid without surrounding text labels.
  * **V2 (Expanded):** Includes month and weekday phosphor text legends (`S`, `M`, `T`, `W`, `T`, `F`, `S`).
* ⚙️ **Fully Customizable:** Easily tweak cell sizes, padding, animation speeds, and color palettes via `config.ts`.

---

## 📸 Previews

### Version V2 (With Month & Weekday Legends - Recommended)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="dist/matrix-rain-v2-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="dist/matrix-rain-v2-light.svg">
  <img alt="Matrix Rain Contribution Graph V2" src="dist/matrix-rain-v2-dark.svg">
</picture>

### Version V1 (Minimal / Clean Grid)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="dist/matrix-rain-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="dist/matrix-rain-light.svg">
  <img alt="Matrix Rain Contribution Graph V1" src="dist/matrix-rain-dark.svg">
</picture>

---

## 🚀 Quick Start (GitHub Action)

Add the following workflow file to your profile repository `.github/workflows/matrix-rain.yml`:

```yaml
name: Generate Matrix Rain SVG

on:
  schedule:
    - cron: "0 */12 * * *"
  workflow_dispatch:
  push:
    branches:
      - main

permissions:
  contents: write

jobs:
  generate-matrix-rain:
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Generate Matrix SVGs
        uses: N1k0droid/matrix-svg-contrib@main
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}

      - name: Deploy SVGs to output branch
        uses: crazy-max/ghaction-github-pages@v4
        with:
          target_branch: output
          build_dir: dist
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## 🖼️ Adding to your `README.md`

### For Version V2 (With Legends):
```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_USERNAME/output/matrix-rain-v2-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_USERNAME/output/matrix-rain-v2-light.svg">
  <img alt="Matrix Rain Contribution Graph" src="https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_USERNAME/output/matrix-rain-v2-dark.svg">
</picture>
```

### For Version V1 (Minimal Grid):
```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_USERNAME/output/matrix-rain-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_USERNAME/output/matrix-rain-light.svg">
  <img alt="Matrix Rain Contribution Graph" src="https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_USERNAME/output/matrix-rain-dark.svg">
</picture>
```

---

## ⚙️ Customization (`config.ts`)

You can customize dimensions, animation timing, and theme color palettes by editing `config.ts`:

```typescript
export const defaultConfig: MatrixConfig = {
  grid: {
    sizeCell: 16,        // Cell pitch step (px)
    sizeDot: 12,         // Square cell size (px)
    borderRadius: 2,    // Cell border radius (px)
    paddingX: 8,        // Horizontal canvas padding (px)
    paddingY: 8,        // Vertical canvas padding (px)
  },
  animation: {
    minDuration: 3.8,   // Minimum cascade duration (s)
    maxDuration: 5.8,   // Maximum cascade duration (s)
    maxDelay: 4.8,      // Maximum initial rain delay (s)
  },
  themes: {
    dark: {
      bg: "#090d0a",
      ce: "#101712",
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
      flashPhosphor: "#00802b",
      c1: "#7ce39b",
      c2: "#26b95c",
      c3: "#138a3c",
      c4: "#0a5424",
      legendColor: "#24292e",
    },
  },
};
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) © 2026 [N1k0droid](https://github.com/N1k0droid).
