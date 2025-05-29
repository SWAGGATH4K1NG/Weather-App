import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface SearchHistory {
  id: string;
  query: string;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  private history: SearchHistory[] = [];
  private storageKey = 'weatherApp_history';
  private maxHistoryItems = 10;

  constructor() {
    this.loadHistory();
  }

  // GET - Obter histórico de pesquisas
  getSearchHistory(): Observable<SearchHistory[]> {
    return of(this.history);
  }

  // POST - Adicionar uma pesquisa ao histórico
  addToHistory(query: string): Observable<SearchHistory> {
    // Criar novo item de histórico
    const newHistoryItem: SearchHistory = {
      id: Date.now().toString(),
      query: query,
      timestamp: new Date()
    };

    // Adicionar ao início da lista
    this.history.unshift(newHistoryItem);
    
    // Manter apenas os últimos N itens
    if (this.history.length > this.maxHistoryItems) {
      this.history = this.history.slice(0, this.maxHistoryItems);
    }
    
    this.saveHistory();
    return of(newHistoryItem);
  }

  // DELETE - Limpar todo o histórico
  clearHistory(): Observable<boolean> {
    this.history = [];
    this.saveHistory();
    return of(true);
  }

  // DELETE - Remover um item específico do histórico
  removeFromHistory(id: string): Observable<boolean> {
    const initialLength = this.history.length;
    this.history = this.history.filter(item => item.id !== id);
    
    const success = initialLength !== this.history.length;
    
    if (success) {
      this.saveHistory();
    }
    
    return of(success);
  }

  // Métodos caso falhe o loading do histórico
  private loadHistory(): void {
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Converter strings de data para objetos Date
        this.history = parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
      } catch (e) {
        console.error('Erro ao carregar histórico:', e);
        this.history = [];
      }
    }
  }

  private saveHistory(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.history));
  }
}