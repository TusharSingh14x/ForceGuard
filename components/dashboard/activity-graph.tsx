'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { getActivityGraph } from '@/lib/actions';
import { Loader2, Share2, ZoomIn, ZoomOut } from 'lucide-react';

export function ActivityGraph() {
    const [data, setData] = useState<{ nodes: any[], links: any[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [zoom, setZoom] = useState(1);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const result = await getActivityGraph();
                setData(result);
            } catch (error) {
                console.error('Failed to fetch activity graph:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <Card className="p-12 h-[500px] flex items-center justify-center bg-card/40 backdrop-blur-3xl border-white/5 rounded-[3rem]">
                <Loader2 className="w-12 h-12 animate-spin text-primary opacity-50" />
            </Card>
        );
    }

    if (!data || data.nodes.length === 0) {
        return (
            <Card className="p-12 h-[500px] flex items-center justify-center bg-card/40 backdrop-blur-3xl border-white/5 rounded-[3rem]">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                        <Share2 className="w-8 h-8 text-primary/40" />
                    </div>
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em] italic">No neural chains detected in this session.</p>
                </div>
            </Card>
        );
    }

    const width = 800;
    const height = 500;

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'Productive': return '#6366f1';
            case 'Distracting': return '#ef4444';
            default: return '#94a3b8';
        }
    };

    // Dynamic position generator
    const getPosition = (id: string, index: number, total: number) => {
        if (nodesPosition[id]) return nodesPosition[id];
        // Arrange unknown nodes in a circular pattern
        const angle = (index / total) * 2 * Math.PI;
        const radius = 180;
        return {
            x: width / 2 + Math.cos(angle) * radius,
            y: height / 2 + Math.sin(angle) * radius
        };
    };

    return (
        <Card className="p-10 relative overflow-hidden bg-card/40 backdrop-blur-3xl border-white/5 rounded-[3rem] group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />

            <div className="flex items-center justify-between mb-10 relative z-10">
                <div>
                    <h3 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10">
                            <Share2 className="w-6 h-6 text-primary" />
                        </div>
                        COGNITIVE DRIFT GRAPH
                    </h3>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1 italic">Mapping the transition between neural states</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-3 bg-secondary/20 hover:bg-primary/20 transition-colors rounded-2xl border border-white/5 group/btn">
                        <ZoomOut className="w-5 h-5 text-muted-foreground group-hover/btn:text-primary transition-colors" />
                    </button>
                    <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-3 bg-secondary/20 hover:bg-primary/20 transition-colors rounded-2xl border border-white/5 group/btn">
                        <ZoomIn className="w-5 h-5 text-muted-foreground group-hover/btn:text-primary transition-colors" />
                    </button>
                </div>
            </div>

            <div className="relative h-[450px] w-full border border-white/5 rounded-[2.5rem] bg-black/40 overflow-hidden cursor-crosshair group/graph">
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:24px_24px]" />

                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="w-full h-full transition-transform duration-500 ease-out"
                    style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
                >
                    <defs>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                        <marker id="arrow" viewBox="0 0 10 10" refX="18" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                            <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
                        </marker>
                    </defs>

                    {/* Render Links */}
                    {data.links.map((link, idx) => {
                        const sourcePos = getPosition(link.source, 0, data.nodes.length);
                        const targetPos = getPosition(link.target, 0, data.nodes.length);

                        return (
                            <line
                                key={`link-${idx}`}
                                x1={sourcePos.x} y1={sourcePos.y} x2={targetPos.x} y2={targetPos.y}
                                stroke="#1e293b"
                                strokeWidth="2"
                                strokeDasharray="4 4"
                                markerEnd="url(#arrow)"
                                className="animate-in fade-in duration-1000"
                            />
                        );
                    })}

                    {/* Render Nodes */}
                    {data.nodes.map((node, idx) => {
                        const pos = getPosition(node.id, idx, data.nodes.length);
                        const radius = Math.min(35, 12 + (node.val / 60) * 3);
                        const color = getCategoryColor(node.category);

                        return (
                            <g key={`node-${node.id}`} className="group/node cursor-pointer">
                                {/* Glow Effect */}
                                <circle
                                    cx={pos.x} cy={pos.y} r={radius + 8}
                                    fill={color}
                                    className="opacity-0 group-hover/node:opacity-20 transition-opacity duration-300"
                                    style={{ filter: 'blur(12px)' }}
                                />
                                <circle
                                    cx={pos.x} cy={pos.y} r={radius}
                                    fill={color}
                                    className="transition-all duration-300 group-hover/node:r-[radius+2] border-2 border-white/10"
                                    style={{ filter: 'url(#glow)', stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1 }}
                                />
                                <text
                                    x={pos.x} y={pos.y + radius + 20}
                                    textAnchor="middle"
                                    fill={color}
                                    className="text-[10px] font-black uppercase tracking-widest opacity-60 group-hover/node:opacity-100 transition-opacity"
                                >
                                    {node.name.split('.')[0]}
                                </text>
                            </g>
                        );
                    })}
                </svg>

                {/* Legend */}
                <div className="absolute bottom-6 left-6 flex gap-6 text-[9px] font-black uppercase tracking-[0.2em] bg-black/60 backdrop-blur-xl p-4 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-2 text-primary">
                        <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                        Focus State
                    </div>
                    <div className="flex items-center gap-2 text-red-500">
                        <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                        Drift State
                    </div>
                </div>
            </div>
        </Card>
    );
}

const nodesPosition: any = {
    'google.com': { x: 150, y: 150 },
    'github.com': { x: 400, y: 120 },
    'instagram.com': { x: 650, y: 250 },
    'youtube.com': { x: 500, y: 400 },
    'stackoverflow.com': { x: 200, y: 350 },
    'facebook.com': { x: 700, y: 150 },
    'linkedin.com': { x: 250, y: 450 },
    'twitter.com': { x: 600, y: 100 },
};
