/**
 * Electrical Components & Canvas Visual Renderer (Simplified & Realistic)
 * - Double Allumage rendered as TWO SEPARATE switch modules side-by-side (Interrupteur 1 & Interrupteur 2)
 *   looking exactly like the standard Single Switch (SA) component.
 * - Realistic single terminals: L, N, and PE on lamps (removed all artificial "Out" terminals).
 * - Students can connect MULTIPLE wires to the same terminal node for natural Repiquage.
 */

class ComponentManager {
  constructor() {
    this.components = [];
    this.terminals = [];
    this.activeMode = 'DA';
    this.vvVariant = 'FR'; // 'FR', 'DE', 'US'
  }

  setMode(mode, vvVariant = 'FR') {
    this.activeMode = mode;
    this.vvVariant = vvVariant;
    this.initModeLayout(mode);
  }

  setVvVariant(variant) {
    this.vvVariant = variant;
    if (this.activeMode === 'VV') {
      this.initModeLayout('VV');
    }
  }

  initModeLayout(mode) {
    this.components = [];
    this.terminals = [];

    switch (mode) {
      case 'SA':
        this.setupSimpleAllumage();
        break;
      case 'DA':
        this.setupDoubleAllumage();
        break;
      case 'VV':
        this.setupVaEtVient(this.vvVariant);
        break;
      case 'TL':
        this.setupTelerupteur();
        break;
    }
  }

  // 1. SIMPLE ALLUMAGE (SA)
  setupSimpleAllumage() {
    // Disjoncteur 10A
    this.addComponent({
      id: 'q1',
      type: 'disjoncteur',
      x: 60,
      y: 130,
      width: 140,
      height: 260,
      labelFr: 'Disjoncteur 10A',
      labelAr: 'قاطع الدارة 10A',
      state: { isOn: true },
      terminals: [
        { id: 'q1_L', name: 'Disjoncteur: Borne L (Phase)', code: 'L', xOffset: 45, yOffset: 240, dir: 'bottom', type: 'phase' },
        { id: 'q1_N', name: 'Disjoncteur: Borne N (Neutre)', code: 'N', xOffset: 95, yOffset: 240, dir: 'bottom', type: 'neutre' },
        { id: 'q1_PE', name: 'Barrette de Terre: Borne PE', code: 'PE', xOffset: 70, yOffset: 25, dir: 'top', type: 'terre' }
      ]
    });

    // Interrupteur Simple (SA)
    this.addComponent({
      id: 'sw1',
      type: 'switch_sa',
      x: 350,
      y: 170,
      width: 140,
      height: 180,
      labelFr: 'Interrupteur SA',
      labelAr: 'قاطعة بسيطة (SA)',
      state: { isClosed: false },
      terminals: [
        { id: 'sw1_L', name: 'Interrupteur: Borne L', code: 'L', xOffset: 45, yOffset: 160, dir: 'bottom', type: 'phase' },
        { id: 'sw1_1', name: 'Interrupteur: Borne 1', code: '1', xOffset: 95, yOffset: 160, dir: 'bottom', type: 'retour' }
      ]
    });

    // Lampe E1 with realistic standard terminals: L, N, PE
    this.addComponent({
      id: 'e1',
      type: 'lamp',
      x: 680,
      y: 130,
      width: 170,
      height: 250,
      labelFr: 'Lampe E1',
      labelAr: 'المصباح E1',
      state: { isLit: false },
      terminals: [
        { id: 'e1_L', name: 'Lampe E1: Borne L', code: 'L', xOffset: 35, yOffset: 220, dir: 'bottom', type: 'retour' },
        { id: 'e1_N', name: 'Lampe E1: Borne N', code: 'N', xOffset: 85, yOffset: 220, dir: 'bottom', type: 'neutre' },
        { id: 'e1_PE', name: 'Lampe E1: Borne PE', code: 'PE', xOffset: 135, yOffset: 220, dir: 'bottom', type: 'terre' }
      ]
    });

    this.rebuildTerminalsIndex();
  }

  // 2. DOUBLE ALLUMAGE (DA) - TWO SEPARATE SWITCH MODULES SIDE-BY-SIDE
  // Each looks exactly like the standard Single Switch (SA) component
  setupDoubleAllumage() {
    // Disjoncteur 10A
    this.addComponent({
      id: 'q1',
      type: 'disjoncteur',
      x: 40,
      y: 140,
      width: 140,
      height: 260,
      labelFr: 'Disjoncteur 10A',
      labelAr: 'قاطع الدارة 10A',
      state: { isOn: true },
      terminals: [
        { id: 'q1_L', name: 'Disjoncteur: Borne L (Phase)', code: 'L', xOffset: 45, yOffset: 240, dir: 'bottom', type: 'phase' },
        { id: 'q1_N', name: 'Disjoncteur: Borne N (Neutre)', code: 'N', xOffset: 95, yOffset: 240, dir: 'bottom', type: 'neutre' },
        { id: 'q1_PE', name: 'Barrette de Terre: Borne PE', code: 'PE', xOffset: 70, yOffset: 25, dir: 'top', type: 'terre' }
      ]
    });

    // SEPARATE SWITCH 1 (Controls E1 & E2) - Looks exactly like standard SA
    this.addComponent({
      id: 'sw_da1',
      type: 'switch_sa',
      x: 220,
      y: 160,
      width: 140,
      height: 180,
      labelFr: 'Interrupteur 1 (DA)',
      labelAr: 'قاطعة 1 (إنارة E1 + E2)',
      state: { isClosed: false },
      terminals: [
        { id: 'da1_L', name: 'Interrupteur 1: Borne L', code: 'L', xOffset: 45, yOffset: 160, dir: 'bottom', type: 'phase' },
        { id: 'da1_1', name: 'Interrupteur 1: Borne 1', code: '1', xOffset: 95, yOffset: 160, dir: 'bottom', type: 'retour' }
      ]
    });

    // SEPARATE SWITCH 2 (Controls E3) - Looks exactly like standard SA
    this.addComponent({
      id: 'sw_da2',
      type: 'switch_sa',
      x: 390,
      y: 160,
      width: 140,
      height: 180,
      labelFr: 'Interrupteur 2 (DA)',
      labelAr: 'قاطعة 2 (إنارة E3)',
      state: { isClosed: false },
      terminals: [
        { id: 'da2_L', name: 'Interrupteur 2: Borne L', code: 'L', xOffset: 45, yOffset: 160, dir: 'bottom', type: 'phase' },
        { id: 'da2_2', name: 'Interrupteur 2: Borne 2', code: '2', xOffset: 95, yOffset: 160, dir: 'bottom', type: 'retour' }
      ]
    });

    // Lampe E1 (Group 1 - Parallel) - ONLY standard L, N, PE terminals
    this.addComponent({
      id: 'e1',
      type: 'lamp',
      x: 580,
      y: 40,
      width: 165,
      height: 230,
      labelFr: 'Lampe E1 (Groupe 1)',
      labelAr: 'المصباح E1 (المجموعة 1)',
      state: { isLit: false },
      terminals: [
        { id: 'e1_L', name: 'Lampe E1: Borne L', code: 'L', xOffset: 30, yOffset: 205, dir: 'bottom', type: 'retour' },
        { id: 'e1_N', name: 'Lampe E1: Borne N', code: 'N', xOffset: 82, yOffset: 205, dir: 'bottom', type: 'neutre' },
        { id: 'e1_PE', name: 'Lampe E1: Borne PE', code: 'PE', xOffset: 135, yOffset: 205, dir: 'bottom', type: 'terre' }
      ]
    });

    // Lampe E2 (Group 1 - Parallel via Repiquage with E1) - ONLY standard L, N, PE terminals
    this.addComponent({
      id: 'e2',
      type: 'lamp',
      x: 780,
      y: 40,
      width: 165,
      height: 230,
      labelFr: 'Lampe E2 (Groupe 1)',
      labelAr: 'المصباح E2 (المجموعة 1 - توازي)',
      state: { isLit: false },
      terminals: [
        { id: 'e2_L', name: 'Lampe E2: Borne L', code: 'L', xOffset: 30, yOffset: 205, dir: 'bottom', type: 'retour' },
        { id: 'e2_N', name: 'Lampe E2: Borne N', code: 'N', xOffset: 82, yOffset: 205, dir: 'bottom', type: 'neutre' },
        { id: 'e2_PE', name: 'Lampe E2: Borne PE', code: 'PE', xOffset: 135, yOffset: 205, dir: 'bottom', type: 'terre' }
      ]
    });

    // Lampe E3 (Group 2 - Controlled by Interrupteur 2) - ONLY standard L, N, PE terminals
    this.addComponent({
      id: 'e3',
      type: 'lamp',
      x: 680,
      y: 310,
      width: 165,
      height: 230,
      labelFr: 'Lampe E3 (Groupe 2)',
      labelAr: 'المصباح E3 (المجموعة 2 - مستقل)',
      state: { isLit: false },
      terminals: [
        { id: 'e3_L', name: 'Lampe E3: Borne L', code: 'L', xOffset: 30, yOffset: 205, dir: 'bottom', type: 'retour' },
        { id: 'e3_N', name: 'Lampe E3: Borne N', code: 'N', xOffset: 82, yOffset: 205, dir: 'bottom', type: 'neutre' },
        { id: 'e3_PE', name: 'Lampe E3: Borne PE', code: 'PE', xOffset: 135, yOffset: 205, dir: 'bottom', type: 'terre' }
      ]
    });

    this.rebuildTerminalsIndex();
  }

  // 3. VA-ET-VIENT (VV)
  setupVaEtVient(variant = 'FR') {
    this.vvVariant = variant;

    // Disjoncteur 10A
    this.addComponent({
      id: 'q1',
      type: 'disjoncteur',
      x: 40,
      y: 140,
      width: 140,
      height: 260,
      labelFr: 'Disjoncteur 10A',
      labelAr: 'قاطع الدارة 10A',
      state: { isOn: true },
      terminals: [
        { id: 'q1_L', name: 'Disjoncteur: Borne L (Phase)', code: 'L', xOffset: 45, yOffset: 240, dir: 'bottom', type: 'phase' },
        { id: 'q1_N', name: 'Disjoncteur: Borne N (Neutre)', code: 'N', xOffset: 95, yOffset: 240, dir: 'bottom', type: 'neutre' },
        { id: 'q1_PE', name: 'Barrette de Terre: Borne PE', code: 'PE', xOffset: 70, yOffset: 25, dir: 'top', type: 'terre' }
      ]
    });

    let switchType = 'switch_vv';
    let sw1Title = 'Interrupteur VV1';
    let sw2Title = 'Interrupteur VV2';
    let subtext = 'Standard Français (NFC 15-100)';
    let term1_1_code = '1';
    let term1_2_code = '2';
    let term2_1_code = '1';
    let term2_2_code = '2';

    if (variant === 'DE') {
      subtext = 'Montage Allemand (Sparwechselschaltung)';
    } else if (variant === 'US') {
      switchType = 'switch_3way_us';
      sw1Title = '3-Way Switch 1 (US)';
      sw2Title = '3-Way Switch 2 (US)';
      subtext = 'Standard US (3-Way NEC)';
      term1_1_code = 'T1';
      term1_2_code = 'T2';
      term2_1_code = 'T1';
      term2_2_code = 'T2';
    }

    // Switch VV1
    this.addComponent({
      id: 'sw_vv1',
      type: switchType,
      x: 230,
      y: 160,
      width: 150,
      height: 200,
      labelFr: sw1Title,
      labelAr: variant === 'US' ? 'مفتاح ثلاثي مسار 1' : 'قاطعة ذهاب/إياب 1',
      subtextFr: subtext,
      state: { position: 1 },
      terminals: [
        { id: 'vv1_L', name: 'VV1: Borne L', code: 'L', xOffset: 75, yOffset: 25, dir: 'top', type: 'phase' },
        { id: 'vv1_1', name: `VV1: Borne ${term1_1_code}`, code: term1_1_code, xOffset: 45, yOffset: 175, dir: 'bottom', type: 'navette' },
        { id: 'vv1_2', name: `VV1: Borne ${term1_2_code}`, code: term1_2_code, xOffset: 105, yOffset: 175, dir: 'bottom', type: 'navette' }
      ]
    });

    // Switch VV2
    this.addComponent({
      id: 'sw_vv2',
      type: switchType,
      x: 430,
      y: 160,
      width: 150,
      height: 200,
      labelFr: sw2Title,
      labelAr: variant === 'US' ? 'مفتاح ثلاثي مسار 2' : 'قاطعة ذهاب/إياب 2',
      subtextFr: subtext,
      state: { position: 1 },
      terminals: [
        { id: 'vv2_1', name: `VV2: Borne ${term2_1_code}`, code: term2_1_code, xOffset: 45, yOffset: 25, dir: 'top', type: 'navette' },
        { id: 'vv2_2', name: `VV2: Borne ${term2_2_code}`, code: term2_2_code, xOffset: 105, yOffset: 25, dir: 'top', type: 'navette' },
        { id: 'vv2_L', name: 'VV2: Borne L', code: 'L', xOffset: 75, yOffset: 175, dir: 'bottom', type: 'retour' }
      ]
    });

    // Lampe E1
    this.addComponent({
      id: 'e1',
      type: 'lamp',
      x: 640,
      y: 70,
      width: 165,
      height: 230,
      labelFr: 'Lampe E1',
      labelAr: 'المصباح E1',
      state: { isLit: false },
      terminals: [
        { id: 'e1_L', name: 'Lampe E1: Borne L', code: 'L', xOffset: 30, yOffset: 205, dir: 'bottom', type: 'retour' },
        { id: 'e1_N', name: 'Lampe E1: Borne N', code: 'N', xOffset: 82, yOffset: 205, dir: 'bottom', type: 'neutre' },
        { id: 'e1_PE', name: 'Lampe E1: Borne PE', code: 'PE', xOffset: 135, yOffset: 205, dir: 'bottom', type: 'terre' }
      ]
    });

    // Lampe E2 (Parallel)
    this.addComponent({
      id: 'e2',
      type: 'lamp',
      x: 830,
      y: 70,
      width: 165,
      height: 230,
      labelFr: 'Lampe E2',
      labelAr: 'المصباح E2 (توازي)',
      state: { isLit: false },
      terminals: [
        { id: 'e2_L', name: 'Lampe E2: Borne L', code: 'L', xOffset: 30, yOffset: 205, dir: 'bottom', type: 'retour' },
        { id: 'e2_N', name: 'Lampe E2: Borne N', code: 'N', xOffset: 82, yOffset: 205, dir: 'bottom', type: 'neutre' },
        { id: 'e2_PE', name: 'Lampe E2: Borne PE', code: 'PE', xOffset: 135, yOffset: 205, dir: 'bottom', type: 'terre' }
      ]
    });

    this.rebuildTerminalsIndex();
  }

  // 4. TÉLÉRUPTEUR (4 FILS)
  setupTelerupteur() {
    this.addComponent({
      id: 'q1',
      type: 'disjoncteur',
      x: 30,
      y: 140,
      width: 130,
      height: 260,
      labelFr: 'Disjoncteur 10A',
      labelAr: 'قاطع الدارة 10A',
      state: { isOn: true },
      terminals: [
        { id: 'q1_L', name: 'Disjoncteur: Borne L', code: 'L', xOffset: 40, yOffset: 240, dir: 'bottom', type: 'phase' },
        { id: 'q1_N', name: 'Disjoncteur: Borne N', code: 'N', xOffset: 90, yOffset: 240, dir: 'bottom', type: 'neutre' },
        { id: 'q1_PE', name: 'Barrette de Terre: Borne PE', code: 'PE', xOffset: 65, yOffset: 25, dir: 'top', type: 'terre' }
      ]
    });

    this.addComponent({
      id: 'tl1',
      type: 'telerupteur',
      x: 190,
      y: 140,
      width: 140,
      height: 260,
      labelFr: 'Télérupteur 4 Fils',
      labelAr: 'مرحل نبضي (Télérupteur)',
      state: { isClosed: false },
      terminals: [
        { id: 'tl_1', name: 'Télérupteur: Borne 1', code: '1', xOffset: 40, yOffset: 25, dir: 'top', type: 'phase' },
        { id: 'tl_A1', name: 'Télérupteur: Borne A1', code: 'A1', xOffset: 100, yOffset: 25, dir: 'top', type: 'navette' },
        { id: 'tl_2', name: 'Télérupteur: Borne 2', code: '2', xOffset: 40, yOffset: 240, dir: 'bottom', type: 'retour' },
        { id: 'tl_A2', name: 'Télérupteur: Borne A2', code: 'A2', xOffset: 100, yOffset: 240, dir: 'bottom', type: 'neutre' }
      ]
    });

    this.addComponent({
      id: 'bp1',
      type: 'push_button',
      x: 360,
      y: 40,
      width: 120,
      height: 135,
      labelFr: 'BP1 (Entrée)',
      labelAr: 'زر ضاغط 1 (مدخل)',
      state: { isPressed: false },
      terminals: [
        { id: 'bp1_L', name: 'BP1: Borne L', code: 'L', xOffset: 35, yOffset: 120, dir: 'bottom', type: 'phase' },
        { id: 'bp1_out', name: 'BP1: Borne Sortie', code: '⭳', xOffset: 85, yOffset: 120, dir: 'bottom', type: 'navette' }
      ]
    });

    this.addComponent({
      id: 'bp2',
      type: 'push_button',
      x: 360,
      y: 195,
      width: 120,
      height: 135,
      labelFr: 'BP2 (Couloir)',
      labelAr: 'زر ضاغط 2 (ممر)',
      state: { isPressed: false },
      terminals: [
        { id: 'bp2_L', name: 'BP2: Borne L', code: 'L', xOffset: 35, yOffset: 120, dir: 'bottom', type: 'phase' },
        { id: 'bp2_out', name: 'BP2: Borne Sortie', code: '⭳', xOffset: 85, yOffset: 120, dir: 'bottom', type: 'navette' }
      ]
    });

    this.addComponent({
      id: 'bp3',
      type: 'push_button',
      x: 360,
      y: 350,
      width: 120,
      height: 135,
      labelFr: 'BP3 (Escalier)',
      labelAr: 'زر ضاغط 3 (درج)',
      state: { isPressed: false },
      terminals: [
        { id: 'bp3_L', name: 'BP3: Borne L', code: 'L', xOffset: 35, yOffset: 120, dir: 'bottom', type: 'phase' },
        { id: 'bp3_out', name: 'BP3: Borne Sortie', code: '⭳', xOffset: 85, yOffset: 120, dir: 'bottom', type: 'navette' }
      ]
    });

    this.addComponent({
      id: 'e1',
      type: 'lamp',
      x: 580,
      y: 130,
      width: 165,
      height: 230,
      labelFr: 'Lampe E1',
      labelAr: 'المصباح E1',
      state: { isLit: false },
      terminals: [
        { id: 'e1_L', name: 'Lampe E1: Borne L', code: 'L', xOffset: 30, yOffset: 205, dir: 'bottom', type: 'retour' },
        { id: 'e1_N', name: 'Lampe E1: Borne N', code: 'N', xOffset: 82, yOffset: 205, dir: 'bottom', type: 'neutre' },
        { id: 'e1_PE', name: 'Lampe E1: Borne PE', code: 'PE', xOffset: 135, yOffset: 205, dir: 'bottom', type: 'terre' }
      ]
    });

    this.addComponent({
      id: 'e2',
      type: 'lamp',
      x: 780,
      y: 130,
      width: 165,
      height: 230,
      labelFr: 'Lampe E2',
      labelAr: 'المصباح E2 (توازي)',
      state: { isLit: false },
      terminals: [
        { id: 'e2_L', name: 'Lampe E2: Borne L', code: 'L', xOffset: 30, yOffset: 205, dir: 'bottom', type: 'retour' },
        { id: 'e2_N', name: 'Lampe E2: Borne N', code: 'N', xOffset: 82, yOffset: 205, dir: 'bottom', type: 'neutre' },
        { id: 'e2_PE', name: 'Lampe E2: Borne PE', code: 'PE', xOffset: 135, yOffset: 205, dir: 'bottom', type: 'terre' }
      ]
    });

    this.rebuildTerminalsIndex();
  }

  addComponent(comp) {
    this.components.push(comp);
  }

  getComponentAt(x, y) {
    for (let i = this.components.length - 1; i >= 0; i--) {
      const comp = this.components[i];
      if (x >= comp.x && x <= comp.x + comp.width && y >= comp.y && y <= comp.y + comp.height) {
        return comp;
      }
    }
    return null;
  }

  // Create new component dynamically (Full Component Management)
  createNewComponent(type, options = {}) {
    const idSuffix = Math.random().toString(36).substring(2, 7);
    let comp = null;

    // Calculate smart coordinate offset so new component doesn't overlap
    const existingCount = this.components.length;
    const defaultX = Math.min(60 + (existingCount * 80) % 700, 850);
    const defaultY = Math.min(100 + (existingCount * 45) % 250, 380);

    const x = options.x !== undefined ? options.x : defaultX;
    const y = options.y !== undefined ? options.y : defaultY;

    switch (type) {
      case 'disjoncteur': {
        const dCount = this.components.filter(c => c.type === 'disjoncteur').length + 1;
        const id = options.id || `q_${idSuffix}`;
        const labelFr = options.labelFr || `Disjoncteur ${dCount === 1 ? '10A' : `${dCount * 10}A`}`;
        const labelAr = options.labelAr || `قاطع الدارة ${dCount === 1 ? '10A' : `${dCount * 10}A`}`;
        comp = {
          id,
          type: 'disjoncteur',
          x, y,
          width: 140,
          height: 260,
          labelFr,
          labelAr,
          state: { isOn: true },
          terminals: [
            { id: `${id}_L`, name: `${labelFr}: Borne L (Phase)`, code: 'L', xOffset: 45, yOffset: 240, dir: 'bottom', type: 'phase' },
            { id: `${id}_N`, name: `${labelFr}: Borne N (Neutre)`, code: 'N', xOffset: 95, yOffset: 240, dir: 'bottom', type: 'neutre' },
            { id: `${id}_PE`, name: `${labelFr}: Borne PE (Terre)`, code: 'PE', xOffset: 70, yOffset: 25, dir: 'top', type: 'terre' }
          ]
        };
        break;
      }

      case 'switch_sa': {
        const sCount = this.components.filter(c => c.type === 'switch_sa').length + 1;
        const id = options.id || `sw_${idSuffix}`;
        const labelFr = options.labelFr || `Interrupteur SA ${sCount}`;
        const labelAr = options.labelAr || `قاطعة بسيطة ${sCount}`;
        comp = {
          id,
          type: 'switch_sa',
          x, y,
          width: 140,
          height: 180,
          labelFr,
          labelAr,
          state: { isClosed: false },
          terminals: [
            { id: `${id}_L`, name: `${labelFr}: Borne L`, code: 'L', xOffset: 45, yOffset: 160, dir: 'bottom', type: 'phase' },
            { id: `${id}_1`, name: `${labelFr}: Borne 1`, code: '1', xOffset: 95, yOffset: 160, dir: 'bottom', type: 'retour' }
          ]
        };
        break;
      }

      case 'switch_vv': {
        const vvCount = this.components.filter(c => c.type === 'switch_vv' || c.type === 'switch_3way_us').length + 1;
        const id = options.id || `sw_vv_${idSuffix}`;
        const labelFr = options.labelFr || `Interrupteur VV ${vvCount}`;
        const labelAr = options.labelAr || `قاطعة ذهاب/إياب ${vvCount}`;
        comp = {
          id,
          type: 'switch_vv',
          x, y,
          width: 150,
          height: 200,
          labelFr,
          labelAr,
          subtextFr: 'Standard Français (NFC 15-100)',
          state: { position: 1 },
          terminals: [
            { id: `${id}_L`, name: `${labelFr}: Borne L`, code: 'L', xOffset: 75, yOffset: 25, dir: 'top', type: 'phase' },
            { id: `${id}_1`, name: `${labelFr}: Borne 1`, code: '1', xOffset: 45, yOffset: 175, dir: 'bottom', type: 'navette' },
            { id: `${id}_2`, name: `${labelFr}: Borne 2`, code: '2', xOffset: 105, yOffset: 175, dir: 'bottom', type: 'navette' }
          ]
        };
        break;
      }

      case 'push_button': {
        const bpCount = this.components.filter(c => c.type === 'push_button').length + 1;
        const id = options.id || `bp_${idSuffix}`;
        const labelFr = options.labelFr || `BP${bpCount} (Bouton)`;
        const labelAr = options.labelAr || `زر ضاغط ${bpCount}`;
        comp = {
          id,
          type: 'push_button',
          x, y,
          width: 120,
          height: 135,
          labelFr,
          labelAr,
          state: { isPressed: false },
          terminals: [
            { id: `${id}_L`, name: `${labelFr}: Borne L`, code: 'L', xOffset: 35, yOffset: 120, dir: 'bottom', type: 'phase' },
            { id: `${id}_out`, name: `${labelFr}: Borne Sortie`, code: '⭳', xOffset: 85, yOffset: 120, dir: 'bottom', type: 'navette' }
          ]
        };
        break;
      }

      case 'telerupteur': {
        const tlCount = this.components.filter(c => c.type === 'telerupteur').length + 1;
        const id = options.id || `tl_${idSuffix}`;
        const labelFr = options.labelFr || `Télérupteur ${tlCount}`;
        const labelAr = options.labelAr || `مرحل نبضي ${tlCount}`;
        comp = {
          id,
          type: 'telerupteur',
          x, y,
          width: 140,
          height: 260,
          labelFr,
          labelAr,
          state: { isClosed: false },
          terminals: [
            { id: `${id}_1`, name: `${labelFr}: Borne 1`, code: '1', xOffset: 40, yOffset: 25, dir: 'top', type: 'phase' },
            { id: `${id}_A1`, name: `${labelFr}: Borne A1`, code: 'A1', xOffset: 100, yOffset: 25, dir: 'top', type: 'navette' },
            { id: `${id}_2`, name: `${labelFr}: Borne 2`, code: '2', xOffset: 40, yOffset: 240, dir: 'bottom', type: 'retour' },
            { id: `${id}_A2`, name: `${labelFr}: Borne A2`, code: 'A2', xOffset: 100, yOffset: 240, dir: 'bottom', type: 'neutre' }
          ]
        };
        break;
      }

      case 'lamp': {
        const lCount = this.components.filter(c => c.type === 'lamp').length + 1;
        const id = options.id || `e_${idSuffix}`;
        const labelFr = options.labelFr || `Lampe E${lCount}`;
        const labelAr = options.labelAr || `المصباح E${lCount}`;
        // Realistic Single Terminals: STRICTLY L, N, PE!
        comp = {
          id,
          type: 'lamp',
          x, y,
          width: 165,
          height: 230,
          labelFr,
          labelAr,
          state: { isLit: false },
          terminals: [
            { id: `${id}_L`, name: `${labelFr}: Borne L`, code: 'L', xOffset: 30, yOffset: 205, dir: 'bottom', type: 'retour' },
            { id: `${id}_N`, name: `${labelFr}: Borne N`, code: 'N', xOffset: 82, yOffset: 205, dir: 'bottom', type: 'neutre' },
            { id: `${id}_PE`, name: `${labelFr}: Borne PE`, code: 'PE', xOffset: 135, yOffset: 205, dir: 'bottom', type: 'terre' }
          ]
        };
        break;
      }
    }

    if (comp) {
      this.components.push(comp);
      this.rebuildTerminalsIndex();
    }

    return comp;
  }

  // Remove component and clean all connected wires
  removeComponent(compId) {
    const idx = this.components.findIndex(c => c.id === compId);
    if (idx === -1) return false;
    const comp = this.components[idx];
    const terminalIds = comp.terminals ? comp.terminals.map(t => t.id) : [];

    this.components.splice(idx, 1);
    this.rebuildTerminalsIndex();

    if (window.wireRouter) {
      window.wireRouter.removeWiresConnectedToTerminals(terminalIds);
      window.wireRouter.recomputeAllPaths(this);
    }

    return true;
  }

  // Duplicate an existing component
  duplicateComponent(compId) {
    const comp = this.getComponentById(compId);
    if (!comp) return null;

    const newX = Math.min(comp.x + 35, 950);
    const newY = Math.min(comp.y + 35, 420);

    return this.createNewComponent(comp.type, {
      x: newX,
      y: newY,
      labelFr: `${comp.labelFr} (Copie)`,
      labelAr: `${comp.labelAr} (نسخة)`
    });
  }

  // Rename component labels
  renameComponent(compId, labelAr, labelFr) {
    const comp = this.getComponentById(compId);
    if (!comp) return false;
    if (labelAr) comp.labelAr = labelAr;
    if (labelFr) comp.labelFr = labelFr;

    if (comp.terminals) {
      comp.terminals.forEach(t => {
        t.name = `${comp.labelFr}: Borne ${t.code}`;
      });
    }

    this.rebuildTerminalsIndex();
    return true;
  }

  // Render selection box with handles and drag badge
  renderSelection(ctx, selectedComponentId) {
    if (!selectedComponentId) return;
    const comp = this.getComponentById(selectedComponentId);
    if (!comp) return;

    ctx.save();
    ctx.shadowColor = 'rgba(6, 182, 212, 0.7)';
    ctx.shadowBlur = 12;

    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 4]);

    const margin = 6;
    const sx = comp.x - margin;
    const sy = comp.y - margin;
    const sw = comp.width + margin * 2;
    const sh = comp.height + margin * 2;

    this.roundRect(ctx, sx, sy, sw, sh, 10);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.shadowColor = 'transparent';

    // 4 Corner handles
    const handleSize = 8;
    const corners = [
      { x: sx, y: sy },
      { x: sx + sw, y: sy },
      { x: sx, y: sy + sh },
      { x: sx + sw, y: sy + sh }
    ];
    corners.forEach(c => {
      ctx.fillStyle = '#06b6d4';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.fillRect(c.x - handleSize / 2, c.y - handleSize / 2, handleSize, handleSize);
      ctx.strokeRect(c.x - handleSize / 2, c.y - handleSize / 2, handleSize, handleSize);
    });

    // Top pill badge: [✥ اسحب للتحريك | Déplacer]
    const tagW = 130;
    const tagH = 22;
    const tagX = comp.x + comp.width / 2 - tagW / 2;
    const tagY = sy - 26;

    ctx.fillStyle = '#0891b2';
    this.roundRect(ctx, tagX, tagY, tagW, tagH, 6);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Cairo, Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✥ اسحب لتحريك الجهاز', comp.x + comp.width / 2, tagY + 15);

    ctx.restore();
  }

  rebuildTerminalsIndex() {
    this.terminals = [];
    this.components.forEach(comp => {
      if (comp.terminals) {
        comp.terminals.forEach(t => {
          this.terminals.push({
            id: t.id,
            compId: comp.id,
            name: t.name,
            code: t.code,
            x: comp.x + t.xOffset,
            y: comp.y + t.yOffset,
            dir: t.dir,
            type: t.type,
            radius: 9
          });
        });
      }
    });
  }

  getTerminalById(id) {
    return this.terminals.find(t => t.id === id);
  }

  getComponentById(id) {
    return this.components.find(c => c.id === id);
  }

  getTerminalAt(x, y, tolerance = 15) {
    return this.terminals.find(t => {
      const dx = t.x - x;
      const dy = t.y - y;
      return (dx * dx + dy * dy) <= (tolerance * tolerance);
    });
  }

  handleClick(x, y) {
    let handled = false;
    for (let comp of this.components) {
      if (x >= comp.x && x <= comp.x + comp.width && y >= comp.y && y <= comp.y + comp.height) {
        if (comp.type === 'disjoncteur') {
          const leverY = comp.y + 110;
          if (y >= leverY - 25 && y <= leverY + 45) {
            comp.state.isOn = !comp.state.isOn;
            if (window.soundEngine) window.soundEngine.playSwitchClick(comp.state.isOn);
            handled = true;
          }
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
            if (window.app) window.app.evaluateCircuit();
          }, 220);
          if (window.app) window.app.handlePushButtonImpulse(comp.id);
          handled = true;
        } else if (comp.type === 'telerupteur') {
          const leverY = comp.y + 110;
          if (y >= leverY - 20 && y <= leverY + 40) {
            comp.state.isClosed = !comp.state.isClosed;
            if (window.soundEngine) window.soundEngine.playRelayClack();
            handled = true;
          }
        }
      }
    }
    return handled;
  }

  renderBodies(ctx) {
    this.components.forEach(comp => {
      switch (comp.type) {
        case 'disjoncteur':
          this.renderDisjoncteur(ctx, comp);
          break;
        case 'switch_sa':
          this.renderSwitchSA(ctx, comp);
          break;
        case 'switch_vv':
        case 'switch_3way_us':
          this.renderSwitchVV(ctx, comp);
          break;
        case 'telerupteur':
          this.renderTelerupteur(ctx, comp);
          break;
        case 'push_button':
          this.renderPushButton(ctx, comp);
          break;
        case 'lamp':
          this.renderLamp(ctx, comp);
          break;
      }
    });
  }

  renderTerminals(ctx, hoveredTerminal = null, selectedTerminal = null) {
    this.terminals.forEach(t => {
      ctx.save();
      const isHovered = hoveredTerminal && hoveredTerminal.id === t.id;
      const isSelected = selectedTerminal && selectedTerminal.id === t.id;

      if (isSelected || isHovered) {
        ctx.fillStyle = isSelected ? 'rgba(59, 130, 246, 0.45)' : 'rgba(234, 88, 12, 0.4)';
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.radius + 7, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = isSelected ? '#3b82f6' : (isHovered ? '#f97316' : '#64748b');
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      const screwGrad = ctx.createRadialGradient(t.x - 2, t.y - 2, 1, t.x, t.y, t.radius - 2);
      screwGrad.addColorStop(0, '#f8fafc');
      screwGrad.addColorStop(0.5, '#cbd5e1');
      screwGrad.addColorStop(1, '#64748b');

      ctx.fillStyle = screwGrad;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.radius - 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(t.x - 3.5, t.y);
      ctx.lineTo(t.x + 3.5, t.y);
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      const labelY = t.dir === 'top' ? t.y - 12 : t.y + 18;

      const textW = ctx.measureText(t.code).width + 6;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      this.roundRect(ctx, t.x - textW / 2, labelY - 9, textW, 12, 3);
      ctx.fill();

      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(t.code, t.x, labelY);

      ctx.restore();
    });
  }

  render(ctx, hoveredTerminal = null, selectedTerminal = null) {
    this.renderBodies(ctx);
    this.renderTerminals(ctx, hoveredTerminal, selectedTerminal);
  }

  renderDisjoncteur(ctx, comp) {
    const { x, y, width, height, state, labelFr, labelAr } = comp;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;

    ctx.fillStyle = '#f1f5f9';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    this.roundRect(ctx, x, y, width, height, 8);
    ctx.fill();
    ctx.stroke();
    ctx.shadowColor = 'transparent';

    ctx.fillStyle = '#e2e8f0';
    this.roundRect(ctx, x + 6, y + 6, width - 12, 35, 4);
    ctx.fill();
    this.roundRect(ctx, x + 6, y + height - 42, width - 12, 36, 4);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 10, y + 48, width - 20, 160);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NF C 15-100', x + width / 2, y + 66);

    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 15px Inter, sans-serif';
    ctx.fillText('C10', x + width / 2 - 25, y + 88);

    ctx.fillStyle = '#475569';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillText('4500A 230V~', x + width / 2 + 25, y + 88);

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 11px Cairo, sans-serif';
    ctx.fillText(labelAr, x + width / 2, y + 175);
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(labelFr, x + width / 2, y + 190);

    const flagY = y + 104;
    ctx.fillStyle = state.isOn ? '#ef4444' : '#22c55e';
    ctx.fillRect(x + width / 2 - 14, flagY, 28, 8);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + width / 2 - 14, flagY, 28, 8);

    const leverY = y + 118;
    const leverH = 34;
    const leverW = 38;
    const leverX = x + width / 2 - leverW / 2;

    ctx.fillStyle = '#1e293b';
    this.roundRect(ctx, leverX, leverY, leverW, leverH, 5);
    ctx.fill();

    ctx.fillStyle = state.isOn ? '#ea580c' : '#475569';
    const knobY = state.isOn ? leverY + 2 : leverY + leverH - 14;
    this.roundRect(ctx, leverX + 4, knobY, leverW - 8, 12, 3);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px Inter, sans-serif';
    ctx.fillText(state.isOn ? 'I (ON)' : 'O (OFF)', x + width / 2, knobY + 9);

    ctx.fillStyle = '#15803d';
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    ctx.fillText('⏚ PE Barrette', x + 70, y + 42);

    ctx.restore();
  }

  // RENDER SINGLE SWITCH (SA) - Also used for each of the two DA switches!
  renderSwitchSA(ctx, comp) {
    const { x, y, width, height, state, labelFr, labelAr } = comp;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 3;

    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    this.roundRect(ctx, x, y, width, height, 12);
    ctx.fill();
    ctx.stroke();
    ctx.shadowColor = 'transparent';

    const rw = width - 40;
    const rh = 80;
    const rx = x + 20;
    const ry = y + 25;

    ctx.fillStyle = state.isClosed ? '#eff6ff' : '#f1f5f9';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    this.roundRect(ctx, rx, ry, rw, rh, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = state.isClosed ? '#2563eb' : '#64748b';
    ctx.beginPath();
    ctx.arc(rx + rw / 2, ry + rh / 2, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = state.isClosed ? '#1d4ed8' : '#64748b';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.isClosed ? 'FERMÉ (ON)' : 'OUVERT (OFF)', x + width / 2, ry + rh - 10);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 11px Cairo, sans-serif';
    ctx.fillText(labelAr, x + width / 2, y + 128);

    ctx.fillStyle = '#64748b';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText(labelFr, x + width / 2, y + 143);

    ctx.restore();
  }

  renderSwitchVV(ctx, comp) {
    const { x, y, width, height, state, labelFr, labelAr, type } = comp;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 3;

    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    this.roundRect(ctx, x, y, width, height, 12);
    ctx.fill();
    ctx.stroke();
    ctx.shadowColor = 'transparent';

    if (type === 'switch_3way_us') {
      const cx = x + width / 2;
      const cy = y + 90;

      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(cx - 15, cy - 35, 30, 70);
      ctx.strokeStyle = '#94a3b8';
      ctx.strokeRect(cx - 15, cy - 35, 30, 70);

      ctx.fillStyle = '#1e293b';
      const leverOffset = state.position === 1 ? -16 : 16;
      this.roundRect(ctx, cx - 8, cy + leverOffset - 10, 16, 20, 4);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(state.position === 1 ? 'UP' : 'DOWN', cx, cy + leverOffset + 4);
    } else {
      const rw = width - 40;
      const rh = 70;
      const rx = x + 20;
      const ry = y + 45;

      ctx.fillStyle = '#f1f5f9';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      this.roundRect(ctx, rx, ry, rw, rh, 6);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(rx + 15, ry + rh / 2);
      if (state.position === 1) {
        ctx.lineTo(rx + rw - 15, ry + 18);
      } else {
        ctx.lineTo(rx + rw - 15, ry + rh - 18);
      }
      ctx.stroke();

      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(rx + 15, ry + rh / 2, 4, 0, Math.PI * 2);
      ctx.arc(rx + rw - 15, ry + 18, 4, 0, Math.PI * 2);
      ctx.arc(rx + rw - 15, ry + 18, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px Cairo, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(labelAr, x + width / 2, y + 25);

    ctx.fillStyle = '#ea580c';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.fillText(`Position: ${state.position}`, x + width / 2, y + 138);

    ctx.fillStyle = '#64748b';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText(labelFr, x + width / 2, y + 153);

    ctx.restore();
  }

  renderTelerupteur(ctx, comp) {
    const { x, y, width, height, state, labelFr, labelAr } = comp;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;

    ctx.fillStyle = '#f1f5f9';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    this.roundRect(ctx, x, y, width, height, 8);
    ctx.fill();
    ctx.stroke();
    ctx.shadowColor = 'transparent';

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 8, y + 45, width - 16, 170);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Télérupteur 16A', x + width / 2, y + 65);

    ctx.fillStyle = '#64748b';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillText('Bobine A1-A2 230V~', x + width / 2, y + 80);
    ctx.fillText('Contact 1-2 NO', x + width / 2, y + 95);

    ctx.fillStyle = state.isClosed ? '#ea580c' : '#94a3b8';
    this.roundRect(ctx, x + width / 2 - 15, y + 105, 30, 16, 4);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.fillText(state.isClosed ? '1 (ON)' : '0 (OFF)', x + width / 2, y + 117);

    const leverY = y + 130;
    ctx.fillStyle = '#1e293b';
    this.roundRect(ctx, x + width / 2 - 20, leverY, 40, 24, 4);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 9px Inter, sans-serif';
    ctx.fillText('MANUEL', x + width / 2, leverY + 16);

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 11px Cairo, sans-serif';
    ctx.fillText(labelAr, x + width / 2, y + 185);

    ctx.restore();
  }

  renderPushButton(ctx, comp) {
    const { x, y, width, height, state, labelFr, labelAr } = comp;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;

    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    this.roundRect(ctx, x, y, width, height, 10);
    ctx.fill();
    ctx.stroke();
    ctx.shadowColor = 'transparent';

    const cx = x + width / 2;
    const cy = y + 50;
    const radius = 26;

    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = state.isPressed ? '#3b82f6' : '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, radius - (state.isPressed ? 6 : 4), 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = state.isPressed ? '#ffffff' : '#0284c7';
    ctx.font = 'bold 17px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⭳', cx, cy + 6);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 11px Cairo, sans-serif';
    ctx.fillText(labelAr, cx, y + 96);
    ctx.fillStyle = '#64748b';
    ctx.font = '9px Inter, sans-serif';
    ctx.fillText(labelFr, cx, y + 108);

    ctx.restore();
  }

  // RENDER LAMPE DCL (Standard real-world single terminals: L, N, PE)
  renderLamp(ctx, comp) {
    const { x, y, width, height, state, labelFr, labelAr } = comp;

    ctx.save();
    const cx = x + width / 2;
    const bulbY = y + 68;
    const bulbRadius = 35;

    if (state.isLit) {
      const glowGrad = ctx.createRadialGradient(cx, bulbY, 10, cx, bulbY, bulbRadius + 45);
      glowGrad.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
      glowGrad.addColorStop(0.35, 'rgba(250, 204, 21, 0.75)');
      glowGrad.addColorStop(0.7, 'rgba(245, 158, 11, 0.35)');
      glowGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');

      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, bulbY, bulbRadius + 45, 0, Math.PI * 2);
      ctx.fill();
    }

    const bulbGrad = ctx.createRadialGradient(cx - 10, bulbY - 12, 5, cx, bulbY, bulbRadius);
    if (state.isLit) {
      bulbGrad.addColorStop(0, '#ffffff');
      bulbGrad.addColorStop(0.3, '#fef08a');
      bulbGrad.addColorStop(0.85, '#f59e0b');
      bulbGrad.addColorStop(1, '#d97706');
    } else {
      bulbGrad.addColorStop(0, '#f8fafc');
      bulbGrad.addColorStop(0.6, '#cbd5e1');
      bulbGrad.addColorStop(1, '#94a3b8');
    }

    ctx.fillStyle = bulbGrad;
    ctx.strokeStyle = state.isLit ? '#b45309' : '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, bulbY, bulbRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = state.isLit ? '#ffffff' : '#475569';
    ctx.lineWidth = state.isLit ? 2.5 : 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 10, bulbY + 12);
    ctx.lineTo(cx - 5, bulbY - 8);
    ctx.lineTo(cx, bulbY - 4);
    ctx.lineTo(cx + 5, bulbY - 8);
    ctx.lineTo(cx + 10, bulbY + 12);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.fillRect(cx - 14, bulbY + bulbRadius - 4, 28, 16);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - 14, bulbY + bulbRadius - 4, 28, 16);

    // DCL Box Housing
    const boxY = y + 120;
    const boxH = height - 120;
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    this.roundRect(ctx, x + 6, boxY, width - 12, boxH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = state.isLit ? '#b45309' : '#0f172a';
    ctx.font = 'bold 12px Cairo, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(labelAr, cx, boxY + 20);

    ctx.fillStyle = '#64748b';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText(labelFr, cx, boxY + 34);

    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.fillStyle = '#334155';
    ctx.fillText('Bornier DCL (L, N, PE)', cx, boxY + 48);

    ctx.restore();
  }

  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}

window.ComponentManager = ComponentManager;
window.componentManager = new ComponentManager();
