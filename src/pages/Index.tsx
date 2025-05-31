
import { useEffect, useState } from 'react';
import { WeatherGauges } from '../components/WeatherGauges';
import { WeatherCharts } from '../components/WeatherCharts';
import { WeatherService } from '../services/WeatherService';
import { Card } from '@/components/ui/card';
import { RefreshCw, Thermometer, Droplets, Gauge, Wind, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

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

interface OpenWeatherData {
  location: string;
  description: string;
  windSpeed: number;
  windDirection: number;
  visibility: number;
  uvIndex: number;
}

const Index = () => {
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
  const [historicalData, setHistoricalData] = useState<WeatherData[]>([]);
  const [openWeatherData, setOpenWeatherData] = useState<OpenWeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const { toast } = useToast();

  const weatherService = new WeatherService();

  const fetchWeatherData = async () => {
    setIsLoading(true);
    setConnectionError(null);
    
    try {
      console.log('Attempting to fetch data from weather station...');
      const stationData = await weatherService.fetchFromWeatherStation();
      
      if (stationData) {
        console.log('Successfully received weather station data:', stationData);
        setCurrentWeather(stationData);
        weatherService.saveWeatherReading(stationData);
        setLastUpdate(new Date());
        
        toast({
          title: "Weather data updated",
          description: "Successfully fetched latest weather information from your station",
        });
      } else {
        throw new Error('Failed to fetch data from weather station');
      }

      // Fetch OpenWeatherMap data (you'll need to get an API key)
      await fetchOpenWeatherData();

    } catch (error) {
      console.error('Error fetching weather data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setConnectionError(errorMessage);
      
      toast({
        title: "Connection Error",
        description: `Failed to connect to weather station at http://192.168.1.131: ${errorMessage}`,
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const fetchOpenWeatherData = async () => {
    try {
      // Mock OpenWeatherMap data - replace with actual API call
      const mockOpenWeather: OpenWeatherData = {
        location: "Your Location",
        description: "Partly cloudy",
        windSpeed: 5.2 + Math.random() * 3,
        windDirection: Math.floor(Math.random() * 360),
        visibility: 10000,
        uvIndex: Math.floor(Math.random() * 11)
      };
      setOpenWeatherData(mockOpenWeather);
    } catch (error) {
      console.error('Error fetching OpenWeatherMap data:', error);
    }
  };

  const loadHistoricalData = () => {
    const data = weatherService.getHistoricalData();
    setHistoricalData(data);
  };

  useEffect(() => {
    fetchWeatherData();
    loadHistoricalData();

    // Set up automatic data fetching every 15 minutes
    const interval = setInterval(() => {
      fetchWeatherData();
      loadHistoricalData();
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Weather Dashboard
          </h1>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4" />
              <span>Weather Station (192.168.1.131)</span>
            </div>
            {lastUpdate && (
              <div className="flex items-center gap-2">
                <span>Last update: {lastUpdate.toLocaleTimeString()}</span>
              </div>
            )}
            <Button
              onClick={fetchWeatherData}
              disabled={isLoading}
              size="sm"
              variant="outline"
              className="ml-4"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          
          {connectionError && (
            <div className="flex items-center justify-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg border border-red-200">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">Connection Error: {connectionError}</span>
            </div>
          )}
        </div>

        {/* Current Conditions */}
        <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <Gauge className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-semibold text-gray-800">Current Conditions</h2>
          </div>
          {currentWeather && openWeatherData ? (
            <WeatherGauges 
              weatherData={currentWeather} 
              openWeatherData={openWeatherData} 
            />
          ) : (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600">
                {connectionError ? 'Unable to load weather data...' : 'Loading weather data...'}
              </span>
            </div>
          )}
        </Card>

        {/* Historical Data */}
        <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <Droplets className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-semibold text-gray-800">Historical Data</h2>
            <span className="text-sm text-gray-500">Last 7 days</span>
          </div>
          {historicalData.length > 0 ? (
            <WeatherCharts historicalData={historicalData} />
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <Wind className="w-8 h-8 mr-2" />
              <span>No historical data available yet</span>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Index;
