import { useState, useRef, useCallback } from "react";
import { toPng, toSvg } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Plus, Trash2, RotateCcw, ChevronDown } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import testdinoLogo from "@assets/image_1769153159547.png";

const defaultColors = ["#9b4f82", "#e8a5d0", "#6b8e9c", "#7cb97c", "#d4a574"];

interface ScatterDataPoint {
    id: string;
    name: string;
    x: number;
    y: number;
    color: string;
}

interface ScatterChartConfig {
    title: string;
    xAxisLabel: string;
    yAxisLabel: string;
    backgroundColor: string;
    borderColor: string;
    textColor: string;
    dataPoints: ScatterDataPoint[];
}

const defaultConfig: ScatterChartConfig = {
    title: "Execution Time vs Test Coverage",
    xAxisLabel: "Test Coverage (%)",
    yAxisLabel: "Execution Time (mins)",
    backgroundColor: "#fafafa",
    borderColor: "#e0e0e0",
    textColor: "#1a1a1a",
    dataPoints: [
        { id: "1", name: "Suite A", x: 85, y: 12, color: "#9b4f82" },
        { id: "2", name: "Suite B", x: 60, y: 5, color: "#e8a5d0" },
        { id: "3", name: "Suite C", x: 92, y: 18, color: "#6b8e9c" },
        { id: "4", name: "Suite D", x: 45, y: 3, color: "#7cb97c" },
        { id: "5", name: "Suite E", x: 78, y: 15, color: "#d4a574" },
    ],
};

export default function ScatterChartPage() {
    const [config, setConfig] = useState<ScatterChartConfig>(defaultConfig);
    const [isExporting, setIsExporting] = useState(false);
    const chartRef = useRef<HTMLDivElement>(null);

    const updateConfig = <K extends keyof ScatterChartConfig>(key: K, value: ScatterChartConfig[K]) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const updateDataPoint = (id: string, field: keyof ScatterDataPoint, value: string | number) => {
        setConfig(prev => ({
            ...prev,
            dataPoints: prev.dataPoints.map(dp => dp.id === id ? { ...dp, [field]: value } : dp),
        }));
    };

    const addDataPoint = () => {
        const newId = Date.now().toString();
        const color = defaultColors[config.dataPoints.length % defaultColors.length];
        setConfig(prev => ({
            ...prev,
            dataPoints: [...prev.dataPoints, { id: newId, name: "New Point", x: 50, y: 10, color }],
        }));
    };

    const removeDataPoint = (id: string) => {
        setConfig(prev => ({
            ...prev,
            dataPoints: prev.dataPoints.filter(dp => dp.id !== id),
        }));
    };

    const exportChart = useCallback(async (format: "png" | "svg") => {
        if (!chartRef.current) return;
        setIsExporting(true);
        try {
            const options = { quality: 1, pixelRatio: 2, backgroundColor: config.backgroundColor, skipFonts: true };
            const dataUrl = format === "svg" ? await toSvg(chartRef.current, options) : await toPng(chartRef.current, options);
            const link = document.createElement("a");
            link.download = `scatter-chart.${format}`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error(err);
        } finally {
            setIsExporting(false);
        }
    }, [config.backgroundColor]);

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto p-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold font-sans">Scatter Chart Generator</h1>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setConfig(defaultConfig)}>
                            <RotateCcw className="w-4 h-4 mr-2" /> Reset
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button disabled={isExporting}>
                                    <Download className="w-4 h-4 mr-2" /> {isExporting ? "Exporting..." : "Export"} <ChevronDown className="w-4 h-4 ml-2" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => exportChart("png")}>Export as PNG</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => exportChart("svg")}>Export as SVG</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-1">
                        <CardHeader><CardTitle>Configuration</CardTitle></CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[calc(100vh-220px)]">
                                <div className="space-y-6 pr-4">
                                    <div className="space-y-2">
                                        <Label>Chart Title</Label>
                                        <Input value={config.title} onChange={e => updateConfig("title", e.target.value)} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-2">
                                            <Label>X-Axis Label</Label>
                                            <Input value={config.xAxisLabel} onChange={e => updateConfig("xAxisLabel", e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Y-Axis Label</Label>
                                            <Input value={config.yAxisLabel} onChange={e => updateConfig("yAxisLabel", e.target.value)} />
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <Label>Data Points</Label>
                                            <Button size="sm" variant="outline" onClick={addDataPoint}><Plus className="w-4 h-4 mr-1" /> Add Point</Button>
                                        </div>
                                        {config.dataPoints.map((dp, index) => (
                                            <Card key={dp.id} className="p-3 mb-2">
                                                <div className="flex items-center justify-between mb-2">
                                                    <Input value={dp.name} onChange={e => updateDataPoint(dp.id, "name", e.target.value)} className="h-8 w-2/3" placeholder="Point Name" />
                                                    <Button size="icon" variant="ghost" onClick={() => removeDataPoint(dp.id)} disabled={config.dataPoints.length <= 1}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div>
                                                        <Label className="text-[10px]">X Value</Label>
                                                        <Input type="number" value={dp.x} onChange={e => updateDataPoint(dp.id, "x", Number(e.target.value))} className="h-7 text-xs" />
                                                    </div>
                                                    <div>
                                                        <Label className="text-[10px]">Y Value</Label>
                                                        <Input type="number" value={dp.y} onChange={e => updateDataPoint(dp.id, "y", Number(e.target.value))} className="h-7 text-xs" />
                                                    </div>
                                                    <div>
                                                        <Label className="text-[10px]">Color</Label>
                                                        <input type="color" value={dp.color} onChange={e => updateDataPoint(dp.id, "color", e.target.value)} className="w-full h-7 rounded cursor-pointer p-0 border-0" />
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                        <CardHeader><CardTitle>Preview</CardTitle></CardHeader>
                        <CardContent>
                            <div className="overflow-auto">
                                <div ref={chartRef} className="p-8 min-w-[600px] flex flex-col" style={{ backgroundColor: config.backgroundColor, border: `1px solid ${config.borderColor}` }}>
                                    <div className="flex items-start justify-between w-full mb-6">
                                        <h2 className="text-xl font-bold" style={{ color: config.textColor }}>{config.title}</h2>
                                        <img src={testdinoLogo} alt="Logo" className="h-8 w-auto" />
                                    </div>

                                    <div style={{ width: "100%", height: "400px" }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} stroke={config.textColor} />
                                                <XAxis type="number" dataKey="x" name="X" label={{ value: config.xAxisLabel, position: 'insideBottom', offset: -10, fill: config.textColor }} tick={{ fill: config.textColor, opacity: 0.7 }} stroke={config.textColor} />
                                                <YAxis type="number" dataKey="y" name="Y" label={{ value: config.yAxisLabel, angle: -90, position: 'insideLeft', fill: config.textColor }} tick={{ fill: config.textColor, opacity: 0.7 }} stroke={config.textColor} />
                                                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '8px' }} formatter={(value: number, name: string, props: any) => [value, props.payload.name]} />
                                                <Scatter data={config.dataPoints} isAnimationActive={false}>
                                                    {config.dataPoints.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Scatter>
                                            </ScatterChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}