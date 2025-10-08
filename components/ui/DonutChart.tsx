import React from 'react';

interface DonutChartProps {
    data: { value: number; total: number; color: string }[];
    size?: number;
    strokeWidth?: number;
}

export const DonutChart = ({ data, size = 100, strokeWidth = 10 }: DonutChartProps) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

    return React.createElement('svg', { width: size, height: size, viewBox: `0 0 ${size} ${size}`, className: '-rotate-90' },
        data.map((item, index) => {
            const dashArray = `${(item.value / item.total) * circumference} ${circumference}`;
            const segment = React.createElement('circle', {
                key: index, cx: size / 2, cy: size / 2, r: radius,
                stroke: item.color, strokeWidth: strokeWidth, fill: 'none',
                strokeDasharray: dashArray, strokeDashoffset: -offset
            });
            offset += (item.value / item.total) * circumference;
            return segment;
        })
    );
};
