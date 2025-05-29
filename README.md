# Aplicativo de Previsão do Tempo

Este é um aplicativo IONIC que consome a API OpenWeatherMap e uma API de backend para gerenciar favoritos, histórico e configurações de usuário.

## Métodos da API utilizados

O aplicativo utiliza os seguintes métodos de API:

### API OpenWeatherMap
1. **GET** `/weather` - Obter clima atual por nome da cidade ou coordenadas
2. **GET** `/forecast` - Obter previsão do tempo para 5 dias
3. **GET** `/air_pollution` - Obter dados de qualidade do ar

### API de Backend
1. **GET** `/favorites` - Obter lista de cidades favoritas
2. **POST** `/favorites` - Adicionar uma cidade aos favoritos
3. **DELETE** `/favorites/:id` - Remover uma cidade dos favoritos
4. **GET** `/settings/:id` - Obter configurações do usuário
5. **PUT** `/settings/:id` - Atualizar configurações do usuário
6. **PATCH** `/settings/:id` - Atualizar parcialmente as configurações
7. **DELETE** `/settings/:id` - Limpar configurações do usuário
8. **POST** `/feedback` - Enviar feedback do usuário

## Como executar o projeto

1. Clone o repositório:
```
git clone <url-do-repositorio>
cd weather
```

2. Instale as dependências:
```
cd weatherApp
npm install
```

3. Inicie o JSON Server (API de backend):
```
npm run api
```

4. Em outro terminal, inicie o aplicativo Angular:
```
npm start
```

5. Acesse o aplicativo em `http://localhost:4200`

## Configuração do Backend

O projeto já está configurado para usar o [JSON Server](https://github.com/typicode/json-server) como backend. O arquivo `db.json` na raiz do projeto contém a estrutura inicial do banco de dados.

### Estrutura do banco de dados
```json
{
  "favorites": [],
  "users": [
    {
      "id": "user123",
      "name": "Usuário de Teste",
      "email": "usuario@teste.com"
    }
  ],
  "settings": [
    {
      "id": "user123",
      "units": "metric",
      "lang": "pt",
      "theme": "light",
      "notifications": true
    }
  ],
  "feedback": []
}
```

### URL do backend
O aplicativo está configurado para acessar o backend em `http://localhost:3000`.

## Alternativa: My JSON Server

Para demonstração, você também pode usar o [My JSON Server](https://my-json-server.typicode.com/):

1. Crie um repositório no GitHub chamado `weather-api`
2. Adicione um arquivo `db.json` com a estrutura acima
3. Atualize a URL do backend no arquivo `weather.service.ts`:
```typescript
private backendUrl = 'https://my-json-server.typicode.com/seu-usuario/weather-api';
```

## Fallback para localStorage

O aplicativo inclui um mecanismo de fallback para localStorage no caso apenas a api so fornecer o GET. Isso garante que o aplicativo continue funcionando mesmo sem conexão com o backend.
