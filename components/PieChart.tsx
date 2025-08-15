import React from 'react';

interface PieChartProps {
  data: {
    name: string;
    value: number;
    color: string;
  }[];
  size?: number;
}

export const PieChart: React.FC<PieChartProps> = ({ data, size = 200 }) => {
  const total = data.reduce((acc, d) => acc + d.value, 0);
  if (total === 0) {
    return (
        <div className="flex items-center justify-center text-center text-stone-500 dark:text-stone-400" style={{width: size, height: size}}>
            No data to display.
        </div>
    );
  }
  
  let cumulative = 0;

  const paths = data.map(d => {
    const startAngle = (cumulative / total) * 360;
    const endAngle = ((cumulative + d.value) / total) * 360;
    cumulative += d.value;

    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    
    const x1 = 50 + 45 * Math.cos(Math.PI * (startAngle - 90) / 180);
    const y1 = 50 + 45 * Math.sin(Math.PI * (startAngle - 90) / 180);
    const x2 = 50 + 45 * Math.cos(Math.PI * (endAngle - 90) / 180);
    const y2 = 50 + 45 * Math.sin(Math.PI * (endAngle - 90) / 180);

    return (
      <path
        key={d.name}
        d={`M 50,50 L ${x1},${y1} A 45,45 0 ${largeArcFlag},1 ${x2},${y2} Z`}
        fill={d.color}
      />
    );
  });

  return (
    <div className="flex items-center gap-8">
      <svg viewBox="0 0 100 100" width={size} height={size}>
          {paths}
      </svg>
      <ul className="space-y-2">
        {data.map(d => (
          <li key={d.name} className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></span>
            <span className="font-medium text-stone-700 dark:text-stone-300">{d.name}:</span>
            <span className="text-stone-500 dark:text-stone-400">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
