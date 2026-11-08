/**
 * Electrical Continuity & Simulation Engine (Simplified & Realistic Terminals)
 * - Two separate SA-style switches for Double Allumage (sw_da1 & sw_da2)
 * - Standard realistic single terminals (L, N, PE) on lamps and components
 * - Supports multiple wire attachments on the same terminal node for natural Repiquage
 */

class CircuitEngine {
  constructor(componentManager, wireRouter) {
    this.cm = componentManager;
    this.wr = wireRouter;
    this.lastEvaluation = null;
  }

  simulate() {
    const breakers = this.cm.components.filter(c => c.type === 'disjoncteur');
    const lamps = this.cm.components.filter(c => c.type === 'lamp');
    lamps.forEach(l => l.state.isLit = false);

    if (breakers.length === 0) {
      return {
        success: false,
        breakerTripped: false,
        messageAr: 'لا يوجد قاطع رئيسي في الدارة! يرجى إضافة قاطع 10A للتغذية والحماية.',
        messageFr: 'Aucun disjoncteur présent dans le circuit.',
        lampsLit: []
      };
    }

    const anyBreakerOn = breakers.some(b => b.state && b.state.isOn);
    if (!anyBreakerOn) {
      return {
        success: false,
        breakerTripped: false,
        messageAr: 'القاطع الرئيسي 10A في وضع إيقاف (OFF). ارفع ذراع القاطع لبدء التغذية الكهربائية.',
        messageFr: 'Le disjoncteur 10A est ouvert (OFF). Enclenchez le disjoncteur.',
        lampsLit: []
      };
    }

    const graph = this.buildConnectivityGraph();

    // Check each active breaker for short-circuit between Phase and Neutre/Earth
    for (const b of breakers) {
      if (!b.state.isOn) continue;
      const bTermL = b.terminals && b.terminals.find(t => t.code === 'L');
      const bTermN = b.terminals && b.terminals.find(t => t.code === 'N');
      const bTermPE = b.terminals && b.terminals.find(t => t.code === 'PE');
      const phaseSource = bTermL ? bTermL.id : `${b.id}_L`;
      const neutreSource = bTermN ? bTermN.id : `${b.id}_N`;
      const terreSource = bTermPE ? bTermPE.id : `${b.id}_PE`;

      const phaseNodes = this.getConnectedNodes(phaseSource, graph);

      if (phaseNodes.has(neutreSource) || phaseNodes.has(terreSource)) {
        b.state.isOn = false;
        if (window.soundEngine) window.soundEngine.playShortCircuit();

        const canvas = document.getElementById('circuitCanvas');
        if (canvas) {
          canvas.classList.add('flash-short-circuit');
          setTimeout(() => canvas.classList.remove('flash-short-circuit'), 600);
        }

        return {
          success: false,
          breakerTripped: true,
          messageAr: `🚨 خطر دارة قصيرة (Court-circuit)! اتصال مباشر بين الطور والمحايد أو التأريض أدى لفصل ${b.labelAr || 'القاطع'} آلياً.`,
          messageFr: 'Court-circuit franc détecté ! Déclenchement instantané du disjoncteur.',
          lampsLit: []
        };
      }
    }

    // Collect all energized Phase and Neutral nodes from all active breakers
    const allPhaseNodes = new Set();
    const allNeutreNodes = new Set();
    const allTerreNodes = new Set();

    breakers.filter(b => b.state.isOn).forEach(b => {
      const bTermL = b.terminals && b.terminals.find(t => t.code === 'L');
      const bTermN = b.terminals && b.terminals.find(t => t.code === 'N');
      const bTermPE = b.terminals && b.terminals.find(t => t.code === 'PE');
      const pSrc = bTermL ? bTermL.id : `${b.id}_L`;
      const nSrc = bTermN ? bTermN.id : `${b.id}_N`;
      const peSrc = bTermPE ? bTermPE.id : `${b.id}_PE`;

      this.getConnectedNodes(pSrc, graph).forEach(n => allPhaseNodes.add(n));
      this.getConnectedNodes(nSrc, graph).forEach(n => allNeutreNodes.add(n));
      this.getConnectedNodes(peSrc, graph).forEach(n => allTerreNodes.add(n));
    });

    // Evaluate illumination for each lamp
    const litLamps = [];
    lamps.forEach(lamp => {
      const lPin = lamp.terminals && lamp.terminals.find(t => t.code === 'L');
      const nPin = lamp.terminals && lamp.terminals.find(t => t.code === 'N');
      const lPinId = lPin ? lPin.id : `${lamp.id}_L`;
      const nPinId = nPin ? nPin.id : `${lamp.id}_N`;

      const hasPhase = allPhaseNodes.has(lPinId);
      const hasNeutre = allNeutreNodes.has(nPinId);

      if (hasPhase && hasNeutre) {
        lamp.state.isLit = true;
        litLamps.push(lamp.id);
      } else {
        lamp.state.isLit = false;
      }
    });

    return {
      success: true,
      breakerTripped: false,
      litLamps,
      lampsLit: litLamps,
      phaseNodes: allPhaseNodes,
      neutreNodes: allNeutreNodes,
      terreNodes: allTerreNodes
    };
  }

  triggerPushButtonImpulse(bpId) {
    const activeBreakers = this.cm.components.filter(c => c.type === 'disjoncteur' && c.state.isOn);
    if (activeBreakers.length === 0) return;

    const bp = this.cm.getComponentById(bpId);
    if (!bp) return;

    const tL = bp.terminals && bp.terminals.find(t => t.code === 'L');
    const tOut = bp.terminals && bp.terminals.find(t => t.code !== 'L');
    const bpLId = tL ? tL.id : `${bpId}_L`;
    const bpOutId = tOut ? tOut.id : `${bpId}_out`;

    const graph = this.buildConnectivityGraph();
    if (!graph.has(bpLId)) graph.set(bpLId, new Set());
    if (!graph.has(bpOutId)) graph.set(bpOutId, new Set());
    graph.get(bpLId).add(bpOutId);
    graph.get(bpOutId).add(bpLId);

    const allPhaseNodes = new Set();
    const allNeutreNodes = new Set();
    activeBreakers.forEach(b => {
      const bTermL = b.terminals && b.terminals.find(t => t.code === 'L');
      const bTermN = b.terminals && b.terminals.find(t => t.code === 'N');
      const pSrc = bTermL ? bTermL.id : `${b.id}_L`;
      const nSrc = bTermN ? bTermN.id : `${b.id}_N`;
      this.getConnectedNodes(pSrc, graph).forEach(n => allPhaseNodes.add(n));
      this.getConnectedNodes(nSrc, graph).forEach(n => allNeutreNodes.add(n));
    });

    const relays = this.cm.components.filter(c => c.type === 'telerupteur');
    relays.forEach(tl => {
      const tA1 = tl.terminals && tl.terminals.find(t => t.code === 'A1');
      const tA2 = tl.terminals && tl.terminals.find(t => t.code === 'A2');
      const a1Id = tA1 ? tA1.id : 'tl_A1';
      const a2Id = tA2 ? tA2.id : 'tl_A2';

      const a1HasPhase = allPhaseNodes.has(a1Id);
      const a2HasNeutre = allNeutreNodes.has(a2Id);

      if (a1HasPhase && a2HasNeutre) {
        tl.state.isClosed = !tl.state.isClosed;
        if (window.soundEngine) window.soundEngine.playRelayClack();
      }
    });

    // Minuterie Électrique (Schneider Electric MIN 15363)
    const minuteries = this.cm.components.filter(c => c.type === 'minuterie');
    minuteries.forEach(min => {
      const tL = min.terminals && min.terminals.find(t => t.code === 'L');
      const tN = min.terminals && min.terminals.find(t => t.code === 'N');
      const t3 = min.terminals && min.terminals.find(t => t.code === '3');
      const t4 = min.terminals && min.terminals.find(t => t.code === '4');

      const lId = tL ? tL.id : (this.cm.getTerminalById('min_L') ? 'min_L' : `${min.id}_L`);
      const nId = tN ? tN.id : (this.cm.getTerminalById('min_N') ? 'min_N' : `${min.id}_N`);
      const t3Id = t3 ? t3.id : (this.cm.getTerminalById('min_3') ? 'min_3' : `${min.id}_3`);
      const t4Id = t4 ? t4.id : (this.cm.getTerminalById('min_4') ? 'min_4' : `${min.id}_4`);

      const hasPhasePower = allPhaseNodes.has(lId);
      const hasNeutrePower = allNeutreNodes.has(nId);

      // In Schneider MIN 15363 4-wire, buttons pulse phase to terminal 4 (or 3)
      const ctrlPulsed = allPhaseNodes.has(t4Id) || allPhaseNodes.has(t3Id);

      if (hasPhasePower && hasNeutrePower && ctrlPulsed) {
        // Trigger or Re-arm timer
        min.state.isClosed = true;
        min.state.isTiming = true;
        min.state.remainingSeconds = min.state.durationSeconds || 30;

        if (window.soundEngine) window.soundEngine.playRelayClack();

        if (min._timerInterval) {
          clearInterval(min._timerInterval);
        }

        min._timerInterval = setInterval(() => {
          if (min.state.remainingSeconds > 0) {
            min.state.remainingSeconds--;
          }
          if (min.state.remainingSeconds <= 0) {
            clearInterval(min._timerInterval);
            min._timerInterval = null;
            min.state.isTiming = false;
            if (min.state.mode !== 'permanent') {
              min.state.isClosed = false;
            }
            if (window.soundEngine) window.soundEngine.playRelayClack();
            const currentApp = window.app || window.mobileApp;
            if (currentApp && currentApp.evaluateCircuit) currentApp.evaluateCircuit();
          }
          const currentApp = window.app || window.mobileApp;
          if (currentApp && currentApp.render) currentApp.render();
        }, 1000);
      }
    });
  }

  evaluateAudit() {
    const mode = this.cm.activeMode;
    const report = {
      mode,
      isValid: false,
      status: 'pending',
      checks: [],
      generalMessageAr: '',
      generalMessageFr: '',
      colorWarnings: []
    };

    const q1 = this.cm.getComponentById('q1');
    if (!q1 || !q1.state.isOn) {
      report.status = 'error';
      report.generalMessageAr = 'القاطع 10A مفصول (OFF). ارفع ذراع القاطع لإجراء الفحص.';
      report.generalMessageFr = 'Disjoncteur 10A déclenché ou ouvert.';
      report.checks.push({ label: 'حالة القاطع (Disjoncteur)', pass: false, desc: 'القاطع في وضع إيقاف' });
      return report;
    }

    report.checks.push({ label: 'تغذية القاطع 10A (Alimentation)', pass: true, desc: 'القاطع في وضع تشغيل (ON)' });

    this.auditWireColors(report);

    switch (mode) {
      case 'SA':
        this.auditSimpleAllumage(report);
        break;
      case 'DA':
        this.auditDoubleAllumage(report);
        break;
      case 'VV':
        this.auditVaEtVient(report);
        break;
      case 'TL':
        this.auditTelerupteur(report);
        break;
      case 'MIN':
        this.auditMinuterie(report);
        break;
      default:
        this.auditCustomCircuit(report);
        break;
    }

    this.lastEvaluation = report;
    return report;
  }

  auditCustomCircuit(report) {
    const rawGraph = this.buildWiringOnlyGraph();
    const breakers = this.cm.components.filter(c => c.type === 'disjoncteur');
    const lamps = this.cm.components.filter(c => c.type === 'lamp');

    let allLampsValid = lamps.length > 0;
    lamps.forEach(lamp => {
      const lPin = lamp.terminals && lamp.terminals.find(t => t.code === 'L');
      const nPin = lamp.terminals && lamp.terminals.find(t => t.code === 'N');
      const pePin = lamp.terminals && lamp.terminals.find(t => t.code === 'PE');

      const hasNeutre = breakers.some(b => {
        const bn = b.terminals && b.terminals.find(t => t.code === 'N');
        return bn && nPin && this.pathExists(bn.id, nPin.id, rawGraph);
      });

      const hasTerre = breakers.some(b => {
        const bpe = b.terminals && b.terminals.find(t => t.code === 'PE');
        return bpe && pePin && this.pathExists(bpe.id, pePin.id, rawGraph);
      });

      const pass = hasNeutre;
      report.checks.push({
        label: `توصيل ${lamp.labelAr || 'المصباح'} (N & PE)`,
        pass,
        desc: hasNeutre ? (hasTerre ? 'المحايد والتأريض موصولان' : 'المحايد متصل - يفضل وصل التأريض PE') : 'المحايد N غير متصل بالمصباح'
      });

      if (!hasNeutre) allLampsValid = false;
    });

    const isConform = allLampsValid && report.colorWarnings.length === 0;
    report.isValid = isConform;
    report.status = isConform ? 'success' : (lamps.length === 0 ? 'idle' : 'error');
    if (isConform) {
      report.generalMessageAr = '✅ التركيب متوافق! يمكنك تجربة تشغيل القواطع والمفاتيح وملاحظة توهج المصابيح.';
      report.generalMessageFr = 'Montage conforme et fonctionnel !';
      if (window.soundEngine) window.soundEngine.playSuccessChime();
    } else {
      report.generalMessageAr = lamps.length === 0 ? 'لوحة العمل جاهزة لإضافة المكونات وتوصيلها بحرية.' : '❌ التركيب غير مكتمل. يرجى مراجعة توصيلات المحايد والطور.';
      report.generalMessageFr = 'Montage incomplet.';
    }
  }

  auditWireColors(report) {
    this.wr.wires.forEach(w => {
      const p1 = this.cm.getTerminalById(w.fromId);
      const p2 = this.cm.getTerminalById(w.toId);
      if (!p1 || !p2) return;

      if (w.color === '#2563eb') {
        if (p1.type === 'phase' || p2.type === 'phase') {
          report.colorWarnings.push('⚠️ مخالفة معايير NFC 15-100: تم استخدام سلك أزرق (Neutre) لنقل الطور. اللون الأزرق مخصص حصراً للمحايد.');
        }
      }

      if (w.type === 'terre' || w.color === '#16a34a') {
        if (p1.type !== 'terre' || p2.type !== 'terre') {
          report.colorWarnings.push('⚠️ مخالفة خطيرة: تم استخدام سلك التأريض (الأصفر/الأخضر) لأغراض أخرى غير الحماية الأرضية.');
        }
      }
    });
  }

  // 1. AUDIT SIMPLE ALLUMAGE (SA)
  auditSimpleAllumage(report) {
    const rawGraph = this.buildWiringOnlyGraph();

    const phaseToSw = this.pathExists('q1_L', 'sw1_L', rawGraph);
    report.checks.push({
      label: 'توصيل الطور بالقاطعة (Phase -> SA: L)',
      pass: phaseToSw,
      desc: phaseToSw ? 'الطور متصل بمدخل القاطعة L' : 'الطور غير متصل بالقاطعة'
    });

    const swToLamp = this.pathExists('sw1_1', 'e1_L', rawGraph);
    report.checks.push({
      label: 'سلك الراجع للمصباح (Retour -> E1: L)',
      pass: swToLamp,
      desc: swToLamp ? 'سلك الراجع واصل للطرف L للمصباح E1' : 'سلك الراجع غير موصول'
    });

    const neutreToLamp = this.pathExists('q1_N', 'e1_N', rawGraph);
    report.checks.push({
      label: 'سلك المحايد (Neutre -> E1: N)',
      pass: neutreToLamp,
      desc: neutreToLamp ? 'المحايد متصل بقطب المصباح N' : 'المحايد غير متصل بالمصباح'
    });

    const isFullyOperational = phaseToSw && swToLamp && neutreToLamp;
    report.isValid = isFullyOperational;
    report.status = isFullyOperational ? 'success' : 'error';

    if (isFullyOperational) {
      report.generalMessageAr = '✅ التوصيل سليم ومكتمل! انقر على القاطعة SA لاختبار تشغيل المصباح E1.';
      report.generalMessageFr = 'Câblage Simple Allumage conforme et opérationnel !';
      if (window.soundEngine) window.soundEngine.playSuccessChime();
    } else {
      report.generalMessageAr = '❌ التوصيل غير مكتمل. يرجى إتمام توصيل مسارات الطور والمحايد والراجع.';
      report.generalMessageFr = 'Câblage incomplet.';
    }
  }

  // 2. AUDIT DOUBLE ALLUMAGE (DA) - TWO SEPARATE SWITCHES (sw_da1 & sw_da2)
  auditDoubleAllumage(report) {
    const rawGraph = this.buildWiringOnlyGraph();

    // 1. Phase feeding both separate switches (sw_da1: L and sw_da2: L)
    const phaseToDA1 = this.pathExists('q1_L', 'da1_L', rawGraph);
    const phaseToDA2 = this.pathExists('q1_L', 'da2_L', rawGraph) || this.pathExists('da1_L', 'da2_L', rawGraph);
    const phaseValid = phaseToDA1 && phaseToDA2;

    report.checks.push({
      label: 'تغذية الطور للقاطعتين (Phase -> Interrupteur 1 & 2)',
      pass: phaseValid,
      desc: phaseValid ? 'الطور متصل بمدخل L لكل من القاطعتين (مباشرة أو عبر تسلسل/جسور)' : 'يجب تغذية مدخل L في كلا القاطعتين بالطور'
    });

    // 2. Interrupteur 1 (da1_1) controls Lamp E1 AND Lamp E2 in parallel
    const da1ToE1 = this.pathExists('da1_1', 'e1_L', rawGraph);
    const da1ToE2 = this.pathExists('da1_1', 'e2_L', rawGraph) || this.pathExists('e1_L', 'e2_L', rawGraph);
    const btn1ControlsBoth = da1ToE1 && da1ToE2;

    report.checks.push({
      label: 'القاطعة 1 تتحكم في مصباحين بالتوازي (Interrupteur 1 -> E1 & E2)',
      pass: btn1ControlsBoth,
      desc: btn1ControlsBoth ? 
        'القاطعة 1 متصلة بالمصباحين E1 و E2 على التوازي عبر سلك الراجع والـ Repiquage' : 
        'يجب ربط القاطعة 1 بكلا المصباحين E1 و E2 على التوازي!'
    });

    // 3. Interrupteur 2 (da2_2) controls Lamp E3 alone
    const da2ToE3 = this.pathExists('da2_2', 'e3_L', rawGraph);
    report.checks.push({
      label: 'القاطعة 2 تتحكم في المصباح E3 منفرداً (Interrupteur 2 -> E3)',
      pass: da2ToE3,
      desc: da2ToE3 ? 'القاطعة 2 متصلة بسلك الراجع للمصباح E3' : 'القاطعة 2 غير متصلة بالمصباح E3'
    });

    // 4. Neutral (Neutre) Repiquage across all 3 lamps (e1_N, e2_N, e3_N)
    const neutreToE1 = this.pathExists('q1_N', 'e1_N', rawGraph);
    const neutreToE2 = this.pathExists('q1_N', 'e2_N', rawGraph) || this.pathExists('e1_N', 'e2_N', rawGraph);
    const neutreToE3 = this.pathExists('q1_N', 'e3_N', rawGraph) || this.pathExists('e2_N', 'e3_N', rawGraph) || this.pathExists('e1_N', 'e3_N', rawGraph);
    const neutreValid = neutreToE1 && neutreToE2 && neutreToE3;

    report.checks.push({
      label: 'المحايد والتسلسل بين المصابيح الثلاثة (Neutre & Repiquage E1, E2, E3)',
      pass: neutreValid,
      desc: neutreValid ? 
        'المحايد موصول بالتسلسل (Repiquage) بين أقطاب N للمصابيح الثلاثة' : 
        'تأكد من إيصال المحايد للمصابيح الثلاثة (مباشرة أو بسحب سلك من قطب N لمصباح لآخر)'
    });

    const isFullyOperational = phaseValid && btn1ControlsBoth && da2ToE3 && neutreValid;
    report.isValid = isFullyOperational;
    report.status = isFullyOperational ? 'success' : 'error';

    if (isFullyOperational) {
      report.generalMessageAr = '🎉 ممتاز جداً! التوصيل سليم ومطابق: القاطعة 1 تتحكم في مصباحين (E1+E2) على التوازي، والقاطعة 2 تتحكم في مصباح (E3)، مع تطبيق التسلسل (Repiquage) بنجاح.';
      report.generalMessageFr = 'Câblage Double Allumage conforme ! Interrupteur 1 = E1+E2, Interrupteur 2 = E3.';
      if (window.soundEngine) window.soundEngine.playSuccessChime();
    } else {
      report.generalMessageAr = '⚠️ الدائرة غير مكتملة. تأكد من تغذية القاطعتين بالطور، وربط القاطعة 1 بـ E1 و E2، والقاطعة 2 بـ E3، وتسلسل المحايد.';
      report.generalMessageFr = 'Vérifiez les connexions du Double Allumage et le repiquage.';
    }
  }

  // 3. AUDIT VA-ET-VIENT (VV)
  auditVaEtVient(report) {
    const rawGraph = this.buildWiringOnlyGraph();
    const variant = this.cm.vvVariant;

    if (variant === 'FR' || variant === 'US') {
      const phaseToVV1 = this.pathExists('q1_L', 'vv1_L', rawGraph);
      report.checks.push({
        label: variant === 'US' ? 'Hot Line -> SW1 (Common)' : 'تغذية الطور للقاطعة الأولى (Phase -> VV1: L)',
        pass: phaseToVV1,
        desc: phaseToVV1 ? 'الطور متصل بقطب المشترك للقاطعة الأولى' : 'الطور غير متصل بالقاطعة الأولى'
      });

      const nav1 = this.pathExists('vv1_1', 'vv2_1', rawGraph) || this.pathExists('vv1_1', 'vv2_2', rawGraph);
      const nav2 = this.pathExists('vv1_2', 'vv2_2', rawGraph) || this.pathExists('vv1_2', 'vv2_1', rawGraph);
      const navettesValid = nav1 && nav2;
      report.checks.push({
        label: variant === 'US' ? 'Travelers (T1 & T2 between switches)' : 'سلكا التبادل (Navettes 1 & 2)',
        pass: navettesValid,
        desc: navettesValid ? 'سلكا التبادل موصولان بنجاح بين القاطعتين' : 'أسلاك التبادل غير متصلة بين القاطعتين'
      });

      const vv2ToE1 = this.pathExists('vv2_L', 'e1_L', rawGraph);
      const vv2ToE2 = this.pathExists('vv2_L', 'e2_L', rawGraph) || this.pathExists('e1_L', 'e2_L', rawGraph);
      const retourValid = vv2ToE1 && vv2ToE2;
      report.checks.push({
        label: 'سلك الراجع للمصابيح (Retour -> E1 & E2)',
        pass: retourValid,
        desc: retourValid ? 'سلك الراجع يغذي المصباحين على التوازي' : 'سلك الراجع غير واصل للمصابيح'
      });

      const neutreToE1 = this.pathExists('q1_N', 'e1_N', rawGraph);
      const neutreToE2 = this.pathExists('q1_N', 'e2_N', rawGraph) || this.pathExists('e1_N', 'e2_N', rawGraph);
      const neutreValid = neutreToE1 && neutreToE2;

      const isFullyOperational = phaseToVV1 && navettesValid && retourValid && neutreValid;
      report.isValid = isFullyOperational;
      report.status = isFullyOperational ? 'success' : 'error';

      if (isFullyOperational) {
        report.generalMessageAr = variant === 'US' ? 
          '✅ توصيل دارة المفتاح ثلاثي المسار (US 3-Way Switch) مطابق لمعايير NEC!' :
          '✅ توصيل دارة الذهاب والإياب (Va-et-vient Français) سليم تماماً وفق NFC 15-100!';
        report.generalMessageFr = 'Va-et-vient conforme et opérationnel !';
        if (window.soundEngine) window.soundEngine.playSuccessChime();
      } else {
        report.generalMessageAr = '❌ دارة الذهاب والإياب غير مكتملة. تفقد توصيل أسلاك التبادل والراجع.';
        report.generalMessageFr = 'Circuit Va-et-vient incomplet.';
      }
    } else if (variant === 'DE') {
      const phaseToS1 = this.pathExists('q1_L', 'vv1_1', rawGraph);
      const phaseToS2 = this.pathExists('q1_L', 'vv2_1', rawGraph) || this.pathExists('vv1_1', 'vv2_1', rawGraph);
      const phaseValid = phaseToS1 && phaseToS2;

      report.checks.push({
        label: 'تغذية الطور للمفتاحين (Phase -> S1:1 & S2:1)',
        pass: phaseValid,
        desc: phaseValid ? 'الطور متصل بالطرف 1 لكلا المفتاحين' : 'يجب تغذية الطرف 1 في كلا المفتاحين بالطور'
      });

      const retourToS1 = this.pathExists('vv1_2', 'e1_L', rawGraph);
      const retourToS2 = this.pathExists('vv2_2', 'e1_L', rawGraph) || this.pathExists('vv1_2', 'vv2_2', rawGraph);
      const retourValid = retourToS1 && retourToS2;

      report.checks.push({
        label: 'سلك الراجع للمفتاحين (Retour Lampe -> S1:2 & S2:2)',
        pass: retourValid,
        desc: retourValid ? 'سلك الراجع متصل بالطرف 2 لكلا المفتاحين' : 'يجب ربط الطرف 2 في كلا المفتاحين براجع المصابيح'
      });

      const singleTraveler = this.pathExists('vv1_L', 'vv2_L', rawGraph);
      report.checks.push({
        label: 'سلك التبادل الوحيد (Einzeldraht Navette: S1:L -> S2:L)',
        pass: singleTraveler,
        desc: singleTraveler ? 'سلك التبادل الأحادي يربط بين قطبي المشترك L للمفتاحين' : 'يجب ربط L في المفتاح الأول بـ L في المفتاح الثاني'
      });

      const neutreToE1 = this.pathExists('q1_N', 'e1_N', rawGraph);
      const neutreToE2 = this.pathExists('q1_N', 'e2_N', rawGraph) || this.pathExists('e1_N', 'e2_N', rawGraph);
      const neutreValid = neutreToE1 && neutreToE2;

      const isFullyOperational = phaseValid && retourValid && singleTraveler && neutreValid;
      report.isValid = isFullyOperational;
      report.status = isFullyOperational ? 'success' : 'error';

      if (isFullyOperational) {
        report.generalMessageAr = '✅ توصيل التركيب الاقتصادي الألماني (Sparwechselschaltung) سليم ومطابق لمعايير VDE!';
        report.generalMessageFr = 'Montage allemand Sparwechselschaltung conforme et opérationnel !';
        if (window.soundEngine) window.soundEngine.playSuccessChime();
      } else {
        report.generalMessageAr = '❌ تركيب Sparwechselschaltung غير مكتمل. راجع توصيل الأطراف 1 (طور) و 2 (راجع) والمشترك L.';
        report.generalMessageFr = 'Sparwechselschaltung incomplet.';
      }
    }
  }

  // 4. AUDIT TÉLÉRUPTEUR (4 FILS)
  auditTelerupteur(report) {
    const rawGraph = this.buildWiringOnlyGraph();

    const phaseToBP1 = this.pathExists('q1_L', 'bp1_L', rawGraph);
    const phaseToBP2 = this.pathExists('q1_L', 'bp2_L', rawGraph) || this.pathExists('bp1_L', 'bp2_L', rawGraph);
    const phaseToBP3 = this.pathExists('q1_L', 'bp3_L', rawGraph) || this.pathExists('bp2_L', 'bp3_L', rawGraph);
    const phaseToTL1 = this.pathExists('q1_L', 'tl_1', rawGraph);

    const allButtonsPowered = phaseToBP1 && phaseToBP2 && phaseToBP3 && phaseToTL1;
    report.checks.push({
      label: 'تغذية الطور الدائم (Phase -> BP1, BP2, BP3 & Contact 1)',
      pass: allButtonsPowered,
      desc: allButtonsPowered ? 
        'الطور متصل بالأزرار الضاغطة الثلاثة وملامس القدرة 1' : 
        'تأكد من تغذية الأزرار الثلاثة BP1, BP2, BP3 وملامس المرحل 1 بالطور'
    });

    const bp1ToA1 = this.pathExists('bp1_out', 'tl_A1', rawGraph) || this.pathExists('bp2_out', 'tl_A1', rawGraph);
    const bp2ToA1 = this.pathExists('bp2_out', 'tl_A1', rawGraph) || this.pathExists('bp1_out', 'bp2_out', rawGraph);
    const bp3ToA1 = this.pathExists('bp3_out', 'tl_A1', rawGraph) || this.pathExists('bp2_out', 'bp3_out', rawGraph) || this.pathExists('bp1_out', 'bp3_out', rawGraph);

    const allButtonsControlCoil = bp1ToA1 && bp2ToA1 && bp3ToA1;
    report.checks.push({
      label: 'ربط نبضات الأزرار بالوشيعة (BP1, BP2, BP3 -> Bobine A1)',
      pass: allButtonsControlCoil,
      desc: allButtonsControlCoil ? 
        'جميع الأزرار الضاغطة الثلاثة موصولة على التوازي بوشيعة المرحل A1' : 
        'يجب ربط مخارج الأزرار الثلاثة على التوازي بالوشيعة A1'
    });

    const neutreToA2 = this.pathExists('q1_N', 'tl_A2', rawGraph);
    report.checks.push({
      label: 'محايد الوشيعة (Neutre -> Bobine A2)',
      pass: neutreToA2,
      desc: neutreToA2 ? 'المحايد متصل بوشيعة المرحل A2' : 'وشيعة المرحل A2 تحتاج إلى سلك المحايد N'
    });

    const contactToLamps = this.pathExists('tl_2', 'e1_L', rawGraph) &&
      (this.pathExists('tl_2', 'e2_L', rawGraph) || this.pathExists('e1_L', 'e2_L', rawGraph));

    report.checks.push({
      label: 'مخرج القدرة للمصابيح (Contact 2 -> Lampes E1 & E2)',
      pass: contactToLamps,
      desc: contactToLamps ? 'مخرج المرحل 2 يغذي المصابيح بالتوازي والتسلسل' : 'المخرج 2 غير متصل بالمصابيح'
    });

    const neutreToLamps = this.pathExists('q1_N', 'e1_N', rawGraph) &&
      (this.pathExists('q1_N', 'e2_N', rawGraph) || this.pathExists('e1_N', 'e2_N', rawGraph));

    report.checks.push({
      label: 'المحايد للمصابيح (Neutre -> Lampes E1 & E2)',
      pass: neutreToLamps,
      desc: neutreToLamps ? 'المحايد متصل بالمصابيح' : 'المحايد غير متصل بالمصابيح'
    });

    const isFullyOperational = allButtonsPowered && allButtonsControlCoil && neutreToA2 && contactToLamps && neutreToLamps;
    report.isValid = isFullyOperational;
    report.status = isFullyOperational ? 'success' : 'error';

    if (isFullyOperational) {
      report.generalMessageAr = '✅ دارة المرحل النبضي (Télérupteur 4 Fils) متصلة بنجاح مع الأزرار الثلاثة (BP1, BP2, BP3) والمصابيح المتوازية!';
      report.generalMessageFr = 'Télérupteur 4 Fils à 3 boutons poussoirs opérationnel et conforme !';
      if (window.soundEngine) window.soundEngine.playSuccessChime();
    } else {
      report.generalMessageAr = '❌ دارة المرحل النبضي غير مكتملة. تأكد من ربط الأزرار الثلاثة على التوازي مع الوشيعة.';
      report.generalMessageFr = 'Circuit Télérupteur incomplet.';
    }
  }

  // 5. AUDIT MINUTERIE ÉLECTRIQUE SCHNEIDER 15363 (NFC 15-100)
  auditMinuterie(report) {
    const rawGraph = this.buildWiringOnlyGraph();

    // 1. Minuterie Power Supply (Phase -> MIN:L)
    const minLId = this.cm.getTerminalById('min_L') ? 'min_L' : 'min1_L';
    const phaseToMin = this.pathExists('q1_L', minLId, rawGraph);
    report.checks.push({
      label: 'تغذية مؤقت الإنارة بالطور (Phase -> Minuterie Borne L)',
      pass: phaseToMin,
      desc: phaseToMin ? 'سلك الطور متصل بالطرف L لمؤقت الإنارة' : 'يجب تغذية الطرف L لمؤقت الإنارة بسلك الطور (Phase)'
    });

    // 2. Minuterie Neutral Supply (Neutre -> MIN:N)
    const minNId = this.cm.getTerminalById('min_N') ? 'min_N' : 'min1_N';
    const neutreToMin = this.pathExists('q1_N', minNId, rawGraph);
    report.checks.push({
      label: 'محايد مؤقت الإنارة (Neutre -> Minuterie Borne N)',
      pass: neutreToMin,
      desc: neutreToMin ? 'المحايد متصل بالطرف N لتغذية محرك/إلكترونيات المؤقت' : 'يجب وصل المحايد N لتغذية المؤقت'
    });

    // 3. Phase to all Push Buttons (q1_L -> bp1_L, bp2_L, bp3_L)
    const phaseToBP1 = this.pathExists('q1_L', 'bp1_L', rawGraph);
    const phaseToBP2 = this.pathExists('q1_L', 'bp2_L', rawGraph) || this.pathExists('bp1_L', 'bp2_L', rawGraph);
    const phaseToBP3 = this.pathExists('q1_L', 'bp3_L', rawGraph) || this.pathExists('bp2_L', 'bp3_L', rawGraph);
    const allButtonsPhase = phaseToBP1 && phaseToBP2 && phaseToBP3;
    report.checks.push({
      label: 'تغذية الأزرار الضاغطة بالطور (Phase -> BP1, BP2, BP3)',
      pass: allButtonsPhase,
      desc: allButtonsPhase ? 'الطور متصل بجميع الأزرار الضاغطة بالتسلسل والتفرع' : 'تأكد من تغذية مدخل كل زر ضاغط بالطور'
    });

    // 4. Push Buttons Return to Minuterie Control Terminal (Borne 4 or 3)
    const minCtrlId = this.cm.getTerminalById('min_4') ? 'min_4' : (this.cm.getTerminalById('min1_4') ? 'min1_4' : 'min_3');
    const minCtrlAltId = this.cm.getTerminalById('min_3') ? 'min_3' : 'min1_3';
    const bp1ToCtrl = this.pathExists('bp1_out', minCtrlId, rawGraph) || this.pathExists('bp1_out', minCtrlAltId, rawGraph) || this.pathExists('bp2_out', minCtrlId, rawGraph);
    const bp2ToCtrl = this.pathExists('bp2_out', minCtrlId, rawGraph) || this.pathExists('bp2_out', minCtrlAltId, rawGraph) || this.pathExists('bp1_out', 'bp2_out', rawGraph);
    const bp3ToCtrl = this.pathExists('bp3_out', minCtrlId, rawGraph) || this.pathExists('bp3_out', minCtrlAltId, rawGraph) || this.pathExists('bp2_out', 'bp3_out', rawGraph) || this.pathExists('bp1_out', 'bp3_out', rawGraph);
    const allButtonsControl = bp1ToCtrl && bp2ToCtrl && bp3ToCtrl;
    report.checks.push({
      label: 'خط التحكم من الأزرار للمؤقت (BP1, BP2, BP3 -> Borne 4)',
      pass: allButtonsControl,
      desc: allButtonsControl ? 'مخارج الأزرار الثلاثة مربوطة على التوازي بمدخل التحكم بالمؤقت' : 'يجب ربط مخارج الأزرار بالتوازي مع مدخل التحكم بالمؤقت (Borne 4)'
    });

    // 5. Minuterie Output to Lamps (Borne 3 or 4 -> E1_L, E2_L)
    const minLampId = this.cm.getTerminalById('min_3') ? 'min_3' : (this.cm.getTerminalById('min1_3') ? 'min1_3' : 'min_4');
    const minLampAltId = this.cm.getTerminalById('min_4') ? 'min_4' : 'min1_4';
    const minToLamps = (this.pathExists(minLampId, 'e1_L', rawGraph) || this.pathExists(minLampAltId, 'e1_L', rawGraph)) &&
      (this.pathExists(minLampId, 'e2_L', rawGraph) || this.pathExists(minLampAltId, 'e2_L', rawGraph) || this.pathExists('e1_L', 'e2_L', rawGraph));
    report.checks.push({
      label: 'مخرج القدرة المؤقت للمصابيح (Sortie 3 -> E1 & E2)',
      pass: minToLamps,
      desc: minToLamps ? 'مخرج المؤقت 3 يغذي مصابيح الإنارة بالتفرع' : 'يجب توصيل مخرج المؤقت (Borne 3) بمدخل المصابيح'
    });

    // 6. Neutral to Lamps (q1_N -> E1_N, E2_N)
    const neutreToLamps = this.pathExists('q1_N', 'e1_N', rawGraph) &&
      (this.pathExists('q1_N', 'e2_N', rawGraph) || this.pathExists('e1_N', 'e2_N', rawGraph));
    report.checks.push({
      label: 'محايد المصابيح (Neutre -> E1 & E2)',
      pass: neutreToLamps,
      desc: neutreToLamps ? 'المحايد متصل بجميع المصابيح' : 'يجب توصيل المحايد N بالمصابيح'
    });

    // 7. Earth PE to Lamps (q1_PE -> E1_PE, E2_PE)
    const terreToLamps = this.pathExists('q1_PE', 'e1_PE', rawGraph) &&
      (this.pathExists('q1_PE', 'e2_PE', rawGraph) || this.pathExists('e1_PE', 'e2_PE', rawGraph));
    report.checks.push({
      label: 'سلك التأريض الوقائي للمصابيح (Terre PE -> E1 & E2)',
      pass: terreToLamps,
      desc: terreToLamps ? 'التأريض PE متصل بهياكل المصابيح (مطابق لمعيار NFC 15-100)' : 'يرجى ربط سلك التأريض الوقائي PE بالمصابيح'
    });

    this.auditWireColors(report);

    const allPassed = report.checks.every(c => c.pass);
    const colorsValid = report.colorWarnings.length === 0;
    report.isValid = allPassed && colorsValid;
    report.status = report.isValid ? 'success' : 'error';

    if (report.isValid) {
      report.generalMessageAr = '✅ دارة مؤقت الإنارة (Minuterie Schneider 15363) مكتملة ومطابقة 100% لمعيار NFC 15-100!';
      report.generalMessageFr = 'Montage Minuterie 4 fils conforme et fonctionnel !';
      if (window.soundEngine) window.soundEngine.playSuccessChime();
    } else {
      report.generalMessageAr = '❌ توجد أخطاء أو نواقص في دارة مؤقت الإنارة. راجع قائمة الفحص أعلاه.';
      report.generalMessageFr = 'Montage Minuterie incomplet ou non conforme.';
    }
  }

  // BUILD DYNAMIC CONNECTIVITY GRAPH
  buildConnectivityGraph(includeImpulse = true) {
    const adj = new Map();
    const addEdge = (u, v) => {
      if (!adj.has(u)) adj.set(u, new Set());
      if (!adj.has(v)) adj.set(v, new Set());
      adj.get(u).add(v);
      adj.get(v).add(u);
    };

    // External wires
    this.wr.wires.forEach(w => {
      addEdge(w.fromId, w.toId);
    });

    // Component internal switches
    this.cm.components.forEach(comp => {
      if (comp.type === 'switch_sa' && comp.state && comp.state.isClosed) {
        if (comp.id === 'sw1') addEdge('sw1_L', 'sw1_1');
        else if (comp.id === 'sw_da1') addEdge('da1_L', 'da1_1');
        else if (comp.id === 'sw_da2') addEdge('da2_L', 'da2_2');
        else {
          const tL = comp.terminals && comp.terminals.find(t => t.code === 'L');
          const t1 = comp.terminals && comp.terminals.find(t => t.code !== 'L');
          if (tL && t1) addEdge(tL.id, t1.id);
        }
      } else if (comp.type === 'switch_vv' || comp.type === 'switch_3way_us') {
        if (comp.id === 'sw_vv1') {
          if (comp.state.position === 1) addEdge('vv1_L', 'vv1_1');
          else addEdge('vv1_L', 'vv1_2');
        } else if (comp.id === 'sw_vv2') {
          if (comp.state.position === 1) addEdge('vv2_L', 'vv2_1');
          else addEdge('vv2_L', 'vv2_2');
        } else {
          const tL = comp.terminals && comp.terminals.find(t => t.code === 'L');
          const t1 = comp.terminals && comp.terminals.find(t => t.code === '1' || t.code === 'T1');
          const t2 = comp.terminals && comp.terminals.find(t => t.code === '2' || t.code === 'T2');
          if (tL && t1 && t2) {
            if (comp.state.position === 1) addEdge(tL.id, t1.id);
            else addEdge(tL.id, t2.id);
          }
        }
      } else if (comp.type === 'telerupteur') {
        if (comp.state && comp.state.isClosed) {
          const t1 = comp.terminals && comp.terminals.find(t => t.code === '1');
          const t2 = comp.terminals && comp.terminals.find(t => t.code === '2');
          if (t1 && t2) addEdge(t1.id, t2.id);
          else addEdge('tl_1', 'tl_2');
        }
      } else if (comp.type === 'minuterie') {
        const isClosed = (comp.state && (comp.state.mode === 'permanent' || comp.state.isClosed || comp.state.isTiming));
        if (isClosed) {
          const tL = comp.terminals && comp.terminals.find(t => t.code === 'L');
          const t3 = comp.terminals && comp.terminals.find(t => t.code === '3');
          const t4 = comp.terminals && comp.terminals.find(t => t.code === '4');
          const lId = tL ? tL.id : (this.cm.getTerminalById('min_L') ? 'min_L' : `${comp.id}_L`);
          const t3Id = t3 ? t3.id : (this.cm.getTerminalById('min_3') ? 'min_3' : `${comp.id}_3`);
          const t4Id = t4 ? t4.id : (this.cm.getTerminalById('min_4') ? 'min_4' : `${comp.id}_4`);
          // Internal contact connects Phase L to output terminals
          addEdge(lId, t3Id);
          addEdge(lId, t4Id);
        }
      } else if (comp.type === 'push_button' && includeImpulse && comp.state && comp.state.isPressed) {
        const tL = comp.terminals && comp.terminals.find(t => t.code === 'L');
        const tOut = comp.terminals && comp.terminals.find(t => t.code !== 'L');
        if (tL && tOut) addEdge(tL.id, tOut.id);
        else addEdge(`${comp.id}_L`, `${comp.id}_out`);
      }
    });

    return adj;
  }

  // BUILD WIRING-ONLY GRAPH
  buildWiringOnlyGraph() {
    const adj = new Map();
    const addEdge = (u, v) => {
      if (!adj.has(u)) adj.set(u, new Set());
      if (!adj.has(v)) adj.set(v, new Set());
      adj.get(u).add(v);
      adj.get(v).add(u);
    };

    this.wr.wires.forEach(w => {
      addEdge(w.fromId, w.toId);
    });

    return adj;
  }

  pathExists(startId, targetId, graph) {
    if (!graph.has(startId)) return false;
    const visited = new Set();
    const queue = [startId];
    visited.add(startId);

    while (queue.length > 0) {
      const curr = queue.shift();
      if (curr === targetId) return true;

      const neighbors = graph.get(curr) || [];
      for (const next of neighbors) {
        if (!visited.has(next)) {
          visited.add(next);
          queue.push(next);
        }
      }
    }
    return false;
  }

  getConnectedNodes(startId, graph) {
    const visited = new Set();
    if (!graph.has(startId)) return visited;

    const queue = [startId];
    visited.add(startId);

    while (queue.length > 0) {
      const curr = queue.shift();
      const neighbors = graph.get(curr) || [];
      for (const next of neighbors) {
        if (!visited.has(next)) {
          visited.add(next);
          queue.push(next);
        }
      }
    }
    return visited;
  }

  // GENERATE MODEL SOLUTION (Auto-wiring for pedagogical reference)
  generateSolution() {
    this.wr.clear();
    const mode = this.cm.activeMode;
    const variant = this.cm.vvVariant;

    switch (mode) {
      case 'SA':
        this.addSolutionWire('q1_L', 'sw1_L', '#dc2626', 'phase');
        this.addSolutionWire('sw1_1', 'e1_L', '#18181b', 'retour');
        this.addSolutionWire('q1_N', 'e1_N', '#2563eb', 'neutre');
        this.addSolutionWire('q1_PE', 'e1_PE', '#16a34a', 'terre');
        break;

      case 'DA':
        // 1. Phase from Disjoncteur to Interrupteur 1: L
        this.addSolutionWire('q1_L', 'da1_L', '#dc2626', 'phase');
        // 2. Phase bridge between Interrupteur 1: L and Interrupteur 2: L
        this.addSolutionWire('da1_L', 'da2_L', '#dc2626', 'phase');

        // 3. Interrupteur 1 (Borne 1) -> Lamp E1: L (Retour 1)
        this.addSolutionWire('da1_1', 'e1_L', '#18181b', 'retour');
        // 4. Parallel repiquage: Lamp E1: L -> Lamp E2: L
        this.addSolutionWire('e1_L', 'e2_L', '#18181b', 'retour');

        // 5. Interrupteur 2 (Borne 2) -> Lamp E3: L (Retour 2)
        this.addSolutionWire('da2_2', 'e3_L', '#18181b', 'retour');

        // 6. Neutral: Disjoncteur N -> Lamp E1: N
        this.addSolutionWire('q1_N', 'e1_N', '#2563eb', 'neutre');
        // 7. Neutral repiquage directly from e1_N -> e2_N
        this.addSolutionWire('e1_N', 'e2_N', '#2563eb', 'neutre');
        // 8. Neutral repiquage directly from e2_N -> e3_N
        this.addSolutionWire('e2_N', 'e3_N', '#2563eb', 'neutre');

        // 9. Earth: Disjoncteur PE -> Lamp E1: PE
        this.addSolutionWire('q1_PE', 'e1_PE', '#16a34a', 'terre');
        // 10. Earth repiquage: e1_PE -> e2_PE
        this.addSolutionWire('e1_PE', 'e2_PE', '#16a34a', 'terre');
        // 11. Earth repiquage: e2_PE -> e3_PE
        this.addSolutionWire('e2_PE', 'e3_PE', '#16a34a', 'terre');
        break;

      case 'VV':
        if (variant === 'FR' || variant === 'US') {
          this.addSolutionWire('q1_L', 'vv1_L', '#dc2626', 'phase');
          this.addSolutionWire('vv1_1', 'vv2_1', '#ea580c', 'navette');
          this.addSolutionWire('vv1_2', 'vv2_2', '#ea580c', 'navette');
          this.addSolutionWire('vv2_L', 'e1_L', '#18181b', 'retour');
          this.addSolutionWire('e1_L', 'e2_L', '#18181b', 'retour');
          this.addSolutionWire('q1_N', 'e1_N', '#2563eb', 'neutre');
          this.addSolutionWire('e1_N', 'e2_N', '#2563eb', 'neutre');
          this.addSolutionWire('q1_PE', 'e1_PE', '#16a34a', 'terre');
        } else if (variant === 'DE') {
          this.addSolutionWire('q1_L', 'vv1_1', '#dc2626', 'phase');
          this.addSolutionWire('vv1_1', 'vv2_1', '#dc2626', 'phase');
          this.addSolutionWire('vv1_L', 'vv2_L', '#ea580c', 'navette');
          this.addSolutionWire('vv1_2', 'e1_L', '#18181b', 'retour');
          this.addSolutionWire('vv2_2', 'vv1_2', '#18181b', 'retour');
          this.addSolutionWire('e1_L', 'e2_L', '#18181b', 'retour');
          this.addSolutionWire('q1_N', 'e1_N', '#2563eb', 'neutre');
          this.addSolutionWire('e1_N', 'e2_N', '#2563eb', 'neutre');
          this.addSolutionWire('q1_PE', 'e1_PE', '#16a34a', 'terre');
        }
        break;

      case 'TL':
        this.addSolutionWire('q1_L', 'tl_1', '#dc2626', 'phase');
        this.addSolutionWire('q1_L', 'bp1_L', '#dc2626', 'phase');
        this.addSolutionWire('bp1_L', 'bp2_L', '#dc2626', 'phase');
        this.addSolutionWire('bp2_L', 'bp3_L', '#dc2626', 'phase');

        this.addSolutionWire('bp1_out', 'tl_A1', '#ea580c', 'navette');
        this.addSolutionWire('bp2_out', 'bp1_out', '#ea580c', 'navette');
        this.addSolutionWire('bp3_out', 'bp2_out', '#ea580c', 'navette');

        this.addSolutionWire('q1_N', 'tl_A2', '#2563eb', 'neutre');

        this.addSolutionWire('tl_2', 'e1_L', '#18181b', 'retour');
        this.addSolutionWire('e1_L', 'e2_L', '#18181b', 'retour');

        this.addSolutionWire('q1_N', 'e1_N', '#2563eb', 'neutre');
        this.addSolutionWire('e1_N', 'e2_N', '#2563eb', 'neutre');
        this.addSolutionWire('q1_PE', 'e1_PE', '#16a34a', 'terre');
        break;

      case 'MIN':
        // 1. Phase from Q1 to Minuterie Borne L
        this.addSolutionWire('q1_L', 'min_L', '#dc2626', 'phase');

        // 2. Phase from Q1 to BP1:L, and bridge to BP2:L, BP3:L
        this.addSolutionWire('q1_L', 'bp1_L', '#dc2626', 'phase');
        this.addSolutionWire('bp1_L', 'bp2_L', '#dc2626', 'phase');
        this.addSolutionWire('bp2_L', 'bp3_L', '#dc2626', 'phase');

        // 3. Neutral from Q1 to Minuterie Borne N
        this.addSolutionWire('q1_N', 'min_N', '#2563eb', 'neutre');

        // 4. Push-buttons return to Minuterie Borne 4 (Retour Boutons ⭳)
        this.addSolutionWire('bp1_out', 'min_4', '#ea580c', 'navette');
        this.addSolutionWire('bp2_out', 'bp1_out', '#ea580c', 'navette');
        this.addSolutionWire('bp3_out', 'bp2_out', '#ea580c', 'navette');

        // 5. Minuterie output Borne 3 to Lamp E1:L, and bridge to E2:L
        this.addSolutionWire('min_3', 'e1_L', '#18181b', 'retour');
        this.addSolutionWire('e1_L', 'e2_L', '#18181b', 'retour');

        // 6. Neutral from Q1 to Lamp E1:N, and bridge to E2:N
        this.addSolutionWire('q1_N', 'e1_N', '#2563eb', 'neutre');
        this.addSolutionWire('e1_N', 'e2_N', '#2563eb', 'neutre');

        // 7. Earth from Q1 to Lamp E1:PE, and bridge to E2:PE
        this.addSolutionWire('q1_PE', 'e1_PE', '#16a34a', 'terre');
        this.addSolutionWire('e1_PE', 'e2_PE', '#16a34a', 'terre');
        break;
    }
  }

  addSolutionWire(fromId, toId, color, type) {
    const p1 = this.cm.getTerminalById(fromId);
    const p2 = this.cm.getTerminalById(toId);
    if (p1 && p2) {
      this.wr.addWire(p1, p2, color, type);
    }
  }
}

window.CircuitEngine = CircuitEngine;
window.circuitEngine = new CircuitEngine(window.componentManager, window.wireRouter);
