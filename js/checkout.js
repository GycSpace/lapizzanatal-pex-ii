// js/checkout.js — Fluxo de Carrinho, Checkout, Pagamento e Envio do Pedido (PEX II)
import { CONFIG } from './config.js';
import { 
  obterCarrinho, 
  obterQuantidadeItens, 
  obterTotalCarrinho, 
  alterarQuantidade, 
  removerItem, 
  limparCarrinho 
} from './carrinho.js';
import { formatarMoeda, converterValorTroco } from './utils.js';
import { obterDadosPix, calcularTroco, gerarLinkComprovantePix } from './pagamento.js';
import { exibirToast } from './configurador.js?v=3';

const STORAGE_PEDIDO_KEY = 'lapizza_numero_pedido';

/**
 * Gera um número incremental e único para o pedido
 * @returns {number}
 */
let contadorMemoria = 1041;

export function gerarProximoNumeroPedido() {
  let atual = contadorMemoria;
  if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
    const salvo = localStorage.getItem(STORAGE_PEDIDO_KEY);
    if (salvo && !isNaN(Number(salvo))) {
      atual = Math.max(atual, Number(salvo));
    }
  }
  const proximo = atual + 1;
  contadorMemoria = proximo;
  if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
    try {
      localStorage.setItem(STORAGE_PEDIDO_KEY, String(proximo));
    } catch (e) {
      // ignora se localstorage indisponível
    }
  }
  return proximo;
}

/**
 * Estado temporário do checkout
 */
let estadoCheckout = {
  etapa: 'carrinho', // 'carrinho' | 'dados' | 'sucesso'
  tipoRecebimento: 'entrega', // 'entrega' | 'retirada'
  formaPagamento: '', // 'pix' | 'dinheiro' | 'cartao'
  precisaTroco: false,
  valorTrocoPara: 0,
  pedidoConfirmado: null
};

// Referências aos elementos do DOM
let modalCarrinhoEl = null;
let backdropCarrinhoEl = null;
let containerItensEl = null;
let viewCarrinhoVazioEl = null;
let viewCarrinhoComItensEl = null;
let subtotalValorEl = null;
let totalValorEl = null;

let secaoDadosEl = null;
let secaoCarrinhoEl = null;
let secaoSucessoEl = null;

let inputNomeEl = null;
let inputRuaEl = null;
let inputNumeroEl = null;
let inputComplementoEl = null;
let inputBairroEl = null;
let inputReferenciaEl = null;
let checkZonaNorteEl = null;

let painelRecebimentoEntregaEl = null;
let painelRecebimentoRetiradaEl = null;
let retiradaEnderecoHorarioEl = null;

let labelPagamentoCartaoTituloEl = null;
let labelPagamentoCartaoDescEl = null;
let textoPerguntaTrocoEl = null;
let tituloPainelCartaoEl = null;
let descPainelCartaoEl = null;

let painelPixEl = null;
let painelDinheiroEl = null;
let painelCartaoEl = null;
let radioTrocoSimEl = null;
let radioTrocoNaoEl = null;
let wrapperTrocoValorEl = null;
let inputTrocoParaEl = null;
let resultadoTrocoEl = null;

let qrCodeContainerEl = null;
let chavePixTextoEl = null;
let btnCopiarChavePixEl = null;
let btnComprovantePixTopoEl = null;

let btnAvancarCheckoutEl = null;
let btnVoltarCarrinhoEl = null;
let btnConfirmarPedidoEl = null;

let elementoFocoAnteriorCarrinho = null;

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
 * Abre o modal do carrinho
 */
export function abrirCarrinho() {
  if (!modalCarrinhoEl) inicializarElementosCheckout();
  if (!modalCarrinhoEl) return;

  const candidatoAtivo = typeof document !== 'undefined' ? document.activeElement : null;
  if (podeReceberFocoForaDoModal(candidatoAtivo, modalCarrinhoEl)) {
    elementoFocoAnteriorCarrinho = candidatoAtivo;
  } else if (typeof document !== 'undefined') {
    elementoFocoAnteriorCarrinho = document.getElementById('cart-indicator');
  }

  estadoCheckout.etapa = 'carrinho';
  atualizarVisualizacaoCarrinho();

  modalCarrinhoEl.classList.add('active');
  modalCarrinhoEl.setAttribute('aria-hidden', 'false');
  if (backdropCarrinhoEl) backdropCarrinhoEl.classList.add('active');
  document.body.classList.add('modal-open');

  const cartScroll = modalCarrinhoEl.querySelector('.carrinho-scroll-area');
  if (cartScroll) cartScroll.scrollTop = 0;
  const modalContent = modalCarrinhoEl.querySelector('.modal-content');
  if (modalContent) modalContent.scrollTop = 0;
}

/**
 * Fecha o modal do carrinho
 */
export function fecharCarrinho() {
  if (!modalCarrinhoEl) return;

  if (
    typeof document !== 'undefined' &&
    document.activeElement &&
    (modalCarrinhoEl.contains(document.activeElement) || document.activeElement === backdropCarrinhoEl)
  ) {
    if (typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
  }

  const cartBtn = typeof document !== 'undefined' ? document.getElementById('cart-indicator') : null;
  let destinoFoco = null;
  if (podeReceberFocoForaDoModal(cartBtn, modalCarrinhoEl)) {
    destinoFoco = cartBtn;
  } else if (podeReceberFocoForaDoModal(elementoFocoAnteriorCarrinho, modalCarrinhoEl)) {
    destinoFoco = elementoFocoAnteriorCarrinho;
  }

  if (destinoFoco) {
    destinoFoco.focus({ preventScroll: true });
  }

  if (
    typeof document !== 'undefined' &&
    document.activeElement &&
    modalCarrinhoEl.contains(document.activeElement) &&
    typeof document.activeElement.blur === 'function'
  ) {
    document.activeElement.blur();
  }

  modalCarrinhoEl.classList.remove('active');
  modalCarrinhoEl.setAttribute('aria-hidden', 'true');
  if (backdropCarrinhoEl) backdropCarrinhoEl.classList.remove('active');
  document.body.classList.remove('modal-open');
}

/**
 * Renderiza a lista de itens no carrinho e recalcula totais
 */
export function atualizarVisualizacaoCarrinho() {
  const itens = obterCarrinho();
  const total = obterTotalCarrinho();

  if (secaoCarrinhoEl && secaoDadosEl && secaoSucessoEl) {
    if (estadoCheckout.etapa === 'carrinho') {
      secaoCarrinhoEl.style.display = 'flex';
      secaoDadosEl.style.display = 'none';
      secaoSucessoEl.style.display = 'none';
    } else if (estadoCheckout.etapa === 'dados') {
      secaoCarrinhoEl.style.display = 'none';
      secaoDadosEl.style.display = 'flex';
      secaoSucessoEl.style.display = 'none';
    } else if (estadoCheckout.etapa === 'sucesso') {
      secaoCarrinhoEl.style.display = 'none';
      secaoDadosEl.style.display = 'none';
      secaoSucessoEl.style.display = 'flex';
    }
  }

  if (itens.length === 0) {
    if (viewCarrinhoVazioEl) viewCarrinhoVazioEl.style.display = 'flex';
    if (viewCarrinhoComItensEl) viewCarrinhoComItensEl.style.display = 'none';
    return;
  }

  if (viewCarrinhoVazioEl) viewCarrinhoVazioEl.style.display = 'none';
  if (viewCarrinhoComItensEl) viewCarrinhoComItensEl.style.display = 'flex';

  // Renderizar itens
  if (containerItensEl) {
    containerItensEl.innerHTML = itens.map(item => {
      const isBebida = item.tipo === 'bebida';
      return `
      <div class="cart-item-card" data-id="${item.id}">
        <div class="cart-item-info">
          <div class="cart-item-header">
            <h4 class="cart-item-title">${item.nome}</h4>
            ${item.isMeioAMeio ? '<span class="badge-meio-a-meio">Meio a Meio</span>' : ''}
            ${isBebida ? '<span class="badge-bebida">Bebida 1L</span>' : ''}
          </div>
          ${isBebida ? `
            <p class="cart-item-specs">
              Refrigerante 1L &bull; Unitário: <strong>${formatarMoeda(item.precoUnitario)}</strong>
            </p>
          ` : `
            <p class="cart-item-specs">
              Tamanho: <strong>${item.tamanho}</strong> &bull; Borda: <strong>${item.borda ? item.borda.nome : 'Sem borda'}</strong>
            </p>
            <p class="cart-item-breakdown">
              Pizza: ${formatarMoeda(item.precoPizza)} ${item.precoBorda > 0 ? `+ Borda: ${formatarMoeda(item.precoBorda)}` : ''} 
              &bull; Unitário: <strong>${formatarMoeda(item.precoUnitario)}</strong>
            </p>
          `}
        </div>

        <div class="cart-item-actions">
          <div class="qty-control">
            <button type="button" class="btn-qty btn-qty-minus" data-action="minus" aria-label="Diminuir quantidade">&minus;</button>
            <span class="qty-value">${item.quantidade}</span>
            <button type="button" class="btn-qty btn-qty-plus" data-action="plus" aria-label="Aumentar quantidade">&plus;</button>
          </div>
          <div class="cart-item-subtotal-wrap">
            <span class="cart-item-subtotal">${formatarMoeda(item.total)}</span>
            <button type="button" class="btn-remove-item" data-action="remove" title="Excluir item">Remover</button>
          </div>
        </div>
      </div>
    `;
    }).join('');

    // Eventos nos botões de cada item
    containerItensEl.querySelectorAll('.btn-qty').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const itemCard = e.target.closest('.cart-item-card');
        const id = itemCard.getAttribute('data-id');
        const action = btn.getAttribute('data-action');
        alterarQuantidade(id, action === 'plus' ? 1 : -1);
        atualizarVisualizacaoCarrinho();
      });
    });

    containerItensEl.querySelectorAll('.btn-remove-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const itemCard = e.target.closest('.cart-item-card');
        const id = itemCard.getAttribute('data-id');
        removerItem(id);
        atualizarVisualizacaoCarrinho();
      });
    });
  }

  if (subtotalValorEl) subtotalValorEl.textContent = formatarMoeda(total);
  if (totalValorEl) totalValorEl.textContent = formatarMoeda(total);

  // Atualizar painéis de pagamento se estiver com Pix ou Dinheiro ativo
  atualizarPaineisPagamento();
}

/**
 * Atualiza o painel de recebimento e pagamento de acordo com a seleção atual
 */
function atualizarPaineisPagamento() {
  const total = obterTotalCarrinho();
  const isRetirada = estadoCheckout.tipoRecebimento === 'retirada';

  if (painelRecebimentoEntregaEl) {
    painelRecebimentoEntregaEl.style.display = isRetirada ? 'none' : '';
  }
  if (painelRecebimentoRetiradaEl) {
    painelRecebimentoRetiradaEl.style.display = isRetirada ? 'block' : 'none';
  }
  if (retiradaEnderecoHorarioEl) {
    retiradaEnderecoHorarioEl.textContent = `${CONFIG.empresa.endereco} • ${CONFIG.empresa.horario}`;
  }

  if (labelPagamentoCartaoTituloEl) {
    labelPagamentoCartaoTituloEl.textContent = isRetirada ? 'Cartão na retirada' : 'Cartão na entrega';
  }
  if (labelPagamentoCartaoDescEl) {
    labelPagamentoCartaoDescEl.textContent = isRetirada ? 'Pagamento no balcão' : 'Levamos a maquininha';
  }
  if (textoPerguntaTrocoEl) {
    textoPerguntaTrocoEl.textContent = isRetirada
      ? 'Pagamento em espécie na retirada. Você vai precisar de troco?'
      : 'Pagamento em espécie no ato da entrega. Você vai precisar de troco?';
  }
  if (tituloPainelCartaoEl) {
    tituloPainelCartaoEl.textContent = isRetirada
      ? '💳 Pagamento no Cartão (Crédito ou Débito) na Retirada'
      : '💳 Pagamento no Cartão (Crédito ou Débito) na Entrega';
  }
  if (descPainelCartaoEl) {
    descPainelCartaoEl.textContent = isRetirada
      ? 'Você poderá realizar o pagamento diretamente no balcão ao retirar o seu pedido. Aceitamos as principais bandeiras de crédito e débito.'
      : 'Nosso entregador levará a maquininha até o seu endereço. Aceitamos as principais bandeiras de crédito e débito.';
  }

  if (painelPixEl) painelPixEl.style.display = estadoCheckout.formaPagamento === 'pix' ? 'block' : 'none';
  if (painelDinheiroEl) painelDinheiroEl.style.display = estadoCheckout.formaPagamento === 'dinheiro' ? 'block' : 'none';
  if (painelCartaoEl) painelCartaoEl.style.display = estadoCheckout.formaPagamento === 'cartao' ? 'block' : 'none';

  if (estadoCheckout.formaPagamento === 'pix') {
    const dadosPix = obterDadosPix(total, 'PEDIDO');
    if (qrCodeContainerEl) {
      qrCodeContainerEl.innerHTML = dadosPix.qrCodeSvg;
    }
    if (chavePixTextoEl) {
      chavePixTextoEl.textContent = dadosPix.chave;
    }
  }

  if (estadoCheckout.formaPagamento === 'dinheiro') {
    if (inputTrocoParaEl && resultadoTrocoEl) {
      const textoTroco = inputTrocoParaEl.value.trim();
      if (estadoCheckout.precisaTroco && textoTroco !== '') {
        const valorInformado = converterValorTroco(inputTrocoParaEl.value);
        const res = calcularTroco(total, valorInformado);
        if (res.valido) {
          resultadoTrocoEl.className = 'troco-feedback troco-valido';
          resultadoTrocoEl.textContent = `Troco solicitado: ${formatarMoeda(res.troco)}`;
        } else {
          resultadoTrocoEl.className = 'troco-feedback troco-invalido';
          resultadoTrocoEl.textContent = res.erro;
        }
      } else {
        resultadoTrocoEl.textContent = '';
      }
    }
  }
}

/**
 * Valida os dados informados no formulário de checkout
 * @returns {{ valido: boolean, erro?: string }}
 */
export function validarDadosCheckout() {
  const itens = obterCarrinho();
  if (itens.length === 0) {
    return { valido: false, erro: "O carrinho está vazio. Adicione pelo menos uma pizza para continuar." };
  }

  const nome = inputNomeEl ? inputNomeEl.value.trim() : '';
  if (!nome) {
    return { valido: false, erro: "Por favor, informe o seu nome." };
  }

  const isRetirada = estadoCheckout.tipoRecebimento === 'retirada';

  if (!isRetirada) {
    const rua = inputRuaEl ? inputRuaEl.value.trim() : '';
    if (!rua) {
      return { valido: false, erro: "Por favor, informe a Rua/Avenida de entrega." };
    }

    const numero = inputNumeroEl ? inputNumeroEl.value.trim() : '';
    if (!numero) {
      return { valido: false, erro: "Por favor, informe o número da residência." };
    }

    const bairro = inputBairroEl ? inputBairroEl.value.trim() : '';
    if (!bairro) {
      return { valido: false, erro: "Por favor, informe o bairro de entrega." };
    }

    if (!checkZonaNorteEl || !checkZonaNorteEl.checked) {
      return {
        valido: false,
        erro: "É necessário confirmar que o endereço informado está localizado na Zona Norte de Natal/RN."
      };
    }
  }

  if (!estadoCheckout.formaPagamento) {
    return {
      valido: false,
      erro: isRetirada
        ? "Por favor, selecione uma forma de pagamento (Pix, Dinheiro ou Cartão na retirada)."
        : "Por favor, selecione uma forma de pagamento (Pix, Dinheiro ou Cartão na entrega)."
    };
  }

  if (estadoCheckout.formaPagamento === 'dinheiro' && estadoCheckout.precisaTroco) {
    const total = obterTotalCarrinho();
    const valorDigitado = inputTrocoParaEl ? converterValorTroco(inputTrocoParaEl.value) : NaN;
    const resTroco = calcularTroco(total, valorDigitado);
    if (!resTroco.valido) {
      return { valido: false, erro: resTroco.erro };
    }
  }

  return { valido: true };
}

/**
 * Constrói a mensagem estruturada para envio oficial via WhatsApp
 * @param {Object} pedido
 * @returns {string} Texto formatado
 */
export function montarMensagemPedidoWhatsapp(pedido) {
  const isRetirada = pedido.tipoRecebimento === 'retirada';
  let texto = `Olá, boa noite! 🍕\n\n`;
  texto += `*NOVO PEDIDO #${pedido.numero}*\n\n`;

  texto += `👤 *Cliente:*\n${pedido.nome}\n\n`;

  if (isRetirada) {
    texto += `🏪 *RETIRADA NO BALCÃO*\n`;
    texto += `Endereço: ${CONFIG.empresa.endereco}\n`;
    texto += `Horário: ${CONFIG.empresa.horario}\n\n`;
  } else {
    texto += `📍 *ENTREGA*\n`;
    texto += `Rua: ${pedido.rua}\n`;
    texto += `Número: ${pedido.numeroEnd}\n`;
    if (pedido.complemento) texto += `Complemento: ${pedido.complemento}\n`;
    texto += `Bairro: ${pedido.bairro}\n`;
    if (pedido.referencia) texto += `Referência: ${pedido.referencia}\n`;
    texto += `(Zona Norte de Natal/RN)\n\n`;
  }

  texto += `🛒 *PEDIDO*\n`;
  pedido.itens.forEach(item => {
    texto += `${item.quantidade}x ${item.nome}\n`;
    if (item.tipo !== 'bebida') {
      if (item.isMeioAMeio) texto += `Meio a Meio\n`;
      texto += `Tamanho: ${item.tamanho}\n`;
      texto += `Borda: ${item.borda ? item.borda.nome : 'Sem borda'}\n`;
    }
    texto += `Subtotal do item: ${formatarMoeda(item.total)}\n\n`;
  });

  texto += `💰 *PAGAMENTO*\n`;
  if (pedido.formaPagamento === 'pix') {
    texto += `Forma: Pix\n`;
    texto += `Pagamento informado pelo cliente.\n`;
    texto += `Comprovante será enviado pelo WhatsApp.\n\n`;
  } else if (pedido.formaPagamento === 'dinheiro') {
    texto += `Forma: Dinheiro\n`;
    if (pedido.precisaTroco) {
      texto += `Troco para: ${formatarMoeda(pedido.valorTrocoPara)}\n`;
      texto += `Troco estimado: ${formatarMoeda(pedido.trocoEstimado)}\n\n`;
    } else {
      texto += `Não precisa de troco.\n\n`;
    }
  } else if (pedido.formaPagamento === 'cartao') {
    texto += `Forma: ${isRetirada ? 'Cartão na retirada' : 'Cartão na entrega'}\n\n`;
  }

  texto += `Subtotal: ${formatarMoeda(pedido.total)}\n`;
  if (!isRetirada) {
    texto += `Taxa de entrega: R$ 0,00\n`;
  }
  texto += `*TOTAL: ${formatarMoeda(pedido.total)}*`;

  return texto;
}

/**
 * Constrói o link do WhatsApp para o pedido completo
 * @param {Object} pedido
 * @returns {string} URL
 */
export function gerarLinkPedidoWhatsapp(pedido) {
  const mensagem = montarMensagemPedidoWhatsapp(pedido);
  return `https://api.whatsapp.com/send?phone=${CONFIG.empresa.whatsapp}&text=${encodeURIComponent(mensagem)}`;
}

/**
 * Finaliza o pedido e exibe a tela de confirmação
 */
function finalizarPedido() {
  const validacao = validarDadosCheckout();
  if (!validacao.valido) {
    alert(validacao.erro);
    return;
  }

  const itens = obterCarrinho();
  const total = obterTotalCarrinho();
  const numeroPedido = gerarProximoNumeroPedido();

  let valorTrocoConvertido = 0;
  let trocoEstimado = 0;
  if (estadoCheckout.formaPagamento === 'dinheiro' && estadoCheckout.precisaTroco) {
    valorTrocoConvertido = inputTrocoParaEl ? converterValorTroco(inputTrocoParaEl.value) : NaN;
    const resTroco = calcularTroco(total, valorTrocoConvertido);
    if (!resTroco.valido) {
      alert(resTroco.erro);
      return;
    }
    trocoEstimado = resTroco.troco;
  }

  const isRetirada = estadoCheckout.tipoRecebimento === 'retirada';

  // Criação do objeto do pedido estruturado
  const pedido = {
    numero: numeroPedido,
    dataHora: new Date().toISOString(),
    tipoRecebimento: isRetirada ? 'retirada' : 'entrega',
    nome: inputNomeEl.value.trim(),
    rua: isRetirada ? '' : inputRuaEl.value.trim(),
    numeroEnd: isRetirada ? '' : inputNumeroEl.value.trim(),
    complemento: isRetirada ? '' : (inputComplementoEl ? inputComplementoEl.value.trim() : ''),
    bairro: isRetirada ? '' : inputBairroEl.value.trim(),
    referencia: isRetirada ? '' : (inputReferenciaEl ? inputReferenciaEl.value.trim() : ''),
    itens: [...itens],
    total: total,
    formaPagamento: estadoCheckout.formaPagamento,
    precisaTroco: estadoCheckout.precisaTroco,
    valorTrocoPara: estadoCheckout.formaPagamento === 'dinheiro' && estadoCheckout.precisaTroco ? valorTrocoConvertido : 0,
    trocoEstimado: trocoEstimado
  };

  estadoCheckout.pedidoConfirmado = pedido;
  estadoCheckout.etapa = 'sucesso';

  // Renderizar dados da tela de sucesso
  const numDisplayEl = document.getElementById('sucesso-numero-pedido');
  const btnWhatsappPedidoEl = document.getElementById('btn-whatsapp-pedido');
  const btnWhatsappComprovanteEl = document.getElementById('btn-whatsapp-comprovante');

  if (numDisplayEl) numDisplayEl.textContent = `#${pedido.numero}`;

  if (btnWhatsappPedidoEl) {
    const linkPedido = gerarLinkPedidoWhatsapp(pedido);
    btnWhatsappPedidoEl.onclick = () => {
      window.open(linkPedido, '_blank');
      // Limpar carrinho apenas após o cliente acionar o envio
      limparCarrinho();
    };
  }

  if (btnWhatsappComprovanteEl) {
    if (pedido.formaPagamento === 'pix') {
      btnWhatsappComprovanteEl.style.display = 'inline-flex';
      const linkComprovante = gerarLinkComprovantePix({
        numeroPedido: pedido.numero,
        nomeCliente: pedido.nome,
        valorTotal: pedido.total
      });
      btnWhatsappComprovanteEl.onclick = () => {
        window.open(linkComprovante, '_blank');
      };
    } else {
      btnWhatsappComprovanteEl.style.display = 'none';
    }
  }

  atualizarVisualizacaoCarrinho();
}

/**
 * Inicializa referências aos elementos e ouvintes do checkout
 */
export function inicializarElementosCheckout() {
  modalCarrinhoEl = document.getElementById('modal-carrinho');
  backdropCarrinhoEl = document.getElementById('modal-carrinho-backdrop');
  containerItensEl = document.getElementById('carrinho-itens-lista');
  viewCarrinhoVazioEl = document.getElementById('carrinho-vazio-view');
  viewCarrinhoComItensEl = document.getElementById('carrinho-com-itens-view');
  subtotalValorEl = document.getElementById('carrinho-subtotal-valor');
  totalValorEl = document.getElementById('carrinho-total-valor');

  secaoCarrinhoEl = document.getElementById('checkout-etapa-carrinho');
  secaoDadosEl = document.getElementById('checkout-etapa-dados');
  secaoSucessoEl = document.getElementById('checkout-etapa-sucesso');

  inputNomeEl = document.getElementById('checkout-nome');
  inputRuaEl = document.getElementById('checkout-rua');
  inputNumeroEl = document.getElementById('checkout-numero');
  inputComplementoEl = document.getElementById('checkout-complemento');
  inputBairroEl = document.getElementById('checkout-bairro');
  inputReferenciaEl = document.getElementById('checkout-referencia');
  checkZonaNorteEl = document.getElementById('checkout-confirma-zona-norte');

  painelRecebimentoEntregaEl = document.getElementById('painel-recebimento-entrega');
  painelRecebimentoRetiradaEl = document.getElementById('painel-recebimento-retirada');
  retiradaEnderecoHorarioEl = document.getElementById('retirada-endereco-horario');

  labelPagamentoCartaoTituloEl = document.getElementById('label-pagamento-cartao-titulo');
  labelPagamentoCartaoDescEl = document.getElementById('label-pagamento-cartao-desc');
  textoPerguntaTrocoEl = document.getElementById('texto-pergunta-troco');
  tituloPainelCartaoEl = document.getElementById('titulo-painel-cartao');
  descPainelCartaoEl = document.getElementById('desc-painel-cartao');

  painelPixEl = document.getElementById('painel-pagamento-pix');
  painelDinheiroEl = document.getElementById('painel-pagamento-dinheiro');
  painelCartaoEl = document.getElementById('painel-pagamento-cartao');
  radioTrocoSimEl = document.getElementById('troco-sim');
  radioTrocoNaoEl = document.getElementById('troco-nao');
  wrapperTrocoValorEl = document.getElementById('wrapper-troco-valor');
  inputTrocoParaEl = document.getElementById('input-troco-para');
  resultadoTrocoEl = document.getElementById('resultado-troco-calculo');

  qrCodeContainerEl = document.getElementById('pix-qrcode-container');
  chavePixTextoEl = document.getElementById('pix-chave-texto');
  btnCopiarChavePixEl = document.getElementById('btn-copiar-chave-pix');
  btnComprovantePixTopoEl = document.getElementById('btn-enviar-comprovante-topo');

  btnAvancarCheckoutEl = document.getElementById('btn-avancar-checkout');
  btnVoltarCarrinhoEl = document.getElementById('btn-voltar-para-carrinho');
  btnConfirmarPedidoEl = document.getElementById('btn-confirmar-pedido');

  const btnFecharModalEl = document.getElementById('btn-fechar-carrinho');
  const btnContinuarComprandoVazioEl = document.getElementById('btn-continuar-comprando-vazio');
  const btnSucessoVoltarCardapioEl = document.getElementById('btn-sucesso-voltar-cardapio');

  if (btnFecharModalEl) btnFecharModalEl.addEventListener('click', fecharCarrinho);
  if (backdropCarrinhoEl) backdropCarrinhoEl.addEventListener('click', fecharCarrinho);
  if (modalCarrinhoEl) {
    modalCarrinhoEl.addEventListener('click', (e) => {
      if (e.target === modalCarrinhoEl) fecharCarrinho();
    });
  }
  if (btnContinuarComprandoVazioEl) btnContinuarComprandoVazioEl.addEventListener('click', fecharCarrinho);
  if (btnSucessoVoltarCardapioEl) {
    btnSucessoVoltarCardapioEl.addEventListener('click', () => {
      limparCarrinho();
      fecharCarrinho();
    });
  }

  // Avançar para a tela de identificação / endereço
  if (btnAvancarCheckoutEl) {
    btnAvancarCheckoutEl.addEventListener('click', () => {
      const itens = obterCarrinho();
      if (itens.length === 0) {
        alert("O carrinho está vazio.");
        return;
      }
      estadoCheckout.etapa = 'dados';
      atualizarVisualizacaoCarrinho();
      const formScroll = document.querySelector('.checkout-form-scroll-area');
      if (formScroll) formScroll.scrollTop = 0;
      const modalContent = modalCarrinhoEl ? modalCarrinhoEl.querySelector('.modal-content') : null;
      if (modalContent) modalContent.scrollTop = 0;
    });
  }

  // Voltar para a lista do carrinho
  if (btnVoltarCarrinhoEl) {
    btnVoltarCarrinhoEl.addEventListener('click', () => {
      estadoCheckout.etapa = 'carrinho';
      atualizarVisualizacaoCarrinho();
      const cartScroll = document.querySelector('.carrinho-scroll-area');
      if (cartScroll) cartScroll.scrollTop = 0;
      const modalContent = modalCarrinhoEl ? modalCarrinhoEl.querySelector('.modal-content') : null;
      if (modalContent) modalContent.scrollTop = 0;
    });
  }

  // Radios de modalidade de recebimento (entrega / retirada)
  const radiosRecebimento = document.querySelectorAll('input[name="tipo-recebimento"]');
  radiosRecebimento.forEach(radio => {
    if (radio.checked) {
      estadoCheckout.tipoRecebimento = radio.value;
    }
    radio.addEventListener('change', () => {
      if (radio.checked) {
        estadoCheckout.tipoRecebimento = radio.value;
        atualizarPaineisPagamento();
      }
    });
  });

  // Radios de forma de pagamento
  const radiosPagamento = document.querySelectorAll('input[name="forma-pagamento"]');
  radiosPagamento.forEach(radio => {
    radio.addEventListener('change', () => {
      estadoCheckout.formaPagamento = radio.value;
      atualizarPaineisPagamento();
    });
  });

  // Radios de troco
  if (radioTrocoSimEl && radioTrocoNaoEl) {
    radioTrocoSimEl.addEventListener('change', () => {
      estadoCheckout.precisaTroco = true;
      if (wrapperTrocoValorEl) wrapperTrocoValorEl.style.display = 'block';
      atualizarPaineisPagamento();
    });
    radioTrocoNaoEl.addEventListener('change', () => {
      estadoCheckout.precisaTroco = false;
      if (wrapperTrocoValorEl) wrapperTrocoValorEl.style.display = 'none';
      if (inputTrocoParaEl) inputTrocoParaEl.value = '';
      atualizarPaineisPagamento();
    });
  }

  if (inputTrocoParaEl) {
    inputTrocoParaEl.addEventListener('input', () => {
      atualizarPaineisPagamento();
    });
  }

  // Botão copiar chave Pix
  if (btnCopiarChavePixEl) {
    btnCopiarChavePixEl.addEventListener('click', () => {
      const chave = CONFIG.pagamento.pix.chave;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(chave).then(() => {
          exibirToast("✅ Chave Pix copiada!");
        }).catch(() => {
          exibirToast(`Chave Pix: ${chave}`);
        });
      } else {
        exibirToast(`Chave Pix: ${chave}`);
      }
    });
  }

  // Botão enviar comprovante (no painel Pix)
  if (btnComprovantePixTopoEl) {
    btnComprovantePixTopoEl.addEventListener('click', () => {
      const total = obterTotalCarrinho();
      const nome = inputNomeEl ? inputNomeEl.value.trim() || 'Cliente' : 'Cliente';
      const link = gerarLinkComprovantePix({
        numeroPedido: 'PEDIDO',
        nomeCliente: nome,
        valorTotal: total
      });
      window.open(link, '_blank');
    });
  }

  // Botão confirmar pedido
  if (btnConfirmarPedidoEl) {
    btnConfirmarPedidoEl.addEventListener('click', finalizarPedido);
  }

  // Fechar com ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalCarrinhoEl && modalCarrinhoEl.classList.contains('active')) {
      fecharCarrinho();
    }
  });
}
