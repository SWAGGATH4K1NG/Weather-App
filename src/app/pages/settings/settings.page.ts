import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem, 
  IonLabel, IonSelect, IonSelectOption, IonToggle, IonButton, 
  IonIcon, IonBackButton, IonButtons, ToastController, 
  IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonGrid, IonRow, IonCol, IonSpinner
} from '@ionic/angular/standalone';
import { WeatherService, UserSettings } from 'src/app/services/weather.service';
import { ThemeService } from 'src/app/services/theme.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule,
    IonList, IonItem, IonLabel, IonSelect, IonSelectOption, IonToggle, 
    IonButton, IonIcon, IonBackButton, IonButtons, RouterModule,
    IonCard, IonCardContent, IonCardHeader, IonCardTitle, 
    IonGrid, IonRow, IonCol, IonSpinner
  ]
})
export class SettingsPage implements OnInit {
  settings: UserSettings = {
    units: 'metric',
    lang: 'pt',
    theme: 'light',
    notifications: true
  };
  
  returnTo: string = '/home';
  cityName: string = '';
  loading: boolean = true;
  
  // Opções para os selects
  unitOptions = [
    { value: 'metric', label: 'Celsius (°C)' },
    { value: 'imperial', label: 'Fahrenheit (°F)' },
    { value: 'standard', label: 'Kelvin (K)' }
  ];
  
  languageOptions = [
    { value: 'pt', label: 'Português' },
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' }
  ];
  
  themeOptions = [
    { value: 'light', label: 'Claro' },
    { value: 'dark', label: 'Escuro' },
    { value: 'system', label: 'Sistema' }
  ];

  constructor(
    private weatherService: WeatherService,
    private themeService: ThemeService,
    private route: ActivatedRoute,
    private router: Router,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    // Obter parâmetros da rota
    this.route.queryParams.subscribe(params => {
      if (params['returnTo']) {
        this.returnTo = params['returnTo'];
      }
      if (params['city']) {
        this.cityName = params['city'];
      }
    });
    
    // Carregar configurações atuais (GET)
    this.loadSettings();
    
    // Aplicar o tema atual
    const currentTheme = this.themeService.getCurrentTheme();
    this.themeService.setTheme(currentTheme);
  }
  
  // GET - Carregar configurações
  loadSettings() {
    this.loading = true;
    this.weatherService.getUserSettings().subscribe({
      next: (settings) => {
        this.settings = settings;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar configurações:', err);
        this.loading = false;
      }
    });
  }
  
  // PUT - Salvar configurações
  saveSettings() {
    this.weatherService.updateUserSettings(this.settings).subscribe({
      next: (updatedSettings) => {
        
        // Aplicar o tema usando o serviço de tema
        this.themeService.setTheme(updatedSettings.theme);
        
        this.settings = updatedSettings;
        
        // Aplicar o tema usando o serviço de tema
        this.themeService.setTheme(updatedSettings.theme);
        
        this.presentToast('Configurações salvas com sucesso!', 'success');
        
        // Navegar de volta para a página anterior
        if (this.returnTo === '/details' && this.cityName) {
          this.router.navigate([this.returnTo], { 
            queryParams: { city: this.cityName } 
          });
        } else {
          this.router.navigateByUrl(this.returnTo);
        }
      },
      error: (err) => {
        console.error('Erro ao salvar configurações:', err);
        this.presentToast('Erro ao salvar configurações', 'danger');
      }
    });
  }
  
  // PATCH - Atualizar apenas o tema
  updateTheme(theme: string) {
    this.weatherService.patchUserSettings({ theme }).subscribe({
      next: (updatedSettings) => {
        this.settings = updatedSettings;
        
        // Aplicar o tema usando o serviço de tema
        this.themeService.setTheme(theme);
        
        this.presentToast('Tema atualizado!', 'success');
      },
      error: (err) => {
        console.error('Erro ao atualizar tema:', err);
        this.presentToast('Erro ao atualizar tema', 'danger');
      }
    });
  }
  
  // DELETE - Resetar configurações
  resetSettings() {
    this.weatherService.clearUserSettings().subscribe({
      next: () => {
        this.loadSettings(); // Recarregar configurações padrão
        
        // Aplicar o tema padrão (light)
        this.themeService.setTheme('light');
        
        this.presentToast('Configurações resetadas com sucesso!', 'success');
      },
      error: (err) => {
        console.error('Erro ao resetar configurações:', err);
        this.presentToast('Erro ao resetar configurações', 'danger');
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
}
