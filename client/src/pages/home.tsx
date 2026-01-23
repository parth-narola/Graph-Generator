import { useState, useRef, useCallback } from "react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Plus, Trash2, RotateCcw } from "lucide-react";
import testdinoLogo from "@assets/image_1769153159547.png";

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, l: 50 };
  
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function darkenColor(hex: string, amount: number = 20): string {
  const { h, s, l } = hexToHsl(hex);
  const newL = Math.max(0, l - amount);
  return hslToHex(h, s, newL);
}

interface DataPoint {
  id: string;
  label: string;
  value1: number;
  value2: number;
}

interface ChartConfig {
  title: string;
  xAxisLabel: string;
  legend1: string;
  legend2: string;
  bar1Color: string;
  bar2Color: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  showPercentageChange: boolean;
  dataPoints: DataPoint[];
}

const defaultConfig: ChartConfig = {
  title: "TestDino V2 spends less time on easy tasks, and more time on complex executions",
  xAxisLabel: "# of model-generated tokens per response",
  legend1: "TestDino V1",
  legend2: "TestDino V2",
  bar1Color: "#9b4f82",
  bar2Color: "#e8a5d0",
  backgroundColor: "#fafafa",
  borderColor: "#e0e0e0",
  textColor: "#1a1a1a",
  showPercentageChange: true,
  dataPoints: [
    { id: "1", label: "10th percentile", value1: 100, value2: 38 },
    { id: "2", label: "30th percentile", value1: 100, value2: 65 },
    { id: "3", label: "50th percentile", value1: 100, value2: 95 },
    { id: "4", label: "70th percentile", value1: 100, value2: 128 },
    { id: "5", label: "80th percentile", value1: 100, value2: 176 },
  ],
};

export default function Home() {
  const [config, setConfig] = useState<ChartConfig>(defaultConfig);
  const [isExporting, setIsExporting] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  const updateConfig = <K extends keyof ChartConfig>(key: K, value: ChartConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const updateDataPoint = (id: string, field: keyof DataPoint, value: string | number) => {
    setConfig(prev => ({
      ...prev,
      dataPoints: prev.dataPoints.map(dp =>
        dp.id === id ? { ...dp, [field]: value } : dp
      ),
    }));
  };

  const addDataPoint = () => {
    const newId = Date.now().toString();
    setConfig(prev => ({
      ...prev,
      dataPoints: [...prev.dataPoints, { id: newId, label: "New Label", value1: 100, value2: 100 }],
    }));
  };

  const removeDataPoint = (id: string) => {
    setConfig(prev => ({
      ...prev,
      dataPoints: prev.dataPoints.filter(dp => dp.id !== id),
    }));
  };

  const resetToDefault = () => {
    setConfig(defaultConfig);
  };

  const exportToPng = useCallback(async () => {
    if (!chartRef.current) return;
    
    setIsExporting(true);
    try {
      const dataUrl = await toPng(chartRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: config.backgroundColor,
        skipFonts: true,
      });
      
      const link = document.createElement("a");
      link.download = "testdino-chart.png";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Error exporting chart:", err);
    } finally {
      setIsExporting(false);
    }
  }, [config.backgroundColor]);

  const maxValue = Math.max(
    ...config.dataPoints.flatMap(dp => [dp.value1, dp.value2])
  );

  const getPercentageChange = (v1: number, v2: number) => {
    if (v1 === 0) return 0;
    return Math.round(((v2 - v1) / v1) * 100);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ fontFamily: "'Geist', sans-serif" }}>
            Chart Generator
          </h1>
          <p className="text-muted-foreground mt-1">
            Create beautiful comparison bar charts with full customization
          </p>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-6">
          <Card className="h-fit">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-lg">Configuration</CardTitle>
                <Button variant="outline" size="sm" onClick={resetToDefault} data-testid="button-reset">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-280px)] pr-4">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                      Text Content
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="title">Chart Title</Label>
                        <Input
                          id="title"
                          value={config.title}
                          onChange={e => updateConfig("title", e.target.value)}
                          className="mt-1.5"
                          data-testid="input-title"
                        />
                      </div>
                      <div>
                        <Label htmlFor="xAxisLabel">X-Axis Label</Label>
                        <Input
                          id="xAxisLabel"
                          value={config.xAxisLabel}
                          onChange={e => updateConfig("xAxisLabel", e.target.value)}
                          className="mt-1.5"
                          data-testid="input-x-axis"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="legend1">Legend 1</Label>
                          <Input
                            id="legend1"
                            value={config.legend1}
                            onChange={e => updateConfig("legend1", e.target.value)}
                            className="mt-1.5"
                            data-testid="input-legend1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="legend2">Legend 2</Label>
                          <Input
                            id="legend2"
                            value={config.legend2}
                            onChange={e => updateConfig("legend2", e.target.value)}
                            className="mt-1.5"
                            data-testid="input-legend2"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                      Colors
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="bar1Color">Bar 1 Color</Label>
                        <div className="flex items-center gap-2 mt-1.5">
                          <input
                            type="color"
                            id="bar1Color"
                            value={config.bar1Color}
                            onChange={e => updateConfig("bar1Color", e.target.value)}
                            className="w-10 h-9 rounded-md border cursor-pointer"
                            data-testid="input-bar1-color"
                          />
                          <Input
                            value={config.bar1Color}
                            onChange={e => updateConfig("bar1Color", e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="bar2Color">Bar 2 Color</Label>
                        <div className="flex items-center gap-2 mt-1.5">
                          <input
                            type="color"
                            id="bar2Color"
                            value={config.bar2Color}
                            onChange={e => updateConfig("bar2Color", e.target.value)}
                            className="w-10 h-9 rounded-md border cursor-pointer"
                            data-testid="input-bar2-color"
                          />
                          <Input
                            value={config.bar2Color}
                            onChange={e => updateConfig("bar2Color", e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="backgroundColor">Background</Label>
                        <div className="flex items-center gap-2 mt-1.5">
                          <input
                            type="color"
                            id="backgroundColor"
                            value={config.backgroundColor}
                            onChange={e => updateConfig("backgroundColor", e.target.value)}
                            className="w-10 h-9 rounded-md border cursor-pointer"
                            data-testid="input-bg-color"
                          />
                          <Input
                            value={config.backgroundColor}
                            onChange={e => updateConfig("backgroundColor", e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="borderColor">Border</Label>
                        <div className="flex items-center gap-2 mt-1.5">
                          <input
                            type="color"
                            id="borderColor"
                            value={config.borderColor}
                            onChange={e => updateConfig("borderColor", e.target.value)}
                            className="w-10 h-9 rounded-md border cursor-pointer"
                            data-testid="input-border-color"
                          />
                          <Input
                            value={config.borderColor}
                            onChange={e => updateConfig("borderColor", e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="textColor">Text Color</Label>
                      <div className="flex items-center gap-2 mt-1.5">
                        <input
                          type="color"
                          id="textColor"
                          value={config.textColor}
                          onChange={e => updateConfig("textColor", e.target.value)}
                          className="w-10 h-9 rounded-md border cursor-pointer"
                          data-testid="input-text-color"
                        />
                        <Input
                          value={config.textColor}
                          onChange={e => updateConfig("textColor", e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                      Options
                    </h3>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="showPercentage"
                        checked={config.showPercentageChange}
                        onChange={e => updateConfig("showPercentageChange", e.target.checked)}
                        className="w-4 h-4 rounded border-border"
                        data-testid="checkbox-percentage"
                      />
                      <Label htmlFor="showPercentage" className="cursor-pointer">
                        Show percentage change labels
                      </Label>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                        Data Points
                      </h3>
                      <Button variant="outline" size="sm" onClick={addDataPoint} data-testid="button-add-data">
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {config.dataPoints.map((dp, index) => (
                        <div key={dp.id} className="p-3 bg-muted/50 rounded-md space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium">Point {index + 1}</span>
                            {config.dataPoints.length > 1 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeDataPoint(dp.id)}
                                className="h-7 w-7"
                                data-testid={`button-remove-data-${index}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          <div>
                            <Label className="text-xs">Label</Label>
                            <Input
                              value={dp.label}
                              onChange={e => updateDataPoint(dp.id, "label", e.target.value)}
                              className="mt-1 h-8"
                              data-testid={`input-label-${index}`}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Value 1</Label>
                              <Input
                                type="number"
                                value={dp.value1}
                                onChange={e => updateDataPoint(dp.id, "value1", Number(e.target.value))}
                                className="mt-1 h-8"
                                data-testid={`input-value1-${index}`}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Value 2</Label>
                              <Input
                                type="number"
                                value={dp.value2}
                                onChange={e => updateDataPoint(dp.id, "value2", Number(e.target.value))}
                                className="mt-1 h-8"
                                data-testid={`input-value2-${index}`}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h2 className="text-lg font-semibold">Preview</h2>
              <Button onClick={exportToPng} disabled={isExporting} data-testid="button-export">
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? "Exporting..." : "Export PNG"}
              </Button>
            </div>

            <div className="overflow-auto rounded-md border">
              <div
                ref={chartRef}
                className="p-8 min-w-[800px]"
                style={{
                  backgroundColor: config.backgroundColor,
                  border: `2px solid ${config.borderColor}`,
                  borderRadius: "12px",
                  fontFamily: "'Geist', sans-serif",
                }}
              >
                <div className="flex justify-between items-start mb-8">
                  <h2
                    className="text-2xl font-semibold max-w-[70%] leading-tight"
                    style={{ color: config.textColor, fontFamily: "'Geist', sans-serif" }}
                  >
                    {config.title}
                  </h2>
                  <div className="flex items-center gap-2">
                    <img src={testdinoLogo} alt="TestDino" className="h-12 object-contain" />
                  </div>
                </div>

                <div className="flex items-center gap-6 mb-8">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: config.bar1Color }}
                    />
                    <span style={{ color: config.textColor, fontFamily: "'Geist', sans-serif" }}>
                      {config.legend1}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: config.bar2Color }}
                    />
                    <span style={{ color: config.textColor, fontFamily: "'Geist', sans-serif" }}>
                      {config.legend2}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="flex items-end justify-between gap-4" style={{ height: "280px" }}>
                    {config.dataPoints.map((dp) => {
                      const percentChange = getPercentageChange(dp.value1, dp.value2);
                      const height1 = maxValue > 0 ? (dp.value1 / maxValue) * 230 : 0;
                      const height2 = maxValue > 0 ? (dp.value2 / maxValue) * 230 : 0;
                      
                      return (
                        <div key={dp.id} className="flex flex-col items-center flex-1">
                          {config.showPercentageChange && (
                            <div
                              className="text-sm font-medium mb-2"
                              style={{
                                color: config.textColor,
                                fontFamily: "'Geist Mono', monospace",
                              }}
                            >
                              {percentChange >= 0 ? "+" : ""}{percentChange}%
                            </div>
                          )}
                          <div className="flex items-end gap-1">
                            <div
                              className="w-10 rounded-md transition-all duration-300"
                              style={{
                                height: `${height1}px`,
                                backgroundColor: config.bar1Color,
                                border: `1px solid ${darkenColor(config.bar1Color, 20)}`,
                              }}
                            />
                            <div
                              className="w-10 rounded-md transition-all duration-300"
                              style={{
                                height: `${height2}px`,
                                backgroundColor: config.bar2Color,
                                border: `1px solid ${darkenColor(config.bar2Color, 20)}`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div 
                    className="w-full h-px mt-2"
                    style={{ backgroundColor: config.textColor, opacity: 0.3 }}
                  />
                  
                  <div className="flex justify-between gap-4">
                    {config.dataPoints.map((dp) => (
                      <div
                        key={dp.id}
                        className="flex-1 flex flex-col items-center"
                      >
                        <div 
                          className="w-px h-3"
                          style={{ backgroundColor: config.textColor, opacity: 0.3 }}
                        />
                        <div
                          className="text-sm text-center mt-2"
                          style={{ color: config.textColor, fontFamily: "'Geist', sans-serif" }}
                        >
                          {dp.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className="text-center mt-8 text-base"
                  style={{ color: config.textColor, fontFamily: "'Geist', sans-serif" }}
                >
                  {config.xAxisLabel}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
