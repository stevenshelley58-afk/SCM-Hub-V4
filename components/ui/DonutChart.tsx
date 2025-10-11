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
            if (!item.total || item.total <= 0) {
                return null;
            }

            const safeValue = Math.max(item.value, 0);
            const ratio = Math.min(safeValue / item.total, 1);
            const dashArray = `${ratio * circumference} ${circumference}`;
            const segment = React.createElement('circle', {
                key: index, cx: size / 2, cy: size / 2, r: radius,
                stroke: item.color, strokeWidth: strokeWidth, fill: 'none',
                strokeDasharray: dashArray, strokeDashoffset: -offset
            });
            offset += ratio * circumference;
            return segment;
        })
    );
};
