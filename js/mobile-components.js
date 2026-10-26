/**
 * Mobile-Optimized Electrical Components & Canvas Visual Renderer (NFC 15-100)
 * Tailored for smartphone portrait viewports (360px - 440px):
 * - Large touch-friendly target areas (tolerance 28px)
 * - Vertical 3-tier flow: Disjoncteur (top) -> Control switches (middle) -> Lamps (bottom)
 * - Double Allumage: 2 separate switches side-by-side, E1+E2 in parallel, E3 independent
 * - Realistic single terminals: L, N, PE on lamps (zero fake Out terminals)
 * - Multiple wires directly attachable to any terminal node
 */

class MobileComponentManager extends ComponentManager {
  constructor() {
    super();
    this.canvasW = 390;
    this.canvasH = 680;
  }

  setCanvasDimensions(w, h) {
    this.canvasW = w;
    this.canvasH = h;
    this.initModeLayout(this.activeMode);
  }

  // 1. SIMPLE ALLUMAGE (SA) - Portrait Mobile
  setupSimpleAllumage() {
    const cx = Math.floor(this.canvasW / 2);

    // Disjoncteur 10A (Top)
    this.addComponent({
      id: 'q1',
      type: 'disjoncteur',
      x: cx - 70,
      y: 20,
      width: 140,
      height: 200,
      labelFr: 'Disjoncteur 10A',
      labelAr: 'قاطع الدارة 10A',
      state: { isOn: true },
      terminals: [
        { id: 'q1_L', name: 'Disjoncteur: Borne L', code: 'L', xOffset: 45, yOffset: 185, dir: 'bottom', type: 'phase' },
        { id: 'q1_N', name: 'Disjoncteur: Borne N', code: 'N', xOffset: 95, yOffset: 185, dir: 'bottom', type: 'neutre' },
        { id: 'q1_PE', name: 'Barrette PE (Terre)', code: 'PE', xOffset: 70, yOffset: 25, dir: 'top', type: 'terre' }
      ]
    });

    // Interrupteur Simple (Middle)
    this.addComponent({
      id: 'sw1',
      type: 'switch_sa',
      x: cx - 70,
      y: 250,
      width: 140,
      height: 160,
      labelFr: 'Interrupteur SA',
      labelAr: 'قاطعة بسيطة (SA)',
      state: { isClosed: false },
      terminals: [
        { id: 'sw1_L', name: 'Interrupteur: Borne L', code: 'L', xOffset: 45, yOffset: 145, dir: 'bottom', type: 'phase' },
        { id: 'sw1_1', name: 'Interrupteur: Borne 1', code: '1', xOffset: 95, yOffset: 145, dir: 'bottom', type: 'retour' }
      ]
    });

    // Lampe E1 (Bottom)
    this.addComponent({
      id: 'e1',
      type: 'lamp',
      x: cx - 80,
      y: 440,
      width: 160,
      height: 200,
      labelFr: 'Lampe E1',
      labelAr: 'المصباح E1',
      state: { isLit: false },
      terminals: [
        { id: 'e1_L', name: 'Lampe E1: Borne L', code: 'L', xOffset: 30, yOffset: 175, dir: 'bottom', type: 'retour' },
        { id: 'e1_N', name: 'Lampe E1: Borne N', code: 'N', xOffset: 80, yOffset: 175, dir: 'bottom', type: 'neutre' },
        { id: 'e1_PE', name: 'Lampe E1: Borne PE', code: 'PE', xOffset: 130, yOffset: 175, dir: 'bottom', type: 'terre' }
      ]
    });

    this.rebuildTerminalsIndex();
  }

  // 2. DOUBLE ALLUMAGE (DA) - 2 SEPARATE SWITCHES SIDE-BY-SIDE ON MOBILE
  setupDoubleAllumage() {
    const cx = Math.floor(this.canvasW / 2);

    // Disjoncteur 10A (Top Center)
    this.addComponent({
      id: 'q1',
      type: 'disjoncteur',
      x: cx - 70,
      y: 15,
      width: 140,
      height: 195,
      labelFr: 'Disjoncteur 10A',
      labelAr: 'قاطع الدارة 10A',
      state: { isOn: true },
      terminals: [
        { id: 'q1_L', name: 'Disjoncteur: Borne L', code: 'L', xOffset: 45, yOffset: 180, dir: 'bottom', type: 'phase' },
        { id: 'q1_N', name: 'Disjoncteur: Borne N', code: 'N', xOffset: 95, yOffset: 180, dir: 'bottom', type: 'neutre' },
        { id: 'q1_PE', name: 'Barrette PE (Terre)', code: 'PE', xOffset: 70, yOffset: 25, dir: 'top', type: 'terre' }
      ]
    });

    // Switch width on mobile: approx 160px each with 10px margin
    const swW = Math.min(165, Math.floor((this.canvasW - 40) / 2));
    const sw1X = Math.floor(this.canvasW / 2) - swW - 8;
    const sw2X = Math.floor(this.canvasW / 2) + 8;

    // Separate Switch 1 (Controls E1 + E2 parallel)
    this.addComponent({
      id: 'sw_da1',
      type: 'switch_sa',
      x: sw1X,
      y: 235,
      width: swW,
      height: 160,
      labelFr: 'Interrupteur 1',
      labelAr: 'قاطعة 1 (E1+E2)',
      state: { isClosed: false },
      terminals: [
        { id: 'da1_L', name: 'Interrupteur 1: L', code: 'L', xOffset: 45, yOffset: 145, dir: 'bottom', type: 'phase' },
        { id: 'da1_1', name: 'Interrupteur 1: 1', code: '1', xOffset: swW - 45, yOffset: 145, dir: 'bottom', type: 'retour' }
      ]
    });

    // Separate Switch 2 (Controls E3 alone)
    this.addComponent({
      id: 'sw_da2',
      type: 'switch_sa',
      x: sw2X,
      y: 235,
      width: swW,
      height: 160,
      labelFr: 'Interrupteur 2',
      labelAr: 'قاطعة 2 (E3)',
      state: { isClosed: false },
      terminals: [
        { id: 'da2_L', name: 'Interrupteur 2: L', code: 'L', xOffset: 45, yOffset: 145, dir: 'bottom', type: 'phase' },
        { id: 'da2_2', name: 'Interrupteur 2: 2', code: '2', xOffset: swW - 45, yOffset: 145, dir: 'bottom', type: 'retour' }
      ]
    });

    // 3 Lamps across bottom: E1, E2, E3
    const lampW = Math.min(118, Math.floor((this.canvasW - 24) / 3));
    const gap = Math.floor((this.canvasW - (lampW * 3)) / 4);

    // Lampe E1
    this.addComponent({
      id: 'e1',
      type: 'lamp',
      x: gap,
      y: 425,
      width: lampW,
      height: 195,
      labelFr: 'Lampe E1',
      labelAr: 'المصباح E1',
      state: { isLit: false },
      terminals: [
        { id: 'e1_L', name: 'E1: Borne L', code: 'L', xOffset: 20, yOffset: 175, dir: 'bottom', type: 'retour' },
        { id: 'e1_N', name: 'E1: Borne N', code: 'N', xOffset: Math.floor(lampW / 2), yOffset: 175, dir: 'bottom', type: 'neutre' },
        { id: 'e1_PE', name: 'E1: Borne PE', code: 'PE', xOffset: lampW - 20, yOffset: 175, dir: 'bottom', type: 'terre' }
      ]
    });

    // Lampe E2 (Parallel with E1 via Retour 1)
    this.addComponent({
      id: 'e2',
      type: 'lamp',
      x: gap * 2 + lampW,
      y: 425,
      width: lampW,
      height: 195,
      labelFr: 'Lampe E2',
      labelAr: 'المصباح E2',
      state: { isLit: false },
      terminals: [
        { id: 'e2_L', name: 'E2: Borne L', code: 'L', xOffset: 20, yOffset: 175, dir: 'bottom', type: 'retour' },
        { id: 'e2_N', name: 'E2: Borne N', code: 'N', xOffset: Math.floor(lampW / 2), yOffset: 175, dir: 'bottom', type: 'neutre' },
        { id: 'e2_PE', name: 'E2: Borne PE', code: 'PE', xOffset: lampW - 20, yOffset: 175, dir: 'bottom', type: 'terre' }
      ]
    });

    // Lampe E3 (Controlled by Switch 2)
    this.addComponent({
      id: 'e3',
      type: 'lamp',
      x: gap * 3 + lampW * 2,
      y: 425,
      width: lampW,
      height: 195,
      labelFr: 'Lampe E3',
      labelAr: 'المصباح E3',
      state: { isLit: false },
      terminals: [
        { id: 'e3_L', name: 'E3: Borne L', code: 'L', xOffset: 20, yOffset: 175, dir: 'bottom', type: 'retour' },
        { id: 'e3_N', name: 'E3: Borne N', code: 'N', xOffset: Math.floor(lampW / 2), yOffset: 175, dir: 'bottom', type: 'neutre' },
        { id: 'e3_PE', name: 'E3: Borne PE', code: 'PE', xOffset: lampW - 20, yOffset: 175, dir: 'bottom', type: 'terre' }
      ]
    });

    this.rebuildTerminalsIndex();
  }

  // 3. VA-ET-VIENT (VV) - Mobile
  setupVaEtVient(variant = 'FR') {
    this.vvVariant = variant;
    const cx = Math.floor(this.canvasW / 2);

    // Disjoncteur 10A
    this.addComponent({
      id: 'q1',
      type: 'disjoncteur',
      x: cx - 70,
      y: 15,
      width: 140,
      height: 195,
      labelFr: 'Disjoncteur 10A',
      labelAr: 'قاطع الدارة 10A',
      state: { isOn: true },
      terminals: [
        { id: 'q1_L', name: 'Disjoncteur: Borne L', code: 'L', xOffset: 45, yOffset: 180, dir: 'bottom', type: 'phase' },
        { id: 'q1_N', name: 'Disjoncteur: Borne N', code: 'N', xOffset: 95, yOffset: 180, dir: 'bottom', type: 'neutre' },
        { id: 'q1_PE', name: 'Barrette PE (Terre)', code: 'PE', xOffset: 70, yOffset: 25, dir: 'top', type: 'terre' }
      ]
    });

    const swW = Math.min(165, Math.floor((this.canvasW - 40) / 2));
    const sw1X = Math.floor(this.canvasW / 2) - swW - 8;
    const sw2X = Math.floor(this.canvasW / 2) + 8;

    let switchType = 'switch_vv';
    let sw1Title = 'Interrupteur VV1';
    let sw2Title = 'Interrupteur VV2';
    let term1_1_code = '1';
    let term1_2_code = '2';
    let term2_1_code = '1';
    let term2_2_code = '2';

    if (variant === 'US') {
      switchType = 'switch_3way_us';
      sw1Title = '3-Way Sw 1 (US)';
      sw2Title = '3-Way Sw 2 (US)';
      term1_1_code = 'T1';
      term1_2_code = 'T2';
      term2_1_code = 'T1';
      term2_2_code = 'T2';
    }

    // Switch VV1
    this.addComponent({
      id: 'sw_vv1',
      type: switchType,
      x: sw1X,
      y: 235,
      width: swW,
      height: 175,
      labelFr: sw1Title,
      labelAr: variant === 'US' ? 'مفتاح 1 (US)' : 'قاطعة ذهاب/إياب 1',
      state: { position: 1 },
      terminals: [
        { id: 'vv1_L', name: 'VV1: L', code: 'L', xOffset: Math.floor(swW / 2), yOffset: 25, dir: 'top', type: 'phase' },
        { id: 'vv1_1', name: `VV1: ${term1_1_code}`, code: term1_1_code, xOffset: 35, yOffset: 155, dir: 'bottom', type: 'navette' },
        { id: 'vv1_2', name: `VV1: ${term1_2_code}`, code: term1_2_code, xOffset: swW - 35, yOffset: 155, dir: 'bottom', type: 'navette' }
      ]
    });

    // Switch VV2
    this.addComponent({
      id: 'sw_vv2',
      type: switchType,
      x: sw2X,
      y: 235,
      width: swW,
      height: 175,
      labelFr: sw2Title,
      labelAr: variant === 'US' ? 'مفتاح 2 (US)' : 'قاطعة ذهاب/إياب 2',
      state: { position: 1 },
      terminals: [
        { id: 'vv2_1', name: `VV2: ${term2_1_code}`, code: term2_1_code, xOffset: 35, yOffset: 25, dir: 'top', type: 'navette' },
        { id: 'vv2_2', name: `VV2: ${term2_2_code}`, code: term2_2_code, xOffset: swW - 35, yOffset: 25, dir: 'top', type: 'navette' },
        { id: 'vv2_L', name: 'VV2: L', code: 'L', xOffset: Math.floor(swW / 2), yOffset: 155, dir: 'bottom', type: 'retour' }
      ]
    });

    // 2 Lamps at Bottom
    const lampW = Math.min(160, Math.floor((this.canvasW - 40) / 2));
    const lamp1X = Math.floor(this.canvasW / 2) - lampW - 8;
    const lamp2X = Math.floor(this.canvasW / 2) + 8;

    this.addComponent({
      id: 'e1',
      type: 'lamp',
      x: lamp1X,
      y: 435,
      width: lampW,
      height: 200,
      labelFr: 'Lampe E1',
      labelAr: 'المصباح E1',
      state: { isLit: false },
      terminals: [
        { id: 'e1_L', name: 'E1: L', code: 'L', xOffset: 25, yOffset: 175, dir: 'bottom', type: 'retour' },
        { id: 'e1_N', name: 'E1: N', code: 'N', xOffset: Math.floor(lampW / 2), yOffset: 175, dir: 'bottom', type: 'neutre' },
        { id: 'e1_PE', name: 'E1: PE', code: 'PE', xOffset: lampW - 25, yOffset: 175, dir: 'bottom', type: 'terre' }
      ]
    });

    this.addComponent({
      id: 'e2',
      type: 'lamp',
      x: lamp2X,
      y: 435,
      width: lampW,
      height: 200,
      labelFr: 'Lampe E2',
      labelAr: 'المصباح E2 (توازي)',
      state: { isLit: false },
      terminals: [
        { id: 'e2_L', name: 'E2: L', code: 'L', xOffset: 25, yOffset: 175, dir: 'bottom', type: 'retour' },
        { id: 'e2_N', name: 'E2: N', code: 'N', xOffset: Math.floor(lampW / 2), yOffset: 175, dir: 'bottom', type: 'neutre' },
        { id: 'e2_PE', name: 'E2: PE', code: 'PE', xOffset: lampW - 25, yOffset: 175, dir: 'bottom', type: 'terre' }
      ]
    });

    this.rebuildTerminalsIndex();
  }

  // 4. TÉLÉRUPTEUR (4 FILS) WITH 3 PUSH BUTTONS - Mobile
  setupTelerupteur() {
    const cx = Math.floor(this.canvasW / 2);

    // Top: Disjoncteur and Télérupteur side by side
    const topW = Math.min(160, Math.floor((this.canvasW - 40) / 2));
    const q1X = Math.floor(this.canvasW / 2) - topW - 8;
    const tl1X = Math.floor(this.canvasW / 2) + 8;

    this.addComponent({
      id: 'q1',
      type: 'disjoncteur',
      x: q1X,
      y: 15,
      width: topW,
      height: 195,
      labelFr: 'Disjoncteur 10A',
      labelAr: 'قاطع الدارة 10A',
      state: { isOn: true },
      terminals: [
        { id: 'q1_L', name: 'Disjoncteur: L', code: 'L', xOffset: 35, yOffset: 180, dir: 'bottom', type: 'phase' },
        { id: 'q1_N', name: 'Disjoncteur: N', code: 'N', xOffset: topW - 35, yOffset: 180, dir: 'bottom', type: 'neutre' },
        { id: 'q1_PE', name: 'Barrette PE', code: 'PE', xOffset: Math.floor(topW / 2), yOffset: 25, dir: 'top', type: 'terre' }
      ]
    });

    this.addComponent({
      id: 'tl1',
      type: 'telerupteur',
      x: tl1X,
      y: 15,
      width: topW,
      height: 195,
      labelFr: 'Télérupteur 4 Fils',
      labelAr: 'مرحل نبضي (TL)',
      state: { isClosed: false },
      terminals: [
        { id: 'tl_1', name: 'TL: 1', code: '1', xOffset: 35, yOffset: 25, dir: 'top', type: 'phase' },
        { id: 'tl_A1', name: 'TL: A1', code: 'A1', xOffset: topW - 35, yOffset: 25, dir: 'top', type: 'navette' },
        { id: 'tl_2', name: 'TL: 2', code: '2', xOffset: 35, yOffset: 180, dir: 'bottom', type: 'retour' },
        { id: 'tl_A2', name: 'TL: A2', code: 'A2', xOffset: topW - 35, yOffset: 180, dir: 'bottom', type: 'neutre' }
      ]
    });

    // Middle: 3 Push Buttons in a horizontal row
    const bpW = Math.min(115, Math.floor((this.canvasW - 24) / 3));
    const gap = Math.floor((this.canvasW - (bpW * 3)) / 4);

    this.addComponent({
      id: 'bp1',
      type: 'push_button',
      x: gap,
      y: 240,
      width: bpW,
      height: 140,
      labelFr: 'BP1 (Entrée)',
      labelAr: 'زر 1 (مدخل)',
      state: { isPressed: false },
      terminals: [
        { id: 'bp1_L', name: 'BP1: L', code: 'L', xOffset: 25, yOffset: 120, dir: 'bottom', type: 'phase' },
        { id: 'bp1_out', name: 'BP1: Sortie', code: '⭳', xOffset: bpW - 25, yOffset: 120, dir: 'bottom', type: 'navette' }
      ]
    });

    this.addComponent({
      id: 'bp2',
      type: 'push_button',
      x: gap * 2 + bpW,
      y: 240,
      width: bpW,
      height: 140,
      labelFr: 'BP2 (Couloir)',
      labelAr: 'زر 2 (ممر)',
      state: { isPressed: false },
      terminals: [
        { id: 'bp2_L', name: 'BP2: L', code: 'L', xOffset: 25, yOffset: 120, dir: 'bottom', type: 'phase' },
        { id: 'bp2_out', name: 'BP2: Sortie', code: '⭳', xOffset: bpW - 25, yOffset: 120, dir: 'bottom', type: 'navette' }
      ]
    });

    this.addComponent({
      id: 'bp3',
      type: 'push_button',
      x: gap * 3 + bpW * 2,
      y: 240,
      width: bpW,
      height: 140,
      labelFr: 'BP3 (Escalier)',
      labelAr: 'زر 3 (درج)',
      state: { isPressed: false },
      terminals: [
        { id: 'bp3_L', name: 'BP3: L', code: 'L', xOffset: 25, yOffset: 120, dir: 'bottom', type: 'phase' },
        { id: 'bp3_out', name: 'BP3: Sortie', code: '⭳', xOffset: bpW - 25, yOffset: 120, dir: 'bottom', type: 'navette' }
      ]
    });

    // Bottom: 2 Lamps (E1 and E2 in parallel)
    const lampW = Math.min(160, Math.floor((this.canvasW - 40) / 2));
    const lamp1X = Math.floor(this.canvasW / 2) - lampW - 8;
    const lamp2X = Math.floor(this.canvasW / 2) + 8;

    this.addComponent({
      id: 'e1',
      type: 'lamp',
      x: lamp1X,
      y: 420,
      width: lampW,
      height: 195,
      labelFr: 'Lampe E1',
      labelAr: 'المصباح E1',
      state: { isLit: false },
      terminals: [
        { id: 'e1_L', name: 'E1: L', code: 'L', xOffset: 25, yOffset: 175, dir: 'bottom', type: 'retour' },
        { id: 'e1_N', name: 'E1: N', code: 'N', xOffset: Math.floor(lampW / 2), yOffset: 175, dir: 'bottom', type: 'neutre' },
        { id: 'e1_PE', name: 'E1: PE', code: 'PE', xOffset: lampW - 25, yOffset: 175, dir: 'bottom', type: 'terre' }
      ]
    });

    this.addComponent({
      id: 'e2',
      type: 'lamp',
      x: lamp2X,
      y: 420,
      width: lampW,
      height: 195,
      labelFr: 'Lampe E2',
      labelAr: 'المصباح E2 (توازي)',
      state: { isLit: false },
      terminals: [
        { id: 'e2_L', name: 'E2: L', code: 'L', xOffset: 25, yOffset: 175, dir: 'bottom', type: 'retour' },
        { id: 'e2_N', name: 'E2: N', code: 'N', xOffset: Math.floor(lampW / 2), yOffset: 175, dir: 'bottom', type: 'neutre' },
        { id: 'e2_PE', name: 'E2: PE', code: 'PE', xOffset: lampW - 25, yOffset: 175, dir: 'bottom', type: 'terre' }
      ]
    });

    this.rebuildTerminalsIndex();
  }

  // Large touch target detection for mobile fingers (tolerance = 26px!)
  getTerminalAt(x, y, tolerance = 26) {
    return this.terminals.find(t => {
      const dx = t.x - x;
      const dy = t.y - y;
      return (dx * dx + dy * dy) <= (tolerance * tolerance);
    });
  }

  // Slightly larger terminal node rendering for mobile touchscreens
  renderTerminals(ctx, hoveredTerminal = null, selectedTerminal = null) {
    this.terminals.forEach(t => {
      ctx.save();
      const isHovered = hoveredTerminal && hoveredTerminal.id === t.id;
      const isSelected = selectedTerminal && selectedTerminal.id === t.id;

      // Generous pulsating touch target ring
      if (isSelected || isHovered) {
        ctx.fillStyle = isSelected ? 'rgba(59, 130, 246, 0.45)' : 'rgba(234, 88, 12, 0.4)';
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.radius + 10, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = isSelected ? '#3b82f6' : (isHovered ? '#f97316' : '#64748b');
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.radius + 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      const screwGrad = ctx.createRadialGradient(t.x - 2, t.y - 2, 1, t.x, t.y, t.radius);
      screwGrad.addColorStop(0, '#f8fafc');
      screwGrad.addColorStop(0.5, '#cbd5e1');
      screwGrad.addColorStop(1, '#64748b');

      ctx.fillStyle = screwGrad;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.radius - 1, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(t.x - 4, t.y);
      ctx.lineTo(t.x + 4, t.y);
      ctx.stroke();

      // Clear terminal code label
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      const labelY = t.dir === 'top' ? t.y - 14 : t.y + 19;

      const textW = ctx.measureText(t.code).width + 8;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      this.roundRect(ctx, t.x - textW / 2, labelY - 10, textW, 13, 3);
      ctx.fill();

      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(t.code, t.x, labelY);

      ctx.restore();
    });
  }
}

window.MobileComponentManager = MobileComponentManager;
