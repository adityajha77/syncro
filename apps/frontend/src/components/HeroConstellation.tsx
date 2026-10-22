import React, { useEffect, useRef } from 'react';

interface HeroConstellationProps {
  isDark: boolean;
}

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseX: number;
  baseY: number;
  size: number;
  label?: string;
}

export const HeroConstellation: React.FC<HeroConstellationProps> = ({ isDark }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 600);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    // Create interactive nodes
    const NODE_COUNT = Math.min(Math.floor(width / 22), 50);
    const labels = ['Real-time', 'Prisma 7', 'WebSocket', 'PostgreSQL', 'Express', 'React 19', 'Task Sync', 'Telemetry'];
    const nodes: Node[] = [];

    for (let i = 0; i < NODE_COUNT; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      nodes.push({
        x,
        y,
        baseX: x,
        baseY: y,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        size: Math.random() * 2 + 1.5,
        label: i < labels.length ? labels[i] : undefined,
      });
    }

    // Mouse tracking
    const mouse = {
      x: width / 2,
      y: height / 2,
      radius: 180,
      active: false,
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    // Gravitational shockwave on click
    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      nodes.forEach((node) => {
        const dx = node.x - clickX;
        const dy = node.y - clickY;
        const dist = Math.hypot(dx, dy);
        if (dist < 260) {
          const force = (260 - dist) / 12;
          const angle = Math.atan2(dy, dx);
          node.vx += Math.cos(angle) * force;
          node.vy += Math.sin(angle) * force;
        }
      });
    };

    const parent = canvas.parentElement;
    if (parent) {
      parent.addEventListener('mousemove', handleMouseMove);
      parent.addEventListener('mouseleave', handleMouseLeave);
      parent.addEventListener('click', handleClick);
    }

    // Animation render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Node color and line colors based on theme
      const nodeColor = isDark ? 'rgba(255, 255, 255, 0.65)' : 'rgba(15, 23, 42, 0.55)';
      const lineColor = isDark ? 'rgba(255, 255, 255,' : 'rgba(15, 23, 42,';
      const labelColor = isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(15, 23, 42, 0.4)';

      // Update and draw nodes
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        // Move
        node.x += node.vx;
        node.y += node.vy;

        // Friction and bounds
        node.vx *= 0.98;
        node.vy *= 0.98;

        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        // Gravitational mouse attraction
        if (mouse.active) {
          const dx = mouse.x - node.x;
          const dy = mouse.y - node.y;
          const dist = Math.hypot(dx, dy);

          if (dist < mouse.radius) {
            const pullForce = (mouse.radius - dist) / 2800;
            node.vx += dx * pullForce;
            node.vy += dy * pullForce;
          }
        }

        // Draw node dot
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
        ctx.fillStyle = nodeColor;
        ctx.fill();

        // Draw node label if present
        if (node.label && width > 640) {
          ctx.font = '9px monospace';
          ctx.fillStyle = labelColor;
          ctx.fillText(node.label, node.x + 6, node.y + 3);
        }

        // Connect nearby nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const other = nodes[j];
          const dist = Math.hypot(node.x - other.x, node.y - other.y);
          const maxDistance = 120;

          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * (isDark ? 0.22 : 0.16);
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `${lineColor} ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        // Connect nodes to mouse when close
        if (mouse.active) {
          const distToMouse = Math.hypot(node.x - mouse.x, node.y - mouse.y);
          if (distToMouse < mouse.radius) {
            const alpha = (1 - distToMouse / mouse.radius) * (isDark ? 0.35 : 0.25);
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `${lineColor} ${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (parent) {
        parent.removeEventListener('mousemove', handleMouseMove);
        parent.removeEventListener('mouseleave', handleMouseLeave);
        parent.removeEventListener('click', handleClick);
      }
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0 opacity-80"
    />
  );
};
