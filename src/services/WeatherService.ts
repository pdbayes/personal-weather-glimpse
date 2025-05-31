
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

export class WeatherService {
  private readonly STORAGE_KEY = 'weatherHistoricalData';
  private readonly MAX_RECORDS = 1008; // 7 days * 24 hours * 6 (10-minute intervals)
  private readonly WEATHER_STATION_URL = 'http://192.168.1.131';

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

  // Method to fetch data from your actual weather station
  async fetchFromWeatherStation(): Promise<WeatherData | null> {
    try {
      console.log(`Fetching data from weather station: ${this.WEATHER_STATION_URL}`);
      const response = await fetch(this.WEATHER_STATION_URL);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Raw weather station data:', data);
      
      // Validate the data structure
      if (this.isValidWeatherData(data)) {
        return {
          ...data,
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error('Invalid weather data format received from station');
      }
    } catch (error) {
      console.error('Error fetching from weather station:', error);
      return null;
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
