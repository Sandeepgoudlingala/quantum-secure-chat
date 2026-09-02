import React, { useEffect, useRef } from "react";

export function LatticeBackground({ className = "" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let t = 0;

    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);

    const onResize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    const isDark = () => document.documentElement.classList.contains("dark");

    let mx = W / 2, my = H / 2;
    const onMouse = (e) => { mx = e.clientX; my = e.clientY; };
    window.addEventListener("mousemove", onMouse);

    const COUNT = Math.min(Math.floor((W * H) / 14000), 75);
    const particles = Array.from({ length: COUNT }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
      r: Math.random() * 1.8 + 0.6, phase: Math.random() * Math.PI * 2,
    }));

    const anchors = [
      { x: W * 0.12, y: H * 0.18 }, { x: W * 0.85, y: H * 0.13 },
      { x: W * 0.5, y: H * 0.72 },  { x: W * 0.22, y: H * 0.82 },
      { x: W * 0.9, y: H * 0.68 },  { x: W * 0.65, y: H * 0.35 },
    ];

    const HEX = ["0x2F4A", "KEM-768", "AES-256", "SHA-256", "0xFF3C", "IV:92", "KDF", "FIPS"];
    const streamNodes = Array.from({ length: 10 }, (_, i) => ({
      x: Math.random() * W, y: Math.random() * H,
      vy: -(Math.random() * 0.28 + 0.08),
      label: HEX[i % HEX.length], alpha: Math.random() * 0.3 + 0.08,
    }));

    const warpLines = Array.from({ length: 6 }, () => ({
      y: Math.random() * H, x: Math.random() * W,
      speed: Math.random() * 2.5 + 1.5, len: Math.random() * 120 + 60,
      alpha: Math.random() * 0.18 + 0.06,
    }));

    // Light: rich indigo/violet/rose on white
    const L = {
      particle:"99,102,241", particleHalo:"99,102,241", link:"99,102,241",
      anchorRing:"124,58,237", anchorDot:"124,58,237", anchorGlow:"124,58,237",
      warp:"236,72,153", mouseLine:"236,72,153",
      orb0:"139,92,246", orb1:"99,102,241", orbRing:"139,92,246",
      hex:"99,102,241", aura0:"99,102,241", aura1:"139,92,246",
    };
    // Dark: cyan/emerald/violet
    const D = {
      particle:"34,211,238", particleHalo:"34,211,238", link:"34,211,238",
      anchorRing:"34,211,238", anchorDot:"52,211,153", anchorGlow:"52,211,153",
      warp:"34,211,238", mouseLine:"168,85,247",
      orb0:"168,85,247", orb1:"34,211,238", orbRing:"168,85,247",
      hex:"52,211,153", aura0:"34,211,238", aura1:"139,92,246",
    };

    const draw = () => {
      t += 0.013;
      const dark = isDark();
      const C = dark ? D : L;
      ctx.clearRect(0, 0, W, H);

      const aura = ctx.createRadialGradient(mx, my, 0, mx, my, 360);
      aura.addColorStop(0, `rgba(${C.aura0},${dark ? 0.045 : 0.07})`);
      aura.addColorStop(0.5, `rgba(${C.aura1},${dark ? 0.022 : 0.04})`);
      aura.addColorStop(1, "transparent");
      ctx.fillStyle = aura;
      ctx.fillRect(0, 0, W, H);

      anchors.forEach((a, ai) => {
        for (let ring = 0; ring < 4; ring++) {
          const phase = (t * 0.65 + ai * 1.1 + ring * 0.95) % (Math.PI * 2);
          const radius = (phase / (Math.PI * 2)) * 260 + 10;
          const alpha = Math.max(0, 1 - radius / 260) * (dark ? 0.13 : 0.11);
          ctx.beginPath();
          ctx.arc(a.x, a.y, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${C.anchorRing},${alpha})`;
          ctx.lineWidth = 0.9;
          ctx.stroke();
        }
        const dA = 0.45 + Math.sin(t * 1.8 + ai) * 0.2;
        const dR = 1.8 + Math.sin(t * 2.2 + ai) * 0.8;
        ctx.beginPath(); ctx.arc(a.x, a.y, dR, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${C.anchorDot},${dA})`; ctx.fill();
        ctx.beginPath(); ctx.arc(a.x, a.y, dR + 5, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${C.anchorGlow},${dA * (dark ? 0.3 : 0.25)})`;
        ctx.lineWidth = 1; ctx.stroke();
      });

      warpLines.forEach((wl) => {
        wl.x += wl.speed;
        if (wl.x > W + wl.len) { wl.x = -wl.len; wl.y = Math.random() * H; }
        const grad = ctx.createLinearGradient(wl.x - wl.len, wl.y, wl.x, wl.y);
        grad.addColorStop(0, "transparent");
        grad.addColorStop(1, `rgba(${C.warp},${dark ? wl.alpha : wl.alpha * 0.75})`);
        ctx.beginPath(); ctx.moveTo(wl.x - wl.len, wl.y); ctx.lineTo(wl.x, wl.y);
        ctx.strokeStyle = grad; ctx.lineWidth = 1; ctx.stroke();
      });

      const LINK = 160;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        const pA = (dark ? 0.28 : 0.5) + Math.sin(t * 1.3 + p.phase) * 0.18;
        const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
        halo.addColorStop(0, `rgba(${C.particleHalo},${pA * (dark ? 0.5 : 0.3)})`);
        halo.addColorStop(1, "transparent");
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2);
        ctx.fillStyle = halo; ctx.fill();
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${C.particle},${pA})`; ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < LINK) {
            const la = (1 - d / LINK) * (dark ? 0.15 : 0.13);
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(${C.link},${la})`;
            ctx.lineWidth = 0.7; ctx.stroke();
          }
        }

        anchors.forEach((a) => {
          const dx = p.x - a.x, dy = p.y - a.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 220) {
            const la = (1 - d / 220) * (dark ? 0.09 : 0.08);
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(a.x, a.y);
            ctx.strokeStyle = `rgba(139,92,246,${la})`;
            ctx.lineWidth = 0.5; ctx.stroke();
          }
        });

        const mdx = p.x - mx, mdy = p.y - my;
        const md = Math.sqrt(mdx * mdx + mdy * mdy);
        if (md < 170) {
          p.vx += (-mdx / md) * 0.007; p.vy += (-mdy / md) * 0.007;
          const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          if (spd > 1.4) { p.vx *= 0.95; p.vy *= 0.95; }
          const ma = (1 - md / 170) * (dark ? 0.35 : 0.3);
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mx, my);
          ctx.strokeStyle = `rgba(${C.mouseLine},${ma})`;
          ctx.lineWidth = 0.9; ctx.stroke();
        }
      }

      const orb = ctx.createRadialGradient(mx, my, 0, mx, my, 72);
      orb.addColorStop(0, `rgba(${C.orb0},${dark ? 0.18 : 0.14})`);
      orb.addColorStop(0.5, `rgba(${C.orb1},0.07)`);
      orb.addColorStop(1, "transparent");
      ctx.fillStyle = orb; ctx.beginPath(); ctx.arc(mx, my, 72, 0, Math.PI * 2); ctx.fill();
      const orbR = 72 + Math.sin(t * 3) * 8;
      ctx.beginPath(); ctx.arc(mx, my, orbR, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${C.orbRing},${dark ? 0.1 : 0.12})`;
      ctx.lineWidth = 1; ctx.stroke();

      ctx.font = "9px 'JetBrains Mono', 'Fira Code', monospace";
      ctx.textAlign = "left";
      streamNodes.forEach((sn) => {
        sn.y += sn.vy;
        if (sn.y < -20) { sn.y = H + 20; sn.x = Math.random() * W; }
        const snA = sn.alpha * (0.6 + Math.sin(t * 0.8 + sn.x * 0.01) * 0.4);
        ctx.fillStyle = `rgba(${C.hex},${dark ? snA : snA * 0.7})`;
        ctx.fillText(sn.label, sn.x, sn.y);
      });

      if (dark) {
        ctx.fillStyle = "rgba(0,0,0,0.022)";
        for (let ly = 0; ly < H; ly += 4) ctx.fillRect(0, ly, W, 1);
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouse);
    };
  }, []);

  return (
    <div className={`fixed inset-0 pointer-events-none z-0 overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-[radial-gradient(#c7d2fe_1px,transparent_1px)] [background-size:24px_24px] opacity-70 dark:hidden" />
      <div className="hidden dark:block absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:28px_28px] opacity-35" />
      <div className="dark:hidden absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full bg-violet-100/60 blur-3xl" />
      <div className="dark:hidden absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full bg-indigo-100/50 blur-3xl" />
      <div className="dark:hidden absolute -bottom-32 left-1/2 -translate-x-1/2 w-[420px] h-[420px] rounded-full bg-pink-100/40 blur-3xl" />
      <div className="hidden dark:block absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-cyan-900/10 blur-3xl" />
      <div className="hidden dark:block absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-violet-900/10 blur-3xl" />
      <div className="hidden dark:block absolute -bottom-40 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-emerald-900/8 blur-3xl" />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-80 dark:opacity-95" />
    </div>
  );
}
