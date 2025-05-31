
import { useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface WeatherData {
  temperature: number;
  humidity: number;
  pressure: number;
  gas: number;
  dewPoint: number;
  cloudBase: number;
  Rain: number;
  timestamp?: string;
}

interface WeatherChartsProps {
  historicalData: WeatherData[];
}

export const WeatherCharts = ({ historicalData }: WeatherChartsProps) => {
  // Get last 24 hours of data, sampled every hour
  const getHourlyData = (data: WeatherData[], hours: number = 24) => {
    const now = new Date();
    const hourlyData: WeatherData[] = [];
    
    for (let i = hours - 1; i >= 0; i--) {
      const targetTime = new Date(now.getTime() - i * 60 * 60 * 1000);
      
      // Find the closest reading to this hour
      let closestReading = data[0];
      let minTimeDiff = Infinity;
      
      for (const reading of data) {
        if (!reading.timestamp) continue;
        const readingTime = new Date(reading.timestamp);
        const timeDiff = Math.abs(targetTime.getTime() - readingTime.getTime());
        
        if (timeDiff < minTimeDiff) {
          minTimeDiff = timeDiff;
          closestReading = reading;
        }
      }
      
      if (closestReading) {
        hourlyData.push({
          ...closestReading,
          timestamp: targetTime.toISOString()
        });
      }
    }
    
    return hourlyData;
  };

  const hourlyData = getHourlyData(historicalData);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartCard
          title="Temperature"
          data={hourlyData}
          dataKey="temperature"
          unit="°C"
          color="temperature"
          icon={<TrendingUp className="w-5 h-5" />}
        />
        
        <ChartCard
          title="Humidity"
          data={hourlyData}
          dataKey="humidity"
          unit="%"
          color="humidity"
          icon={<TrendingDown className="w-5 h-5" />}
        />
        
        <ChartCard
          title="Pressure"
          data={hourlyData}
          dataKey="pressure"
          unit="hPa"
          color="pressure"
          icon={<Minus className="w-5 h-5" />}
        />
        
        <ChartCard
          title="Rainfall"
          data={hourlyData}
          dataKey="Rain"
          unit="mm"
          color="rain"
          icon={<TrendingDown className="w-5 h-5" />}
        />
      </div>
    </div>
  );
};

interface ChartCardProps {
  title: string;
  data: WeatherData[];
  dataKey: keyof WeatherData;
  unit: string;
  color: string;
  icon: React.ReactNode;
}

const ChartCard = ({ title, data, dataKey, unit, color, icon }: ChartCardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const getColorForValue = (value: number, type: string) => {
    const colorMaps = {
      temperature: (val: number) => {
        if (val < 0) return '#1E40AF'; // Deep blue
        if (val < 10) return '#3B82F6'; // Blue
        if (val < 20) return '#10B981'; // Green
        if (val < 30) return '#F59E0B'; // Orange
        return '#EF4444'; // Red
      },
      humidity: (val: number) => {
        if (val < 30) return '#F59E0B'; // Orange (dry)
        if (val < 60) return '#10B981'; // Green (comfortable)
        return '#06B6D4'; // Blue (humid)
      },
      pressure: (val: number) => {
        if (val < 1000) return '#EF4444'; // Red (low)
        if (val < 1020) return '#10B981'; // Green (normal)
        return '#3B82F6'; // Blue (high)
      },
      rain: (val: number) => {
        if (val === 0) return '#E5E7EB'; // Gray (no rain)
        if (val < 2) return '#06B6D4'; // Light blue
        if (val < 5) return '#3B82F6'; // Blue
        return '#1E40AF'; // Deep blue (heavy rain)
      }
    };
    
    return colorMaps[type as keyof typeof colorMaps]?.(value) || '#6366F1';
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Get values
    const values = data.map(d => Number(d[dataKey]) || 0);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue || 1;

    // Draw grid lines
    ctx.strokeStyle = '#F3F4F6';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight * i) / 5;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Vertical grid lines
    for (let i = 0; i < data.length; i++) {
      const x = padding + (chartWidth * i) / (data.length - 1 || 1);
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }

    // Draw bars
    const barWidth = chartWidth / Math.max(data.length, 1) * 0.8;
    
    data.forEach((item, index) => {
      const value = Number(item[dataKey]) || 0;
      const normalizedValue = (value - minValue) / valueRange;
      const barHeight = chartHeight * normalizedValue;
      
      const x = padding + (chartWidth * index) / (data.length - 1 || 1) - barWidth / 2;
      const y = height - padding - barHeight;
      
      // Get color based on value and type
      const fillColor = getColorForValue(value, color);
      
      // Draw bar with gradient
      const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
      gradient.addColorStop(0, fillColor);
      gradient.addColorStop(1, fillColor + '80'); // Add transparency
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);
      
      // Draw bar outline
      ctx.strokeStyle = fillColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, barWidth, barHeight);
    });

    // Draw axes
    ctx.strokeStyle = '#6B7280';
    ctx.lineWidth = 2;
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.stroke();
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw labels
    ctx.fillStyle = '#6B7280';
    ctx.font = '12px system-ui';
    ctx.textAlign = 'center';
    
    // Y-axis labels
    for (let i = 0; i <= 5; i++) {
      const value = minValue + (valueRange * (5 - i)) / 5;
      const y = padding + (chartHeight * i) / 5;
      ctx.textAlign = 'right';
      ctx.fillText(value.toFixed(1), padding - 10, y + 4);
    }
    
    // X-axis labels (time)
    ctx.textAlign = 'center';
    data.forEach((item, index) => {
      if (index % 4 === 0 && item.timestamp) { // Show every 4th label
        const time = new Date(item.timestamp);
        const x = padding + (chartWidth * index) / (data.length - 1 || 1);
        ctx.fillText(
          time.getHours().toString().padStart(2, '0') + ':00',
          x,
          height - padding + 20
        );
      }
    });

  }, [data, dataKey, color]);

  const getCurrentValue = () => {
    if (data.length === 0) return 0;
    return Number(data[data.length - 1][dataKey]) || 0;
  };

  const getTrend = () => {
    if (data.length < 2) return 'stable';
    const current = Number(data[data.length - 1][dataKey]) || 0;
    const previous = Number(data[data.length - 2][dataKey]) || 0;
    
    if (current > previous + 0.1) return 'up';
    if (current < previous - 0.1) return 'down';
    return 'stable';
  };

  const trend = getTrend();
  const currentValue = getCurrentValue();

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-gray-800">
            {currentValue.toFixed(1)} {unit}
          </span>
          {trend === 'up' && <TrendingUp className="w-5 h-5 text-green-500" />}
          {trend === 'down' && <TrendingDown className="w-5 h-5 text-red-500" />}
          {trend === 'stable' && <Minus className="w-5 h-5 text-gray-400" />}
        </div>
      </div>
      
      <canvas
        ref={canvasRef}
        width={600}
        height={300}
        className="w-full h-auto"
        style={{ maxHeight: '300px' }}
      />
      
      <div className="mt-4 text-sm text-gray-500 text-center">
        Last 24 hours • Updated every hour
      </div>
    </div>
  );
};
