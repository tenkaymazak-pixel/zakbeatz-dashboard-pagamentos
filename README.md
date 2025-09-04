# DASHBOARD DE PAGAMENTOS

Dashboard para controle de sessões, artistas e pagamentos do estúdio Zakbeatz.

## 🚀 Funcionalidades

- **Gestão de Artistas**: Cadastro e controle de diferentes tipos de clientes
- **Controle de Sessões**: Registro de horários de trabalho com cálculo automático
- **Sistema de Pagamentos**: Acompanhamento de valores pagos e pendentes
- **Filtros Avançados**: Por artista, tipo de serviço, mês e ano
- **Tipos de Serviço**: Produção semanal/quinzenal, pacotes de horas, mixagem, masterização, gravação, shows e venda de beats

## 🛠️ Tecnologias

- **React 18** - Framework JavaScript
- **Tailwind CSS** - Framework de estilização
- **Vite** - Build tool e servidor de desenvolvimento

## 📦 Instalação

1. **Clone ou baixe o projeto**
2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Execute o projeto:**
   ```bash
   npm run dev
   ```

4. **Acesse no navegador:**
   ```
   http://localhost:3000
   ```

## 🎯 Como Usar

### Adicionando um Novo Cliente
1. Clique no botão "+ Cliente" no formulário
2. Preencha nome, tipo de serviço e valor por hora
3. Clique em "Salvar"

### Registrando uma Sessão
1. Selecione o artista/cliente
2. Escolha a data
3. Para pacotes de horas: selecione o tipo de pacote
4. Para outros tipos: preencha os horários de início, pausa e fim
5. Adicione uma nota descritiva
6. Clique em "Adicionar"

### Controlando Pagamentos
- No painel lateral, você pode ver o total a receber de cada cliente
- Edite o valor pago diretamente no campo de cada cliente
- O sistema mostra automaticamente o valor restante

### Filtros
- Use os filtros na barra lateral para visualizar dados específicos
- Filtre por artista, tipo de serviço, mês ou ano

## 📊 Tipos de Serviço

- **📅 Prod. Semanal**: Produção musical semanal
- **🗓️ Prod. Quinzenal**: Produção musical quinzenal  
- **⏰ Pacote Horas**: Trabalho por pacotes de horas (4h, 8h, 12h, 16h, 20h)
- **🎛️ Mixagem**: Serviços de mixagem
- **🎚️ Masterização**: Serviços de masterização
- **🎤 Gravação**: Serviços de gravação
- **🎪 Show**: Montagem e produção de shows
- **💿 Beat**: Venda de beats

## 🔧 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Gera build de produção
- `npm run preview` - Visualiza o build de produção

## 📝 Notas

- Os dados são armazenados apenas no estado local do React (não persistem após recarregar a página)
- Para persistência de dados, seria necessário implementar um backend ou usar localStorage
- O sistema calcula automaticamente as horas trabalhadas considerando pausas
