# 🍕 LaPizzaNatal — Sistema Digital de Pedidos

## 📌 Contexto

Projeto desenvolvido no contexto do **Projeto de Extensão Universitária II (PEX II)** do curso de **Análise e Desenvolvimento de Sistemas (ADS)**.

---

## 🎯 Objetivo

Apresentar uma solução web para apoiar o processo de pedidos da **LaPizzaNatal**, com foco em organização, redução de custos operacionais e melhoria do atendimento aos clientes da Zona Norte de Natal/RN.

---

## 🛠️ Tecnologias Utilizadas

O sistema foi construído sem dependências externas pesadas ou frameworks desnecessários, utilizando tecnologias web modernas e nativas:

* **HTML5** (Semântica, acessibilidade e meta tags para dispositivos móveis)
* **CSS3** (Variáveis CSS, Flexbox, Grid e design responsivo mobile-first)
* **JavaScript (ES6 Modules)** (Lógica desacoplada, regras de negócio e manipulação do DOM)
* **SVG** (Renderização vetorial escalável para QR Code Pix dinâmico)
* **LocalStorage** (Persistência leve e segura do estado do carrinho e numeração incremental dos pedidos)
* **Git** (Controle de versão local)

---

## ✨ Funcionalidades Implementadas

* **Cardápio digital:** visualização completa e categorizada de 26 pizzas salgadas, 8 pizzas doces (34 pizzas no total), 4 bordas recheadas e 3 opções de bebidas de 1L.
* **Seleção de tamanho:** escolha entre tamanhos Pequena (P), Média (M) e Grande (G), com atualização em tempo real de valores.
* **Pizza de um sabor:** seleção direta do sabor desejado.
* **Meio a meio:** possibilidade de combinar 2 sabores diferentes, aplicando rigorosamente a regra de negócio oficial da pizzaria (o preço final é sempre o do sabor de maior valor para o tamanho escolhido, nunca somando nem fazendo média).
* **Bordas recheadas:** opção de adicionar até 1 borda recheada por pizza com valor cobrado à parte.
* **Bebidas:** adição de bebidas individuais de 1L diretamente ao carrinho.
* **Carrinho completo:** controle de itens selecionados, alteração de quantidades (`+` e `−`), remoção de produtos e cálculo automático de subtotais e total geral.
* **Checkout completo:** formulário com validação de dados de identificação e endereço de entrega.
* **Restrição de entrega à Zona Norte:** validação com confirmação declarada do cliente e informação de taxa de entrega gratuita (R$ 0,00).
* **Pagamento via Pix:** exibição da chave oficial, botão copiar chave Pix, geração do código BR Code padrão Banco Central do Brasil com cálculo de CRC16 CCITT e QR Code SVG nítido renderizado na tela.
* **Pagamento em Dinheiro com cálculo de troco:** suporte a pagamento exato ou cálculo dinâmico de troco, com bloqueio em caso de valor inferior ao total da compra.
* **Pagamento com Cartão na entrega:** opção de pagamento via maquininha na porta do cliente.
* **Geração de pedido:** numeração sequencial e única iniciada a partir de `#1042`.
* **Integração com WhatsApp:** montagem automática da mensagem estruturada e abertura da conversa no WhatsApp oficial da LaPizzaNatal (`(84) 99899-2266`), incluindo atalho para envio de comprovante Pix.

---

## 📁 Estrutura do Projeto

```text
LapizzaNatal PEX II/
├── index.html           # Página principal do sistema e modais
├── README.md            # Documentação e guia do projeto
├── .gitignore           # Arquivos e diretórios ignorados pelo Git
├── assets/
│   ├── images/
│   │   └── logo.png     # Logotipo oficial da LaPizzaNatal
│   └── icons/           # Ícones auxiliares
├── css/
│   └── style.css        # Folha de estilos e responsividade
├── data/
│   └── cardapio.js      # Fonte oficial de dados dos produtos e regras de negócio
└── js/
    ├── app.js           # Ponto de entrada e renderização do cardápio
    ├── config.js        # Configurações centrais (contatos, Pix e entrega)
    ├── regras.js        # Motor de regras de negócio e cálculo de preços
    ├── carrinho.js      # Gerenciamento de estado do carrinho e LocalStorage
    ├── configurador.js  # Modal interativo de configuração de pizzas
    ├── checkout.js      # Fluxo de checkout, validações e link do WhatsApp
    ├── pagamento.js     # Regras de pagamento, troco e payload do Pix
    └── qrcode.js        # Gerador nativo e autônomo de QR Code em SVG
```

---

## 🚀 Execução Local

Por utilizar **Módulos JavaScript nativos (`type="module"`)**, a aplicação requer execução através de um servidor HTTP local simples para que o navegador carregue os módulos corretamente.

### Opção 1: Via Python 3 (Testado)

Abra o terminal na pasta raiz do projeto e execute:

```bash
python -m http.server 8000
```

Em seguida, acesse no navegador: `http://localhost:8000`

### Opção 2: Via VS Code (Live Server)

1. Abra a pasta do projeto no Visual Studio Code;
2. Com a extensão **Live Server** instalada, clique com o botão direito em `index.html`;
3. Selecione a opção **"Open with Live Server"**.

---

## 🎓 Informações Acadêmicas

* **Curso:** Análise e Desenvolvimento de Sistemas (ADS)
* **Componente Curricular:** Projeto de Extensão Universitária II (PEX II)
* **Aluna:** Geyce Kamila
* **Beneficiária:** LaPizzaNatal (Zona Norte de Natal/RN)
