import { CARDAPIO } from '../data/cardapio.js';
import { formatarMoeda } from './utils.js';
import { abrirConfigurador, inicializarElementosModal, exibirToast } from './configurador.js?v=3';
import { observarCarrinho, obterQuantidadeItens, adicionarBebidaAoCarrinho } from './carrinho.js';
import { abrirCarrinho, inicializarElementosCheckout } from './checkout.js?v=3';

export { formatarMoeda };

/**
 * Renderiza uma lista de pizzas no elemento alvo e vincula o configurador
 * @param {Array} pizzas 
 * @param {HTMLElement} container 
 */
function renderizarPizzas(pizzas, container) {
  if (!container) return;

  container.innerHTML = pizzas.map(pizza => `
    <article class="pizza-card clickable-pizza" data-id="${pizza.id}" role="button" tabindex="0" title="Toque para personalizar a pizza ${pizza.nome}">
      <header class="pizza-header">
        <h3 class="pizza-name">${pizza.nome}</h3>
        <span class="pizza-badge-action">Personalizar 🍕</span>
      </header>
      <p class="pizza-ingredients">${pizza.ingredientes}</p>
      <div class="pizza-prices" aria-label="Preços por tamanho">
        <div class="price-pill" data-tamanho="P" title="Tamanho Pequeno">
          <span class="size-label">P</span>
          <span class="price-value">${formatarMoeda(pizza.precos.P)}</span>
        </div>
        <div class="price-pill" data-tamanho="M" title="Tamanho Médio">
          <span class="size-label">M</span>
          <span class="price-value">${formatarMoeda(pizza.precos.M)}</span>
        </div>
        <div class="price-pill" data-tamanho="G" title="Tamanho Grande">
          <span class="size-label">G</span>
          <span class="price-value">${formatarMoeda(pizza.precos.G)}</span>
        </div>
      </div>
    </article>
  `).join('');

  // Vincular eventos de clique e acessibilidade por teclado (Enter ou Espaço)
  const cards = container.querySelectorAll('.clickable-pizza');
  cards.forEach(card => {
    const id = card.getAttribute('data-id');
    card.addEventListener('click', (e) => {
      const pill = e.target.closest('.price-pill');
      const tamanho = pill ? pill.getAttribute('data-tamanho') : 'G';
      abrirConfigurador(id, tamanho);
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        abrirConfigurador(id, 'G');
      }
    });
  });
}

/**
 * Renderiza a lista de bordas no cardápio
 * @param {Array} bordas 
 * @param {HTMLElement} container 
 */
function renderizarBordas(bordas, container) {
  if (!container) return;

  container.innerHTML = bordas.map(borda => `
    <article class="simple-card" data-id="${borda.id}">
      <div class="simple-info">
        <span class="simple-badge">🧀 Borda</span>
        <h3 class="simple-name">${borda.nome}</h3>
      </div>
      <div class="simple-price-wrap">
        <span class="simple-price">${formatarMoeda(borda.preco)}</span>
      </div>
    </article>
  `).join('');
}

/**
 * Renderiza a lista de bebidas no cardápio com ação de adicionar ao carrinho
 * @param {Array} bebidas 
 * @param {HTMLElement} container 
 */
function renderizarBebidas(bebidas, container) {
  if (!container) return;

  container.innerHTML = bebidas.map(bebida => `
    <article class="simple-card simple-card-action" data-id="${bebida.id}">
      <div class="simple-info">
        <span class="simple-badge">🥤 Refrigerante 1L</span>
        <h3 class="simple-name">${bebida.nome}</h3>
      </div>
      <div class="simple-price-wrap">
        <span class="simple-price">${formatarMoeda(bebida.preco)}</span>
        <button type="button" class="btn-add-bebida" data-id="${bebida.id}" aria-label="Adicionar ${bebida.nome} ao carrinho">
          + Adicionar
        </button>
      </div>
    </article>
  `).join('');

  // Vincular eventos de clique para adicionar bebida ao carrinho
  const botoes = container.querySelectorAll('.btn-add-bebida');
  botoes.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const bebida = CARDAPIO.bebidas.find(b => b.id === id);
      if (bebida) {
        adicionarBebidaAoCarrinho(bebida);
        exibirToast(`🥤 ${bebida.nome} adicionada ao carrinho!`);
      }
    });
  });
}

/**
 * Configura o comportamento dos chips de navegação de categorias
 */
function configurarNavegacao() {
  const chips = document.querySelectorAll('.nav-chip');
  if (!chips.length) return;

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
    });
  });
}

/**
 * Conecta o indicador de carrinho com o estado observável e adiciona evento de clique
 */
function configurarIndicadorCarrinho() {
  const cartBtn = document.getElementById('cart-indicator');
  const countEl = document.getElementById('cart-count');

  if (cartBtn) {
    cartBtn.addEventListener('click', () => {
      abrirCarrinho();
    });
  }

  observarCarrinho(() => {
    if (countEl) {
      countEl.textContent = obterQuantidadeItens();
    }
  });
}

/**
 * Inicialização do cardápio digital e módulos da aplicação
 */
function iniciarCardapio() {
  // 1. Elementos do DOM
  const gridSalgadas = document.getElementById('grid-pizzas-salgadas');
  const gridDoces = document.getElementById('grid-pizzas-doces');
  const gridBordas = document.getElementById('grid-bordas');
  const gridBebidas = document.getElementById('grid-bebidas');

  // 2. Renderização dinâmica dos itens
  renderizarPizzas(CARDAPIO.pizzasSalgadas, gridSalgadas);
  renderizarPizzas(CARDAPIO.pizzasDoces, gridDoces);
  renderizarBordas(CARDAPIO.bordas, gridBordas);
  renderizarBebidas(CARDAPIO.bebidas, gridBebidas);

  // 3. Atualização dos contadores de seção
  const countSalgadas = document.getElementById('count-salgadas');
  const countDoces = document.getElementById('count-doces');
  const countBordas = document.getElementById('count-bordas');
  const countBebidas = document.getElementById('count-bebidas');

  if (countSalgadas) countSalgadas.textContent = `${CARDAPIO.pizzasSalgadas.length} sabores`;
  if (countDoces) countDoces.textContent = `${CARDAPIO.pizzasDoces.length} sabores`;
  if (countBordas) countBordas.textContent = `${CARDAPIO.bordas.length} opções`;
  if (countBebidas) countBebidas.textContent = `${CARDAPIO.bebidas.length} opções`;

  // 4. Inicializar modal do configurador, checkout e carrinho
  inicializarElementosModal();
  inicializarElementosCheckout();
  configurarIndicadorCarrinho();
  configurarNavegacao();

  // 5. Log de confirmação
  const totalPizzas = CARDAPIO.pizzasSalgadas.length + CARDAPIO.pizzasDoces.length;
  console.log('LaPizzaNatal PEX II — Etapa 5 ativa:');
  console.log(`- Cardápio: ${totalPizzas} pizzas, ${CARDAPIO.bordas.length} bordas, ${CARDAPIO.bebidas.length} bebidas`);
  console.log('- Configurador de Pizza ativo');
  console.log('- Carrinho completo com alteração de quantidade ativo');
  console.log('- Checkout, Pagamento (Pix com QR Code, Dinheiro com troco, Cartão) e WhatsApp ativos');
}

// Executar no navegador após carregamento do DOM
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarCardapio);
  } else {
    iniciarCardapio();
  }
}
