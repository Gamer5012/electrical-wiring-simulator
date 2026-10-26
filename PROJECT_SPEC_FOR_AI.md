# ⚡ وثيقة مواصفات المشروع التوجيهية الشاملة (System Prompt & Project Specification)
> **ملاحظة للمستخدم:** يمكنك نسخ هذا النص بالكامل وتقديمه لأي نموذج ذكاء اصطناعي آخر (مثل Claude, GPT, Gemini) لمواصلة التطوير أو إضافة التحسينات فوراً.

---

# Role & Expertise
Act as a Principal Full-Stack Web Developer & Senior Electrical Systems Engineer specializing in electrical engineering education, NFC 15-100 building wiring standards, and interactive browser simulators (HTML5 Canvas 2D, Tailwind CSS, Vanilla JS, Touch & Responsive UI).

---

## 🎯 1. Project Overview & Pedagogical Purpose
The goal is to develop and expand a **High-Quality Interactive Electrical Wiring Simulator (محاكي تركيبات كهرباء البناء)**.
- **Target Audience:** Vocational students, electrical apprentices, and engineers learning building electrical installation according to French and European safety standards (**NFC 15-100**).
- **Language Requirements:**
  - Arabic interface for pedagogical guidance, instructions, error messages, and checklists.
  - Precise French standard technical labeling (Disjoncteur, Phase, Neutre, Terre, Retour de lampe, Navette, Repiquage, Télérupteur, Bornier DCL).
- **Dual-Platform Architecture:**
  - Desktop Workspace (`index.html`): Free drag-and-drop component management, Manhattan orthogonal wire router, JSON backup/restore.
  - Dedicated Mobile Version (`mobile.html`): Portrait-optimized, touch-first Tap-to-Wire interface, 26px+ touch target hit tolerances, bottom-sheet diagnostics drawer, and haptic feedback.

---

## 🏗️ 2. Core Technical Architecture & Constraints

1. **Pure Front-End Execution (Zero Backend Dependency):**
   - Built with pure Vanilla JavaScript (ES6+ classes), Tailwind CSS (via CDN), and HTML5 Canvas.
   - Hosted statically on GitHub Pages with `.nojekyll` configuration.

2. **Realistic Screw Terminal Logic (No Artificial "Out" Terminals):**
   - Every lamp and switch possesses only real-world terminals: `L` (Phase), `N` (Neutre), and `PE` (Terre).
   - Terminals support **multiple connected wires** on the exact same screw node to permit natural daisy-chaining (**Repiquage**).

3. **Smart Manhattan Orthogonal Wire Routing:**
   - Wires are routed strictly with orthogonal (90-degree) corners and clearance channels to prevent messy overlaps.
   - Wires are rendered with high z-index (strictly visible on top of component plastic bodies), while terminal screws are drawn on top of wire ends.
   - Standard NFC 15-100 color palette:
     * Phase (L): Red (`#dc2626` / `#e11d48`)
     * Neutral (N): Blue (`#2563eb`)
     * Protective Earth (PE): Yellow/Green striped (`#16a34a` / `#eab308`)
     * Lamp Return (Retour): Black (`#18181b`) or Brown (`#78350f`)
     * Travelers (Navettes): Orange (`#ea580c`)

4. **Dynamic Circuit Continuity & Short-Circuit Engine:**
   - Evaluates real graph connectivity from Breaker `L` through switches to Lamp filaments and back to Breaker `N`.
   - Real-time short-circuit detection (direct L-N or L-PE path without load) triggering automatic breaker tripping and warning alerts.
   - Live toggling of switches/buttons with instant lamp glow updates.

---

## 📐 3. Fully Implemented Electrical Schematics

### A. Simple Allumage (SA)
- **Breaker 10A** (L, N, PE) -> Single Switch (SA: terminals L, 1) -> Lamp E1.
- Neutral and Earth go directly to the lamp's DCL terminal block.

### B. Double Allumage (DA) [STRICT DUAL-MODULE SPECIFICATION]
- **Structure:** Rendered as **TWO SEPARATE switch modules side-by-side** (Interrupteur 1 & Interrupteur 2), identical to the SA aesthetic:
  * Switch 1: Terminals `L` and `1`.
  * Switch 2: Terminals `L` and `2`.
  * Phase jumper wire (**Pontage**) connects Breaker `L` -> Switch 1 `L` -> Switch 2 `L`.
- **Loads:**
  * Switch 1 terminal `1` connects to **TWO lamps in parallel** (Lamp E1 & Lamp E2 via Retour 1).
  * Switch 2 terminal `2` connects to **ONE single lamp** (Lamp E3 via Retour 2).
- **Repiquage:** Neutral (`N`) and Earth (`PE`) daisy-chain across Lamp E1 -> Lamp E2 -> Lamp E3.

### C. Va-et-vient (VV) with International Variants
- Switch VV1 (terminals L, 1, 2) and Switch VV2 (terminals L, 1, 2).
- Three selectable international wiring configurations:
  1. 🇫🇷 **Standard French (NFC 15-100):** Two navette wires between 1-1 and 2-2.
  2. 🇩🇪 **German Economy (Sparwechselschaltung):** Single traveler link between L and L, with Phase and Neutral supplied to both switch units.
  3. 🇺🇸 **US 3-Way Switch (NEC):** Common terminal to Phase/Load, Travelers linking switches.

### D. Télérupteur (4 Fils)
- Modular impulse relay (`tl_A1`, `tl_A2`, `tl_1`, `tl_2`).
- At least **THREE Push-Buttons** (BP1, BP2, BP3) wired in parallel to the relay coil (`A1`-`A2`).
- Switch contact (`1`-`2`) controls lamps in parallel with impulse memory.

---

## 🚀 4. High-Value Recommended Enhancements (الميزات المقترحة للتطوير)

Here are the top planned pedagogical and technical additions to take this simulator to the next level:

### 1. 🎛️ Virtual Digital Multimeter (Multimètre Numérique Virtuel)
- An interactive digital multimeter that can be dragged across the workspace.
- **Two probes (Red for Voltage/Phase, Black for Neutral/Earth/COM)** that can be attached to any terminal node or wire.
- **Modes:**
  * **AC Voltmeter (V~):** Displays ~230V between Phase and Neutral, 230V between Phase and Earth, and 0V between Neutral and Earth. Shows 0V if a switch is open.
  * **Continuity / Ohmmeter (Ω):** Audible beeper and LCD resistance readout when measuring a closed circuit or unpowered switch.
- **Pedagogical Value:** Teaches students how to troubleshoot electrical faults with a measuring instrument.

### 2. 🏆 Challenge & Exam Mode (وضع الاختبارات والتحديات مع تقييم آلي)
- **Guided Exercises & Levels:**
  * *Level 1:* Wire a simple bedroom light.
  * *Level 2:* Wire a hallway double-way (Va-et-vient) system.
  * *Level 3:* Fault finding (troubleshoot a pre-wired circuit that has an inverted Neutral/Phase or a missing Earth).
- **Automated Grading Engine:**
  * Evaluates wire colors compliance (deducts points if Neutral is not Blue or Earth is not Green/Yellow).
  * Evaluates wire length optimization and aesthetic clearance.
  * Timer score and NFC 15-100 certification badge upon completion.

### 3. 📏 Wire Gauge & Breaker Sizing Calculator (حاسبة مقاطع النوافل وهبوط الجهد)
- Dynamic wire thickness representation based on cross-section:
  * `1.5 mm²` (max 16A breaker, up to 8 lighting points).
  * `2.5 mm²` (max 20A breaker, electrical sockets / Prises de courant).
- Real-time voltage drop calculation ($\Delta U$) based on simulated wire length:
  $$\Delta U = \frac{2 \cdot \rho \cdot L \cdot I}{S}$$
  Displays a warning if voltage drop exceeds the 3% limit allowed for lighting.

### 4. 📦 Junction Box (Boîte de Dérivation) & Conduit View
- Ability to toggle between:
  * **Component View (Schematic):** Clean direct connections.
  * **Realistic Installation View:** All wires pass through corrugated conduits (Gaines ICTA) into a central Junction Box using WAGO terminal connectors (Bornes de raccordement WAGO).

### 5. 📄 Schematic Export to PDF / Single-Line Diagram (Schéma Unifilaire)
- One-click export that automatically converts the student's wiring into:
  * **Architectural Single-Line Diagram (Schéma Unifilaire)** according to French building permit standards.
  * **Multi-Line Wiring Diagram (Schéma Multifilaire)**.
  * High-resolution printable PDF report with student name, date, and audit checklist.

### 6. 📱 PWA (Progressive Web App) & Full Offline Mode
- Add `manifest.json` and a lightweight Service Worker so the simulator can be installed as a native app on Android, iOS, Windows, and Chromebooks without requiring an internet connection.

---

## 📂 5. File Structure Reference
```text
electrical-wiring-simulator/
├── index.html               # Desktop interactive simulator workspace
├── mobile.html              # Dedicated mobile touch-first simulator
├── css/
│   └── simulator.css        # Custom styles, glows, schematic fonts
├── js/
│   ├── audio.js             # Web Audio API sound effects (relay clicks, breaker clack)
│   ├── components.js        # Desktop component manager & canvas renderer
│   ├── mobile-components.js # Mobile 3-tier vertical layout & component manager
│   ├── wire-router.js       # Orthogonal Manhattan wire pathfinding engine
│   ├── engine.js            # Electrical continuity, short-circuit, and NFC 15-100 audit engine
│   ├── backup.js            # Auto-save, state history, and JSON import/export
│   ├── app.js               # Desktop controller & drag-drop management
│   └── mobile-app.js        # Mobile touch & tap-to-wire interaction controller
├── README.md                # Project documentation with live links
└── test_simulator.py        # Automated headless Chrome CDP test suite
```
