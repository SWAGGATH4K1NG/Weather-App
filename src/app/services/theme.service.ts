import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private darkMode = false;
  private prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

  constructor() {
    // Verificar se há um tema salvo no localStorage
    this.loadSavedTheme();
    
    // Adicionar listener para mudanças nas preferências do sistema
    this.prefersDark.addEventListener('change', (mediaQuery) => {
      if (this.getCurrentTheme() === 'system') {
        this.setTheme('system');
      }
    });
  }

  // Carregar tema salvo
  private loadSavedTheme() {
    try {
      const stored = localStorage.getItem('weatherApp_settings');
      if (stored) {
        const settings = JSON.parse(stored);
        if (settings.theme) {
          this.setTheme(settings.theme);
          return;
        }
      }
      // Se não houver tema salvo, usar o tema do sistema
      this.setTheme('system');
    } catch (e) {
      console.error('Erro ao carregar tema:', e);
      this.setTheme('light');
    }
  }

  // Definir tema
  setTheme(theme: string) {
    const body = document.querySelector('body');
    if (!body) return;

    // Remover classes existentes
    body.classList.remove('dark-theme', 'light-theme');

    switch (theme) {
      case 'dark':
        body.classList.add('dark-theme');
        this.darkMode = true;
        break;
      case 'light':
        body.classList.add('light-theme');
        this.darkMode = false;
        break;
      case 'system':
      default:
        // Usar preferência do sistema
        if (this.prefersDark.matches) {
          body.classList.add('dark-theme');
          this.darkMode = true;
        } else {
          body.classList.add('light-theme');
          this.darkMode = false;
        }
        break;
    }

    // Atualizar a meta tag de cor do tema
    this.updateMetaThemeColor();
  }

  // Obter tema atual
  getCurrentTheme(): string {
    const stored = localStorage.getItem('weatherApp_settings');
    if (stored) {
      try {
        const settings = JSON.parse(stored);
        return settings.theme || 'system';
      } catch (e) {
        return 'system';
      }
    }
    return 'system';
  }

  // Atualizar a meta tag de cor do tema
  private updateMetaThemeColor() {
    const metaThemeColor = document.querySelector('meta[name=theme-color]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', this.darkMode ? '#1a1a1a' : '#3880ff');
    }
  }
}