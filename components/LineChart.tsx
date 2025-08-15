import React from 'react';

interface LineChartProps {
  data: { label: string; value: number }[];
  width?: number;
  height?: number;
  currencyFormatter: (value: number) => string;
}

export const LineChart: React.FC<LineChartProps> = ({ data, width = 700, height = 300, currencyFormatter }) => {
  if (!data || data.length === 0 || data.every(d => d.value === 0)) {
    return <div style={{ height: `${height}px` }} className="flex items-center justify-center text-stone-500 dark:text-stone-400">No sales data available for this period.</div>;
  }

  const padding = { top: 20, right: 30, bottom: 40, left: 70 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxValue = Math.max(...data.map(d => d.value), 0);
  const yAxisMax = maxValue > 0 ? Math.ceil(maxValue / 1000) * 1000 : 1000; // Round up to nearest 1000

  const xScale = (index: number) => (index / (data.length - 1)) * chartWidth;
  const yScale = (value: number) => chartHeight - (value / yAxisMax) * chartHeight;

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d.value)}`).join(' ');

  const areaPath = `${linePath} L ${xScale(data.length - 1)} ${chartHeight} L ${xScale(0)} ${chartHeight} Z`;

  const yAxisLabels = Array.from({ length: 5 }, (_, i) => {
    const value = (yAxisMax / 4) * i;
    return { value, y: yScale(value) };
  });

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="font-sans">
      <defs>
        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" className="stop-color-blue-500" stopOpacity="0.4"/>
          <stop offset="100%" className="stop-color-blue-500" stopOpacity="0"/>
        </linearGradient>
        <style>{`
            .stop-color-blue-500 { stop-color: #3b82f6; }
        `}</style>
      </defs>
      <g transform={`translate(${padding.left}, ${padding.top})`}>
        {/* Grid lines */}
        {yAxisLabels.map(({ value, y }) => (
          <line
            key={`grid-${value}`}
            x1={0}
            y1={y}
            x2={chartWidth}
            y2={y}
            className="stroke-stone-200 dark:stroke-gray-700"
            strokeWidth="1"
            strokeDasharray="2,2"
          />
        ))}

        {/* Y-axis */}
        {yAxisLabels.map(({ value, y }) => (
          <text
            key={`label-y-${value}`}
            x={-10}
            y={y}
            textAnchor="end"
            dy="0.3em"
            className="text-xs fill-stone-500 dark:fill-stone-400"
          >
            {currencyFormatter(value)}
          </text>
        ))}

        {/* X-axis */}
        {data.map((d, i) => (
          <text
            key={`label-x-${d.label}`}
            x={xScale(i)}
            y={chartHeight + 20}
            textAnchor="middle"
            className="text-xs fill-stone-500 dark:fill-stone-400"
          >
            {d.label}
          </text>
        ))}
        
        {/* Gradient Area */}
        <path d={areaPath} fill="url(#areaGradient)" />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          className="stroke-blue-600"
          strokeWidth="2"
        />

        {/* Points */}
        {data.map((d, i) => (
          <g key={`point-group-${d.label}`}>
            <title>{`${d.label}: ${currencyFormatter(d.value)}`}</title>
            <circle
              cx={xScale(i)}
              cy={yScale(d.value)}
              r="4"
              className="fill-blue-600 stroke-white dark:stroke-gray-800"
              strokeWidth="2"
            />
          </g>
        ))}
      </g>
    </svg>
  );
};
