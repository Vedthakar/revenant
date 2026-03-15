"use client";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

interface MemoryNode {
  id: string;
  content: string;
  namespace: string;
  memory_strength: number;
  decayed_strength: number;
  reinforcement_count: number;
  last_reinforced_at: string;
  created_at: string;
}

interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  content: string;
  namespace: string;
  strength: number;
  reinforcements: number;
  radius: number;
}

const NAMESPACE_COLORS: Record<string, string> = {
  semantic: "#c084fc",
  episodic: "#86efac",
  procedural: "#fbbf24",
};

const NAMESPACE_LABELS: Record<string, string> = {
  semantic: "Architecture & Decisions",
  episodic: "Stories & Moments",
  procedural: "Frameworks & Playbooks",
};

export default function MemoryHealthMap() {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<MemoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<MemoryNode | null>(null);

  useEffect(() => {
    fetch("/api/memory-health")
      .then((res) => res.json())
      .then((data) => {
        setNodes(data.nodes || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const simNodes: SimNode[] = nodes.map((n) => ({
      id: n.id,
      content: n.content,
      namespace: n.namespace,
      strength: n.decayed_strength,
      reinforcements: n.reinforcement_count,
      radius: Math.max(8, Math.min(30, n.decayed_strength * 28)),
    }));

    // Group links: connect nodes within the same namespace
    const links: { source: string; target: string }[] = [];
    const byNamespace: Record<string, SimNode[]> = {};
    for (const n of simNodes) {
      if (!byNamespace[n.namespace]) byNamespace[n.namespace] = [];
      byNamespace[n.namespace].push(n);
    }
    for (const group of Object.values(byNamespace)) {
      for (let i = 0; i < group.length - 1; i++) {
        links.push({ source: group[i].id, target: group[i + 1].id });
      }
    }

    const simulation = d3
      .forceSimulation(simNodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d: any) => d.id)
          .distance(60)
          .strength(0.3)
      )
      .force("charge", d3.forceManyBody().strength(-80))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius((d: any) => d.radius + 4));

    const defs = svg.append("defs");

    // Glow filter
    const filter = defs.append("filter").attr("id", "glow");
    filter.append("feGaussianBlur").attr("stdDeviation", "3").attr("result", "coloredBlur");
    const merge = filter.append("feMerge");
    merge.append("feMergeNode").attr("in", "coloredBlur");
    merge.append("feMergeNode").attr("in", "SourceGraphic");

    const link = svg
      .append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "rgba(255,255,255,0.05)")
      .attr("stroke-width", 1);

    const node = svg
      .append("g")
      .selectAll("circle")
      .data(simNodes)
      .join("circle")
      .attr("r", (d) => d.radius)
      .attr("fill", (d) => {
        const color = NAMESPACE_COLORS[d.namespace] || "#d97706";
        // Fade based on strength
        const opacity = Math.max(0.15, d.strength);
        return d3.color(color)!.copy({ opacity }).toString();
      })
      .attr("stroke", (d) => NAMESPACE_COLORS[d.namespace] || "#d97706")
      .attr("stroke-width", (d) => (d.strength > 0.7 ? 2 : 1))
      .attr("stroke-opacity", (d) => Math.max(0.2, d.strength))
      .attr("filter", (d) => (d.strength > 0.5 ? "url(#glow)" : "none"))
      .attr("cursor", "pointer")
      .on("click", (_event, d) => {
        const original = nodes.find((n) => n.id === d.id);
        if (original) setSelectedNode(original);
      })
      .on("mouseover", function (event, d) {
        d3.select(this).transition().duration(200).attr("r", d.radius * 1.3);
        if (tooltipRef.current) {
          tooltipRef.current.style.display = "block";
          tooltipRef.current.style.left = `${event.offsetX + 12}px`;
          tooltipRef.current.style.top = `${event.offsetY - 12}px`;
          tooltipRef.current.innerHTML = `<strong>${d.namespace}</strong><br/>${d.content.slice(0, 80)}...<br/>Strength: ${(d.strength * 100).toFixed(0)}%`;
        }
      })
      .on("mouseout", function (_event, d) {
        d3.select(this).transition().duration(200).attr("r", d.radius);
        if (tooltipRef.current) {
          tooltipRef.current.style.display = "none";
        }
      })
      .call(
        d3.drag<any, SimNode>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Strength text inside larger nodes
    svg
      .append("g")
      .selectAll("text")
      .data(simNodes.filter((d) => d.radius > 16))
      .join("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("font-size", 9)
      .attr("font-weight", 700)
      .attr("fill", "rgba(255,255,255,0.7)")
      .attr("pointer-events", "none")
      .text((d) => `${(d.strength * 100).toFixed(0)}%`);

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("cx", (d) => d.x!).attr("cy", (d) => d.y!);

      svg
        .selectAll("text")
        .data(simNodes.filter((d) => d.radius > 16))
        .attr("x", (d) => d.x!)
        .attr("y", (d) => d.y!);
    });

    return () => {
      simulation.stop();
    };
  }, [nodes]);

  return (
    <section className="glass rounded-[28px] p-6" style={{ position: "relative" }}>
      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Cognitive model</p>
      <h3 className="mt-2 text-2xl font-semibold text-[var(--text)]">Memory Health Map</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
        Each node is a founder memory. Size = strength, color = namespace, opacity = decay. Fading nodes need reinforcement.
      </p>

      {/* Legend */}
      <div className="mt-4 flex gap-6">
        {Object.entries(NAMESPACE_COLORS).map(([ns, color]) => (
          <div key={ns} className="flex items-center gap-2">
            <span className="block h-3 w-3 rounded-full" style={{ background: color }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color }}>{NAMESPACE_LABELS[ns] || ns}</span>
          </div>
        ))}
      </div>

      {/* Graph */}
      <div className="relative mt-4 rounded-[20px] border border-[var(--border)] bg-[rgba(0,0,0,0.3)]" style={{ height: 400, overflow: "hidden" }}>
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--gold)] border-t-transparent" />
          </div>
        ) : nodes.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-[var(--text-muted)]">
            <p className="text-sm font-medium">No memories loaded yet</p>
            <p className="text-xs">Seed demo data via <code className="rounded bg-[rgba(255,255,255,0.05)] px-2 py-1">POST /api/seed</code></p>
          </div>
        ) : (
          <>
            <svg ref={svgRef} style={{ width: "100%", height: "100%" }} />
            <div
              ref={tooltipRef}
              style={{
                display: "none",
                position: "absolute",
                padding: "8px 12px",
                borderRadius: 10,
                background: "rgba(12,9,5,0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#e8e0d0",
                fontSize: 11,
                lineHeight: 1.5,
                pointerEvents: "none",
                maxWidth: 250,
                zIndex: 100,
                backdropFilter: "blur(12px)",
              }}
            />
          </>
        )}
      </div>

      {/* Node detail panel */}
      {selectedNode && (
        <div className="mt-4 rounded-[20px] border border-[var(--border-gold)] bg-[rgba(217,119,6,0.06)] p-5">
          <div className="flex items-center justify-between">
            <span
              className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em]"
              style={{
                color: NAMESPACE_COLORS[selectedNode.namespace],
                background: `${NAMESPACE_COLORS[selectedNode.namespace]}15`,
                border: `1px solid ${NAMESPACE_COLORS[selectedNode.namespace]}30`,
              }}
            >
              {selectedNode.namespace}
            </span>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-[var(--text-muted)] hover:text-[var(--text)]"
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16 }}
            >
              x
            </button>
          </div>
          <p className="mt-3 text-sm leading-6 text-[var(--text)]">{selectedNode.content}</p>
          <div className="mt-3 flex gap-6 text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
            <span>Strength: <strong style={{ color: "#d97706" }}>{(selectedNode.decayed_strength * 100).toFixed(0)}%</strong></span>
            <span>Reinforced: <strong>{selectedNode.reinforcement_count}x</strong></span>
            <span>Created: {selectedNode.created_at ? new Date(selectedNode.created_at).toLocaleDateString() : "Unknown"}</span>
          </div>
        </div>
      )}
    </section>
  );
}
