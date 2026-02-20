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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from "recharts";
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

interface StackedChartConfig {
  title: string;
  xAxisLabel: string;
  yAxisLabel: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  series: ChartSeries[];
  dataPoints: DataPoint[];
}

const defaultConfig: StackedChartConfig = {
  title: "Revenue Breakdown by Product Line",
  xAxisLabel: "Quarter",
  yAxisLabel: "Revenue (in Thousands)",
  backgroundColor: "#fafafa",
  borderColor: "#e0e0e0",
  textColor: "#1a1a1a",
  series: [
    { id: "s1", name: "Software", color: "#9b4f82" },
    { id: "s2", name: "Hardware", color: "#6b8e9c" },
    { id: "s3", name: "Services", color: "#e8a5d0" },
  ],
  dataPoints: [
    { id: "1", label: "Q1", values: { s1: 4000, s2: 2400, s3: 2400 } },
    { id: "2", label: "Q2", values: { s1: 3000, s2: 1398, s3: 2210 } },
    { id: "3", label: "Q3", values: { s1: 2000, s2: 9800, s3: 2290 } },
    { id: "4", label: "Q4", values: { s1: 2780, s2: 3908, s3: 2000 } },
  ],
};

export default function StackedBarChartPage() {
  const [config, setConfig] = useState<StackedChartConfig>(defaultConfig);
  const [isExporting, setIsExporting] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  const updateConfig = <K extends keyof StackedChartConfig>(
    key: K,
    value: StackedChartConfig[K],
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const addSeries = () => {
    const newId = `s${Date.now()}`;
    const color = defaultColors[config.series.length % defaultColors.length];
    setConfig((prev) => ({
      ...prev,
      series: [...prev.series, { id: newId, name: `New Segment`, color }],
      dataPoints: prev.dataPoints.map((dp) => ({
        ...dp,
        values: { ...dp.values, [newId]: 1000 },
      })),
    }));
  };

  const updateSeries = (
    id: string,
    field: keyof ChartSeries,
    value: string,
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
    }));
  };

  const addDataPoint = () => {
    const newId = Date.now().toString();
    const initialValues: Record<string, number> = {};
    config.series.forEach((s) => (initialValues[s.id] = 1000));
    setConfig((prev) => ({
      ...prev,
      dataPoints: [
        ...prev.dataPoints,
        { id: newId, label: "New Data", values: initialValues },
      ],
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

  const updateDataPointLabel = (pointId: string, label: string) => {
    setConfig((prev) => ({
      ...prev,
      dataPoints: prev.dataPoints.map((dp) =>
        dp.id === pointId ? { ...dp, label } : dp,
      ),
    }));
  };

  const removeDataPoint = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      dataPoints: prev.dataPoints.filter((dp) => dp.id !== id),
    }));
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
        link.download = `stacked-bar.${format}`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error(err);
      } finally {
        setIsExporting(false);
      }
    },
    [config.backgroundColor],
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold font-sans">
            Stacked Bar Chart Generator
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setConfig(defaultConfig)}>
              <RotateCcw className="w-4 h-4 mr-2" /> Reset
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button disabled={isExporting}>
                  <Download className="w-4 h-4 mr-2" />{" "}
                  {isExporting ? "Exporting..." : "Export"}{" "}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => exportChart("png")}>
                  Export as PNG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportChart("svg")}>
                  Export as SVG
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-220px)]">
                <div className="space-y-6 pr-4">
                  <div className="space-y-2">
                    <Label>Chart Title</Label>
                    <Input
                      value={config.title}
                      onChange={(e) => updateConfig("title", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>X-Axis Label</Label>
                      <Input
                        value={config.xAxisLabel}
                        onChange={(e) =>
                          updateConfig("xAxisLabel", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Y-Axis Label</Label>
                      <Input
                        value={config.yAxisLabel}
                        onChange={(e) =>
                          updateConfig("yAxisLabel", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label>Stack Segments</Label>
                      <Button size="sm" variant="outline" onClick={addSeries}>
                        <Plus className="w-4 h-4 mr-1" /> Add Segment
                      </Button>
                    </div>
                    {config.series.map((s) => (
                      <div key={s.id} className="flex gap-2 items-center mb-2">
                        <input
                          type="color"
                          value={s.color}
                          onChange={(e) =>
                            updateSeries(s.id, "color", e.target.value)
                          }
                          className="w-8 h-8 rounded cursor-pointer shrink-0"
                        />
                        <Input
                          value={s.name}
                          onChange={(e) =>
                            updateSeries(s.id, "name", e.target.value)
                          }
                          className="h-8 text-sm"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeSeries(s.id)}
                          disabled={config.series.length <= 1}
                          className="shrink-0 h-8 w-8 text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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
                      >
                        <Plus className="w-4 h-4 mr-1" /> Add Point
                      </Button>
                    </div>
                    {config.dataPoints.map((dp) => (
                      <Card key={dp.id} className="p-3 mb-3">
                        <div className="flex justify-between items-center mb-2">
                          <Input
                            value={dp.label}
                            onChange={(e) =>
                              updateDataPointLabel(dp.id, e.target.value)
                            }
                            className="h-8 w-2/3"
                            placeholder="Label"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeDataPoint(dp.id)}
                            disabled={config.dataPoints.length <= 1}
                            className="h-8 w-8 text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {config.series.map((s) => (
                            <div key={s.id}>
                              <Label
                                className="text-[10px] text-muted-foreground truncate"
                                title={s.name}
                              >
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
              <CardTitle>Preview</CardTitle>
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
                >
                  <div className="flex items-start justify-between mb-4 gap-8">
                    <h2
                      className="text-xl font-bold flex-1"
                      style={{ color: config.textColor }}
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
                    {/* HTML Y-Axis */}
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

                    <div
                      className="flex-1"
                      style={{
                        minWidth: `${Math.max(600, config.dataPoints.length * 80)}px`,
                      }}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={config.dataPoints}
                          margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={config.textColor}
                            opacity={0.2}
                          />
                          <XAxis
                            dataKey="label"
                            stroke={config.textColor}
                            tick={{ fill: config.textColor }}
                          />
                          <YAxis
                            stroke={config.textColor}
                            tick={{ fill: config.textColor }}
                            width={80}
                          />
                          <Tooltip contentStyle={{ borderRadius: "8px" }} />
                          <Legend wrapperStyle={{ paddingTop: "20px" }} />

                          {config.series.map((s) => (
                            <Bar
                              key={s.id}
                              dataKey={`values.${s.id}`}
                              name={s.name}
                              stackId="a"
                              fill={s.color}
                              isAnimationActive={false}
                            >
                              <LabelList
                                dataKey={`values.${s.id}`}
                                position="center"
                                fill="#ffffff"
                                fontSize={12}
                                fontWeight="bold"
                                formatter={(val: number) =>
                                  val > 0 ? val : ""
                                }
                              />
                            </Bar>
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* HTML X-Axis Label */}
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
