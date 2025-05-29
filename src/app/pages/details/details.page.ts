import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { WeatherService, WeatherData, AirPollutionData, UserFeedback } from 'src/app/services/weather.service';
import { FavoritesService, FavoriteCity } from 'src/app/services/favorites.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastController } from '@ionic/angular';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, 
  IonButton, IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, 
  IonCardContent, IonGrid, IonRow, IonCol, IonItem, IonLabel, IonBadge, 
  IonSpinner, IonImg, IonTextarea
} from '@ionic/angular/standalone';
import { catchError, finalize, switchMap } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-details',
  templateUrl: './details.page.html',
  styleUrls: ['./details.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
    IonButton, IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle,
    IonCardContent, IonGrid, IonRow, IonCol, IonItem, IonLabel, IonBadge,
    IonSpinner, IonImg, IonTextarea
  ]
})
export class DetailsPage implements OnInit {
  cityName: string = '';
  weatherData: WeatherData | null = null;
  airPollution: AirPollutionData | null = null;
  loading: boolean = true;
  error: string | null = null;
  isFavorite: boolean = false;
  favoriteId: string | null = null;
  userFeedback: {
    rating: number;
    comment: string;
  } = {
    rating: 0,
    comment: ''
  };
  showFeedbackForm: boolean = false;
  favoritos: FavoriteCity[] = [];

  // Mapeamento de índices de qualidade do ar para descrições
  aqiDescriptions = [
    'Bom',
    'Moderado',
    'Mau para grupos sensíveis',
    'Mau',
    'Muito mau',
    'Perigoso'
  ];

  constructor(
    private route: ActivatedRoute,
    private weatherService: WeatherService,
    private favoritesService: FavoritesService,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['city']) {
        this.cityName = params['city'];
        this.loadWeatherDetails();
      } else {
        this.error = 'Nenhuma cidade especificada';
        this.loading = false;
      }
    });
  }

  loadWeatherDetails() {
    this.loading = true;
    this.error = null;
    
    console.log('Carregando detalhes para a cidade:', this.cityName);

    // Primeiro, carregar a lista de favoritos
    this.favoritesService.getFavorites().subscribe({
      next: (favoritos) => {
        console.log('Favoritos carregados:', favoritos.length);
        this.favoritos = favoritos;
        
        // Depois, carregar os dados do clima
        this.weatherService.getWeather(this.cityName).pipe(
          switchMap(weather => {
            console.log('Dados do clima carregados:', weather.name);
            this.weatherData = weather;
            
            // Após obter os dados do clima, buscar dados de poluição do ar
            return this.weatherService.getAirPollution(
              weather.coord.lat,
              weather.coord.lon
            ).pipe(
              catchError(err => {
                console.warn('Erro ao carregar dados de poluição do ar:', err);
                return of(null);
              })
            );
          }),
          catchError(err => {
            console.error('Erro ao carregar dados do clima:', err);
            this.error = 'Erro ao carregar dados do clima: ' + err.message;
            return of(null);
          }),
          finalize(() => {
            this.loading = false;
          })
        ).subscribe({
          next: (airPollution) => {
            this.airPollution = airPollution;
            
            // Verificar se a cidade atual está nos favoritos
            this.checkIfCityIsFavorite();
            
            console.log('Carregamento de detalhes concluído');
          },
          error: (err) => {
            console.error('Erro na subscrição dos dados do clima:', err);
            this.error = 'Erro ao processar dados: ' + err.message;
            this.loading = false;
          }
        });
      },
      error: (err) => {
        console.error('Erro ao carregar favoritos:', err);
        this.error = 'Erro ao carregar favoritos: ' + err.message;
        this.loading = false;
      }
    });
  }
  
  // Verificar se a cidade atual está nos favoritos
  checkIfCityIsFavorite() {
    if (!this.weatherData) {
      console.warn('Não há dados de clima para verificar favoritos');
      return;
    }
    
    try {
      const favorite = this.favoritos.find(
        (fav: FavoriteCity) => 
          fav.name.toLowerCase() === this.weatherData!.name.toLowerCase() && 
          fav.country.toLowerCase() === this.weatherData!.sys.country.toLowerCase()
      );
      
      if (favorite) {
        this.isFavorite = true;
        this.favoriteId = favorite.id;
        console.log('Cidade está nos favoritos:', favorite);
      } else {
        this.isFavorite = false;
        this.favoriteId = null;
        console.log('Cidade não está nos favoritos');
      }
    } catch (error) {
      console.error('Erro ao verificar favoritos:', error);
      this.isFavorite = false;
      this.favoriteId = null;
    }
  }

  // Toggle favorito - Adicionar ou remover dos favoritos
  toggleFavorite() {
    if (this.isFavorite) {
      this.removeFromFavorites();
    } else {
      this.addToFavorites();
    }
  }

  // POST - Adicionar aos favoritos
  addToFavorites() {
    if (!this.weatherData) return;
    
    this.favoritesService.addFavorite(
      this.weatherData.name,
      this.weatherData.sys.country
    ).subscribe({
      next: (favorite) => {
        this.isFavorite = true;
        this.favoriteId = favorite.id;
        this.presentToast('Cidade adicionada aos favoritos!', 'success');
        // Recarregar a lista de favoritos
        this.favoritesService.getFavorites().subscribe(favoritos => {
          this.favoritos = favoritos;
          this.checkIfCityIsFavorite();
        });
      },
      error: (err) => {
        this.presentToast('Erro ao adicionar aos favoritos', 'danger');
        console.error('Erro ao adicionar favorito:', err);
      }
    });
  }

  // DELETE - Remover dos favoritos
  removeFromFavorites() {
    if (!this.favoriteId) {
      console.warn('Tentativa de remover favorito sem ID');
      return;
    }
    
    this.favoritesService.removeFavorite(this.favoriteId).subscribe({
      next: (sucesso) => {
        if (sucesso) {
          this.isFavorite = false;
          this.favoriteId = null;
          this.presentToast('Cidade removida dos favoritos', 'success');
          // Recarregar a lista de favoritos
          this.favoritesService.getFavorites().subscribe(favoritos => {
            this.favoritos = favoritos;
          });
        } else {
          this.presentToast('Erro ao remover dos favoritos', 'danger');
          console.warn('Falha ao remover favorito com ID:', this.favoriteId);
        }
      },
      error: (err) => {
        this.presentToast('Erro ao remover dos favoritos', 'danger');
        console.error('Erro ao remover favorito:', err);
      }
    });
  }

  // POST - Enviar feedback
  submitFeedback() {
    if (!this.weatherData || this.userFeedback.rating === 0) {
      this.presentToast('Por favor, forneça uma avaliação', 'warning');
      return;
    }
    
    this.weatherService.submitFeedback({
      cityName: this.weatherData.name,
      rating: this.userFeedback.rating,
      comment: this.userFeedback.comment
    }).subscribe({
      next: () => {
        this.presentToast('Feedback enviado com sucesso!', 'success');
        this.userFeedback = { rating: 0, comment: '' };
        this.showFeedbackForm = false;
      },
      error: () => {
        this.presentToast('Erro ao enviar feedback', 'danger');
      }
    });
  }

  // Exibir toast de notificação
  async presentToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      color: color,
      position: 'bottom'
    });
    toast.present();
  }

  // Alternar exibição do formulário de feedback
  toggleFeedbackForm() {
    this.showFeedbackForm = !this.showFeedbackForm;
  }

  // Definir avaliação
  setRating(rating: number) {
    this.userFeedback.rating = rating;
  }

  getAqiDescription(aqi: number): string {
    // O índice AQI vai de 1 a 5
    return this.aqiDescriptions[aqi - 1] || 'Desconhecido';
  }

  getAqiColor(aqi: number): string {
    const colors = [
      'success',  // 1 - Bom (Verde)
      'warning',  // 2 - Moderado (Amarelo)
      'warning',  // 3 - Ruim para grupos sensíveis (Laranja)
      'danger',   // 4 - Ruim (Vermelho)
      'danger',   // 5 - Muito ruim (Roxo)
      'danger'    // 6 - Perigoso (Marrom)
    ];
    return colors[aqi - 1] || 'medium';
  }

  getIconUrl(iconCode: string): string {
    return this.weatherService.getIconUrl(iconCode);
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleString('pt-BR');
  }

  getWindDirection(degrees: number): string {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  }
}
