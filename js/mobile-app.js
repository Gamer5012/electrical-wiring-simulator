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

    // FLUID TAP VS SCROLL ENGINE:
    // Does NOT call e.preventDefault() on touchstart, allowing natural 60fps vertical scroll!
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let isTouchScrolling = false;

    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        const t = e.touches[0];
        touchStartX = t.clientX;
        touchStartY = t.clientY;
        touchStartTime = Date.now();
        isTouchScrolling = false;
      }
    }, { passive: true });

    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        const t = e.touches[0];
        const dx = t.clientX - touchStartX;
        const dy = t.clientY - touchStartY;
        if (Math.hypot(dx, dy) > 8) {
          isTouchScrolling = true;
        }
      }
    }, { passive: true });

    this.canvas.addEventListener('touchend', (e) => {
      const elapsed = Date.now() - touchStartTime;
      // If user moved more than 8px or held down longer than 500ms, it was a scroll gesture
      if (isTouchScrolling || elapsed > 500) {
        return;
      }

      const touch = e.changedTouches ? e.changedTouches[0] : null;
      if (!touch) return;

      const rect = this.canvas.getBoundingClientRect();
      const coords = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };

      this.processInteraction(coords);
    });

    // Also support direct click for testing and mouse interaction
    this.canvas.addEventListener('click', (e) => {
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
    this.touchPos = coords;

    // 1. Check if clicking/tapping a terminal pin (with generous 28px tolerance!)
    const pin = this.cm.getTerminalAt(coords.x, coords.y, 28);
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
        }
        this.cancelConnecting();
      }
      return;
    }

    // If tapped on empty space while connecting, cancel connection
    if (this.isConnecting) {
      this.cancelConnecting();
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
    const wire = this.wr.getWireAt(coords.x, coords.y, 16);
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
