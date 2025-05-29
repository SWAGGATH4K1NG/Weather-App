import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

export interface WeatherData {
  name: string;
  sys: {
    country: string;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  wind: {
    speed: number;
    deg: number;
  };
  clouds: {
    all: number;
  };
  dt: number;
  id: number;
  coord: {
    lon: number;
    lat: number;
  };
}

export interface ForecastData {
  list: Array<{
    dt: number;
    main: {
      temp: number;
      feels_like: number;
      temp_min: number;
      temp_max: number;
      pressure: number;
      humidity: number;
    };
    weather: Array<{
      id: number;
      main: string;
      description: string;
      icon: string;
    }>;
    clouds: {
      all: number;
    };
    wind: {
      speed: number;
      deg: number;
    };
    dt_txt: string;
  }>;
  city: {
    id: number;
    name: string;
    coord: {
      lat: number;
      lon: number;
    };
    country: string;
  };
}

export interface AirPollutionData {
  list: Array<{
    main: {
      aqi: number;
    };
    components: {
      co: number;
      no: number;
      no2: number;
      o3: number;
      so2: number;
      pm2_5: number;
      pm10: number;
      nh3: number;
    };
    dt: number;
  }>;
}

export interface FavoriteCity {
  id?: number;
  name: string;
  country: string;
  lat: number;
  lon: number;
  userId: string;
  addedAt: Date;
}

export interface UserFeedback {
  id?: number;
  userId: string;
  cityName: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface UserSettings {
  id?: string;
  units: string;
  lang: string;
  theme: string;
  notifications: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private apiKey = '2e55f4cdb6006a4005d6f7419aec021f'; 
  private baseUrl = 'https://api.openweathermap.org/data/2.5';
  private geoUrl = 'https://api.openweathermap.org/geo/1.0';
  
  // URL da nossa API de backend (simulada com localStorage neste exemplo)
  private backendUrl = 'https://api.weatherapp.example/api';
  
  // Usuário simulado para demonstração
  private currentUserId = 'user123';

  constructor(private http: HttpClient) {
    // Inicializar armazenamento local se não existir
    if (!localStorage.getItem('weatherApp_favorites')) {
      localStorage.setItem('weatherApp_favorites', JSON.stringify([]));
    }
    if (!localStorage.getItem('weatherApp_feedback')) {
      localStorage.setItem('weatherApp_feedback', JSON.stringify([]));
    }
  }

  // GET - Obter clima atual por nome da cidade
  getWeather(city: string): Observable<WeatherData> {
    const url = `${this.baseUrl}/weather`;
    const params = new HttpParams()
      .set('q', city)
      .set('appid', this.apiKey)
      .set('units', 'metric')
      .set('lang', 'pt');

    return this.http.get<WeatherData>(url, { params }).pipe(
      catchError(error => {
        console.error('Erro ao buscar dados do clima:', error);
        return throwError(() => new Error('Cidade não encontrada ou erro na API'));
      })
    );
  }

  // GET - Obter clima atual por coordenadas geográficas
  getWeatherByCoords(lat: number, lon: number): Observable<WeatherData> {
    const url = `${this.baseUrl}/weather`;
    const params = new HttpParams()
      .set('lat', lat.toString())
      .set('lon', lon.toString())
      .set('appid', this.apiKey)
      .set('units', 'metric')
      .set('lang', 'pt');

    return this.http.get<WeatherData>(url, { params }).pipe(
      catchError(error => {
        console.error('Erro ao buscar dados do clima por coordenadas:', error);
        return throwError(() => new Error('Erro ao buscar dados do clima para esta localização'));
      })
    );
  }

  // GET - Obter previsão do tempo para 5 dias
  getForecast(city: string): Observable<ForecastData> {
    const url = `${this.baseUrl}/forecast`;
    const params = new HttpParams()
      .set('q', city)
      .set('appid', this.apiKey)
      .set('units', 'metric')
      .set('lang', 'pt');

    return this.http.get<ForecastData>(url, { params }).pipe(
      catchError(error => {
        console.error('Erro ao buscar previsão do tempo:', error);
        return throwError(() => new Error('Não foi possível obter a previsão para esta cidade'));
      })
    );
  }

  // GET - Obter qualidade do ar por coordenadas
  getAirPollution(lat: number, lon: number): Observable<AirPollutionData> {
    const url = `${this.baseUrl}/air_pollution`;
    const params = new HttpParams()
      .set('lat', lat.toString())
      .set('lon', lon.toString())
      .set('appid', this.apiKey);

    return this.http.get<AirPollutionData>(url, { params }).pipe(
      catchError(error => {
        console.error('Erro ao buscar dados de poluição do ar:', error);
        return throwError(() => new Error('Não foi possível obter dados de qualidade do ar'));
      })
    );
  }

  // POST - Adicionar cidade aos favoritos
  addFavoriteCity(city: WeatherData): Observable<FavoriteCity> {
    // Em uma aplicação real, isso seria um POST para uma API
    const newFavorite: FavoriteCity = {
      name: city.name,
      country: city.sys.country,
      lat: city.coord.lat,
      lon: city.coord.lon,
      userId: this.currentUserId,
      addedAt: new Date()
    };
    
    // Simulação de POST para API
    console.log(`POST ${this.backendUrl}/favorites`, newFavorite);
    
    // Armazenar localmente para simulação
    const favorites = JSON.parse(localStorage.getItem('weatherApp_favorites') || '[]');
    newFavorite.id = Date.now(); // Simular ID gerado pelo servidor
    favorites.push(newFavorite);
    localStorage.setItem('weatherApp_favorites', JSON.stringify(favorites));
    
    return of(newFavorite);
  }

  // GET - Obter cidades favoritas do usuário
  getFavoriteCities(): Observable<FavoriteCity[]> {
    // Em uma aplicação real, isso seria um GET para uma API
    console.log(`GET ${this.backendUrl}/favorites?userId=${this.currentUserId}`);
    
    // Simulação de resposta da API
    const favorites = JSON.parse(localStorage.getItem('weatherApp_favorites') || '[]');
    const userFavorites = favorites.filter((fav: FavoriteCity) => fav.userId === this.currentUserId);
    
    return of(userFavorites);
  }

  // DELETE - Remover cidade dos favoritos
  removeFavoriteCity(cityId: number): Observable<{success: boolean}> {
    // Em uma aplicação real, isso seria um DELETE para uma API
    console.log(`DELETE ${this.backendUrl}/favorites/${cityId}`);
    
    // Simulação de DELETE
    const favorites = JSON.parse(localStorage.getItem('weatherApp_favorites') || '[]');
    const updatedFavorites = favorites.filter((fav: FavoriteCity) => fav.id !== cityId);
    localStorage.setItem('weatherApp_favorites', JSON.stringify(updatedFavorites));
    
    return of({success: true});
  }

  // PUT - Atualizar configurações do usuário
  updateUserSettings(settings: UserSettings): Observable<UserSettings> {
    // Em uma aplicação real, isso seria um PUT para uma API
    console.log(`PUT ${this.backendUrl}/users/${this.currentUserId}/settings`, settings);
    
    // Simulação de PUT
    settings.id = this.currentUserId;
    localStorage.setItem('weatherApp_settings', JSON.stringify(settings));
    
    return of(settings);
  }

  // GET - Obter configurações de usuário
  getUserSettings(): Observable<UserSettings> {
    // Em uma aplicação real, isso seria um GET para uma API
    console.log(`GET ${this.backendUrl}/users/${this.currentUserId}/settings`);
    
    const stored = localStorage.getItem('weatherApp_settings');
    const defaultSettings: UserSettings = {
      id: this.currentUserId,
      units: 'metric', 
      lang: 'pt',
      theme: 'light',
      notifications: true
    };
    
    if (stored) {
      try {
        return of(JSON.parse(stored));
      } catch (e) {
        return of(defaultSettings);
      }
    }
    
    return of(defaultSettings);
  }

  // POST - Enviar feedback do usuário sobre uma cidade
  submitFeedback(feedback: {cityName: string, rating: number, comment: string}): Observable<UserFeedback> {
    // Em uma aplicação real, isso seria um POST para uma API
    const newFeedback: UserFeedback = {
      userId: this.currentUserId,
      cityName: feedback.cityName,
      rating: feedback.rating,
      comment: feedback.comment,
      createdAt: new Date()
    };
    
    console.log(`POST ${this.backendUrl}/feedback`, newFeedback);
    
    // Simulação de POST
    const feedbackList = JSON.parse(localStorage.getItem('weatherApp_feedback') || '[]');
    newFeedback.id = Date.now(); // Simular ID gerado pelo servidor
    feedbackList.push(newFeedback);
    localStorage.setItem('weatherApp_feedback', JSON.stringify(feedbackList));
    
    return of(newFeedback);
  }

  // DELETE - Limpar configurações de usuário
  clearUserSettings(): Observable<{success: boolean}> {
    // Em uma aplicação real, isso seria um DELETE para uma API
    console.log(`DELETE ${this.backendUrl}/users/${this.currentUserId}/settings`);
    
    localStorage.removeItem('weatherApp_settings');
    return of({success: true});
  }

  // PATCH - Atualizar parcialmente as configurações do usuário
  patchUserSettings(partialSettings: Partial<UserSettings>): Observable<UserSettings> {
    // Em uma aplicação real, isso seria um PATCH para uma API
    console.log(`PATCH ${this.backendUrl}/users/${this.currentUserId}/settings`, partialSettings);
    
    // Simulação de PATCH
    const stored = localStorage.getItem('weatherApp_settings');
    let currentSettings: UserSettings;
    
    if (stored) {
      try {
        currentSettings = JSON.parse(stored);
      } catch (e) {
        currentSettings = {
          id: this.currentUserId,
          units: 'metric', 
          lang: 'pt',
          theme: 'light',
          notifications: true
        };
      }
    } else {
      currentSettings = {
        id: this.currentUserId,
        units: 'metric', 
        lang: 'pt',
        theme: 'light',
        notifications: true
      };
    }
    
    // Atualizar apenas os campos fornecidos
    const updatedSettings = { ...currentSettings, ...partialSettings };
    localStorage.setItem('weatherApp_settings', JSON.stringify(updatedSettings));
    
    return of(updatedSettings);
  }

  // Método auxiliar para obter URL do ícone
  getIconUrl(iconCode: string): string {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  }
}
