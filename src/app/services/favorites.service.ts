import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

export interface FavoriteCity {
  id: string;
  name: string;
  country: string;
  addedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  // Usar BehaviorSubject para permitir que os componentes se inscrevam em mudanças
  private favoritesSubject = new BehaviorSubject<FavoriteCity[]>([]);
  
  // Em uma aplicação real, usaríamos uma API real, mas para demonstração
  // vamos simular com localStorage
  private storageKey = 'weatherApp_favorites';

  constructor(private http: HttpClient) {
    // Carregar favoritos ao inicializar o serviço
    this.loadFavorites();
  }

  // Simula um GET - Obter todas as cidades favoritas
  getFavorites(): Observable<FavoriteCity[]> {
    // Recarregar do localStorage para garantir dados atualizados
    this.loadFavorites();
    return this.favoritesSubject.asObservable();
  }

  // Simula um POST - Adicionar uma cidade aos favoritos
  addFavorite(cityName: string, countryCode: string): Observable<FavoriteCity> {
    // Obter a lista atual
    const currentFavorites = this.favoritesSubject.getValue();
    
    // Verificar se a cidade já existe nos favoritos (case insensitive)
    const existingCity = currentFavorites.find(city => 
      city.name.toLowerCase() === cityName.toLowerCase() && 
      city.country.toLowerCase() === countryCode.toLowerCase()
    );

    // Se a cidade já existe, apenas retorna a cidade existente
    if (existingCity) {
      console.log('Cidade já existe nos favoritos:', existingCity);
      return of(existingCity);
    }

    // Criar nova cidade favorita
    const newFavorite: FavoriteCity = {
      id: Date.now().toString(), // Gerar ID único
      name: cityName,
      country: countryCode,
      addedAt: new Date()
    };

    // Adicionar à lista
    const updatedFavorites = [...currentFavorites, newFavorite];
    
    // Atualizar o subject e salvar
    this.favoritesSubject.next(updatedFavorites);
    this.saveFavorites(updatedFavorites);
    
    console.log('Nova cidade adicionada aos favoritos:', newFavorite);
    console.log('Total de favoritos:', updatedFavorites.length);

    return of(newFavorite);
  }

  // Simula um DELETE - Remover uma cidade dos favoritos
  removeFavorite(id: string): Observable<boolean> {
    // Obter a lista atual
    const currentFavorites = this.favoritesSubject.getValue();
    const initialLength = currentFavorites.length;
    
    // Encontrar a cidade a ser removida
    const cityToRemove = currentFavorites.find(city => city.id === id);
    
    if (cityToRemove) {
      console.log('Removendo cidade dos favoritos:', cityToRemove);
    } else {
      console.warn('Cidade com ID', id, 'não encontrada nos favoritos');
      return of(false);
    }
    
    // Filtrar a cidade da lista
    const updatedFavorites = currentFavorites.filter(city => city.id !== id);
    
    // Se a lista mudou de tamanho, significa que removemos com sucesso
    const success = updatedFavorites.length < initialLength;
    
    if (success) {
      // Atualizar o subject e salvar
      this.favoritesSubject.next(updatedFavorites);
      this.saveFavorites(updatedFavorites);
      
      console.log('Cidade removida com sucesso. Favoritos restantes:', updatedFavorites.length);
    } else {
      console.warn('Falha ao remover cidade com ID:', id);
    }
    
    return of(success);
  }

  // Simula um PUT - Atualizar detalhes de uma cidade favorita
  updateFavorite(id: string, data: Partial<FavoriteCity>): Observable<FavoriteCity | null> {
    // Obter a lista atual
    const currentFavorites = this.favoritesSubject.getValue();
    const index = currentFavorites.findIndex(city => city.id === id);
    
    if (index === -1) {
      console.warn('Cidade com ID', id, 'não encontrada para atualização');
      return of(null);
    }
    
    // Criar uma cópia da lista
    const updatedFavorites = [...currentFavorites];
    
    // Atualizar os dados
    updatedFavorites[index] = {
      ...updatedFavorites[index],
      ...data
    };
    
    // Atualizar o subject e salvar
    this.favoritesSubject.next(updatedFavorites);
    this.saveFavorites(updatedFavorites);
    
    console.log('Cidade atualizada com sucesso:', updatedFavorites[index]);
    
    return of(updatedFavorites[index]);
  }

  // Limpar todos os favoritos
  clearAllFavorites(): Observable<boolean> {
    this.favoritesSubject.next([]);
    this.saveFavorites([]);
    console.log('Todos os favoritos foram removidos');
    return of(true);
  }

  // Métodos auxiliares para persistência
  private loadFavorites(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // Converter strings de data para objetos Date
        const favorites = parsed.map((city: any) => ({
          ...city,
          addedAt: new Date(city.addedAt)
        }));
        
        // Atualizar o subject
        this.favoritesSubject.next(favorites);
        console.log('Favoritos carregados do localStorage:', favorites.length);
      } else {
        // Se não há dados no localStorage, inicializar com array vazio
        this.favoritesSubject.next([]);
        console.log('Nenhum favorito encontrado no localStorage');
      }
    } catch (e) {
      console.error('Erro ao carregar favoritos:', e);
      // Em caso de erro, inicializar com array vazio
      this.favoritesSubject.next([]);
    }
  }

  private saveFavorites(favorites: FavoriteCity[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(favorites));
      console.log('Favoritos salvos no localStorage:', favorites.length);
    } catch (e) {
      console.error('Erro ao salvar favoritos:', e);
    }
  }
}