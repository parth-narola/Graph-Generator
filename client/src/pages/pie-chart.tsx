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
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import testdinoLogo from "@assets/image_1769153159547.png";

const defaultColors = ["#9b4f82", "#e8a5d0", "#6b8e9c", "#7cb97c", "#d4a574", "#c9726b"];

interface PieDataPoint {
  id: string;
  name: string;
  value: number;
  color: string;
}

interface PieChartConfig {
  title: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  isDonut: boolean;
  dataPoints: PieDataPoint[];
}

const defaultConfig: PieChartConfig = {
  title: "Test Automation Frameworks Distribution",
  backgroundColor: "#fafafa",
  borderColor: "#e0e0e0",
  textColor: "#1a1a1a",
  isDonut: true,
  dataPoints: [
    { id: "1", name: "Playwright", value: 45, color: "#9b4f82" },
    { id: "2", name: "Cypress", value: 30, color: "#e8a5d0" },
    { id: "3", name: "Selenium", value: 15, color: "#6b8e9c" },
    { id: "4", name: "Others", value: 10, color: "#d4a574" },
  ],
};

export default function PieChartPage() {
  const [config, setConfig] = useState<PieChartConfig>(defaultConfig);
  const [isExporting, setIsExporting] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  const updateConfig = <K extends keyof PieChartConfig>(key: K, value: PieChartConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const updateDataPoint = (id: string, field: keyof PieDataPoint, value: string | number) => {
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
      dataPoints: [...prev.dataPoints, { id: newId, name: "New Category", value: 10, color }],
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
      link.download = `pie-chart.${format}`;
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
          <h1 className="text-2xl font-bold font-sans">Pie Chart Generator</h1>
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

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isDonut"
                      checked={config.isDonut}
                      onChange={e => updateConfig("isDonut", e.target.checked)}
                      className="w-4 h-4 rounded border-border"
                    />
                    <Label htmlFor="isDonut" className="cursor-pointer">Donut Style</Label>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label>Data Points</Label>
                      <Button size="sm" variant="outline" onClick={addDataPoint}><Plus className="w-4 h-4 mr-1" /> Add Slice</Button>
                    </div>
                    {config.dataPoints.map((dp, index) => (
                      <Card key={dp.id} className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Slice {index + 1}</span>
                          <Button size="icon" variant="ghost" onClick={() => removeDataPoint(dp.id)} disabled={config.dataPoints.length <= 1}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Label</Label>
                            <Input value={dp.name} onChange={e => updateDataPoint(dp.id, "name", e.target.value)} className="h-8 text-sm" />
                          </div>
                          <div>
                            <Label className="text-xs">Value</Label>
                            <Input type="number" value={dp.value} onChange={e => updateDataPoint(dp.id, "value", Number(e.target.value))} className="h-8 text-sm" />
                          </div>
                          <div className="col-span-2">
                            <Label className="text-xs">Color</Label>
                            <div className="flex gap-2">
                              <input type="color" value={dp.color} onChange={e => updateDataPoint(dp.id, "color", e.target.value)} className="w-10 h-8 rounded cursor-pointer" />
                              <Input value={dp.color} onChange={e => updateDataPoint(dp.id, "color", e.target.value)} className="flex-1 h-8 text-xs" />
                            </div>
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
                <div ref={chartRef} className="p-8 min-w-[600px] flex flex-col items-center" style={{ backgroundColor: config.backgroundColor, border: `1px solid ${config.borderColor}` }}>
                  <div className="flex items-start justify-between w-full mb-4">
                    <h2 className="text-xl font-bold" style={{ color: config.textColor }}>{config.title}</h2>
                    <img src={testdinoLogo} alt="Logo" className="h-8 w-auto" />
                  </div>
                  
                  <div style={{ width: "100%", height: "400px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={config.dataPoints}
                          cx="50%"
                          cy="50%"
                          innerRadius={config.isDonut ? 100 : 0}
                          outerRadius={150}
                          paddingAngle={config.isDonut ? 5 : 0}
                          dataKey="value"
                          isAnimationActive={false} // Required for Export to work smoothly
                          stroke={config.backgroundColor}
                          strokeWidth={2}
                        >
                          {config.dataPoints.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '8px' }} />
                        <Legend wrapperStyle={{ color: config.textColor }} />
                      </PieChart>
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