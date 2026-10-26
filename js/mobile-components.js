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
    this.canvasW = Math.max(320, w);
    this.canvasH = Math.max(680, h);
    this.initModeLayout(this.activeMode);
  }

  // 1. SIMPLE ALLUMAGE (SA) - Portrait Mobile
  setupSimpleAllumage() {
    const cx = Math.floor(this.canvasW / 2);

    // Disjoncteur 10A (Top)
    this.addComponent({
      id: 'q1',
      type: 'disjoncteur',
      x: cx - 65,
      y: 15,
      width: 130,
      height: 180,
      labelFr: 'Disjoncteur 10A',
      labelAr: 'قاطع الدارة 10A',
      state: { isOn: true },
      terminals: [
        { id: 'q1_L', name: 'Disjoncteur: Borne L', code: 'L', xOffset: 40, yOffset: 165, dir: 'bottom', type: 'phase' },
        { id: 'q1_N', name: 'Disjoncteur: Borne N', code: 'N', xOffset: 90, yOffset: 165, dir: 'bottom', type: 'neutre' },
        { id: 'q1_PE', name: 'Barrette PE (Terre)', code: 'PE', xOffset: 65, yOffset: 25, dir: 'top', type: 'terre' }
      ]
    });

    // Interrupteur Simple (Middle)
    this.addComponent({
      id: 'sw1',
      type: 'switch_sa',
      x: cx - 65,
      y: 225,
      width: 130,
      height: 145,
      labelFr: 'Interrupteur SA',
      labelAr: 'قاطعة بسيطة (SA)',
      state: { isClosed: false },
      terminals: [
        { id: 'sw1_L', name: 'Interrupteur: Borne L', code: 'L', xOffset: 40, yOffset: 130, dir: 'bottom', type: 'phase' },
        { id: 'sw1_1', name: 'Interrupteur: Borne 1', code: '1', xOffset: 90, yOffset: 130, dir: 'bottom', type: 'retour' }
      ]
    });

    // Lampe E1 (Bottom)
    this.addComponent({
      id: 'e1',
      type: 'lamp',
      x: cx - 75,
      y: 415,
      width: 150,
      height: 175,
      labelFr: 'Lampe E1',
      labelAr: 'المصباح E1',
      state: { isLit: false },
      terminals: [
        { id: 'e1_L', name: 'Lampe E1: Borne L', code: 'L', xOffset: 28, yOffset: 155, dir: 'bottom', type: 'retour' },
        { id: 'e1_N', name: 'Lampe E1: Borne N', code: 'N', xOffset: 75, yOffset: 155, dir: 'bottom', type: 'neutre' },
        { id: 'e1_PE', name: 'Lampe E1: Borne PE', code: 'PE', xOffset: 122, yOffset: 155, dir: 'bottom', type: 'terre' }
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
      x: cx - 65,
      y: 15,
      width: 130,
      height: 180,
      labelFr: 'Disjoncteur 10A',
      labelAr: 'قاطع الدارة 10A',
      state: { isOn: true },
      terminals: [
        { id: 'q1_L', name: 'Disjoncteur: Borne L', code: 'L', xOffset: 40, yOffset: 165, dir: 'bottom', type: 'phase' },
        { id: 'q1_N', name: 'Disjoncteur: Borne N', code: 'N', xOffset: 90, yOffset: 165, dir: 'bottom', type: 'neutre' },
        { id: 'q1_PE', name: 'Barrette PE (Terre)', code: 'PE', xOffset: 65, yOffset: 25, dir: 'top', type: 'terre' }
      ]
    });

    // Switch width on mobile: 2 separate switches side by side
    const swW = Math.min(160, Math.floor((this.canvasW - 32) / 2));
    const sw1X = cx - swW - 6;
    const sw2X = cx + 6;

    // Separate Switch 1 (Controls E1 + E2 parallel)
    this.addComponent({
      id: 'sw_da1',
      type: 'switch_sa',
      x: sw1X,
      y: 225,
      width: swW,
      height: 145,
      labelFr: 'Interrupteur 1',
      labelAr: 'قاطعة 1 (E1+E2)',
      state: { isClosed: false },
      terminals: [
        { id: 'da1_L', name: 'Interrupteur 1: L', code: 'L', xOffset: 38, yOffset: 130, dir: 'bottom', type: 'phase' },
        { id: 'da1_1', name: 'Interrupteur 1: 1', code: '1', xOffset: swW - 38, yOffset: 130, dir: 'bottom', type: 'retour' }
      ]
    });

    // Separate Switch 2 (Controls E3 alone)
    this.addComponent({
      id: 'sw_da2',
      type: 'switch_sa',
      x: sw2X,
      y: 225,
      width: swW,
      height: 145,
      labelFr: 'Interrupteur 2',
      labelAr: 'قاطعة 2 (E3)',
      state: { isClosed: false },
      terminals: [
        { id: 'da2_L', name: 'Interrupteur 2: L', code: 'L', xOffset: 38, yOffset: 130, dir: 'bottom', type: 'phase' },
        { id: 'da2_2', name: 'Interrupteur 2: 2', code: '2', xOffset: swW - 38, yOffset: 130, dir: 'bottom', type: 'retour' }
      ]
    });

    // 3 Lamps across bottom: E1, E2, E3
    const lampW = Math.min(115, Math.floor((this.canvasW - 24) / 3));
    const gap = Math.floor((this.canvasW - (lampW * 3)) / 4);

    // Lampe E1
    this.addComponent({
      id: 'e1',
      type: 'lamp',
      x: gap,
      y: 415,
      width: lampW,
      height: 175,
      labelFr: 'Lampe E1',
      labelAr: 'المصباح E1',
      state: { isLit: false },
      terminals: [
        { id: 'e1_L', name: 'E1: Borne L', code: 'L', xOffset: 18, yOffset: 155, dir: 'bottom', type: 'retour' },
        { id: 'e1_N', name: 'E1: Borne N', code: 'N', xOffset: Math.floor(lampW / 2), yOffset: 155, dir: 'bottom', type: 'neutre' },
        { id: 'e1_PE', name: 'E1: Borne PE', code: 'PE', xOffset: lampW - 18, yOffset: 155, dir: 'bottom', type: 'terre' }
      ]
    });

    // Lampe E2 (Parallel with E1 via Retour 1)
    this.addComponent({
      id: 'e2',
      type: 'lamp',
      x: gap * 2 + lampW,
      y: 415,
      width: lampW,
      height: 175,
      labelFr: 'Lampe E2',
      labelAr: 'المصباح E2',
      state: { isLit: false },
      terminals: [
        { id: 'e2_L', name: 'E2: Borne L', code: 'L', xOffset: 18, yOffset: 155, dir: 'bottom', type: 'retour' },
        { id: 'e2_N', name: 'E2: Borne N', code: 'N', xOffset: Math.floor(lampW / 2), yOffset: 155, dir: 'bottom', type: 'neutre' },
        { id: 'e2_PE', name: 'E2: Borne PE', code: 'PE', xOffset: lampW - 18, yOffset: 155, dir: 'bottom', type: 'terre' }
      ]
    });

    // Lampe E3 (Controlled by Switch 2)
    this.addComponent({
      id: 'e3',
      type: 'lamp',
      x: gap * 3 + lampW * 2,
      y: 415,
      width: lampW,
      height: 175,
      labelFr: 'Lampe E3',
      labelAr: 'المصباح E3',
      state: { isLit: false },
      terminals: [
        { id: 'e3_L', name: 'E3: Borne L', code: 'L', xOffset: 18, yOffset: 155, dir: 'bottom', type: 'retour' },
        { id: 'e3_N', name: 'E3: Borne N', code: 'N', xOffset: Math.floor(lampW / 2), yOffset: 155, dir: 'bottom', type: 'neutre' },
        { id: 'e3_PE', name: 'E3: Borne PE', code: 'PE', xOffset: lampW - 18, yOffset: 155, dir: 'bottom', type: 'terre' }
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
      x: cx - 65,
      y: 15,
      width: 130,
      height: 180,
      labelFr: 'Disjoncteur 10A',
      labelAr: 'قاطع الدارة 10A',
      state: { isOn: true },
      terminals: [
        { id: 'q1_L', name: 'Disjoncteur: Borne L', code: 'L', xOffset: 40, yOffset: 165, dir: 'bottom', type: 'phase' },
        { id: 'q1_N', name: 'Disjoncteur: Borne N', code: 'N', xOffset: 90, yOffset: 165, dir: 'bottom', type: 'neutre' },
        { id: 'q1_PE', name: 'Barrette PE (Terre)', code: 'PE', xOffset: 65, yOffset: 25, dir: 'top', type: 'terre' }
      ]
    });

    const swW = Math.min(160, Math.floor((this.canvasW - 32) / 2));
    const sw1X = cx - swW - 6;
    const sw2X = cx + 6;

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
      y: 225,
      width: swW,
      height: 155,
      labelFr: sw1Title,
      labelAr: variant === 'US' ? 'مفتاح 1 (US)' : 'قاطعة ذهاب/إياب 1',
      state: { position: 1 },
      terminals: [
        { id: 'vv1_L', name: 'VV1: L', code: 'L', xOffset: Math.floor(swW / 2), yOffset: 25, dir: 'top', type: 'phase' },
        { id: 'vv1_1', name: `VV1: ${term1_1_code}`, code: term1_1_code, xOffset: 32, yOffset: 140, dir: 'bottom', type: 'navette' },
        { id: 'vv1_2', name: `VV1: ${term1_2_code}`, code: term1_2_code, xOffset: swW - 32, yOffset: 140, dir: 'bottom', type: 'navette' }
      ]
    });

    // Switch VV2
    this.addComponent({
      id: 'sw_vv2',
      type: switchType,
      x: sw2X,
      y: 225,
      width: swW,
      height: 155,
      labelFr: sw2Title,
      labelAr: variant === 'US' ? 'مفتاح 2 (US)' : 'قاطعة ذهاب/إياب 2',
      state: { position: 1 },
      terminals: [
        { id: 'vv2_1', name: `VV2: ${term2_1_code}`, code: term2_1_code, xOffset: 32, yOffset: 25, dir: 'top', type: 'navette' },
        { id: 'vv2_2', name: `VV2: ${term2_2_code}`, code: term2_2_code, xOffset: swW - 32, yOffset: 25, dir: 'top', type: 'navette' },
        { id: 'vv2_L', name: 'VV2: L', code: 'L', xOffset: Math.floor(swW / 2), yOffset: 140, dir: 'bottom', type: 'retour' }
      ]
    });

    // 2 Lamps at Bottom
    const lampW = Math.min(155, Math.floor((this.canvasW - 32) / 2));
    const lamp1X = cx - lampW - 6;
    const lamp2X = cx + 6;

    this.addComponent({
      id: 'e1',
      type: 'lamp',
      x: lamp1X,
      y: 415,
      width: lampW,
      height: 180,
      labelFr: 'Lampe E1',
      labelAr: 'المصباح E1',
      state: { isLit: false },
      terminals: [
        { id: 'e1_L', name: 'E1: L', code: 'L', xOffset: 24, yOffset: 160, dir: 'bottom', type: 'retour' },
        { id: 'e1_N', name: 'E1: N', code: 'N', xOffset: Math.floor(lampW / 2), yOffset: 160, dir: 'bottom', type: 'neutre' },
        { id: 'e1_PE', name: 'E1: PE', code: 'PE', xOffset: lampW - 24, yOffset: 160, dir: 'bottom', type: 'terre' }
      ]
    });

    this.addComponent({
      id: 'e2',
      type: 'lamp',
      x: lamp2X,
      y: 415,
      width: lampW,
      height: 180,
      labelFr: 'Lampe E2',
      labelAr: 'المصباح E2 (توازي)',
      state: { isLit: false },
      terminals: [
        { id: 'e2_L', name: 'E2: L', code: 'L', xOffset: 24, yOffset: 160, dir: 'bottom', type: 'retour' },
        { id: 'e2_N', name: 'E2: N', code: 'N', xOffset: Math.floor(lampW / 2), yOffset: 160, dir: 'bottom', type: 'neutre' },
        { id: 'e2_PE', name: 'E2: PE', code: 'PE', xOffset: lampW - 24, yOffset: 160, dir: 'bottom', type: 'terre' }
      ]
    });

    this.rebuildTerminalsIndex();
  }

  // 4. TÉLÉRUPTEUR (4 FILS) WITH 3 PUSH BUTTONS - Mobile
  setupTelerupteur() {
    const cx = Math.floor(this.canvasW / 2);

    // Top: Disjoncteur and Télérupteur side by side
    const topW = Math.min(155, Math.floor((this.canvasW - 32) / 2));
    const q1X = cx - topW - 6;
    const tl1X = cx + 6;

    this.addComponent({
      id: 'q1',
      type: 'disjoncteur',
      x: q1X,
      y: 15,
      width: topW,
      height: 180,
      labelFr: 'Disjoncteur 10A',
      labelAr: 'قاطع الدارة 10A',
      state: { isOn: true },
      terminals: [
        { id: 'q1_L', name: 'Disjoncteur: L', code: 'L', xOffset: 32, yOffset: 165, dir: 'bottom', type: 'phase' },
        { id: 'q1_N', name: 'Disjoncteur: N', code: 'N', xOffset: topW - 32, yOffset: 165, dir: 'bottom', type: 'neutre' },
        { id: 'q1_PE', name: 'Barrette PE', code: 'PE', xOffset: Math.floor(topW / 2), yOffset: 25, dir: 'top', type: 'terre' }
      ]
    });

    this.addComponent({
      id: 'tl1',
      type: 'telerupteur',
      x: tl1X,
      y: 15,
      width: topW,
      height: 180,
      labelFr: 'Télérupteur 4 Fils',
      labelAr: 'مرحل نبضي (TL)',
      state: { isClosed: false },
      terminals: [
        { id: 'tl_1', name: 'TL: 1', code: '1', xOffset: 32, yOffset: 25, dir: 'top', type: 'phase' },
        { id: 'tl_A1', name: 'TL: A1', code: 'A1', xOffset: topW - 32, yOffset: 25, dir: 'top', type: 'navette' },
        { id: 'tl_2', name: 'TL: 2', code: '2', xOffset: 32, yOffset: 165, dir: 'bottom', type: 'retour' },
        { id: 'tl_A2', name: 'TL: A2', code: 'A2', xOffset: topW - 32, yOffset: 165, dir: 'bottom', type: 'neutre' }
      ]
    });

    // Middle: 3 Push Buttons in a horizontal row
    const bpW = Math.min(110, Math.floor((this.canvasW - 24) / 3));
    const gap = Math.floor((this.canvasW - (bpW * 3)) / 4);

    this.addComponent({
      id: 'bp1',
      type: 'push_button',
      x: gap,
      y: 230,
      width: bpW,
      height: 140,
      labelFr: 'BP1 (Entrée)',
      labelAr: 'زر 1 (مدخل)',
      state: { isPressed: false },
      terminals: [
        { id: 'bp1_L', name: 'BP1: L', code: 'L', xOffset: 22, yOffset: 120, dir: 'bottom', type: 'phase' },
        { id: 'bp1_out', name: 'BP1: Sortie', code: '⭳', xOffset: bpW - 22, yOffset: 120, dir: 'bottom', type: 'navette' }
      ]
    });

    this.addComponent({
      id: 'bp2',
      type: 'push_button',
      x: gap * 2 + bpW,
      y: 230,
      width: bpW,
      height: 140,
      labelFr: 'BP2 (Couloir)',
      labelAr: 'زر 2 (ممر)',
      state: { isPressed: false },
      terminals: [
        { id: 'bp2_L', name: 'BP2: L', code: 'L', xOffset: 22, yOffset: 120, dir: 'bottom', type: 'phase' },
        { id: 'bp2_out', name: 'BP2: Sortie', code: '⭳', xOffset: bpW - 22, yOffset: 120, dir: 'bottom', type: 'navette' }
      ]
    });

    this.addComponent({
      id: 'bp3',
      type: 'push_button',
      x: gap * 3 + bpW * 2,
      y: 230,
      width: bpW,
      height: 140,
      labelFr: 'BP3 (Escalier)',
      labelAr: 'زر 3 (درج)',
      state: { isPressed: false },
      terminals: [
        { id: 'bp3_L', name: 'BP3: L', code: 'L', xOffset: 22, yOffset: 120, dir: 'bottom', type: 'phase' },
        { id: 'bp3_out', name: 'BP3: Sortie', code: '⭳', xOffset: bpW - 22, yOffset: 120, dir: 'bottom', type: 'navette' }
      ]
    });

    // Bottom: 2 Lamps (E1 and E2 in parallel)
    const lampW = Math.min(155, Math.floor((this.canvasW - 32) / 2));
    const lamp1X = cx - lampW - 6;
    const lamp2X = cx + 6;

    this.addComponent({
      id: 'e1',
      type: 'lamp',
      x: lamp1X,
      y: 415,
      width: lampW,
      height: 180,
      labelFr: 'Lampe E1',
      labelAr: 'المصباح E1',
      state: { isLit: false },
      terminals: [
        { id: 'e1_L', name: 'E1: L', code: 'L', xOffset: 24, yOffset: 160, dir: 'bottom', type: 'retour' },
        { id: 'e1_N', name: 'E1: N', code: 'N', xOffset: Math.floor(lampW / 2), yOffset: 160, dir: 'bottom', type: 'neutre' },
        { id: 'e1_PE', name: 'E1: PE', code: 'PE', xOffset: lampW - 24, yOffset: 160, dir: 'bottom', type: 'terre' }
      ]
    });

    this.addComponent({
      id: 'e2',
      type: 'lamp',
      x: lamp2X,
      y: 415,
      width: lampW,
      height: 180,
      labelFr: 'Lampe E2',
      labelAr: 'المصباح E2 (توازي)',
      state: { isLit: false },
      terminals: [
        { id: 'e2_L', name: 'E2: L', code: 'L', xOffset: 24, yOffset: 160, dir: 'bottom', type: 'retour' },
        { id: 'e2_N', name: 'E2: N', code: 'N', xOffset: Math.floor(lampW / 2), yOffset: 160, dir: 'bottom', type: 'neutre' },
        { id: 'e2_PE', name: 'E2: PE', code: 'PE', xOffset: lampW - 24, yOffset: 160, dir: 'bottom', type: 'terre' }
      ]
    });

    this.rebuildTerminalsIndex();
  }

  // Generous touch hit detection with magnetic snapping to closest pin
  getTerminalAt(x, y, tolerance = 40) {
    let closest = null;
    let minDistSq = tolerance * tolerance;
    for (const t of this.terminals) {
      const dx = t.x - x;
      const dy = t.y - y;
      const distSq = dx * dx + dy * dy;
      if (distSq <= minDistSq) {
        minDistSq = distSq;
        closest = t;
      }
    }
    return closest;
  }

  // Interactive toggle with full support for window.mobileApp and easy finger targets
  handleClick(x, y) {
    let handled = false;
    for (let comp of this.components) {
      if (x >= comp.x && x <= comp.x + comp.width && y >= comp.y && y <= comp.y + comp.height) {
        // Skip if touching near a terminal node
        const nearTerminal = this.getTerminalAt(x, y, 25);
        if (nearTerminal) continue;

        const currentApp = window.mobileApp || window.app;

        if (comp.type === 'disjoncteur') {
          comp.state.isOn = !comp.state.isOn;
          if (window.soundEngine) window.soundEngine.playSwitchClick(comp.state.isOn);
          handled = true;
        } else if (comp.type === 'switch_sa') {
          comp.state.isClosed = !comp.state.isClosed;
          if (window.soundEngine) window.soundEngine.playSwitchClick(comp.state.isClosed);
          handled = true;
        } else if (comp.type === 'switch_vv' || comp.type === 'switch_3way_us') {
          comp.state.position = comp.state.position === 1 ? 2 : 1;
          if (window.soundEngine) window.soundEngine.playSwitchClick(comp.state.position === 1);
          handled = true;
        } else if (comp.type === 'push_button') {
          comp.state.isPressed = true;
          if (window.soundEngine) window.soundEngine.playSwitchClick(true);
          setTimeout(() => {
            comp.state.isPressed = false;
            if (currentApp) currentApp.evaluateCircuit();
          }, 220);
          if (currentApp) currentApp.handlePushButtonImpulse(comp.id);
          handled = true;
        } else if (comp.type === 'telerupteur') {
          comp.state.isClosed = !comp.state.isClosed;
          if (window.soundEngine) window.soundEngine.playRelayClack();
          handled = true;
        }
      }
    }
    return handled;
  }

  // Clear terminal node rendering with prominent labels, pulsating source ring, and inviting target halos
  renderTerminals(ctx, hoveredTerminal = null, selectedTerminal = null) {
    this.terminals.forEach(t => {
      ctx.save();
      const isHovered = hoveredTerminal && hoveredTerminal.id === t.id;
      const isSelected = selectedTerminal && selectedTerminal.id === t.id;
      const isPotentialTarget = selectedTerminal && !isSelected;

      // Generous pulsating touch target ring
      if (isSelected) {
        // Bright pulsating blue/cyan ring on the source terminal
        ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.radius + 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.radius + 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (isPotentialTarget) {
        // Inviting green halo around all potential target terminals
        ctx.fillStyle = 'rgba(16, 185, 129, 0.22)';
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.radius + 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(52, 211, 153, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.radius + 8, 0, Math.PI * 2);
        ctx.stroke();
      } else if (isHovered) {
        ctx.fillStyle = 'rgba(234, 88, 12, 0.4)';
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.radius + 12, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = isSelected ? '#38bdf8' : (isPotentialTarget ? '#10b981' : (isHovered ? '#f97316' : '#64748b'));
      ctx.lineWidth = 2.5;
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
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      const labelY = t.dir === 'top' ? t.y - 14 : t.y + 19;

      const textW = ctx.measureText(t.code).width + 8;
      ctx.fillStyle = isSelected ? 'rgba(2, 132, 199, 0.95)' : (isPotentialTarget ? 'rgba(5, 150, 105, 0.95)' : 'rgba(15, 23, 42, 0.9)');
      this.roundRect(ctx, t.x - textW / 2, labelY - 10, textW, 14, 3);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillText(t.code, t.x, labelY);

      ctx.restore();
    });
  }
}

window.MobileComponentManager = MobileComponentManager;
