import { useState, useRef, useCallback } from "react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Download, Plus, Trash2, RotateCcw } from "lucide-react";
import testdinoLogo from "@assets/image_1768935263598.png";

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
  value: number;
  annotation: string;
}

interface LineChartConfig {
  title: string;
  lineColor: string;
  pointColor: string;
  annotationBgColor: string;
  annotationTextColor: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  showAnnotations: boolean;
  pointSize: number;
  lineWidth: number;
  dataPoints: DataPoint[];
}

const defaultConfig: LineChartConfig = {
  title: "Median Playwright Suite Duration VS Adoption Maturity (2024-2026)",
  lineColor: "#6b8e9c",
  pointColor: "#6b8e9c",
  annotationBgColor: "#ffffff",
  annotationTextColor: "#1a1a1a",
  backgroundColor: "#fafafa",
  borderColor: "#e0e0e0",
  textColor: "#1a1a1a",
  showAnnotations: true,
  pointSize: 8,
  lineWidth: 2,
  dataPoints: [
    { id: "1", label: "Pilot", value: 12, annotation: "No parallel execution" },
    { id: "2", label: "Early", value: 18, annotation: "Session reuse enabled" },
    { id: "3", label: "Growing", value: 25, annotation: "API mocking" },
    { id: "4", label: "Mature", value: 9, annotation: "Performance baseline" },
  ],
};

export default function LineChart() {
  const [config, setConfig] = useState<LineChartConfig>(defaultConfig);
  const [isExporting, setIsExporting] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  const updateConfig = <K extends keyof LineChartConfig>(key: K, value: LineChartConfig[K]) => {
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
      dataPoints: [...prev.dataPoints, { 
        id: newId, 
        label: "New", 
        value: 10, 
        annotation: "Description" 
      }],
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
      link.download = "line-chart.png";
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Failed to export chart:", error);
    } finally {
      setIsExporting(false);
    }
  }, [config.backgroundColor]);

  const maxValue = Math.max(...config.dataPoints.map(dp => dp.value));
  const yAxisMax = Math.ceil(maxValue / 5) * 5 + 5;
  const yAxisTicks = [];
  for (let i = 0; i <= yAxisMax; i += 5) {
    yAxisTicks.push(i);
  }

  const chartHeight = 380;
  const chartWidth = 700;
  const padding = { left: 50, right: 50, top: 80, bottom: 50 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  const getPointPosition = (index: number, value: number) => {
    const x = padding.left + (index / (config.dataPoints.length - 1)) * plotWidth;
    const y = padding.top + plotHeight - (value / yAxisMax) * plotHeight;
    return { x, y };
  };

  const linePath = config.dataPoints.map((dp, index) => {
    const { x, y } = getPointPosition(index, dp.value);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 
            className="text-2xl font-bold"
            style={{ fontFamily: "'Geist', sans-serif" }}
          >
            Line Chart Generator
          </h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={resetToDefault}
              data-testid="button-reset"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button
              onClick={exportToPng}
              disabled={isExporting}
              data-testid="button-export"
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? "Exporting..." : "Export PNG"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle style={{ fontFamily: "'Geist', sans-serif" }}>Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-220px)]">
                <div className="space-y-6 pr-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Chart Title</Label>
                    <Input
                      id="title"
                      value={config.title}
                      onChange={(e) => updateConfig("title", e.target.value)}
                      data-testid="input-title"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label>Line & Point Colors</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Line Color</Label>
                        <div className="flex gap-1">
                          <Input
                            type="color"
                            value={config.lineColor}
                            onChange={(e) => updateConfig("lineColor", e.target.value)}
                            className="w-10 h-8 p-1 cursor-pointer"
                            data-testid="input-line-color"
                          />
                          <Input
                            value={config.lineColor}
                            onChange={(e) => updateConfig("lineColor", e.target.value)}
                            className="flex-1 h-8 text-xs"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Point Color</Label>
                        <div className="flex gap-1">
                          <Input
                            type="color"
                            value={config.pointColor}
                            onChange={(e) => updateConfig("pointColor", e.target.value)}
                            className="w-10 h-8 p-1 cursor-pointer"
                            data-testid="input-point-color"
                          />
                          <Input
                            value={config.pointColor}
                            onChange={(e) => updateConfig("pointColor", e.target.value)}
                            className="flex-1 h-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Line Width</Label>
                      <Input
                        type="number"
                        value={config.lineWidth}
                        onChange={(e) => updateConfig("lineWidth", parseInt(e.target.value) || 2)}
                        min={1}
                        max={10}
                        className="h-8"
                        data-testid="input-line-width"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Point Size</Label>
                      <Input
                        type="number"
                        value={config.pointSize}
                        onChange={(e) => updateConfig("pointSize", parseInt(e.target.value) || 8)}
                        min={4}
                        max={20}
                        className="h-8"
                        data-testid="input-point-size"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Show Annotations</Label>
                      <Switch
                        checked={config.showAnnotations}
                        onCheckedChange={(checked) => updateConfig("showAnnotations", checked)}
                        data-testid="switch-annotations"
                      />
                    </div>
                    
                    {config.showAnnotations && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs text-muted-foreground">Annotation BG</Label>
                          <div className="flex gap-1">
                            <Input
                              type="color"
                              value={config.annotationBgColor}
                              onChange={(e) => updateConfig("annotationBgColor", e.target.value)}
                              className="w-10 h-8 p-1 cursor-pointer"
                              data-testid="input-annotation-bg"
                            />
                            <Input
                              value={config.annotationBgColor}
                              onChange={(e) => updateConfig("annotationBgColor", e.target.value)}
                              className="flex-1 h-8 text-xs"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Annotation Text</Label>
                          <div className="flex gap-1">
                            <Input
                              type="color"
                              value={config.annotationTextColor}
                              onChange={(e) => updateConfig("annotationTextColor", e.target.value)}
                              className="w-10 h-8 p-1 cursor-pointer"
                              data-testid="input-annotation-text"
                            />
                            <Input
                              value={config.annotationTextColor}
                              onChange={(e) => updateConfig("annotationTextColor", e.target.value)}
                              className="flex-1 h-8 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Background & Text Colors</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Background</Label>
                        <div className="flex gap-1">
                          <Input
                            type="color"
                            value={config.backgroundColor}
                            onChange={(e) => updateConfig("backgroundColor", e.target.value)}
                            className="w-10 h-8 p-1 cursor-pointer"
                            data-testid="input-bg-color"
                          />
                          <Input
                            value={config.backgroundColor}
                            onChange={(e) => updateConfig("backgroundColor", e.target.value)}
                            className="flex-1 h-8 text-xs"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Border</Label>
                        <div className="flex gap-1">
                          <Input
                            type="color"
                            value={config.borderColor}
                            onChange={(e) => updateConfig("borderColor", e.target.value)}
                            className="w-10 h-8 p-1 cursor-pointer"
                            data-testid="input-border-color"
                          />
                          <Input
                            value={config.borderColor}
                            onChange={(e) => updateConfig("borderColor", e.target.value)}
                            className="flex-1 h-8 text-xs"
                          />
                        </div>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs text-muted-foreground">Text Color</Label>
                        <div className="flex gap-1">
                          <Input
                            type="color"
                            value={config.textColor}
                            onChange={(e) => updateConfig("textColor", e.target.value)}
                            className="w-10 h-8 p-1 cursor-pointer"
                            data-testid="input-text-color"
                          />
                          <Input
                            value={config.textColor}
                            onChange={(e) => updateConfig("textColor", e.target.value)}
                            className="flex-1 h-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Data Points</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={addDataPoint}
                        data-testid="button-add-datapoint"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {config.dataPoints.map((dp, index) => (
                        <Card key={dp.id} className="p-3">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Point {index + 1}</span>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => removeDataPoint(dp.id)}
                                disabled={config.dataPoints.length <= 2}
                                data-testid={`button-remove-dp-${index}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs">Label</Label>
                                <Input
                                  value={dp.label}
                                  onChange={(e) => updateDataPoint(dp.id, "label", e.target.value)}
                                  className="h-8"
                                  data-testid={`input-dp-label-${index}`}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Value</Label>
                                <Input
                                  type="number"
                                  value={dp.value}
                                  onChange={(e) => updateDataPoint(dp.id, "value", parseFloat(e.target.value) || 0)}
                                  className="h-8"
                                  data-testid={`input-dp-value-${index}`}
                                />
                              </div>
                            </div>
                            {config.showAnnotations && (
                              <div>
                                <Label className="text-xs">Annotation</Label>
                                <Input
                                  value={dp.annotation}
                                  onChange={(e) => updateDataPoint(dp.id, "annotation", e.target.value)}
                                  className="h-8"
                                  placeholder="Description text"
                                  data-testid={`input-dp-annotation-${index}`}
                                />
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle style={{ fontFamily: "'Geist', sans-serif" }}>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <div 
                  ref={chartRef}
                  className="rounded-lg p-8 min-w-[750px]"
                  style={{
                    backgroundColor: config.backgroundColor,
                    border: `1px solid ${config.borderColor}`,
                  }}
                  data-testid="chart-preview"
                >
                <div className="flex items-start justify-between mb-8">
                  <h2
                    className="text-xl font-bold flex-1 pr-4"
                    style={{ color: config.textColor, fontFamily: "'Geist', sans-serif" }}
                  >
                    {config.title}
                  </h2>
                  <div className="flex items-center gap-2 shrink-0">
                    <img
                      src={testdinoLogo}
                      alt="TestDino"
                      className="h-6 w-auto"
                    />
                    <span
                      className="text-lg font-semibold"
                      style={{ color: config.textColor, fontFamily: "'Geist', sans-serif" }}
                    >
                      TestDino
                    </span>
                  </div>
                </div>

                <div className="flex" style={{ minHeight: `${chartHeight + 40}px` }}>
                  <div 
                    className="flex flex-col justify-between pr-3 text-right shrink-0"
                    style={{ height: `${chartHeight}px`, paddingTop: `${padding.top}px`, paddingBottom: `${padding.bottom}px`, minWidth: '35px' }}
                  >
                    {[...yAxisTicks].reverse().map((tick) => (
                      <span
                        key={tick}
                        className="text-xs"
                        style={{ 
                          color: config.textColor, 
                          fontFamily: "'Geist Mono', monospace",
                          opacity: 0.7
                        }}
                      >
                        {tick}
                      </span>
                    ))}
                  </div>

                  <div className="flex-1" style={{ minWidth: '500px' }}>
                    <svg 
                      width="100%" 
                      height={chartHeight} 
                      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                      preserveAspectRatio="xMidYMid meet"
                      style={{ overflow: 'visible' }}
                    >
                      {yAxisTicks.map((tick) => (
                        <line
                          key={tick}
                          x1={padding.left}
                          y1={padding.top + plotHeight - (tick / yAxisMax) * plotHeight}
                          x2={chartWidth - padding.right}
                          y2={padding.top + plotHeight - (tick / yAxisMax) * plotHeight}
                          stroke={config.textColor}
                          strokeOpacity={tick === 0 ? 0.4 : 0.25}
                          strokeWidth={1}
                          strokeDasharray={tick === 0 ? "none" : "4 4"}
                        />
                      ))}

                      <path
                        d={linePath}
                        fill="none"
                        stroke={config.lineColor}
                        strokeWidth={config.lineWidth}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {config.dataPoints.map((dp, index) => {
                        const { x, y } = getPointPosition(index, dp.value);
                        return (
                          <g key={dp.id}>
                            <circle
                              cx={x}
                              cy={y}
                              r={config.pointSize / 2 + 2}
                              fill={config.backgroundColor}
                              stroke={config.pointColor}
                              strokeWidth={config.lineWidth}
                            />
                            <circle
                              cx={x}
                              cy={y}
                              r={config.pointSize / 2 - 1}
                              fill={config.pointColor}
                            />
                          </g>
                        );
                      })}

                      {config.showAnnotations && config.dataPoints.map((dp, index) => {
                        const { x, y } = getPointPosition(index, dp.value);
                        const words = dp.annotation.split(' ');
                        let annotationLines: string[] = [];
                        if (words.length > 2) {
                          const mid = Math.ceil(words.length / 2);
                          annotationLines = [
                            words.slice(0, mid).join(' '),
                            words.slice(mid).join(' ')
                          ];
                        } else {
                          annotationLines = [dp.annotation];
                        }
                        const maxLineLength = Math.max(...annotationLines.map(l => l.length), String(dp.value).length + 2);
                        const boxWidth = Math.max(80, maxLineLength * 6.5 + 20);
                        const boxHeight = 30 + annotationLines.length * 14;
                        const isAbove = index % 2 === 0;
                        const boxY = isAbove ? y - boxHeight - 20 : y + 20;
                        const boxX = Math.max(5, Math.min(chartWidth - boxWidth - 5, x - boxWidth / 2));
                        
                        const connectorX = x;
                        
                        return (
                          <g key={`annotation-${dp.id}`}>
                            <line
                              x1={connectorX}
                              y1={y + (isAbove ? -config.pointSize/2 - 4 : config.pointSize/2 + 4)}
                              x2={connectorX}
                              y2={isAbove ? boxY + boxHeight + 2 : boxY - 2}
                              stroke={config.textColor}
                              strokeOpacity={0.15}
                              strokeWidth={1}
                              strokeDasharray="3 3"
                            />
                            <rect
                              x={boxX}
                              y={boxY}
                              width={boxWidth}
                              height={boxHeight}
                              rx={4}
                              fill={config.annotationBgColor}
                              stroke={config.textColor}
                              strokeOpacity={0.15}
                              strokeWidth={1}
                            />
                            <text
                              x={boxX + boxWidth / 2}
                              y={boxY + 18}
                              textAnchor="middle"
                              fill={config.lineColor}
                              fontFamily="'Geist Mono', monospace"
                              fontSize={14}
                              fontWeight="bold"
                            >
                              {dp.value}
                            </text>
                            {annotationLines.map((line, lineIndex) => (
                              <text
                                key={lineIndex}
                                x={boxX + boxWidth / 2}
                                y={boxY + 32 + lineIndex * 12}
                                textAnchor="middle"
                                fill={config.annotationTextColor}
                                fontFamily="'Geist Mono', monospace"
                                fontSize={10}
                              >
                                {line}
                              </text>
                            ))}
                          </g>
                        );
                      })}

                      {config.dataPoints.map((dp, index) => {
                        const x = padding.left + (index / (config.dataPoints.length - 1)) * plotWidth;
                        return (
                          <g key={`label-${dp.id}`}>
                            <line
                              x1={x}
                              y1={padding.top + plotHeight}
                              x2={x}
                              y2={padding.top + plotHeight + 8}
                              stroke={config.textColor}
                              strokeOpacity={0.3}
                              strokeWidth={1}
                            />
                            <text
                              x={x}
                              y={padding.top + plotHeight + 25}
                              textAnchor="middle"
                              fill={config.textColor}
                              fontFamily="'Geist Mono', monospace"
                              fontSize={12}
                            >
                              {dp.label}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
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
