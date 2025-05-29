import { Component, OnInit } from '@angular/core';
import { WeatherService, WeatherData, ForecastData } from 'src/app/services/weather.service';
import { FavoritesService, FavoriteCity } from 'src/app/services/favorites.service';
import { HistoryService, SearchHistory } from 'src/app/services/history.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, 
  IonButton, IonIcon, IonItem, IonLabel, 
  IonInput, IonItemSliding, IonList, IonImg, IonSpinner,
  IonItemOptions, IonItemOption, 
  IonSelect, IonSelectOption
} from '@ionic/angular/standalone';
import { catchError, finalize, tap } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, 
    IonButton, IonIcon, IonItem, IonLabel, 
    IonImg, IonInput, IonList, IonItemSliding, IonSpinner,
    IonItemOptions, IonItemOption, 
    IonSelect, IonSelectOption
  ]
})
export class HomePage implements OnInit {
  cidade: string = '';
  tempo: WeatherData | null = null;
  previsao: ForecastData | null = null;
  previsaoPorDia: any[] = []; // Nova propriedade para armazenar previsão por dia
  favoritos: FavoriteCity[] = [];
  historico: SearchHistory[] = [];
  carregar: boolean = false;
  carregandoFavoritos: boolean = false;
  erro: string | null = null;
  mostrarFavoritos: boolean = false;
  mostrarHistorico: boolean = false;
  mostrarConfiguracoes: boolean = false;
  unidade: string = 'metric';
  idioma: string = 'pt';

  constructor(
    private weatherService: WeatherService,
    private favoritesService: FavoritesService,
    private historyService: HistoryService
  ) {}
  
  // Método para resetar estados de carregamento
  resetarEstadosCarregamento() {
    console.log('Resetando estados de carregamento');
    this.carregandoFavoritos = false;
    this.carregar = false;
  }

  ngOnInit() {
    // Garantir que o estado de carregamento esteja resetado
    this.resetarEstadosCarregamento();
    
    // Carregar dados iniciais
    this.carregarFavoritos();
    this.carregarHistorico();
    this.carregarConfiguracoes();
    
    // Adicionar um timer para garantir que os estados de carregamento sejam resetados
    setTimeout(() => {
      this.resetarEstadosCarregamento();
    }, 5000);
  }

  // Método para buscar clima atual e previsão
  buscarClima() {
    if (!this.cidade) return;

    this.carregar = true;
    this.erro = null;
    
    // Adicionar ao histórico
    this.historyService.addToHistory(this.cidade).subscribe();

    // Buscar clima atual e previsão em paralelo
    forkJoin({
      clima: this.weatherService.getWeather(this.cidade).pipe(
        catchError(err => {
          this.erro = 'Cidade não encontrada!';
          return of(null);
        })
      ),
      previsao: this.weatherService.getForecast(this.cidade).pipe(
        catchError(err => of(null))
      )
    }).pipe(
      finalize(() => {
        this.carregar = false;
        this.carregarHistorico(); // Atualizar histórico após busca
      })
    ).subscribe(results => {
      if (results.clima) {
        this.tempo = results.clima;
        this.previsao = results.previsao;
        
        // Processar a previsão para mostrar apenas uma previsão por dia
        if (this.previsao) {
          this.processarPrevisaoPorDia();
        }
      }
    });
  }

  // Verificar se a cidade atual já está nos favoritos
  cidadeEstaNosFavoritos(): boolean {
    if (!this.tempo) return false;
    
    return this.favoritos.some(
      city => city.name.toLowerCase() === this.tempo!.name.toLowerCase() && 
              city.country.toLowerCase() === this.tempo!.sys.country.toLowerCase()
    );
  }
  
  // Verificar se uma cidade do histórico já está nos favoritos
  cidadeHistoricoEstaNosFavoritos(nomeCidade: string): boolean {
    if (!nomeCidade || !this.favoritos || this.favoritos.length === 0) {
      return false;
    }
    
    return this.favoritos.some(
      city => city.name.toLowerCase() === nomeCidade.toLowerCase()
    );
  }

  // POST - Adicionar cidade aos favoritos
  adicionarFavorito(event: Event) {
    // Prevenir comportamento padrão do botão
    event.preventDefault();
    event.stopPropagation();
    
    if (!this.tempo) {
      console.warn('Não há dados de clima para adicionar aos favoritos');
      return;
    }
    
    // Se a cidade já está nos favoritos, remover
    if (this.cidadeEstaNosFavoritos()) {
      console.log('Cidade já está nos favoritos, removendo:', this.tempo.name);
      
      // Encontrar o ID da cidade nos favoritos
      const favorito = this.favoritos.find(
        city => city.name.toLowerCase() === this.tempo!.name.toLowerCase() && 
                city.country.toLowerCase() === this.tempo!.sys.country.toLowerCase()
      );
      
      if (favorito) {
        this.removerFavorito(favorito.id, event);
      }
      
      return;
    }
    
    // Adicionar aos favoritos
    // Evitar múltiplas chamadas simultâneas
    if (this.carregandoFavoritos) {
      console.log('Já está carregando favoritos, ignorando chamada');
      return;
    }
    
    console.log('Iniciando adição aos favoritos da cidade atual');
    this.carregandoFavoritos = true;
    
    // Adicionar um timer para garantir que o estado de carregamento seja resetado
    const timer = setTimeout(() => {
      console.log('Timer de segurança acionado para resetar estado de carregamento');
      this.carregandoFavoritos = false;
    }, 10000);
    
    this.favoritesService.addFavorite(
      this.tempo.name, 
      this.tempo.sys.country
    ).pipe(
      catchError(err => {
        console.error('Erro ao adicionar favorito:', err);
        this.carregandoFavoritos = false;
        clearTimeout(timer);
        return of(null);
      }),
      finalize(() => {
        console.log('Finalizando adição aos favoritos da cidade atual');
        this.carregandoFavoritos = false;
        clearTimeout(timer);
      })
    ).subscribe({
      next: (favorito) => {
        console.log('Cidade adicionada aos favoritos:', favorito);
        // Recarregar a lista de favoritos uma única vez
        this.carregarFavoritos();
      },
      error: (err) => {
        console.error('Erro ao adicionar favorito:', err);
      }
    });
  }

  // DELETE - Remover cidade dos favoritos
  removerFavorito(id: string, event?: Event) {
    // Prevenir comportamento padrão se o evento for fornecido
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Evitar múltiplas chamadas simultâneas
    if (this.carregandoFavoritos) {
      console.log('Já está carregando favoritos, ignorando chamada');
      return;
    }
    
    console.log('Iniciando remoção de favorito');
    this.carregandoFavoritos = true;
    
    // Adicionar um timer para garantir que o estado de carregamento seja resetado
    const timer = setTimeout(() => {
      console.log('Timer de segurança acionado para resetar estado de carregamento');
      this.carregandoFavoritos = false;
    }, 10000);
    
    this.favoritesService.removeFavorite(id).pipe(
      catchError(err => {
        console.error('Erro ao remover favorito:', err);
        this.carregandoFavoritos = false;
        clearTimeout(timer);
        return of(false);
      }),
      finalize(() => {
        console.log('Finalizando remoção de favorito');
        this.carregandoFavoritos = false;
        clearTimeout(timer);
      })
    ).subscribe({
      next: (sucesso) => {
        if (sucesso) {
          console.log('Cidade removida dos favoritos com sucesso');
          // Recarregar a lista de favoritos uma única vez
          this.carregarFavoritos();
        } else {
          console.warn('Falha ao remover cidade dos favoritos');
        }
      },
      error: (err) => {
        console.error('Erro ao remover favorito:', err);
      }
    });
  }
  
  // DELETE - Limpar todos os favoritos
  limparTodosFavoritos(event: Event) {
    // Prevenir comportamento padrão
    event.preventDefault();
    event.stopPropagation();
    // Confirmar antes de remover
    if (confirm('Tem certeza que deseja remover todas as cidades favoritas?')) {
      this.favoritesService.clearAllFavorites().subscribe({
        next: (sucesso) => {
          if (sucesso) {
            console.log('Todos os favoritos foram removidos');
            // Recarregar a lista de favoritos
            this.carregarFavoritos();
          }
        },
        error: (err) => {
          console.error('Erro ao limpar favoritos:', err);
        }
      });
    }
  }

  // GET - Carregar cidades favoritas
  carregarFavoritos() {
    // Evitar múltiplas chamadas simultâneas
    if (this.carregandoFavoritos) {
      console.log('Já está carregando favoritos, ignorando chamada');
      return;
    }
    
    console.log('Iniciando carregamento de favoritos');
    this.carregandoFavoritos = true;
    
    // Limpar a lista atual para evitar dados antigos
    this.favoritos = [];
    
    this.favoritesService.getFavorites().pipe(
      finalize(() => {
        console.log('Finalizando carregamento de favoritos');
        this.carregandoFavoritos = false;
      })
    ).subscribe({
      next: (favoritos) => {
        console.log('Favoritos carregados:', favoritos.length);
        // Atualiza a lista local com os dados mais recentes
        this.favoritos = [...favoritos];
        
        // Verificar se a cidade atual está nos favoritos (para atualizar o ícone)
        if (this.tempo) {
          const isFavorite = this.cidadeEstaNosFavoritos();
          console.log(`Cidade atual (${this.tempo.name}) está nos favoritos: ${isFavorite}`);
        }
      },
      error: (err) => {
        console.error('Erro ao carregar favoritos:', err);
        // Em caso de erro, garantir que a lista esteja vazia
        this.favoritos = [];
      }
    });
  }

  // GET - Carregar histórico de pesquisas
  carregarHistorico() {
    this.historyService.getSearchHistory().subscribe({
      next: (historico) => {
        this.historico = historico;
      },
      error: (err) => {
        console.error('Erro ao carregar histórico:', err);
      }
    });
  }

  // DELETE - Limpar histórico de pesquisas
  limparHistorico(event: Event) {
    // Prevenir comportamento padrão
    event.preventDefault();
    event.stopPropagation();
    this.historyService.clearHistory().subscribe({
      next: () => {
        this.historico = [];
      }
    });
  }

  // DELETE - Remover item do histórico
  removerDoHistorico(id: string, event?: Event) {
    // Prevenir comportamento padrão se o evento for fornecido
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.historyService.removeFromHistory(id).subscribe({
      next: (sucesso) => {
        if (sucesso) {
          this.carregarHistorico();
        }
      }
    });
  }

  // Buscar a partir de um item do histórico
  buscarDoHistorico(query: string, event?: Event) {
    // Prevenir comportamento padrão se o evento for fornecido
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.cidade = query;
    this.buscarClima();
  }
  
  // Adicionar aos favoritos a partir do histórico
  adicionarAosFavoritosDoHistorico(query: string, event: Event) {
    // Prevenir comportamento padrão
    event.preventDefault();
    event.stopPropagation();
    
    // Evitar múltiplas chamadas simultâneas
    if (this.carregandoFavoritos) {
      console.log('Já está carregando favoritos, ignorando chamada');
      return;
    }
    
    // Verificar se a cidade já está nos favoritos
    const cidadeJaFavorita = this.cidadeHistoricoEstaNosFavoritos(query);
    
    if (cidadeJaFavorita) {
      // Se já estiver nos favoritos, remover
      const favorito = this.favoritos.find(
        city => city.name.toLowerCase() === query.toLowerCase()
      );
      
      if (favorito) {
        this.removerFavorito(favorito.id, event);
      }
      
      return;
    }
    
    console.log('Iniciando adição aos favoritos do histórico');
    this.carregandoFavoritos = true;
    
    // Adicionar um timer para garantir que o estado de carregamento seja resetado
    const timer = setTimeout(() => {
      console.log('Timer de segurança acionado para resetar estado de carregamento');
      this.carregandoFavoritos = false;
    }, 10000);
    
    // Primeiro, buscar os dados da cidade para obter o código do país
    this.weatherService.getWeather(query).pipe(
      catchError(err => {
        console.error('Erro ao buscar dados da cidade:', err);
        this.carregandoFavoritos = false;
        clearTimeout(timer);
        return of(null);
      }),
      finalize(() => {
        console.log('Finalizando busca de dados da cidade do histórico');
        clearTimeout(timer);
      })
    ).subscribe(dados => {
      if (dados) {
        // Adicionar aos favoritos
        this.favoritesService.addFavorite(
          dados.name, 
          dados.sys.country
        ).pipe(
          finalize(() => {
            console.log('Finalizando adição aos favoritos do histórico');
            this.carregandoFavoritos = false;
          })
        ).subscribe({
          next: (favorito) => {
            console.log('Cidade adicionada aos favoritos:', favorito);
            // Recarregar a lista de favoritos
            this.carregarFavoritos();
          },
          error: (err) => {
            console.error('Erro ao adicionar favorito:', err);
          }
        });
      } else {
        console.log('Dados da cidade do histórico não encontrados');
        this.carregandoFavoritos = false;
      }
    });
  }

  // Buscar a partir de um favorito
  buscarDoFavorito(cidade: string, event?: Event) {
    // Prevenir comportamento padrão se o evento for fornecido
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.cidade = cidade;
    this.buscarClima();
  }

  // PUT - Salvar configurações
  salvarConfiguracoes(event?: Event) {
    // Prevenir comportamento padrão se o evento for fornecido
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.weatherService.updateUserSettings({
      units: this.unidade,
      lang: this.idioma,
      theme: 'light', // Valor padrão
      notifications: true // Valor padrão
    }).subscribe();
  }

  // GET - Carregar configurações
  carregarConfiguracoes() {
    this.weatherService.getUserSettings().subscribe(settings => {
      this.unidade = settings.units;
      this.idioma = settings.lang;
    });
  }

  // Alternar exibição de favoritos
  toggleFavoritos(event: Event) {
    // Prevenir comportamento padrão
    event.preventDefault();
    event.stopPropagation();
    
    this.mostrarFavoritos = !this.mostrarFavoritos;
    if (this.mostrarFavoritos) {
      // Esconder outras seções
      this.mostrarHistorico = false;
      this.mostrarConfiguracoes = false;
    } else {
      // Ao fechar favoritos, apenas fechar a seção sem limpar os dados
      this.mostrarFavoritos = false;
    }
  }

  // Alternar exibição de histórico
  toggleHistorico(event: Event) {
    // Prevenir comportamento padrão
    event.preventDefault();
    event.stopPropagation();
    
    this.mostrarHistorico = !this.mostrarHistorico;
    if (this.mostrarHistorico) {
      // Esconder outras seções
      this.mostrarFavoritos = false;
      this.mostrarConfiguracoes = false;
    } else {
      // Ao fechar histórico, apenas fechar a seção sem limpar os dados
      this.mostrarHistorico = false;
    }
  }
  
  // Alternar exibição de configurações
  toggleConfiguracoes(event: Event) {
    // Prevenir comportamento padrão
    event.preventDefault();
    event.stopPropagation();
    
    this.mostrarConfiguracoes = !this.mostrarConfiguracoes;
    if (this.mostrarConfiguracoes) {
      // Esconder outras seções
      this.mostrarFavoritos = false;
      this.mostrarHistorico = false;
    } else {
      // Ao fechar configurações, apenas fechar a seção sem limpar os dados
      this.mostrarConfiguracoes = false;
    }
  }
  
  // Método para resetar a visualização e mostrar a "página principal"
  resetarVisualizacao(event?: Event, limparDados: boolean = false) {
    // Prevenir comportamento padrão se o evento for fornecido
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Apenas limpar os dados se o parâmetro limparDados for true
    if (limparDados) {
      // Limpar dados do clima e previsão
      this.tempo = null;
      this.previsao = null;
      this.previsaoPorDia = [];
      
      // Limpar campo de busca
      this.cidade = '';
      
      // Limpar mensagens de erro
      this.erro = null;
    }
    
    // Fechar todas as seções
    this.mostrarFavoritos = false;
    this.mostrarHistorico = false;
    this.mostrarConfiguracoes = false;
  }

  // Obter URL do ícone do clima
  getIconUrl(iconCode: string): string {
    return this.weatherService.getIconUrl(iconCode);
  }

  // Formatar data
  formatarData(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR');
  }
  
  // Limpar o campo de cidade
  limparCidade(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.cidade = '';
  }
  
  // Adicionar cidade atual da caixa de pesquisa aos favoritos
  adicionarCidadePesquisaAosFavoritos(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    
    if (!this.cidade || this.cidade.trim() === '') {
      console.warn('Campo de pesquisa vazio');
      return;
    }
    
    // Evitar múltiplas chamadas simultâneas
    if (this.carregandoFavoritos) {
      console.log('Já está carregando favoritos, ignorando chamada');
      return;
    }
    
    // Verificar se a cidade já está nos favoritos
    const cidadeJaFavorita = this.cidadeHistoricoEstaNosFavoritos(this.cidade);
    
    if (cidadeJaFavorita) {
      // Se já estiver nos favoritos, remover
      const favorito = this.favoritos.find(
        city => city.name.toLowerCase() === this.cidade.toLowerCase()
      );
      
      if (favorito) {
        this.removerFavorito(favorito.id, event);
      }
      
      return;
    }
    
    console.log('Iniciando adição aos favoritos');
    this.carregandoFavoritos = true;
    
    // Adicionar um timer para garantir que o estado de carregamento seja resetado
    const timer = setTimeout(() => {
      console.log('Timer de segurança acionado para resetar estado de carregamento');
      this.carregandoFavoritos = false;
    }, 10000);
    
    // Buscar os dados da cidade para obter o código do país
    this.weatherService.getWeather(this.cidade).pipe(
      catchError(err => {
        console.error('Erro ao buscar dados da cidade:', err);
        this.carregandoFavoritos = false;
        clearTimeout(timer);
        return of(null);
      }),
      finalize(() => {
        console.log('Finalizando busca de dados da cidade');
        clearTimeout(timer);
      })
    ).subscribe(dados => {
      if (dados) {
        // Adicionar aos favoritos
        this.favoritesService.addFavorite(
          dados.name, 
          dados.sys.country
        ).pipe(
          finalize(() => {
            console.log('Finalizando adição aos favoritos');
            this.carregandoFavoritos = false;
          })
        ).subscribe({
          next: (favorito) => {
            console.log('Cidade adicionada aos favoritos:', favorito);
            // Recarregar a lista de favoritos
            this.carregarFavoritos();
          },
          error: (err) => {
            console.error('Erro ao adicionar favorito:', err);
          }
        });
      } else {
        console.log('Dados da cidade não encontrados');
        this.carregandoFavoritos = false;
      }
    });
  }
  
  // Processar previsão para mostrar apenas uma previsão por dia
  processarPrevisaoPorDia() {
    if (!this.previsao || !this.previsao.list || this.previsao.list.length === 0) return;
    
    // Limpar array anterior
    this.previsaoPorDia = [];
    
    // Mapa para armazenar a previsão de cada dia
    const previsoesPorDia = new Map<string, any>();
    
    // Agrupar previsões por dia
    this.previsao.list.forEach(item => {
      // Extrair a data (sem a hora)
      const data = new Date(item.dt * 1000);
      const dataString = `${data.getFullYear()}-${data.getMonth() + 1}-${data.getDate()}`;
      
      // Se ainda não temos previsão para este dia ou se é meio-dia (melhor representação do dia)
      const hora = data.getHours();
      if (!previsoesPorDia.has(dataString) || hora === 12 || hora === 13) {
        previsoesPorDia.set(dataString, item);
      }
    });
    
    // Converter o mapa em array e ordenar por data
    this.previsaoPorDia = Array.from(previsoesPorDia.values())
      .sort((a, b) => a.dt - b.dt)
      .slice(0, 5); // Limitar a 5 dias
  }
  
  // Retorna a classe CSS apropriada para o fundo com base no ícone do clima
  getWeatherBgClass(iconCode: string): string {
    // Verificar se é dia ou noite
    const isDay = iconCode.includes('d');
    const isNight = iconCode.includes('n');
    
    // Verificar o tipo de clima
    if (iconCode.startsWith('01')) {
      // Céu limpo
      return isDay ? 'weather-bg-clear-day' : 'weather-bg-clear-night';
    } else if (iconCode.startsWith('02') || iconCode.startsWith('03') || iconCode.startsWith('04')) {
      // Nuvens
      return isDay ? 'weather-bg-clouds-day' : 'weather-bg-clouds-night';
    } else if (iconCode.startsWith('09') || iconCode.startsWith('10')) {
      // Chuva
      return 'weather-bg-rain';
    } else if (iconCode.startsWith('11')) {
      // Tempestade
      return 'weather-bg-thunderstorm';
    } else if (iconCode.startsWith('13')) {
      // Neve
      return 'weather-bg-snow';
    } else if (iconCode.startsWith('50')) {
      // Neblina
      return 'weather-bg-mist';
    }
    
    // Padrão
    return '';
  }
}
