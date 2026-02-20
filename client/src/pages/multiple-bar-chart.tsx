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
import testdinoLogo from "@assets/image_1769153159547.png";

const defaultColors = ["#9b4f82", "#e8a5d0", "#6b8e9c", "#7cb97c", "#d4a574"];

interface ChartSeries {
    id: string;
    name: string;
    color: string;
}

interface DataPoint {
    id: string;
    label: string;
    values: Record<string, number>;
}

interface MultipleChartConfig {
    title: string;
    xAxisLabel: string;
    backgroundColor: string;
    borderColor: string;
    textColor: string;
    series: ChartSeries[];
    dataPoints: DataPoint[];
}

const defaultConfig: MultipleChartConfig = {
    title: "Multi-Version Performance Comparison",
    xAxisLabel: "Percentile",
    backgroundColor: "#fafafa",
    borderColor: "#e0e0e0",
    textColor: "#1a1a1a",
    series: [
        { id: "s1", name: "Version 1", color: "#9b4f82" },
        { id: "s2", name: "Version 2", color: "#e8a5d0" },
        { id: "s3", name: "Version 3", color: "#6b8e9c" },
    ],
    dataPoints: [
        { id: "1", label: "10th", values: { s1: 80, s2: 60, s3: 45 } },
        { id: "2", label: "50th", values: { s1: 100, s2: 95, s3: 85 } },
        { id: "3", label: "90th", values: { s1: 150, s2: 130, s3: 110 } },
    ],
};

export default function MultipleBarChart() {
    const [config, setConfig] = useState<MultipleChartConfig>(defaultConfig);
    const [isExporting, setIsExporting] = useState(false);
    const chartRef = useRef<HTMLDivElement>(null);

    const updateConfig = <K extends keyof MultipleChartConfig>(key: K, value: MultipleChartConfig[K]) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const addSeries = () => {
        const newId = `s${Date.now()}`;
        const color = defaultColors[config.series.length % defaultColors.length];

        setConfig(prev => ({
            ...prev,
            series: [...prev.series, { id: newId, name: `New Series`, color }],
            dataPoints: prev.dataPoints.map(dp => ({
                ...dp,
                values: { ...dp.values, [newId]: 50 }
            }))
        }));
    };

    const updateSeries = (id: string, field: keyof ChartSeries, value: string) => {
        setConfig(prev => ({
            ...prev,
            series: prev.series.map(s => s.id === id ? { ...s, [field]: value } : s)
        }));
    };

    const removeSeries = (id: string) => {
        setConfig(prev => {
            const newDataPoints = prev.dataPoints.map(dp => {
                const newValues = { ...dp.values };
                delete newValues[id];
                return { ...dp, values: newValues };
            });
            return {
                ...prev,
                series: prev.series.filter(s => s.id !== id),
                dataPoints: newDataPoints
            };
        });
    };

    const addDataPoint = () => {
        const newId = Date.now().toString();
        const initialValues: Record<string, number> = {};
        config.series.forEach(s => initialValues[s.id] = 50);

        setConfig(prev => ({
            ...prev,
            dataPoints: [...prev.dataPoints, { id: newId, label: "New Point", values: initialValues }],
        }));
    };

    const updateDataPointValue = (pointId: string, seriesId: string, value: number) => {
        setConfig(prev => ({
            ...prev,
            dataPoints: prev.dataPoints.map(dp =>
                dp.id === pointId
                    ? { ...dp, values: { ...dp.values, [seriesId]: value } }
                    : dp
            )
        }));
    };

    const updateDataPointLabel = (pointId: string, label: string) => {
        setConfig(prev => ({
            ...prev,
            dataPoints: prev.dataPoints.map(dp => dp.id === pointId ? { ...dp, label } : dp)
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
            link.download = `multiple-chart.${format}`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error(err);
        } finally {
            setIsExporting(false);
        }
    }, [config.backgroundColor]);

    const allValues = config.dataPoints.flatMap(dp => Object.values(dp.values));
    const maxValue = allValues.length > 0 ? Math.max(...allValues) : 100;

    // Calculate dynamic minimum widths so the layout breathes when there is a ton of data
    const minGroupWidth = Math.max(120, config.series.length * 28 + 40);

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto p-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold font-sans">Multiple Bar Chart Generator</h1>
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
                                    <div className="space-y-2">
                                        <Label>X-Axis Label</Label>
                                        <Input value={config.xAxisLabel} onChange={e => updateConfig("xAxisLabel", e.target.value)} />
                                    </div>

                                    <Separator />

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <Label>Data Series</Label>
                                            <Button size="sm" variant="outline" onClick={addSeries}><Plus className="w-4 h-4 mr-1" /> Add Series</Button>
                                        </div>
                                        {config.series.map((s, idx) => (
                                            <div key={s.id} className="flex gap-2 items-center mb-2">
                                                <input type="color" value={s.color} onChange={e => updateSeries(s.id, "color", e.target.value)} className="w-8 h-8 rounded cursor-pointer shrink-0" />
                                                <Input value={s.name} onChange={e => updateSeries(s.id, "name", e.target.value)} className="h-8 text-sm" />
                                                <Button size="icon" variant="ghost" onClick={() => removeSeries(s.id)} disabled={config.series.length <= 1} className="shrink-0 h-8 w-8">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>

                                    <Separator />

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <Label>Data Points</Label>
                                            <Button size="sm" variant="outline" onClick={addDataPoint}><Plus className="w-4 h-4 mr-1" /> Add Point</Button>
                                        </div>
                                        {config.dataPoints.map((dp, idx) => (
                                            <Card key={dp.id} className="p-3 mb-3">
                                                <div className="flex justify-between items-center mb-2">
                                                    <Input value={dp.label} onChange={e => updateDataPointLabel(dp.id, e.target.value)} className="h-8 w-2/3" placeholder="Label" />
                                                    <Button size="icon" variant="ghost" onClick={() => removeDataPoint(dp.id)} disabled={config.dataPoints.length <= 1} className="h-8 w-8">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 mt-2">
                                                    {config.series.map(s => (
                                                        <div key={s.id}>
                                                            <Label className="text-[10px] text-muted-foreground truncate" title={s.name}>{s.name}</Label>
                                                            <Input type="number" value={dp.values[s.id] || 0} onChange={e => updateDataPointValue(dp.id, s.id, Number(e.target.value))} className="h-7 text-xs" />
                                                        </div>
                                                    ))}
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
                            {/* Outer container handles scrolling. Inner chart stretches nicely. */}
                            <div className="overflow-x-auto overflow-y-hidden pb-4">
                                <div
                                    ref={chartRef}
                                    className="p-8 min-w-full w-max flex flex-col"
                                    style={{ backgroundColor: config.backgroundColor, border: `1px solid ${config.borderColor}` }}
                                >
                                    <div className="flex items-start justify-between mb-4 gap-8">
                                        <h2 className="text-xl font-bold flex-1" style={{ color: config.textColor }}>{config.title}</h2>
                                        <img src={testdinoLogo} alt="Logo" className="h-8 w-auto shrink-0" />
                                    </div>

                                    <div className="flex items-center flex-wrap gap-4 mb-8">
                                        {config.series.map(s => (
                                            <div key={s.id} className="flex items-center gap-2">
                                                <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                                                <span style={{ color: config.textColor, fontSize: '0.875rem' }}>{s.name}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex flex-col flex-1">
                                        <div className="flex items-end justify-between gap-6" style={{ height: "300px" }}>
                                            {config.dataPoints.map(dp => (
                                                <div
                                                    key={dp.id}
                                                    className="flex flex-col items-center flex-1"
                                                    style={{ minWidth: `${minGroupWidth}px` }}
                                                >
                                                    <div className="flex items-end justify-center gap-1 w-full h-full">
                                                        {config.series.map(s => {
                                                            const val = dp.values[s.id] || 0;
                                                            const heightPx = maxValue > 0 ? (val / maxValue) * 280 : 0;
                                                            return (
                                                                <div
                                                                    key={s.id}
                                                                    className="flex-1 max-w-[40px] rounded-t-sm transition-all duration-300 relative group flex flex-col justify-end"
                                                                    style={{ height: `${Math.max(1, heightPx)}px`, backgroundColor: s.color, opacity: 0.9 }}
                                                                >
                                                                    {/* Conditionally rotate text if there are too many bars so it doesn't overlap */}
                                                                    <span
                                                                        className={`text-[10px] text-center w-full absolute -top-5 opacity-70 ${config.series.length > 4 ? '-rotate-45 -translate-y-1' : ''}`}
                                                                        style={{ color: config.textColor }}
                                                                    >
                                                                        {val}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="w-full h-px mt-2 shrink-0" style={{ backgroundColor: config.textColor, opacity: 0.3 }} />

                                        <div className="flex justify-between gap-6">
                                            {config.dataPoints.map(dp => (
                                                <div
                                                    key={dp.id}
                                                    className="flex-1 flex flex-col items-center"
                                                    style={{ minWidth: `${minGroupWidth}px` }}
                                                >
                                                    <div className="w-px h-2 shrink-0" style={{ backgroundColor: config.textColor, opacity: 0.3 }} />
                                                    <div className="text-sm text-center mt-2 font-medium" style={{ color: config.textColor }}>{dp.label}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="text-center mt-8 text-sm italic" style={{ color: config.textColor }}>{config.xAxisLabel}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}