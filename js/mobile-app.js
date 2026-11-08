/**
 * Mobile-Specific Application Controller & Touch Interaction Engine (NFC 15-100)
 * Designed for smartphones and touchscreens:
 * - Fluid, native 60fps vertical scrolling with Tap vs Scroll differentiation
 * - Direct Tap-to-Wire mode with visual floating guide banner
 * - Quick-jump helper to smoothly scroll between Breakers and Lamps
 * - Haptic vibration feedback on touch interactions
 * - Bottom Sheet Drawer for Diagnostics & Audit checklist
 * - Full pedagogical circuits: Double Allumage (2 separate switches), SA, VV, Télérupteur
 */

class MobileSimulatorApp {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.cm = null;
    this.wr = window.wireRouter;
    this.engine = null;
    this.sound = window.soundEngine;
    this.backupManager = null;

    // Interaction states
    this.isConnecting = false;
    this.startPin = null;
    this.touchPos = { x: 0, y: 0 };
    this.selectedPin = null;

    this.currentMode = 'DA';
    this.vvVariant = 'FR';
    this.animationId = null;

    // Mobile Exam Mode
    this.examManager = null;
    this.activeExamTypeTab = 'build';
  }

  init() {
    this.canvas = document.getElementById('mobileCircuitCanvas');
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');

    // Initialize Mobile Component Manager
    this.cm = new window.MobileComponentManager();
    window.componentManager = this.cm;

    // Initialize Circuit Engine
    const EngineClass = window.CircuitEngine || (typeof CircuitEngine !== 'undefined' ? CircuitEngine : null);
    if (EngineClass) {
      this.engine = new EngineClass(this.cm, this.wr);
    } else if (window.circuitEngine) {
      this.engine = window.circuitEngine;
      this.engine.cm = this.cm;
      this.engine.wr = this.wr;
    }
    window.circuitEngine = this.engine;

    // Initialize Backup Manager
    if (window.BackupManager) {
      this.backupManager = new window.BackupManager(this);
      this.backupManager.init();
    }

    // Initialize Mobile Exam Manager
    if (window.ExamSessionManager) {
      this.examManager = new window.ExamSessionManager(this);
      this.initMobileExamMode();
    }

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.setCircuitMode('DA');
    this.setupEventListeners();
    this.startLoop();
    this.evaluateCircuit();
  }

  resizeCanvas() {
    const wrapper = this.canvas.parentElement;
    const rect = wrapper.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    const w = Math.floor(rect.width) || window.innerWidth || 390;
    // Stable height of 680px for the 3 vertical tiers
    const h = 680;

    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;

    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;

    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);

    if (this.cm) {
      this.cm.setCanvasDimensions(w, h);
      this.wr.recomputeAllPaths(this.cm);
    }
  }

  triggerHaptic(ms = 22) {
    if (window.navigator && window.navigator.vibrate) {
      try {
        window.navigator.vibrate(ms);
      } catch (e) {}
    }
  }

  setupEventListeners() {
    // Mode Switcher Pills
    const modeButtons = document.querySelectorAll('[data-mobile-mode]');
    modeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mobile-mode');
        this.setCircuitMode(mode);
        this.triggerHaptic(15);
      });
    });

    // Va-et-vient Variant Switcher (FR, DE, US)
    const vvButtons = document.querySelectorAll('[data-mobile-vv-variant]');
    vvButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const variant = btn.getAttribute('data-mobile-vv-variant');
        this.setVvVariant(variant);
        this.triggerHaptic(15);
      });
    });

    // Wire Color Buttons
    const colorButtons = document.querySelectorAll('[data-mobile-color]');
    colorButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const color = btn.getAttribute('data-mobile-color');
        const wireType = btn.getAttribute('data-mobile-wire-type');
        this.setActiveColor(color, wireType, btn);
        this.triggerHaptic(15);

        if (this.wr.selectedWireId) {
          this.wr.updateWireColor(this.wr.selectedWireId, color, wireType);
          this.evaluateCircuit();
          this.updateSelectionUI();
          this.showToast(`تم تغيير لون السلك إلى ${wireType.toUpperCase()}`, 'info');
        }
      });
    });

    // Primary Action Buttons
    const btnTest = document.getElementById('btnMobileTest');
    if (btnTest) {
      btnTest.addEventListener('click', () => {
        this.triggerHaptic(30);
        this.runFullAudit();
        this.openAuditSheet();
      });
    }

    const btnSolution = document.getElementById('btnMobileSolution');
    if (btnSolution) {
      btnSolution.addEventListener('click', () => {
        this.triggerHaptic(25);
        this.engine.generateSolution();
        this.evaluateCircuit();
        this.runFullAudit();
        this.showToast('تم توصيل الدارة النموذجية بنجاح', 'success');
      });
    }

    const btnUndo = document.getElementById('btnMobileUndo');
    if (btnUndo) {
      btnUndo.addEventListener('click', () => {
        this.triggerHaptic(20);
        this.wr.undo();
        this.evaluateCircuit();
      });
    }

    const btnReset = document.getElementById('btnMobileReset');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.triggerHaptic(35);
        this.wr.clear();
        this.cancelConnecting();
        this.evaluateCircuit();
        this.showToast('تم تفريغ جميع الأسلاك', 'info');
      });
    }

    const btnSound = document.getElementById('btnMobileSound');
    if (btnSound) {
      btnSound.addEventListener('click', () => {
        const isEnabled = this.sound.toggleSound();
        const icon = btnSound.querySelector('i');
        if (icon) {
          icon.className = isEnabled ? 'fa-solid fa-volume-high text-emerald-400' : 'fa-solid fa-volume-xmark text-slate-500';
        }
      });
    }

    // Audit Sheet Drawer Toggle & Close
    const btnToggleAudit = document.getElementById('btnToggleAuditSheet');
    const btnCloseAudit = document.getElementById('btnCloseAuditSheet');

    if (btnToggleAudit) {
      btnToggleAudit.addEventListener('click', () => this.toggleAuditSheet());
    }
    if (btnCloseAudit) {
      btnCloseAudit.addEventListener('click', () => this.closeAuditSheet());
    }

    // Scroll Helper (Jump smoothly between Breaker and Lamps)
    const mobileMain = document.getElementById('mobileMain');
    const btnScrollLamps = document.getElementById('btnScrollToLamps');
    const btnScrollBreaker = document.getElementById('btnScrollToBreaker');

    if (mobileMain && btnScrollLamps && btnScrollBreaker) {
      mobileMain.addEventListener('scroll', () => {
        if (mobileMain.scrollTop > 120) {
          btnScrollLamps.classList.add('hidden');
          btnScrollBreaker.classList.remove('hidden');
        } else {
          btnScrollLamps.classList.remove('hidden');
          btnScrollBreaker.classList.add('hidden');
        }
      }, { passive: true });

      btnScrollLamps.addEventListener('click', () => {
        this.triggerHaptic(15);
        mobileMain.scrollTo({ top: 380, behavior: 'smooth' });
      });

      btnScrollBreaker.addEventListener('click', () => {
        this.triggerHaptic(15);
        mobileMain.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // DUAL DRAG-TO-WIRE & TAP-TO-WIRE ENGINE WITH MAGNETIC SNAPPING
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let isTouchDragWiring = false;
    let isTouchScrolling = false;
    this.lastTouchTime = 0;

    // TOUCHSTART
    this.canvas.addEventListener('touchstart', (e) => {
      this.lastTouchTime = Date.now();
      if (e.touches.length !== 1) return;

      const t = e.touches[0];
      touchStartX = t.clientX;
      touchStartY = t.clientY;
      touchStartTime = Date.now();
      isTouchScrolling = false;
      isTouchDragWiring = false;

      const rect = this.canvas.getBoundingClientRect();
      const coords = { x: t.clientX - rect.left, y: t.clientY - rect.top };

      // Did user touch directly on a terminal pin? (Generous 40px tolerance)
      const touchedPin = this.cm.getTerminalAt(coords.x, coords.y, 40);
      if (touchedPin) {
        // Prevent scrolling while interacting directly with a pin
        if (e.cancelable) e.preventDefault();

        if (!this.isConnecting) {
          // Start connection
          this.isConnecting = true;
          this.startPin = touchedPin;
          this.selectedPin = touchedPin;
          this.touchPos = coords;
          isTouchDragWiring = true;
          this.showWirePrompt(touchedPin);
          this.triggerHaptic(25);
        } else {
          // Finish connection on touchstart of target pin!
          if (touchedPin.id !== this.startPin.id) {
            const wire = this.wr.addWire(this.startPin, touchedPin);
            if (wire) {
              this.evaluateCircuit();
              this.triggerHaptic(40);
              this.showToast(`تم ربط سلك: ${wire.type.toUpperCase()}`, 'success');
            }
          }
          this.cancelConnecting();
        }
      }
    }, { passive: false });

    // TOUCHMOVE
    this.canvas.addEventListener('touchmove', (e) => {
      this.lastTouchTime = Date.now();
      if (e.touches.length !== 1) return;

      const t = e.touches[0];
      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;

      if (isTouchDragWiring && this.isConnecting) {
        // Dragging wire from startPin! Prevent screen scroll and track finger
        if (e.cancelable) e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        this.touchPos = { x: t.clientX - rect.left, y: t.clientY - rect.top };
      } else {
        // Normal page scrolling
        if (Math.hypot(dx, dy) > 8) {
          isTouchScrolling = true;
        }
      }
    }, { passive: false });

    // TOUCHEND
    this.canvas.addEventListener('touchend', (e) => {
      this.lastTouchTime = Date.now();
      const elapsed = Date.now() - touchStartTime;

      const touch = e.changedTouches ? e.changedTouches[0] : null;
      if (!touch) return;

      const rect = this.canvas.getBoundingClientRect();
      const coords = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };

      // 1. If user was drag-wiring and released over a target pin:
      if (isTouchDragWiring && this.isConnecting && this.startPin) {
        const releasedPin = this.cm.getTerminalAt(coords.x, coords.y, 40);
        if (releasedPin && releasedPin.id !== this.startPin.id) {
          const wire = this.wr.addWire(this.startPin, releasedPin);
          if (wire) {
            this.evaluateCircuit();
            this.triggerHaptic(40);
            this.showToast(`تم تثبيت السلك بنجاح!`, 'success');
          }
          this.cancelConnecting();
          return;
        }
        // If released on the same pin or empty space during a quick tap:
        // Keep this.isConnecting = true so Tap-to-Wire continues!
        isTouchDragWiring = false;
        return;
      }

      // 2. If user was scrolling the page, ignore
      if (isTouchScrolling || elapsed > 500) {
        return;
      }

      // 3. Regular clean tap interaction (switches, wires, or second pin)
      this.processInteraction(coords);
    });

    // CLICK (for desktop testing / CDP / mouse)
    this.canvas.addEventListener('click', (e) => {
      // Ignore synthetic clicks from mobile browser touch events
      if (Date.now() - this.lastTouchTime < 600) return;

      const rect = this.canvas.getBoundingClientRect();
      const coords = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      this.processInteraction(coords);
    });

    // Cancel connection button
    const btnCancelWire = document.getElementById('btnCancelMobileWire');
    if (btnCancelWire) {
      btnCancelWire.addEventListener('click', () => this.cancelConnecting());
    }

    // Wire selection delete action
    const btnDeleteWire = document.getElementById('btnDeleteMobileWire');
    if (btnDeleteWire) {
      btnDeleteWire.addEventListener('click', () => {
        if (this.wr.selectedWireId) {
          this.wr.removeWire(this.wr.selectedWireId);
          this.evaluateCircuit();
          this.updateSelectionUI();
          this.triggerHaptic(25);
        }
      });
    }
  }

  processInteraction(coords) {
    if (this.examManager && this.examManager.isExamSubmitted) {
      return;
    }
    this.touchPos = coords;

    // 1. Check if clicking/tapping a terminal pin (with generous 40px magnetic tolerance!)
    const pin = this.cm.getTerminalAt(coords.x, coords.y, 40);
    if (pin) {
      this.triggerHaptic(25);
      if (!this.isConnecting) {
        // Start wire connection
        this.isConnecting = true;
        this.startPin = pin;
        this.selectedPin = pin;
        this.showWirePrompt(pin);
      } else {
        // Finish wire connection
        if (pin.id !== this.startPin.id) {
          const wire = this.wr.addWire(this.startPin, pin);
          if (wire) {
            this.evaluateCircuit();
            this.triggerHaptic(40);
            this.showToast(`تم ربط سلك: ${wire.type.toUpperCase()}`, 'success');
          }
          this.cancelConnecting();
        } else {
          // Tapped the same pin -> keep active
        }
      }
      return;
    }

    // Notice: If isConnecting is true and tapped outside a pin, DO NOT cancel!
    // Simply return so the user can try tapping the pin again!
    if (this.isConnecting) {
      return;
    }

    // 2. Check if clicking on switch / breaker / push button
    const handled = this.cm.handleClick(coords.x, coords.y);
    if (handled) {
      this.triggerHaptic(30);
      this.evaluateCircuit();
      return;
    }

    // 3. Check if clicking on an existing wire to select/delete it
    const wire = this.wr.getWireAt(coords.x, coords.y, 18);
    if (wire) {
      this.triggerHaptic(20);
      if (this.wr.selectedWireId === wire.id) {
        this.wr.removeWire(wire.id);
        this.evaluateCircuit();
        this.wr.selectedWireId = null;
        this.showToast('تم حذف السلك', 'info');
      } else {
        this.wr.selectedWireId = wire.id;
        this.showToast(`سلك ${wire.type.toUpperCase()} محدد - اضغط مجدداً لحذفه`, 'info');
      }
      this.updateSelectionUI();
      return;
    }

    // Clear wire selection if tapped on empty area
    this.wr.selectedWireId = null;
    this.updateSelectionUI();
  }

  showWirePrompt(pin) {
    const promptEl = document.getElementById('mobileWirePrompt');
    const pinNameEl = document.getElementById('mobileSelectedPinName');
    if (promptEl && pinNameEl) {
      pinNameEl.textContent = pin.name || pin.code;
      promptEl.classList.remove('hidden');
    }
  }

  cancelConnecting() {
    this.isConnecting = false;
    this.startPin = null;
    this.selectedPin = null;
    const promptEl = document.getElementById('mobileWirePrompt');
    if (promptEl) promptEl.classList.add('hidden');
  }

  updateSelectionUI() {
    const wireBar = document.getElementById('mobileWireActionBar');
    if (!wireBar) return;

    if (this.wr.selectedWireId) {
      wireBar.classList.remove('hidden');
    } else {
      wireBar.classList.add('hidden');
    }
  }

  setActiveColor(color, wireType, activeBtn) {
    this.wr.setColor(color, wireType);
    document.querySelectorAll('[data-mobile-color]').forEach(b => {
      b.classList.remove('ring-4', 'ring-white', 'scale-110');
    });
    if (activeBtn) {
      activeBtn.classList.add('ring-4', 'ring-white', 'scale-110');
    }
  }

  setCircuitMode(mode) {
    if (this.examManager && this.examManager.isExamActive && !this.examManager.isExamSubmitted) {
      this.showToast('لا يمكن تغيير الدارة أثناء الامتحان النشط', 'error');
      return;
    }
    this.currentMode = mode;
    this.cm.setMode(mode, this.vvVariant);
    this.wr.clear();
    this.cancelConnecting();

    document.querySelectorAll('[data-mobile-mode]').forEach(btn => {
      const bMode = btn.getAttribute('data-mobile-mode');
      if (bMode === mode) {
        btn.className = 'px-3 py-1.5 rounded-xl text-xs font-black bg-blue-600 text-white shadow-md transition whitespace-nowrap';
      } else {
        btn.className = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 transition whitespace-nowrap';
      }
    });

    const vvBar = document.getElementById('mobileVvBar');
    if (vvBar) {
      if (mode === 'VV') vvBar.classList.remove('hidden');
      else vvBar.classList.add('hidden');
    }

    this.evaluateCircuit();
    this.runFullAudit();
  }

  setVvVariant(variant) {
    this.vvVariant = variant;
    this.cm.setVvVariant(variant);
    this.wr.clear();
    this.cancelConnecting();

    document.querySelectorAll('[data-mobile-vv-variant]').forEach(btn => {
      const bVar = btn.getAttribute('data-mobile-vv-variant');
      if (bVar === variant) {
        btn.className = 'px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-600 text-white shadow whitespace-nowrap';
      } else {
        btn.className = 'px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 whitespace-nowrap';
      }
    });

    this.evaluateCircuit();
  }

  evaluateCircuit() {
    if (!this.engine && window.circuitEngine) {
      this.engine = window.circuitEngine;
    }
    return this.engine ? this.engine.simulate() : null;
  }

  handlePushButtonImpulse(bpId) {
    if (!this.engine && window.circuitEngine) {
      this.engine = window.circuitEngine;
    }
    if (!this.engine) return;
    this.engine.triggerPushButtonImpulse(bpId);
    this.evaluateCircuit();
  }

  runFullAudit() {
    if (!this.engine && window.circuitEngine) {
      this.engine = window.circuitEngine;
    }
    if (!this.engine) return;

    if (this.examManager && this.examManager.isExamActive && !this.examManager.isExamSubmitted) {
      this.updateDiagnosticsUI({
        status: 'exam',
        generalMessageAr: '🎯 وضع الامتحان نشط: النتائج والتقييم النهائي تظهر فور تسليم الامتحان.',
        checks: []
      });
      return;
    }

    const report = this.engine.evaluateAudit();
    this.updateDiagnosticsUI(report);
  }

  updateDiagnosticsUI(report) {
    const badge = document.getElementById('mobileAuditBadge');
    const summaryMsg = document.getElementById('mobileAuditSummary');
    const checklist = document.getElementById('mobileAuditChecklist');

    if (badge) {
      if (report.status === 'success') {
        badge.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
        badge.textContent = '● سليم (Conforme)';
      } else if (report.status === 'error') {
        badge.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30';
        badge.textContent = '✕ غير مطابق';
      } else {
        badge.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30';
        badge.textContent = '○ بانتظار الفحص';
      }
    }

    if (summaryMsg) {
      summaryMsg.textContent = report.generalMessageAr || '';
    }

    if (checklist && report.checks) {
      checklist.innerHTML = '';
      report.checks.forEach(chk => {
        const item = document.createElement('div');
        item.className = `p-2.5 rounded-xl text-xs flex items-start gap-2 border ${
          chk.passed ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300' : 'bg-rose-950/40 border-rose-800/50 text-rose-300'
        }`;

        const icon = document.createElement('i');
        icon.className = chk.passed ? 'fa-solid fa-circle-check text-emerald-400 mt-0.5' : 'fa-solid fa-circle-xmark text-rose-400 mt-0.5';
        item.appendChild(icon);

        const textDiv = document.createElement('div');
        textDiv.className = 'flex-1';
        textDiv.innerHTML = `<b class="block text-white mb-0.5">${chk.nameAr}</b><span class="text-[11px] opacity-80">${chk.descAr}</span>`;
        item.appendChild(textDiv);

        checklist.appendChild(item);
      });
    }
  }

  toggleAuditSheet() {
    const sheet = document.getElementById('mobileAuditSheet');
    if (!sheet) return;
    if (sheet.classList.contains('translate-y-full')) {
      this.openAuditSheet();
    } else {
      this.closeAuditSheet();
    }
  }

  openAuditSheet() {
    const sheet = document.getElementById('mobileAuditSheet');
    if (sheet) sheet.classList.remove('translate-y-full');
  }

  closeAuditSheet() {
    const sheet = document.getElementById('mobileAuditSheet');
    if (sheet) sheet.classList.add('translate-y-full');
  }

  showToast(message, type = 'info') {
    const toast = document.getElementById('mobileToast');
    if (!toast) return;

    toast.textContent = message;
    toast.className = `fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-xs font-bold shadow-2xl transition-all duration-300 ${
      type === 'success' ? 'bg-emerald-600 text-white' : (type === 'error' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-100 border border-slate-700')
    }`;
    toast.classList.remove('opacity-0', 'pointer-events-none');

    setTimeout(() => {
      toast.classList.add('opacity-0', 'pointer-events-none');
    }, 2500);
  }

  // ==========================================
  // MOBILE EXAM MODE CONTROLLER
  // ==========================================

  initMobileExamMode() {
    if (!this.examManager) return;

    this.examManager.onTimerTick = (rem, tot) => this.updateMobileExamTimer(rem, tot);
    this.examManager.onTimerExpired = () => this.autoSubmitMobileExam();

    // 5th Pill Navigation in Mobile Nav
    const pillNavExam = document.getElementById('pillNavMobileExam');
    if (pillNavExam) {
      pillNavExam.addEventListener('click', () => {
        this.triggerHaptic(20);
        this.openMobileExamSelection();
      });
    }

    // Top Header Button: Open Exam
    const btnOpenExam = document.getElementById('btnMobileOpenExam');
    if (btnOpenExam) {
      btnOpenExam.addEventListener('click', () => {
        this.triggerHaptic(20);
        this.openMobileExamSelection();
      });
    }

    // Type Switcher Tabs in Selection Sheet
    const tabA = document.getElementById('tabMobileExamTypeA');
    const tabB = document.getElementById('tabMobileExamTypeB');
    if (tabA && tabB) {
      tabA.addEventListener('click', () => {
        this.activeExamTypeTab = 'build';
        tabA.className = 'flex-1 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white shadow';
        tabB.className = 'flex-1 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-slate-400';
        this.renderMobileExamExercises('build');
      });

      tabB.addEventListener('click', () => {
        this.activeExamTypeTab = 'fault';
        tabB.className = 'flex-1 py-1.5 rounded-lg text-xs font-bold bg-amber-600 text-white shadow';
        tabA.className = 'flex-1 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-slate-400';
        this.renderMobileExamExercises('fault');
      });
    }

    // Sticky Bar Buttons
    const btnTasks = document.getElementById('btnMobileExamTasks');
    if (btnTasks) {
      btnTasks.addEventListener('click', () => {
        this.openMobileTasksSheet();
      });
    }

    const btnSubmit = document.getElementById('btnMobileExamSubmit');
    if (btnSubmit) {
      btnSubmit.addEventListener('click', () => {
        const modal = document.getElementById('mobileExamConfirmModal');
        const timerBadge = document.getElementById('mobileExamTimerBadge');
        const confirmTimer = document.getElementById('mobileExamConfirmTimer');
        if (timerBadge && confirmTimer) confirmTimer.textContent = timerBadge.textContent;
        if (modal) modal.classList.remove('hidden');
      });
    }

    const btnCancelSubmit = document.getElementById('btnMobileCancelSubmit');
    if (btnCancelSubmit) {
      btnCancelSubmit.addEventListener('click', () => {
        const modal = document.getElementById('mobileExamConfirmModal');
        if (modal) modal.classList.add('hidden');
      });
    }

    const btnExecSubmit = document.getElementById('btnMobileExecuteSubmit');
    if (btnExecSubmit) {
      btnExecSubmit.addEventListener('click', () => {
        const modal = document.getElementById('mobileExamConfirmModal');
        if (modal) modal.classList.add('hidden');
        this.submitMobileExam();
      });
    }

    const btnCancelExam = document.getElementById('btnMobileExamCancel');
    if (btnCancelExam) {
      btnCancelExam.addEventListener('click', () => {
        if (confirm('هل تريد إلغاء الامتحان والعودة إلى لوحة العمل السابقة؟')) {
          this.cancelMobileExam();
        }
      });
    }

    // Results Sheet Buttons
    const btnCloseResults = document.getElementById('btnCloseMobileResults');
    if (btnCloseResults) {
      btnCloseResults.addEventListener('click', () => {
        const sheet = document.getElementById('mobileExamResultsSheet');
        if (sheet) sheet.classList.add('hidden');
      });
    }

    const btnInspect = document.getElementById('btnMobileInspectCanvas');
    if (btnInspect) {
      btnInspect.addEventListener('click', () => {
        const sheet = document.getElementById('mobileExamResultsSheet');
        if (sheet) sheet.classList.add('hidden');
        this.showToast('يمكنك الآن فحص اللوحة ومعاينة التوصيل', 'info');
      });
    }

    const btnFinish = document.getElementById('btnMobileFinishRestore');
    if (btnFinish) {
      btnFinish.addEventListener('click', () => {
        this.exitMobileExam();
      });
    }

    // History Buttons
    const btnOpenHist = document.getElementById('btnMobileOpenHistory');
    if (btnOpenHist) {
      btnOpenHist.addEventListener('click', () => {
        const selSheet = document.getElementById('mobileExamSelectionSheet');
        if (selSheet) selSheet.classList.add('hidden');
        this.openMobileExamHistory();
      });
    }

    const btnClearHist = document.getElementById('btnMobileClearHistory');
    if (btnClearHist) {
      btnClearHist.addEventListener('click', () => {
        if (confirm('هل تريد مسح سجل الامتحانات السابقة بالكامل؟')) {
          this.examManager.clearExamHistory();
          this.renderMobileExamHistory();
          this.showToast('تم مسح سجل النتائج', 'info');
        }
      });
    }
  }

  openMobileExamSelection() {
    if (this.examManager && this.examManager.isExamActive && !this.examManager.isExamSubmitted) {
      this.showToast('امتحان قيد التنفيذ! يرجى تسليمه أو إلغاؤه', 'error');
      return;
    }
    const sheet = document.getElementById('mobileExamSelectionSheet');
    if (sheet) sheet.classList.remove('hidden');
    this.renderMobileExamExercises(this.activeExamTypeTab);
  }

  renderMobileExamExercises(type) {
    const container = document.getElementById('mobileExamExercisesContainer');
    if (!container || !this.examManager) return;

    const exercises = this.examManager.getExercises().filter(ex => ex.type === type);
    container.innerHTML = '';

    exercises.forEach(ex => {
      const card = document.createElement('div');
      card.className = 'p-3 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-2';

      const diffBadge = ex.difficulty === 'easy'
        ? '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">مبتدئ</span>'
        : ex.difficulty === 'medium'
        ? '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">متوسط</span>'
        : '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300">متقدم</span>';

      card.innerHTML = `
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-1.5 overflow-hidden">
            <h4 class="text-xs font-bold text-white truncate">${ex.titleAr}</h4>
            ${diffBadge}
          </div>
          <span class="text-[10px] text-amber-300 font-mono-tech shrink-0">${ex.durationMinutes} دقيقة</span>
        </div>
        <p class="text-[11px] text-slate-300 leading-relaxed">${ex.descriptionAr}</p>
        <div class="flex items-center justify-between pt-1">
          <span class="text-[10px] text-slate-400">علامة النجاح: ${ex.passingScore}/100</span>
          <button data-mobile-start="${ex.id}" class="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-black shadow flex items-center gap-1">
            <i class="fa-solid fa-play"></i>
            <span>بدء</span>
          </button>
        </div>
      `;

      const startBtn = card.querySelector(`[data-mobile-start="${ex.id}"]`);
      if (startBtn) {
        startBtn.addEventListener('click', () => {
          this.startMobileExam(ex.id);
        });
      }

      container.appendChild(card);
    });
  }

  startMobileExam(exerciseId) {
    if (!this.examManager) return;
    const ok = this.examManager.startExam(exerciseId);
    if (!ok) return;

    const sheet = document.getElementById('mobileExamSelectionSheet');
    if (sheet) sheet.classList.add('hidden');

    const activeBar = document.getElementById('mobileExamActiveBar');
    const titleEl = document.getElementById('mobileExamActiveTitle');
    const ex = this.examManager.currentExercise;

    if (activeBar) activeBar.classList.remove('hidden');
    if (titleEl) titleEl.textContent = ex.titleAr;

    const btnSol = document.getElementById('btnMobileSolution');
    if (btnSol) btnSol.classList.add('hidden');

    this.showToast(`🎯 بدأ امتحان: ${ex.titleAr}`, 'success');
  }

  updateMobileExamTimer(remainingSeconds, totalSeconds) {
    const badge = document.getElementById('mobileExamTimerBadge');
    if (!badge) return;

    const mins = Math.floor(Math.max(0, remainingSeconds) / 60);
    const secs = Math.max(0, remainingSeconds) % 60;
    badge.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    if (remainingSeconds <= 60) {
      badge.className = 'px-2 py-0.5 rounded-lg bg-rose-950 border border-rose-500 font-mono-tech text-xs font-black text-rose-300 animate-pulse';
    } else {
      badge.className = 'px-2 py-0.5 rounded-lg bg-slate-900 border border-amber-500/40 font-mono-tech text-xs font-black text-amber-300';
    }
  }

  openMobileTasksSheet() {
    if (!this.examManager || !this.examManager.currentExercise) return;
    const ex = this.examManager.currentExercise;

    const sheet = document.getElementById('mobileExamTasksSheet');
    const title = document.getElementById('mobileExamTasksTitle');
    const desc = document.getElementById('mobileExamTasksDesc');
    const list = document.getElementById('mobileExamTasksList');

    if (title) title.textContent = `مهمة: ${ex.titleAr}`;
    if (desc) desc.textContent = ex.descriptionAr;
    if (list) {
      list.innerHTML = '';
      (ex.tasksAr || []).forEach(t => {
        const li = document.createElement('li');
        li.className = 'p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300';
        li.innerHTML = `<span class="text-sky-400 ml-1">•</span>${t}`;
        list.appendChild(li);
      });
    }

    if (sheet) sheet.classList.remove('hidden');
  }

  submitMobileExam() {
    if (!this.examManager) return;
    const report = this.examManager.submitExam(false);
    if (!report) return;

    if (window.soundEngine) {
      if (report.passed) window.soundEngine.playSuccessBell();
      else window.soundEngine.playWarningSound();
    }

    this.renderMobileExamResults(report);
  }

  autoSubmitMobileExam() {
    if (!this.examManager) return;
    const report = this.examManager.submitExam(true);
    if (!report) return;

    this.showToast('⏰ انتهى الوقت! تم تسليم الامتحان', 'warning');
    this.renderMobileExamResults(report);
  }

  cancelMobileExam() {
    if (!this.examManager) return;
    this.examManager.cancelExam();

    const activeBar = document.getElementById('mobileExamActiveBar');
    if (activeBar) activeBar.classList.add('hidden');

    const btnSol = document.getElementById('btnMobileSolution');
    if (btnSol) btnSol.classList.remove('hidden');

    this.showToast('تم إلغاء الامتحان واستعادة اللوحة السابقة', 'info');
  }

  exitMobileExam() {
    if (!this.examManager) return;
    this.examManager.exitExamMode();

    const sheet = document.getElementById('mobileExamResultsSheet');
    if (sheet) sheet.classList.add('hidden');

    const activeBar = document.getElementById('mobileExamActiveBar');
    if (activeBar) activeBar.classList.add('hidden');

    const btnSol = document.getElementById('btnMobileSolution');
    if (btnSol) btnSol.classList.remove('hidden');

    this.showToast('تم إنهاء المراجعة واستعادة اللوحة السابقة', 'success');
  }

  renderMobileExamResults(report) {
    const sheet = document.getElementById('mobileExamResultsSheet');
    if (!sheet || !report) return;

    const scoreEl = document.getElementById('mobileResultScore');
    const statusEl = document.getElementById('mobileResultStatus');
    const feedbackEl = document.getElementById('mobileResultFeedback');

    if (scoreEl) scoreEl.textContent = `${report.totalScore}/100`;
    if (statusEl) {
      statusEl.className = `inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
        report.passed ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
      }`;
      statusEl.textContent = report.passed ? '● ناجح مؤهل (Admis)' : '✕ بحاجة لإعادة المحاولة';
    }

    const sConn = document.getElementById('mobileScoreConn');
    const sRel = document.getElementById('mobileScoreRel');
    const sCol = document.getElementById('mobileScoreColors');
    const sHyg = document.getElementById('mobileScoreHyg');
    if (sConn) sConn.textContent = `${report.scoreBreakdown.connections}/${report.scoreBreakdown.maxConnections}`;
    if (sRel) sRel.textContent = `${report.scoreBreakdown.relationships}/${report.scoreBreakdown.maxRelationships}`;
    if (sCol) sCol.textContent = `${report.scoreBreakdown.colors}/${report.scoreBreakdown.maxColors}`;
    if (sHyg) sHyg.textContent = `${report.scoreBreakdown.hygiene}/${report.scoreBreakdown.maxHygiene}`;

    if (feedbackEl) feedbackEl.textContent = report.generalFeedbackAr;

    // Faults list
    const fBox = document.getElementById('mobileFaultsBox');
    const fList = document.getElementById('mobileFaultsList');
    if (fBox && fList) {
      if (report.exerciseType === 'fault' && report.faultsStatus && report.faultsStatus.length > 0) {
        fBox.classList.remove('hidden');
        fList.innerHTML = '';
        report.faultsStatus.forEach(f => {
          const row = document.createElement('div');
          row.className = `p-1.5 rounded-lg border text-[10px] flex items-center justify-between ${
            f.resolved ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-rose-950/40 border-rose-800 text-rose-300'
          }`;
          row.innerHTML = `<span>${f.descriptionAr}</span><span class="font-bold">${f.resolved ? 'تم الإصلاح ✓' : 'لم يُصلح ✕'}</span>`;
          fList.appendChild(row);
        });
      } else {
        fBox.classList.add('hidden');
      }
    }

    // Connections checklist
    const cList = document.getElementById('mobileResultDetailsList');
    if (cList) {
      cList.innerHTML = '';
      (report.connectionDetails || []).forEach(c => {
        const row = document.createElement('div');
        row.className = `p-1.5 rounded-lg border flex items-center justify-between text-[11px] ${
          c.satisfied ? 'bg-slate-950 border-emerald-800/40 text-slate-200' : 'bg-rose-950/30 border-rose-800/40 text-slate-300'
        }`;
        row.innerHTML = `
          <div class="flex items-center gap-1.5 overflow-hidden">
            <span class="${c.satisfied ? 'text-emerald-400' : 'text-rose-400'} font-bold">${c.satisfied ? '✓' : '✕'}</span>
            <span class="truncate">${c.nameAr}</span>
          </div>
          <span class="font-mono-tech font-bold ${c.satisfied ? 'text-emerald-400' : 'text-rose-400'} shrink-0">+${c.earned}/${c.points}</span>
        `;
        cList.appendChild(row);
      });
    }

    sheet.classList.remove('hidden');
  }

  openMobileExamHistory() {
    const sheet = document.getElementById('mobileExamHistorySheet');
    if (sheet) sheet.classList.remove('hidden');
    this.renderMobileExamHistory();
  }

  renderMobileExamHistory() {
    const container = document.getElementById('mobileExamHistoryList');
    const emptyEl = document.getElementById('mobileExamHistoryEmpty');
    if (!container || !this.examManager) return;

    const list = this.examManager.getExamHistory();
    if (list.length === 0) {
      container.innerHTML = '';
      if (emptyEl) emptyEl.classList.remove('hidden');
      return;
    }

    if (emptyEl) emptyEl.classList.add('hidden');
    container.innerHTML = '';

    list.forEach(item => {
      const card = document.createElement('div');
      card.className = 'p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2';
      card.innerHTML = `
        <div class="overflow-hidden">
          <div class="flex items-center gap-1.5">
            <span class="font-bold text-xs text-white truncate">${item.exerciseTitleAr}</span>
            <span class="text-[9px] px-1.5 py-0.2 rounded font-bold ${item.passed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}">${item.passed ? 'ناجح' : 'راسب'}</span>
          </div>
          <div class="text-[10px] text-slate-400 mt-0.5">${item.dateStr}</div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <span class="font-mono-tech text-xs font-black ${item.passed ? 'text-emerald-400' : 'text-rose-400'}">${item.totalScore}/100</span>
          <button data-del-mob-id="${item.id}" class="text-rose-400 text-xs p-1">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      `;

      const delBtn = card.querySelector(`[data-del-mob-id="${item.id}"]`);
      if (delBtn) {
        delBtn.addEventListener('click', () => {
          this.examManager.deleteExamHistoryItem(item.id);
          this.renderMobileExamHistory();
        });
      }

      container.appendChild(card);
    });
  }

  startLoop() {
    const render = () => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Layer 1: Component Bodies
      this.cm.renderBodies(this.ctx);

      // Layer 2: Wires (Drawn strictly on top of components)
      this.wr.render(this.ctx, this.startPin, this.touchPos);

      // Layer 3: Terminal Screws (Drawn on top of wire ends)
      this.cm.renderTerminals(this.ctx, null, this.startPin);

      this.animationId = requestAnimationFrame(render);
    };

    render();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.mobileApp = new MobileSimulatorApp();
  window.mobileApp.init();
});
