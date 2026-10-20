// js/configurador.js — Interface do Modal e Configurador de Pizza da LaPizzaNatal (PEX II)
import { CARDAPIO } from '../data/cardapio.js';
import { 
  obterTodasPizzas, 
  buscarPizzaPorId, 
  buscarBordaPorId, 
  calcularTotalConfiguracao, 
  validarConfiguracao,
  obterPrecoPizza
} from './regras.js';
import { adicionarAoCarrinho } from './carrinho.js';
import { formatarMoeda } from './utils.js';

/**
 * Estado atual da pizza sendo configurada no modal
 */
let configAtual = {
  sabor1: null,
  sabor2: null,
  tamanho: 'G',
  borda: null
};

// Referências aos elementos do DOM do modal
let modalEl = null;
let backdropEl = null;
let fecharBtnEl = null;
let nomePizzaEl = null;
let ingredientesEl = null;
let tamanhoBtnsContainerEl = null;
let toggleMeioAMeioEl = null;
let wrapperSegundoSaborEl = null;
let selectSegundoSaborEl = null;
let bordasContainerEl = null;
let resumoNomeEl = null;
let resumoTamanhoEl = null;
let resumoBordaEl = null;
let resumoPrecoPizzaEl = null;
let resumoPrecoBordaEl = null;
let resumoTotalEl = null;
let btnAdicionarCarrinhoEl = null;
let toastEl = null;

/**
 * Exibe uma notificação temporária discreta
 * @param {string} mensagem 
 */
export function exibirToast(mensagem) {
  if (!toastEl) {
    toastEl = document.getElementById('toast-feedback');
  }
  if (!toastEl) return;

  toastEl.textContent = mensagem;
  toastEl.classList.add('visible');

  setTimeout(() => {
    toastEl.classList.remove('visible');
  }, 2500);
}

/**
 * Atualiza os valores do resumo e os preços nos botões em tempo real
 */
function atualizarInterfaceModal() {
  if (!configAtual.sabor1) return;

  const { sabor1, sabor2, tamanho, borda } = configAtual;

  // 1. Atualizar botões de tamanho com preços dinâmicos
  const tamanhos = ['P', 'M', 'G'];
  tamanhos.forEach(tam => {
    const btn = document.getElementById(`btn-tamanho-${tam}`);
    const precoEl = document.getElementById(`preco-tamanho-${tam}`);
    if (btn && precoEl) {
      // Se tiver sabor 2, calcula pela regra do sabor mais caro no tamanho correspondente
      const precoCalculado = sabor2 
        ? Math.max(obterPrecoPizza(sabor1, tam), obterPrecoPizza(sabor2, tam))
        : obterPrecoPizza(sabor1, tam);

      precoEl.textContent = formatarMoeda(precoCalculado);

      if (tam === tamanho) {
        btn.classList.add('selected');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.remove('selected');
        btn.setAttribute('aria-pressed', 'false');
      }
    }
  });

  // 2. Atualizar estado das bordas
  const radiosBorda = document.querySelectorAll('input[name="opcao-borda"]');
  radiosBorda.forEach(radio => {
    const idBorda = radio.value;
    const isSelected = (!borda && idBorda === 'sem-borda') || (borda && borda.id === idBorda);
    radio.checked = isSelected;
    const labelCard = radio.closest('.borda-option-label');
    if (labelCard) {
      if (isSelected) {
        labelCard.classList.add('selected');
      } else {
        labelCard.classList.remove('selected');
      }
    }
  });

  // 3. Calcular totais de acordo com as regras de negócio
  const calculo = calcularTotalConfiguracao(sabor1, sabor2, tamanho, borda);

  // 4. Atualizar resumo visual
  if (resumoNomeEl) {
    if (sabor2) {
      resumoNomeEl.innerHTML = `<span class="badge-meio-a-meio">MEIO A MEIO</span> <strong>${sabor1.nome}</strong> + <strong>${sabor2.nome}</strong>`;
    } else {
      resumoNomeEl.textContent = sabor1.nome;
    }
  }

  if (resumoTamanhoEl) {
    const textoTamanho = tamanho === 'P' ? 'Pequena (P)' : tamanho === 'M' ? 'Média (M)' : 'Grande (G)';
    resumoTamanhoEl.textContent = textoTamanho;
  }

  if (resumoBordaEl) {
    resumoBordaEl.textContent = borda ? borda.nome : 'Sem borda';
  }

  if (resumoPrecoPizzaEl) {
    resumoPrecoPizzaEl.textContent = formatarMoeda(calculo.precoPizza);
  }

  if (resumoPrecoBordaEl) {
    resumoPrecoBordaEl.textContent = calculo.precoBorda > 0 ? `+ ${formatarMoeda(calculo.precoBorda)}` : 'R$ 0,00';
  }

  if (resumoTotalEl) {
    resumoTotalEl.textContent = formatarMoeda(calculo.total);
  }
}

/**
 * Popula o select do segundo sabor com as 33 outras pizzas cadastradas
 */
function popularSelectSegundoSabor(saborPrincipalId) {
  if (!selectSegundoSaborEl) return;

  const todasPizzas = obterTodasPizzas();
  selectSegundoSaborEl.innerHTML = '';

  const optPadrao = document.createElement('option');
  optPadrao.value = '';
  optPadrao.textContent = '-- Escolha o segundo sabor --';
  selectSegundoSaborEl.appendChild(optPadrao);

  // Agrupamento por Salgadas e Doces
  const grupoSalgadas = document.createElement('optgroup');
  grupoSalgadas.label = 'Pizzas Salgadas';

  const grupoDoces = document.createElement('optgroup');
  grupoDoces.label = 'Pizzas Doces';

  todasPizzas.forEach(pizza => {
    // REGRA 9: Nunca permitir selecionar o mesmo sabor no sabor 2
    if (pizza.id === saborPrincipalId) return;

    const opt = document.createElement('option');
    opt.value = pizza.id;
    opt.textContent = `${pizza.nome}`;

    if (CARDAPIO.pizzasSalgadas.some(p => p.id === pizza.id)) {
      grupoSalgadas.appendChild(opt);
    } else {
      grupoDoces.appendChild(opt);
    }
  });

  selectSegundoSaborEl.appendChild(grupoSalgadas);
  selectSegundoSaborEl.appendChild(grupoDoces);
}

/**
 * Renderiza as opções de borda dentro do modal
 */
function renderizarOpcoesBordas() {
  if (!bordasContainerEl) return;

  let html = `
    <label class="borda-option-label selected">
      <input type="radio" name="opcao-borda" value="sem-borda" checked>
      <div class="borda-option-content">
        <span class="borda-option-name">Sem borda</span>
        <span class="borda-option-price">R$ 0,00</span>
      </div>
    </label>
  `;

  CARDAPIO.bordas.forEach(borda => {
    html += `
      <label class="borda-option-label">
        <input type="radio" name="opcao-borda" value="${borda.id}">
        <div class="borda-option-content">
          <span class="borda-option-name">${borda.nome}</span>
          <span class="borda-option-price">+ ${formatarMoeda(borda.preco)}</span>
        </div>
      </label>
    `;
  });

  bordasContainerEl.innerHTML = html;

  // Adicionar ouvintes para seleção única de borda
  const radios = bordasContainerEl.querySelectorAll('input[name="opcao-borda"]');
  radios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.value === 'sem-borda') {
        configAtual.borda = null;
      } else {
        configAtual.borda = buscarBordaPorId(radio.value);
      }
      atualizarInterfaceModal();
    });
  });
}

let elementoFocoAnteriorConfigurador = null;

/**
 * Verifica se um elemento pode receber foco com segurança fora do modal ocultado
 * @param {HTMLElement|null} el
 * @param {HTMLElement|null} modalRef
 * @returns {boolean}
 */
function podeReceberFocoForaDoModal(el, modalRef) {
  if (!el || typeof el.focus !== 'function') return false;
  if (typeof document === 'undefined' || !document.body || !document.body.contains(el)) return false;
  if (el === document.body || el === document.documentElement) return false;
  if (modalRef && modalRef.contains(el)) return false;

  if (typeof el.closest === 'function') {
    if (el.closest('[aria-hidden="true"]')) return false;
    const modalAncestral = el.closest('.modal-dialog');
    if (
      modalAncestral &&
      (modalAncestral === modalRef ||
        !modalAncestral.classList.contains('active') ||
        modalAncestral.getAttribute('aria-hidden') === 'true')
    ) {
      return false;
    }
  }

  let atual = el;
  while (atual && atual !== document.body && atual !== document.documentElement) {
    if (atual === modalRef) return false;
    if (typeof atual.getAttribute === 'function' && atual.getAttribute('aria-hidden') === 'true') {
      return false;
    }
    if (atual.classList && typeof atual.classList.contains === 'function' && atual.classList.contains('modal-dialog')) {
      if (!atual.classList.contains('active')) return false;
    }
    if (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function') {
      const estilo = window.getComputedStyle(atual);
      if (estilo.display === 'none' || estilo.visibility === 'hidden' || estilo.opacity === '0') {
        return false;
      }
    }
    atual = atual.parentElement || null;
  }

  return true;
}

/**
 * Abre o configurador para a pizza indicada
 * @param {string} pizzaId 
 * @param {string} [tamanhoInicial='G']
 */
export function abrirConfigurador(pizzaId, tamanhoInicial = 'G') {
  const pizza = buscarPizzaPorId(pizzaId);
  if (!pizza) {
    console.error(`Pizza não encontrada com id: ${pizzaId}`);
    return;
  }

  if (!modalEl) inicializarElementosModal();

  const cardAcionador = typeof document !== 'undefined'
    ? document.querySelector(`.clickable-pizza[data-id="${pizzaId}"]`)
    : null;
  const candidatoAtivo = typeof document !== 'undefined' ? document.activeElement : null;

  if (podeReceberFocoForaDoModal(cardAcionador, modalEl)) {
    elementoFocoAnteriorConfigurador = cardAcionador;
  } else if (podeReceberFocoForaDoModal(candidatoAtivo, modalEl)) {
    elementoFocoAnteriorConfigurador = candidatoAtivo;
  } else {
    elementoFocoAnteriorConfigurador = null;
  }

  // Validar tamanho inicial ('P', 'M' ou 'G', fallback 'G')
  const tamanhoValido = ['P', 'M', 'G'].includes(tamanhoInicial) ? tamanhoInicial : 'G';

  // Inicializar estado limpo com o tamanho selecionado
  configAtual = {
    sabor1: pizza,
    sabor2: null,
    tamanho: tamanhoValido,
    borda: null
  };

  // Preencher dados do sabor principal
  if (nomePizzaEl) nomePizzaEl.textContent = pizza.nome;
  if (ingredientesEl) ingredientesEl.textContent = pizza.ingredientes;

  // Resetar Meio a Meio
  if (toggleMeioAMeioEl) toggleMeioAMeioEl.checked = false;
  if (wrapperSegundoSaborEl) wrapperSegundoSaborEl.style.display = 'none';
  popularSelectSegundoSabor(pizza.id);

  // Renderizar opções de borda
  renderizarOpcoesBordas();

  // Atualizar tudo
  atualizarInterfaceModal();

  // Redefinir rolagem para o topo do corpo do modal
  const modalBodyEl = modalEl ? modalEl.querySelector('.modal-body') : null;
  if (modalBodyEl) {
    modalBodyEl.scrollTop = 0;
  }

  // Exibir modal
  modalEl.classList.add('active');
  if (backdropEl) backdropEl.classList.add('active');
  modalEl.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');

  // Foco no botão de fechar para acessibilidade
  if (fecharBtnEl) fecharBtnEl.focus();
}

/**
 * Fecha o configurador
 */
export function fecharConfigurador() {
  if (!modalEl) return;

  if (
    typeof document !== 'undefined' &&
    document.activeElement &&
    (modalEl.contains(document.activeElement) || document.activeElement === backdropEl)
  ) {
    if (typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
  }

  const cardPizzaAtual = (typeof document !== 'undefined' && configAtual.sabor1)
    ? document.querySelector(`.clickable-pizza[data-id="${configAtual.sabor1.id}"]`)
    : null;
  const fallbackCartBtn = typeof document !== 'undefined' ? document.getElementById('cart-indicator') : null;

  let destinoFoco = null;
  if (podeReceberFocoForaDoModal(cardPizzaAtual, modalEl)) {
    destinoFoco = cardPizzaAtual;
  } else if (podeReceberFocoForaDoModal(elementoFocoAnteriorConfigurador, modalEl)) {
    destinoFoco = elementoFocoAnteriorConfigurador;
  } else if (podeReceberFocoForaDoModal(fallbackCartBtn, modalEl)) {
    destinoFoco = fallbackCartBtn;
  }

  if (destinoFoco) {
    destinoFoco.focus({ preventScroll: true });
  }

  if (
    typeof document !== 'undefined' &&
    document.activeElement &&
    modalEl.contains(document.activeElement) &&
    typeof document.activeElement.blur === 'function'
  ) {
    document.activeElement.blur();
  }

  modalEl.classList.remove('active');
  if (backdropEl) backdropEl.classList.remove('active');
  modalEl.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

/**
 * Ação de adicionar ao carrinho
 */
function acaoAdicionarAoCarrinho() {
  const validacao = validarConfiguracao(configAtual);
  if (!validacao.valido) {
    alert(validacao.erro);
    return;
  }

  const { sabor1, sabor2, tamanho, borda } = configAtual;
  const calculo = calcularTotalConfiguracao(sabor1, sabor2, tamanho, borda);

  const itemAdicionado = adicionarAoCarrinho({
    sabor1,
    sabor2,
    tamanho,
    borda,
    precoPizza: calculo.precoPizza,
    precoBorda: calculo.precoBorda,
    total: calculo.total
  });

  fecharConfigurador();
  exibirToast(`🍕 ${itemAdicionado.nome} adicionada ao carrinho!`);
}

/**
 * Inicializa referências e ouvintes de evento do modal
 */
export function inicializarElementosModal() {
  modalEl = document.getElementById('modal-configurador');
  backdropEl = document.getElementById('modal-backdrop');
  fecharBtnEl = document.getElementById('btn-fechar-modal');
  nomePizzaEl = document.getElementById('modal-pizza-nome');
  ingredientesEl = document.getElementById('modal-pizza-ingredientes');
  tamanhoBtnsContainerEl = document.getElementById('modal-tamanhos-container');
  toggleMeioAMeioEl = document.getElementById('toggle-meio-a-meio');
  wrapperSegundoSaborEl = document.getElementById('wrapper-segundo-sabor');
  selectSegundoSaborEl = document.getElementById('select-segundo-sabor');
  bordasContainerEl = document.getElementById('modal-bordas-container');
  resumoNomeEl = document.getElementById('resumo-pizza-nome');
  resumoTamanhoEl = document.getElementById('resumo-pizza-tamanho');
  resumoBordaEl = document.getElementById('resumo-pizza-borda');
  resumoPrecoPizzaEl = document.getElementById('resumo-preco-pizza');
  resumoPrecoBordaEl = document.getElementById('resumo-preco-borda');
  resumoTotalEl = document.getElementById('resumo-total-valor');
  btnAdicionarCarrinhoEl = document.getElementById('btn-adicionar-carrinho');
  toastEl = document.getElementById('toast-feedback');

  if (!modalEl) return;

  // Ouvinte: Fechar modal
  if (fecharBtnEl) fecharBtnEl.addEventListener('click', fecharConfigurador);
  if (backdropEl) backdropEl.addEventListener('click', fecharConfigurador);
  if (modalEl) {
    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl) fecharConfigurador();
    });
  }

  // Ouvinte: Tecla ESC para acessibilidade
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalEl && modalEl.classList.contains('active')) {
      fecharConfigurador();
    }
  });

  // Ouvintes: Botões de tamanho P, M, G
  ['P', 'M', 'G'].forEach(tam => {
    const btn = document.getElementById(`btn-tamanho-${tam}`);
    if (btn) {
      btn.addEventListener('click', () => {
        configAtual.tamanho = tam;
        atualizarInterfaceModal();
      });
    }
  });

  // Ouvinte: Toggle de Meio a Meio
  if (toggleMeioAMeioEl) {
    toggleMeioAMeioEl.addEventListener('change', () => {
      const ativado = toggleMeioAMeioEl.checked;
      if (wrapperSegundoSaborEl) {
        wrapperSegundoSaborEl.style.display = ativado ? 'block' : 'none';
      }

      if (!ativado) {
        configAtual.sabor2 = null;
        if (selectSegundoSaborEl) selectSegundoSaborEl.value = '';
      } else {
        const segundoId = selectSegundoSaborEl ? selectSegundoSaborEl.value : '';
        configAtual.sabor2 = segundoId ? buscarPizzaPorId(segundoId) : null;
      }
      atualizarInterfaceModal();
    });
  }

  // Ouvinte: Seleção do Segundo Sabor
  if (selectSegundoSaborEl) {
    selectSegundoSaborEl.addEventListener('change', () => {
      const segundoId = selectSegundoSaborEl.value;
      if (segundoId) {
        // Garantir que não seja o mesmo sabor
        if (segundoId === configAtual.sabor1.id) {
          alert('Não é permitido escolher o mesmo sabor duas vezes.');
          selectSegundoSaborEl.value = '';
          configAtual.sabor2 = null;
        } else {
          configAtual.sabor2 = buscarPizzaPorId(segundoId);
        }
      } else {
        configAtual.sabor2 = null;
      }
      atualizarInterfaceModal();
    });
  }

  // Ouvinte: Adicionar ao Carrinho
  if (btnAdicionarCarrinhoEl) {
    btnAdicionarCarrinhoEl.addEventListener('click', acaoAdicionarAoCarrinho);
  }
}
