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
import { formatarMoeda } from './app.js';
import { obterDadosPix, calcularTroco, gerarLinkComprovantePix } from './pagamento.js';
import { exibirToast } from './configurador.js';

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

/**
 * Abre o modal do carrinho
 */
export function abrirCarrinho() {
  if (!modalCarrinhoEl) inicializarElementosCheckout();
  if (!modalCarrinhoEl) return;

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
 * Atualiza o painel de pagamento de acordo com a seleção atual
 */
function atualizarPaineisPagamento() {
  const total = obterTotalCarrinho();

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
      const valorInformado = parseFloat(inputTrocoParaEl.value.replace(',', '.'));
      if (estadoCheckout.precisaTroco && !isNaN(valorInformado)) {
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

  if (!estadoCheckout.formaPagamento) {
    return { valido: false, erro: "Por favor, selecione uma forma de pagamento (Pix, Dinheiro ou Cartão na entrega)." };
  }

  if (estadoCheckout.formaPagamento === 'dinheiro' && estadoCheckout.precisaTroco) {
    const total = obterTotalCarrinho();
    const valorDigitado = inputTrocoParaEl ? parseFloat(inputTrocoParaEl.value.replace(',', '.')) : 0;
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
  let texto = `Olá, boa noite! 🍕\n\n`;
  texto += `*NOVO PEDIDO #${pedido.numero}*\n\n`;
  
  texto += `👤 *Cliente:*\n${pedido.nome}\n\n`;
  
  texto += `📍 *ENTREGA*\n`;
  texto += `Rua: ${pedido.rua}\n`;
  texto += `Número: ${pedido.numeroEnd}\n`;
  if (pedido.complemento) texto += `Complemento: ${pedido.complemento}\n`;
  texto += `Bairro: ${pedido.bairro}\n`;
  if (pedido.referencia) texto += `Referência: ${pedido.referencia}\n`;
  texto += `(Zona Norte de Natal/RN)\n\n`;

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
    texto += `Forma: Cartão na entrega\n\n`;
  }

  texto += `Subtotal: ${formatarMoeda(pedido.total)}\n`;
  texto += `Taxa de entrega: R$ 0,00\n`;
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
  return `https://wa.me/${CONFIG.empresa.whatsapp}?text=${encodeURIComponent(mensagem)}`;
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

  let trocoEstimado = 0;
  if (estadoCheckout.formaPagamento === 'dinheiro' && estadoCheckout.precisaTroco) {
    const valorDigitado = parseFloat(inputTrocoParaEl.value.replace(',', '.'));
    trocoEstimado = Number((valorDigitado - total).toFixed(2));
  }

  // Criação do objeto do pedido estruturado
  const pedido = {
    numero: numeroPedido,
    dataHora: new Date().toISOString(),
    nome: inputNomeEl.value.trim(),
    rua: inputRuaEl.value.trim(),
    numeroEnd: inputNumeroEl.value.trim(),
    complemento: inputComplementoEl ? inputComplementoEl.value.trim() : '',
    bairro: inputBairroEl.value.trim(),
    referencia: inputReferenciaEl ? inputReferenciaEl.value.trim() : '',
    itens: [...itens],
    total: total,
    formaPagamento: estadoCheckout.formaPagamento,
    precisaTroco: estadoCheckout.precisaTroco,
    valorTrocoPara: estadoCheckout.precisaTroco ? parseFloat(inputTrocoParaEl.value.replace(',', '.')) : 0,
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
