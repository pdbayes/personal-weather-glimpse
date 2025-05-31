
interface WeatherData {
  temperature: number;
  humidity: number;
  pressure: number;
  gas: number;
  dewPoint: number;
  cloudBase: number;
  Rain: number;
  timestamp?: string;
  isMockData?: boolean;
}

interface WeatherServiceResponse {
  data: WeatherData;
  isMock: boolean;
}

export class WeatherService {
  private readonly STORAGE_KEY = 'weatherHistoricalData';
  private readonly MAX_RECORDS = 1008; // 7 days * 24 hours * 6 (10-minute intervals)
  private readonly WEATHER_STATION_URL = '/api';

  constructor() {
    console.log('WeatherService initialized');
  }

  saveWeatherReading(data: WeatherData): void {
    try {
      const historicalData = this.getHistoricalData();
      
      // Add timestamp if not present
      const dataWithTimestamp = {
        ...data,
        timestamp: data.timestamp || new Date().toISOString()
      };

      // Add new reading to the beginning of the array
      historicalData.unshift(dataWithTimestamp);

      // Keep only the most recent records
      if (historicalData.length > this.MAX_RECORDS) {
        historicalData.splice(this.MAX_RECORDS);
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(historicalData));
      console.log('Weather reading saved successfully');
    } catch (error) {
      console.error('Error saving weather reading:', error);
    }
  }

  getHistoricalData(): WeatherData[] {
    try {
      const storedData = localStorage.getItem(this.STORAGE_KEY);
      if (!storedData) {
        return [];
      }
      
      const data = JSON.parse(storedData) as WeatherData[];
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error retrieving historical data:', error);
      return [];
    }
  }

  getDataForPeriod(hours: number): WeatherData[] {
    const allData = this.getHistoricalData();
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);

    return allData.filter(reading => {
      if (!reading.timestamp) return false;
      const readingTime = new Date(reading.timestamp);
      return readingTime >= cutoffTime;
    });
  }

  clearHistoricalData(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('Historical data cleared');
    } catch (error) {
      console.error('Error clearing historical data:', error);
    }
  }

  getAverageForPeriod(hours: number): Partial<WeatherData> | null {
    const data = this.getDataForPeriod(hours);
    if (data.length === 0) return null;

    const totals = data.reduce(
      (acc, reading) => ({
        temperature: acc.temperature + reading.temperature,
        humidity: acc.humidity + reading.humidity,
        pressure: acc.pressure + reading.pressure,
        gas: acc.gas + reading.gas,
        dewPoint: acc.dewPoint + reading.dewPoint,
        cloudBase: acc.cloudBase + reading.cloudBase,
        Rain: acc.Rain + reading.Rain,
      }),
      {
        temperature: 0,
        humidity: 0,
        pressure: 0,
        gas: 0,
        dewPoint: 0,
        cloudBase: 0,
        Rain: 0,
      }
    );

    const count = data.length;
    return {
      temperature: totals.temperature / count,
      humidity: totals.humidity / count,
      pressure: totals.pressure / count,
      gas: totals.gas / count,
      dewPoint: totals.dewPoint / count,
      cloudBase: totals.cloudBase / count,
      Rain: totals.Rain / count,
    };
  }

  // Generate realistic mock weather data
  private generateMockWeatherData(): WeatherData {
    const baseTemp = 16 + (Math.random() - 0.5) * 10; // 11-21°C range
    const humidity = 60 + Math.random() * 35; // 60-95%
    const pressure = 1000 + Math.random() * 20; // 1000-1020 hPa
    
    return {
      temperature: Math.round(baseTemp * 100) / 100,
      humidity: Math.round(humidity * 100) / 100,
      pressure: Math.round(pressure * 10) / 10,
      gas: Math.round((80 + Math.random() * 40) * 1000) / 1000,
      dewPoint: Math.round((baseTemp - 2 - Math.random() * 3) * 100) / 100,
      cloudBase: Math.round((400 + Math.random() * 300) * 100) / 100,
      Rain: Math.random() > 0.8 ? Math.round(Math.random() * 5 * 100) / 100 : 0,
      timestamp: new Date().toISOString(),
      isMockData: true
    };
  }

  // Method to fetch data from your actual weather station
  async fetchFromWeatherStation(): Promise<WeatherServiceResponse | null> {
    try {
      console.log(`Fetching data from weather station: ${this.WEATHER_STATION_URL}`);
      const response = await fetch(this.WEATHER_STATION_URL, {
        method: 'GET',
        // timeout: 5000 // Note: timeout is not a standard fetch option, consider AbortController if needed
      } as RequestInit); // Use RequestInit for better typing, remove 'as any'
      
      if (!response.ok) {
        // Log the response text for non-ok responses as well, as it might contain useful error info
        const errorText = await response.text();
        console.error(`HTTP error! status: ${response.status}, response text: ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const responseText = await response.text();
        console.error(`Expected application/json but got ${contentType}. Response text: ${responseText}`);
        throw new Error(`Expected application/json but got ${contentType}`);
      }
      
      // Clone the response before reading it as JSON, so we can read it as text if JSON parsing fails
      const responseClone = response.clone();
      try {
        const data = await response.json();
        console.log('Raw weather station data:', data);

        if (this.isValidWeatherData(data)) {
          const stationDataWithTimestamp: WeatherData = {
            ...data,
            timestamp: data.timestamp || new Date().toISOString(),
            isMockData: false
          };
          return { data: stationDataWithTimestamp, isMock: false };
        } else {
          console.error('Invalid weather data format received from station. Data:', data);
          throw new Error('Invalid weather data format received from station');
        }
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        // Log the raw text of the response if JSON parsing failed
        const responseText = await responseClone.text();
        console.error('Raw response text that failed JSON parsing:', responseText);
        throw jsonError; // Re-throw the jsonError to be caught by the outer catch
      }
    } catch (error) {
      console.error('Error fetching from weather station:', error);
      console.log('Falling back to mock data for preview/development');
      const mockData = this.generateMockWeatherData();
      return { data: mockData, isMock: true };
    }
  }

  private isValidWeatherData(data: any): data is WeatherData {
    return (
      typeof data === 'object' &&
      data !== null &&
      typeof data.temperature === 'number' &&
      typeof data.humidity === 'number' &&
      typeof data.pressure === 'number' &&
      typeof data.gas === 'number' &&
      typeof data.dewPoint === 'number' &&
      typeof data.cloudBase === 'number' &&
      typeof data.Rain === 'number'
    );
  }
}
