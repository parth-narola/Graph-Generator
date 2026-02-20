import { useState, useRef, useCallback } from "react";
import { toPng, toSvg } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Download, Plus, Trash2, RotateCcw, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import testdinoLogo from "@assets/image_1769153159547.png";

const defaultColors = ["#9b4f82", "#e8a5d0", "#6b8e9c", "#7cb97c", "#d4a574"];

interface LineSeries {
  id: string;
  name: string;
  color: string;
  lineStyle: "solid" | "dashed" | "dotted";
  dotShape: "circle" | "square" | "triangle" | "star";
  lineWidth: number;
}

interface DataPoint {
  id: string;
  label: string;
  values: Record<string, number>;
}

interface LineChartConfig {
  title: string;
  xAxisLabel: string;
  yAxisLabel: string;
  yAxisMax: number;
  yAxisStep: number;
  valueFormat: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  gridColor: string;
  showGrid: boolean;
  showLegend: boolean;
  showDots: boolean;
  series: LineSeries[];
  dataPoints: DataPoint[];
}

const defaultConfig: LineChartConfig = {
  title: "Performance Trends Over Time",
  xAxisLabel: "Timeline",
  yAxisLabel: "Score",
  yAxisMax: 100,
  yAxisStep: 20,
  valueFormat: "",
  backgroundColor: "#fafafa",
  borderColor: "#e0e0e0",
  textColor: "#1a1a1a",
  gridColor: "#e0e0e0",
  showGrid: true,
  showLegend: true,
  showDots: false,
  series: [
    {
      id: "s1",
      name: "Version 1",
      color: "#9b4f82",
      lineStyle: "solid",
      dotShape: "circle",
      lineWidth: 3,
    },
    {
      id: "s2",
      name: "Version 2",
      color: "#6b8e9c",
      lineStyle: "dashed",
      dotShape: "star",
      lineWidth: 3,
    },
  ],
  dataPoints: [
    { id: "1", label: "Jan", values: { s1: 40, s2: 24 } },
    { id: "2", label: "Feb", values: { s1: 30, s2: 13 } },
    { id: "3", label: "Mar", values: { s1: 20, s2: 98 } },
    { id: "4", label: "Apr", values: { s1: 27, s2: 39 } },
    { id: "5", label: "May", values: { s1: 18, s2: 48 } },
  ],
};

const CustomDot = (props: any) => {
  const { cx, cy, stroke, fill, shape } = props;
  if (!cx || !cy) return null;

  // FIXED: Inherits the exact color of the line and removes the white stroke entirely!
  const dotColor = stroke || fill;

  if (shape === "square") {
    return (
      <rect
        x={cx - 5}
        y={cy - 5}
        width={10}
        height={10}
        fill={dotColor}
        stroke="none"
        fillOpacity={1}
      />
    );
  }
  if (shape === "triangle") {
    return (
      <polygon
        points={`${cx},${cy - 6} ${cx - 6},${cy + 6} ${cx + 6},${cy + 6}`}
        fill={dotColor}
        stroke="none"
        fillOpacity={1}
      />
    );
  }
  if (shape === "star") {
    return (
      <polygon
        points={`${cx},${cy - 7} ${cx + 2},${cy - 2} ${cx + 7},${cy - 2} ${cx + 3},${cy + 2} ${cx + 4},${cy + 7} ${cx},${cy + 4} ${cx - 4},${cy + 7} ${cx - 3},${cy + 2} ${cx - 7},${cy - 2} ${cx - 2},${cy - 2}`}
        fill={dotColor}
        stroke="none"
        fillOpacity={1}
      />
    );
  }
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill={dotColor}
      stroke="none"
      fillOpacity={1}
    />
  );
};

export default function CombinedLineChart() {
  const [config, setConfig] = useState<LineChartConfig>(defaultConfig);
  const [isExporting, setIsExporting] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  const updateConfig = <K extends keyof LineChartConfig>(
    key: K,
    value: LineChartConfig[K],
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const addSeries = () => {
    const newId = `s${Date.now()}`;
    const color = defaultColors[config.series.length % defaultColors.length];
    setConfig((prev) => ({
      ...prev,
      series: [
        ...prev.series,
        {
          id: newId,
          name: `Series ${prev.series.length + 1}`,
          color,
          lineStyle: "solid",
          dotShape: "circle",
          lineWidth: 3,
        },
      ],
      dataPoints: prev.dataPoints.map((dp) => ({
        ...dp,
        values: { ...dp.values, [newId]: 50 },
      })),
    }));
  };

  const updateSeries = (
    id: string,
    field: keyof LineSeries,
    value: string | number,
  ) => {
    setConfig((prev) => ({
      ...prev,
      series: prev.series.map((s) =>
        s.id === id ? { ...s, [field]: value } : s,
      ),
    }));
  };

  const removeSeries = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      series: prev.series.filter((s) => s.id !== id),
      dataPoints: prev.dataPoints.map((dp) => {
        const newValues = { ...dp.values };
        delete newValues[id];
        return { ...dp, values: newValues };
      }),
    }));
  };

  const addDataPoint = () => {
    const newId = Date.now().toString();
    const initialValues: Record<string, number> = {};
    config.series.forEach((s) => (initialValues[s.id] = 50));
    setConfig((prev) => ({
      ...prev,
      dataPoints: [
        ...prev.dataPoints,
        { id: newId, label: "New Point", values: initialValues },
      ],
    }));
  };

  const updateDataPoint = (pointId: string, field: string, value: string) => {
    setConfig((prev) => ({
      ...prev,
      dataPoints: prev.dataPoints.map((dp) =>
        dp.id === pointId ? { ...dp, [field]: value } : dp,
      ),
    }));
  };

  const updateDataPointValue = (
    pointId: string,
    seriesId: string,
    value: number,
  ) => {
    setConfig((prev) => ({
      ...prev,
      dataPoints: prev.dataPoints.map((dp) =>
        dp.id === pointId
          ? { ...dp, values: { ...dp.values, [seriesId]: value } }
          : dp,
      ),
    }));
  };

  const removeDataPoint = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      dataPoints: prev.dataPoints.filter((dp) => dp.id !== id),
    }));
  };

  const resetToDefault = () => {
    setConfig(defaultConfig);
  };

  const exportChart = useCallback(
    async (format: "png" | "svg") => {
      if (!chartRef.current) return;
      setIsExporting(true);
      try {
        const node = chartRef.current;
        const options = {
          quality: 1,
          pixelRatio: 3,
          backgroundColor: config.backgroundColor,
          width: node.clientWidth + 2,
          height: node.clientHeight + 2,
          style: { margin: "0", transform: "none" },
        };
        const dataUrl =
          format === "svg"
            ? await toSvg(node, options)
            : await toPng(node, options);
        const link = document.createElement("a");
        link.download = `line-chart.${format}`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error("Export failed:", err);
      } finally {
        setIsExporting(false);
      }
    },
    [config.backgroundColor],
  );

  const getStrokeDasharray = (style: string) => {
    if (style === "dashed") return "8 8";
    if (style === "dotted") return "3 3";
    return "";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
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
              <RotateCcw className="w-4 h-4 mr-2" /> Reset
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button disabled={isExporting} data-testid="button-export">
                  <Download className="w-4 h-4 mr-2" />
                  {isExporting ? "Exporting..." : "Export"}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => exportChart("png")}
                  data-testid="export-png"
                >
                  Export as PNG
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => exportChart("svg")}
                  data-testid="export-svg"
                >
                  Export as SVG
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle style={{ fontFamily: "'Geist', sans-serif" }}>
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-220px)]">
                <div className="space-y-6 pr-4">
                  <div className="space-y-2">
                    <Label>Chart Title</Label>
                    <Input
                      value={config.title}
                      onChange={(e) => updateConfig("title", e.target.value)}
                      data-testid="input-title"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>X-Axis Label</Label>
                      <Input
                        value={config.xAxisLabel}
                        onChange={(e) =>
                          updateConfig("xAxisLabel", e.target.value)
                        }
                        data-testid="input-xaxis"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Y-Axis Label</Label>
                      <Input
                        value={config.yAxisLabel}
                        onChange={(e) =>
                          updateConfig("yAxisLabel", e.target.value)
                        }
                        data-testid="input-yaxis"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Y-Axis Max</Label>
                      <Input
                        type="number"
                        value={config.yAxisMax}
                        onChange={(e) =>
                          updateConfig("yAxisMax", Number(e.target.value))
                        }
                        data-testid="input-y-max"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Y-Axis Step</Label>
                      <Input
                        type="number"
                        value={config.yAxisStep}
                        onChange={(e) =>
                          updateConfig("yAxisStep", Number(e.target.value))
                        }
                        data-testid="input-y-step"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Value Suffix</Label>
                    <Input
                      value={config.valueFormat}
                      onChange={(e) =>
                        updateConfig("valueFormat", e.target.value)
                      }
                      placeholder="e.g., K, B, %"
                      data-testid="input-format"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      Display Options
                    </Label>
                    <div className="flex items-center justify-between">
                      <Label>Show Grid</Label>
                      <Switch
                        checked={config.showGrid}
                        onCheckedChange={(checked) =>
                          updateConfig("showGrid", checked)
                        }
                        data-testid="switch-grid"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Show Legend</Label>
                      <Switch
                        checked={config.showLegend}
                        onCheckedChange={(checked) =>
                          updateConfig("showLegend", checked)
                        }
                        data-testid="switch-legend"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Show Data Points</Label>
                      <Switch
                        checked={config.showDots}
                        onCheckedChange={(checked) =>
                          updateConfig("showDots", checked)
                        }
                        data-testid="switch-dots"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Colors</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Background</Label>
                        <div className="flex gap-1">
                          <input
                            type="color"
                            value={config.backgroundColor}
                            onChange={(e) =>
                              updateConfig("backgroundColor", e.target.value)
                            }
                            className="w-10 h-8 rounded cursor-pointer"
                            data-testid="input-bg-color"
                          />
                          <Input
                            value={config.backgroundColor}
                            onChange={(e) =>
                              updateConfig("backgroundColor", e.target.value)
                            }
                            className="flex-1 h-8 text-xs"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Border</Label>
                        <div className="flex gap-1">
                          <input
                            type="color"
                            value={config.borderColor}
                            onChange={(e) =>
                              updateConfig("borderColor", e.target.value)
                            }
                            className="w-10 h-8 rounded cursor-pointer"
                            data-testid="input-border-color"
                          />
                          <Input
                            value={config.borderColor}
                            onChange={(e) =>
                              updateConfig("borderColor", e.target.value)
                            }
                            className="flex-1 h-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Text Color</Label>
                        <div className="flex gap-1">
                          <input
                            type="color"
                            value={config.textColor}
                            onChange={(e) =>
                              updateConfig("textColor", e.target.value)
                            }
                            className="w-10 h-8 rounded cursor-pointer"
                            data-testid="input-text-color"
                          />
                          <Input
                            value={config.textColor}
                            onChange={(e) =>
                              updateConfig("textColor", e.target.value)
                            }
                            className="flex-1 h-8 text-xs"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Grid Color</Label>
                        <div className="flex gap-1">
                          <input
                            type="color"
                            value={config.gridColor}
                            onChange={(e) =>
                              updateConfig("gridColor", e.target.value)
                            }
                            className="w-10 h-8 rounded cursor-pointer"
                            data-testid="input-grid-color"
                          />
                          <Input
                            value={config.gridColor}
                            onChange={(e) =>
                              updateConfig("gridColor", e.target.value)
                            }
                            className="flex-1 h-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label>Line Series</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={addSeries}
                        data-testid="button-add-series"
                      >
                        <Plus className="w-4 h-4 mr-1" /> Add Line
                      </Button>
                    </div>
                    {config.series.map((s, idx) => (
                      <Card key={s.id} className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <Input
                            value={s.name}
                            onChange={(e) =>
                              updateSeries(s.id, "name", e.target.value)
                            }
                            className="h-8 w-2/3"
                            data-testid={`input-series-name-${idx}`}
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeSeries(s.id)}
                            disabled={config.series.length <= 1}
                            className="h-8 w-8 text-destructive"
                            data-testid={`button-remove-series-${idx}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div>
                            <Label className="text-[10px]">Color</Label>
                            <input
                              type="color"
                              value={s.color}
                              onChange={(e) =>
                                updateSeries(s.id, "color", e.target.value)
                              }
                              className="w-full h-7 rounded cursor-pointer p-0 border-0"
                              data-testid={`input-series-color-${idx}`}
                            />
                          </div>
                          <div>
                            <Label className="text-[10px]">Line Width</Label>
                            <Input
                              type="number"
                              value={s.lineWidth}
                              onChange={(e) =>
                                updateSeries(
                                  s.id,
                                  "lineWidth",
                                  parseInt(e.target.value) || 2,
                                )
                              }
                              min={1}
                              max={10}
                              className="h-7 text-xs"
                              data-testid={`input-series-width-${idx}`}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-[10px]">Line Style</Label>
                            <select
                              value={s.lineStyle}
                              onChange={(e) =>
                                updateSeries(
                                  s.id,
                                  "lineStyle",
                                  e.target.value as any,
                                )
                              }
                              className="w-full h-7 text-xs border rounded px-1"
                              data-testid={`select-series-style-${idx}`}
                            >
                              <option value="solid">Solid</option>
                              <option value="dashed">Dashed</option>
                              <option value="dotted">Dotted</option>
                            </select>
                          </div>
                          <div
                            className={
                              config.showDots
                                ? ""
                                : "opacity-50 pointer-events-none"
                            }
                          >
                            <Label className="text-[10px]">Point Style</Label>
                            <select
                              value={s.dotShape}
                              onChange={(e) =>
                                updateSeries(
                                  s.id,
                                  "dotShape",
                                  e.target.value as any,
                                )
                              }
                              className="w-full h-7 text-xs border rounded px-1"
                              data-testid={`select-series-shape-${idx}`}
                            >
                              <option value="circle">Circle</option>
                              <option value="square">Square</option>
                              <option value="triangle">Triangle</option>
                              <option value="star">Star</option>
                            </select>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label>Data Points</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={addDataPoint}
                        data-testid="button-add-datapoint"
                      >
                        <Plus className="w-4 h-4 mr-1" /> Add Point
                      </Button>
                    </div>
                    {config.dataPoints.map((dp, idx) => (
                      <Card key={dp.id} className="p-3 mb-2">
                        <div className="flex items-center justify-between mb-2">
                          <Input
                            value={dp.label}
                            onChange={(e) =>
                              updateDataPoint(dp.id, "label", e.target.value)
                            }
                            className="h-8 w-2/3"
                            data-testid={`input-dp-label-${idx}`}
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeDataPoint(dp.id)}
                            disabled={config.dataPoints.length <= 1}
                            data-testid={`button-remove-dp-${idx}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {config.series.map((s, sIdx) => (
                            <div key={s.id}>
                              <Label className="text-[10px] truncate">
                                {s.name}
                              </Label>
                              <Input
                                type="number"
                                value={dp.values[s.id] || 0}
                                onChange={(e) =>
                                  updateDataPointValue(
                                    dp.id,
                                    s.id,
                                    Number(e.target.value),
                                  )
                                }
                                className="h-7 text-xs"
                                data-testid={`input-dp-value-${idx}-${sIdx}`}
                              />
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
            <CardHeader>
              <CardTitle style={{ fontFamily: "'Geist', sans-serif" }}>
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto overflow-y-hidden pb-4">
                <div
                  ref={chartRef}
                  className="p-8 min-w-full w-max flex flex-col"
                  style={{
                    backgroundColor: config.backgroundColor,
                    border: `1px solid ${config.borderColor}`,
                  }}
                  data-testid="chart-preview"
                >
                  <div className="flex items-start justify-between w-full mb-6 gap-8">
                    <h2
                      className="text-xl font-bold flex-1"
                      style={{
                        color: config.textColor,
                        fontFamily: "'Geist', sans-serif",
                      }}
                    >
                      {config.title}
                    </h2>
                    <img
                      src={testdinoLogo}
                      alt="Logo"
                      className="h-8 w-auto shrink-0"
                    />
                  </div>

                  {/* HTML WRAPPER LAYOUT FOR AXES */}
                  <div
                    className="flex items-stretch w-full"
                    style={{ height: "400px" }}
                  >
                    {/* Y-Axis Label Rendered Outside the SVG */}
                    {config.yAxisLabel && (
                      <div
                        className="flex items-center justify-center shrink-0 mr-2"
                        style={{ width: "20px" }}
                      >
                        <span
                          style={{
                            transform: "rotate(-90deg)",
                            whiteSpace: "nowrap",
                            color: config.textColor,
                            fontFamily: "'Geist', sans-serif",
                            fontSize: "14px",
                            fontWeight: 500,
                          }}
                        >
                          {config.yAxisLabel}
                        </span>
                      </div>
                    )}

                    {/* Chart Core */}
                    <div
                      className="flex-1"
                      style={{
                        minWidth: `${Math.max(600, config.dataPoints.length * 80)}px`,
                      }}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsLineChart
                          data={config.dataPoints}
                          margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                        >
                          {config.showGrid && (
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke={config.gridColor}
                              opacity={0.3}
                            />
                          )}
                          <XAxis
                            dataKey="label"
                            stroke={config.textColor}
                            tick={{ fill: config.textColor }}
                          />
                          <YAxis
                            stroke={config.textColor}
                            tick={{ fill: config.textColor }}
                            width={80}
                            domain={[0, config.yAxisMax]}
                            ticks={Array.from(
                              {
                                length:
                                  Math.floor(
                                    config.yAxisMax / config.yAxisStep,
                                  ) + 1,
                              },
                              (_, i) => i * config.yAxisStep,
                            )}
                            tickFormatter={(value) =>
                              `${value}${config.valueFormat}`
                            }
                          />
                          <Tooltip
                            contentStyle={{
                              borderRadius: "8px",
                              fontFamily: "'Geist', sans-serif",
                            }}
                            formatter={(value: any) => [
                              `${value}${config.valueFormat}`,
                              "",
                            ]}
                          />
                          {config.showLegend && (
                            <Legend
                              wrapperStyle={{
                                paddingTop: "20px",
                                fontFamily: "'Geist', sans-serif",
                              }}
                            />
                          )}
                          {config.series.map((s) => (
                            <Line
                              key={s.id}
                              type="monotone"
                              name={s.name}
                              dataKey={`values.${s.id}`}
                              stroke={s.color}
                              strokeWidth={s.lineWidth}
                              strokeDasharray={getStrokeDasharray(s.lineStyle)}
                              isAnimationActive={false}
                              dot={
                                config.showDots ? (
                                  <CustomDot shape={s.dotShape} />
                                ) : (
                                  false
                                )
                              }
                              activeDot={{ r: 8 }}
                            />
                          ))}
                        </RechartsLineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* X-Axis Label Rendered Outside the SVG */}
                  {config.xAxisLabel && (
                    <div
                      className="text-center mt-4 text-sm font-medium"
                      style={{
                        color: config.textColor,
                        fontFamily: "'Geist', sans-serif",
                      }}
                    >
                      {config.xAxisLabel}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
