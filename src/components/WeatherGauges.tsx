
import { useEffect, useRef } from 'react';
import { Thermometer, Droplets, Gauge, Wind, Eye, Sun } from 'lucide-react';

interface WeatherData {
  temperature: number;
  humidity: number;
  pressure: number;
  gas: number;
  dewPoint: number;
  cloudBase: number;
  Rain: number;
}

interface OpenWeatherData {
  location: string;
  description: string;
  windSpeed: number;
  windDirection: number;
  visibility: number;
  uvIndex: number;
}

interface WeatherGaugesProps {
  weatherData: WeatherData;
  openWeatherData: OpenWeatherData;
}

export const WeatherGauges = ({ weatherData, openWeatherData }: WeatherGaugesProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <GaugeCard
        title="Temperature"
        value={weatherData.temperature}
        unit="°C"
        min={-10}
        max={40}
        icon={<Thermometer className="w-5 h-5" />}
        color="temperature"
        decimals={1}
      />
      
      <GaugeCard
        title="Humidity"
        value={weatherData.humidity}
        unit="%"
        min={0}
        max={100}
        icon={<Droplets className="w-5 h-5" />}
        color="humidity"
        decimals={1}
      />
      
      <GaugeCard
        title="Pressure"
        value={weatherData.pressure}
        unit="hPa"
        min={980}
        max={1030}
        icon={<Gauge className="w-5 h-5" />}
        color="pressure"
        decimals={1}
      />
      
      <GaugeCard
        title="Dew Point"
        value={weatherData.dewPoint}
        unit="°C"
        min={-10}
        max={30}
        icon={<Droplets className="w-5 h-5" />}
        color="dewpoint"
        decimals={1}
      />
      
      <GaugeCard
        title="Wind Speed"
        value={openWeatherData.windSpeed}
        unit="m/s"
        min={0}
        max={20}
        icon={<Wind className="w-5 h-5" />}
        color="wind"
        decimals={1}
      />
      
      <GaugeCard
        title="Visibility"
        value={openWeatherData.visibility / 1000}
        unit="km"
        min={0}
        max={20}
        icon={<Eye className="w-5 h-5" />}
        color="visibility"
        decimals={1}
      />
      
      <GaugeCard
        title="UV Index"
        value={openWeatherData.uvIndex}
        unit=""
        min={0}
        max={11}
        icon={<Sun className="w-5 h-5" />}
        color="uv"
        decimals={0}
      />
      
      <GaugeCard
        title="Gas Sensor"
        value={weatherData.gas}
        unit="kΩ"
        min={0}
        max={200}
        icon={<Gauge className="w-5 h-5" />}
        color="gas"
        decimals={1}
      />
    </div>
  );
};

interface GaugeCardProps {
  title: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  icon: React.ReactNode;
  color: string;
  decimals: number;
}

const GaugeCard = ({ title, value, unit, min, max, icon, color, decimals }: GaugeCardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const percentage = Math.min(Math.max((value - min) / (max - min), 0), 1);
  
  const getColorScheme = (type: string, percentage: number) => {
    const schemes = {
      temperature: {
        bg: percentage < 0.3 ? '#3B82F6' : percentage < 0.7 ? '#10B981' : '#EF4444',
        gradient: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444']
      },
      humidity: {
        bg: '#06B6D4',
        gradient: ['#0EA5E9', '#06B6D4', '#0891B2']
      },
      pressure: {
        bg: '#8B5CF6',
        gradient: ['#7C3AED', '#8B5CF6', '#A855F7']
      },
      dewpoint: {
        bg: '#06B6D4',
        gradient: ['#0EA5E9', '#06B6D4', '#0891B2']
      },
      wind: {
        bg: '#10B981',
        gradient: ['#059669', '#10B981', '#34D399']
      },
      visibility: {
        bg: '#F59E0B',
        gradient: ['#D97706', '#F59E0B', '#FBBF24']
      },
      uv: {
        bg: percentage < 0.3 ? '#10B981' : percentage < 0.6 ? '#F59E0B' : '#EF4444',
        gradient: ['#10B981', '#F59E0B', '#EF4444']
      },
      gas: {
        bg: '#6366F1',
        gradient: ['#4F46E5', '#6366F1', '#818CF8']
      }
    };
    
    return schemes[type as keyof typeof schemes] || schemes.temperature;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const colorScheme = getColorScheme(color, percentage);

    // Draw background arc
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0.75 * Math.PI, 0.25 * Math.PI);
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineCap = 'round';
    ctx.stroke();

    // Draw value arc
    const endAngle = 0.75 * Math.PI + (1.5 * Math.PI * percentage);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0.75 * Math.PI, endAngle);
    ctx.lineWidth = 8;
    ctx.strokeStyle = colorScheme.bg;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 4, 0, 2 * Math.PI);
    ctx.fillStyle = colorScheme.bg;
    ctx.fill();

  }, [value, percentage, color]);

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-gray-600">
          {icon}
          <span className="font-medium text-sm">{title}</span>
        </div>
      </div>
      
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={120}
          height={120}
          className="mx-auto"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-800">
            {value.toFixed(decimals)}
          </span>
          <span className="text-sm text-gray-500">{unit}</span>
        </div>
      </div>
      
      <div className="mt-4 flex justify-between text-xs text-gray-400">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
};
