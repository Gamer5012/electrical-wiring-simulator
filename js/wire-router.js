/**
 * Smart Orthogonal (Manhattan) Wire Routing Engine (Updated)
 * Ensures wires are NEVER occluded or covered by component bodies.
 * Supports multiple wires per terminal node, clean Manhattan clearance channels,
 * striped Earth cables, and interactive wire selection/removal.
 */

class WireRouter {
  constructor() {
    this.wires = [];
    this.selectedWireId = null;
    this.hoveredWireId = null;
    this.earthPattern = null;
    this.activeColor = '#e11d48'; // default Phase Red
    this.activeWireType = 'phase';
  }

  initPatterns(ctx) {
    if (!this.earthPattern) {
      const pCanvas = document.createElement('canvas');
      pCanvas.width = 16;
      pCanvas.height = 16;
      const pCtx = pCanvas.getContext('2d');

      pCtx.fillStyle = '#eab308'; // Jaune
      pCtx.fillRect(0, 0, 16, 16);

      pCtx.fillStyle = '#16a34a'; // Vert
      pCtx.beginPath();
      pCtx.moveTo(0, 8);
      pCtx.lineTo(8, 0);
      pCtx.lineTo(16, 0);
      pCtx.lineTo(0, 16);
      pCtx.closePath();
      pCtx.fill();

      pCtx.beginPath();
      pCtx.moveTo(8, 16);
      pCtx.lineTo(16, 8);
      pCtx.lineTo(16, 16);
      pCtx.closePath();
      pCtx.fill();

      this.earthPattern = ctx.createPattern(pCanvas, 'repeat');
    }
  }

  setColor(color, wireType) {
    this.activeColor = color;
    this.activeWireType = wireType;
  }

  // Add wire between any two pins, allowing multiple connections to the same pin
  addWire(fromPin, toPin, color = null, type = null) {
    if (!fromPin || !toPin || fromPin.id === toPin.id) return null;

    // Check if identical duplicate wire between these two exact pins already exists
    const exists = this.wires.some(w => 
      (w.fromId === fromPin.id && w.toId === toPin.id) ||
      (w.fromId === toPin.id && w.toId === fromPin.id)
    );
    if (exists) return null;

    const chosenColor = color || this.activeColor;
    const chosenType = type || this.activeWireType;

    const wire = {
      id: `w_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      fromId: fromPin.id,
      toId: toPin.id,
      color: chosenColor,
      type: chosenType,
      path: this.computeOrthogonalPath(fromPin, toPin, this.wires.length)
    };

    this.wires.push(wire);
    if (window.soundEngine) window.soundEngine.playWireConnect();
    return wire;
  }

  removeWire(wireId) {
    const idx = this.wires.findIndex(w => w.id === wireId);
    if (idx !== -1) {
      this.wires.splice(idx, 1);
      if (this.selectedWireId === wireId) this.selectedWireId = null;
      if (this.hoveredWireId === wireId) this.hoveredWireId = null;
      if (window.soundEngine) window.soundEngine.playWireDisconnect();
      return true;
    }
    return false;
  }

  // Remove any wires connected to the specified terminals
  removeWiresConnectedToTerminals(terminalIdList) {
    if (!Array.isArray(terminalIdList) || terminalIdList.length === 0) return 0;
    const set = new Set(terminalIdList);
    const initialCount = this.wires.length;
    this.wires = this.wires.filter(w => !set.has(w.fromId) && !set.has(w.toId));

    if (this.selectedWireId && !this.wires.some(w => w.id === this.selectedWireId)) {
      this.selectedWireId = null;
    }
    if (this.hoveredWireId && !this.wires.some(w => w.id === this.hoveredWireId)) {
      this.hoveredWireId = null;
    }

    const removed = initialCount - this.wires.length;
    if (removed > 0 && window.soundEngine) {
      window.soundEngine.playWireDisconnect();
    }
    return removed;
  }

  // Update wire color and type dynamically
  updateWireColor(wireId, color, type) {
    const wire = this.wires.find(w => w.id === wireId);
    if (wire) {
      wire.color = color;
      wire.type = type || this.activeWireType;
      return true;
    }
    return false;
  }

  undo() {
    if (this.wires.length > 0) {
      const removed = this.wires.pop();
      if (window.soundEngine) window.soundEngine.playWireDisconnect();
      return removed;
    }
    return null;
  }

  clear() {
    this.wires = [];
    this.selectedWireId = null;
    this.hoveredWireId = null;
  }

  recomputeAllPaths(terminalManager) {
    this.wires.forEach((w, idx) => {
      const p1 = terminalManager.getTerminalById(w.fromId);
      const p2 = terminalManager.getTerminalById(w.toId);
      if (p1 && p2) {
        w.path = this.computeOrthogonalPath(p1, p2, idx);
      }
    });
  }

  /**
   * Compute orthogonal path with clearance corridors avoiding component occlusion
   */
  computeOrthogonalPath(p1, p2, wireIndex = 0) {
    const points = [];
    points.push({ x: p1.x, y: p1.y });

    // Exit offsets with slight stagger to prevent wires from overlapping exactly
    const stagger = (wireIndex % 5) * 4;
    const dist1 = 28 + stagger;
    const dist2 = 28 + stagger;

    const offset1 = this.getExitOffset(p1, dist1);
    points.push(offset1);

    const offset2 = this.getExitOffset(p2, dist2);

    if (p1.dir === 'bottom' && p2.dir === 'bottom') {
      const corridorY = Math.max(offset1.y, offset2.y) + 20 + stagger;
      points.push({ x: offset1.x, y: corridorY });
      points.push({ x: offset2.x, y: corridorY });
    } else if (p1.dir === 'top' && p2.dir === 'top') {
      const corridorY = Math.min(offset1.y, offset2.y) - 20 - stagger;
      points.push({ x: offset1.x, y: corridorY });
      points.push({ x: offset2.x, y: corridorY });
    } else if (p1.dir === 'top' && p2.dir === 'bottom') {
      if (offset1.y < offset2.y) {
        const midY = (offset1.y + offset2.y) / 2;
        points.push({ x: offset1.x, y: midY });
        points.push({ x: offset2.x, y: midY });
      } else {
        const midX = (offset1.x + offset2.x) / 2;
        points.push({ x: midX, y: offset1.y });
        points.push({ x: midX, y: offset2.y });
      }
    } else if (p1.dir === 'bottom' && p2.dir === 'top') {
      if (offset1.y < offset2.y) {
        const midY = (offset1.y + offset2.y) / 2;
        points.push({ x: offset1.x, y: midY });
        points.push({ x: offset2.x, y: midY });
      } else {
        const midX = (offset1.x + offset2.x) / 2;
        points.push({ x: midX, y: offset1.y });
        points.push({ x: midX, y: offset2.y });
      }
    } else {
      const midX = (offset1.x + offset2.x) / 2;
      points.push({ x: midX, y: offset1.y });
      points.push({ x: midX, y: offset2.y });
    }

    points.push(offset2);
    points.push({ x: p2.x, y: p2.y });

    return this.simplifyPath(points);
  }

  getExitOffset(pin, dist = 28) {
    switch (pin.dir) {
      case 'top':
        return { x: pin.x, y: pin.y - dist };
      case 'bottom':
        return { x: pin.x, y: pin.y + dist };
      case 'left':
        return { x: pin.x - dist, y: pin.y };
      case 'right':
        return { x: pin.x + dist, y: pin.y };
      default:
        return { x: pin.x, y: pin.y + dist };
    }
  }

  simplifyPath(pts) {
    if (pts.length <= 2) return pts;
    const clean = [pts[0]];
    for (let i = 1; i < pts.length - 1; i++) {
      const prev = clean[clean.length - 1];
      const curr = pts[i];
      const next = pts[i + 1];

      const isColinearH = Math.abs(prev.y - curr.y) < 1 && Math.abs(curr.y - next.y) < 1;
      const isColinearV = Math.abs(prev.x - curr.x) < 1 && Math.abs(curr.x - next.x) < 1;

      if (!isColinearH && !isColinearV) {
        clean.push(curr);
      }
    }
    clean.push(pts[pts.length - 1]);
    return clean;
  }

  getWireAt(x, y, maxDist = 9) {
    for (let i = this.wires.length - 1; i >= 0; i--) {
      const wire = this.wires[i];
      if (this.isPointNearPath(x, y, wire.path, maxDist)) {
        return wire;
      }
    }
    return null;
  }

  isPointNearPath(px, py, path, maxDist) {
    for (let i = 0; i < path.length - 1; i++) {
      const d = this.distToSegment(px, py, path[i], path[i + 1]);
      if (d <= maxDist) return true;
    }
    return false;
  }

  distToSegment(px, py, p1, p2) {
    const l2 = (p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2;
    if (l2 === 0) return Math.hypot(px - p1.x, py - p1.y);
    let t = ((px - p1.x) * (p2.x - p1.x) + (py - p1.y) * (p2.y - p1.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (p1.x + t * (p2.x - p1.x)), py - (p1.y + t * (p2.y - p1.y)));
  }

  // RENDER ALL WIRES (Drawn on top of component bodies)
  render(ctx, previewStartPin = null, currentMousePos = null) {
    this.initPatterns(ctx);

    // Existing wires
    this.wires.forEach((wire, idx) => {
      this.drawWire(ctx, wire);
    });

    // Active live wire preview
    if (previewStartPin && currentMousePos) {
      ctx.save();
      const tempTarget = {
        x: currentMousePos.x,
        y: currentMousePos.y,
        dir: currentMousePos.y > previewStartPin.y ? 'top' : 'bottom'
      };
      const previewPath = this.computeOrthogonalPath(previewStartPin, tempTarget);

      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 4.5;
      ctx.strokeStyle = this.activeWireType === 'terre' ? '#eab308' : this.activeColor;
      ctx.globalAlpha = 0.9;

      this.strokeRoundedPath(ctx, previewPath, 10);
      ctx.stroke();

      ctx.restore();
    }
  }

  drawWire(ctx, wire) {
    const { path, color, type, id } = wire;
    if (!path || path.length < 2) return;

    const isSelected = this.selectedWireId === id;
    const isHovered = this.hoveredWireId === id;

    ctx.save();

    // 3D Outer border & drop shadow for high contrast over any background
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = 7;
    ctx.shadowOffsetY = 3;

    ctx.lineWidth = 6.5;
    ctx.strokeStyle = isSelected ? '#3b82f6' : (isHovered ? '#f97316' : '#020617');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    this.strokeRoundedPath(ctx, path, 10);
    ctx.stroke();

    ctx.shadowColor = 'transparent';

    // Core Wire Body
    ctx.lineWidth = 4.5;
    if (type === 'terre' && this.earthPattern) {
      ctx.strokeStyle = this.earthPattern;
    } else {
      ctx.strokeStyle = color;
    }
    this.strokeRoundedPath(ctx, path, 10);
    ctx.stroke();

    // Metallic ferrules (embouts de câblage) at endpoints
    const startPt = path[0];
    const endPt = path[path.length - 1];
    ctx.fillStyle = '#cbd5e1';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.arc(startPt.x, startPt.y, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(endPt.x, endPt.y, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Delete badge on selected/hovered wire
    if (isSelected || isHovered) {
      const midIdx = Math.floor(path.length / 2);
      const midPt = path[midIdx] || path[0];

      ctx.fillStyle = '#ef4444';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(midPt.x, midPt.y, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✕', midPt.x, midPt.y + 4);
    }

    ctx.restore();
  }

  strokeRoundedPath(ctx, pts, radius = 9) {
    if (pts.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);

    for (let i = 1; i < pts.length - 1; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];
      ctx.arcTo(p1.x, p1.y, p2.x, p2.y, radius);
    }

    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
  }
}

window.wireRouter = new WireRouter();
