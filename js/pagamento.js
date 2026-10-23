// js/pagamento.js — Regras e Geração de Pagamento da LaPizzaNatal (PEX II)
import { CONFIG } from './config.js';
import { gerarQrCodeSvg } from './qrcode.js';

/**
 * Calcula o checksum CRC16 CCITT padrão do Banco Central para o BR Code
 * @param {string} str
 * @returns {string} 4 caracteres hexadecimais em maiúsculo
 */
export function calcularCrc16(str) {
  let crc = 0xFFFF;
  for (let c = 0; c < str.length; c++) {
    crc ^= str.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Formata um campo no padrão TLV (Type - Length - Value)
 * @param {string} id 
 * @param {string} valor 
 * @returns {string}
 */
function formatarTlv(id, valor) {
  const tamanho = String(valor.length).padStart(2, '0');
  return `${id}${tamanho}${valor}`;
}

/**
 * Normaliza strings para caracteres ASCII (sem acentos) conforme exigido pela especificação EMV / Pix
 * @param {string} str 
 * @returns {string}
 */
function normalizarTexto(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

/**
 * Normaliza a chave Pix para o padrão internacional exigido pelo BACEN no BR Code.
 * Chaves de telefone celular no DICT devem ser formatadas conforme E.164 (+55...).
 * @param {string} chave
 * @returns {string}
 */
export function normalizarChavePix(chave) {
  const limpa = String(chave || '').trim();
  if (/^\d{10,11}$/.test(limpa)) {
    return `+55${limpa}`;
  }
  if (/^55\d{10,11}$/.test(limpa)) {
    return `+${limpa}`;
  }
  return limpa;
}

/**
 * Valida se um valor monetário para Pix é um número finito e estritamente positivo
 * @param {*} valor
 * @returns {boolean}
 */
export function validarValorPix(valor) {
  return typeof valor === 'number' && Number.isFinite(valor) && !isNaN(valor) && valor > 0;
}

/**
 * Gera o payload oficial do Pix Copia e Cola (BR Code estático) com valor e identificador.
 * Retorna null se o valor informado não for numérico, finito e estritamente positivo.
 * @param {number} valor
 * @param {string|number} numeroPedido
 * @returns {string|null} Código Pix completo ou null se inválido
 */
export function gerarPayloadPix(valor, numeroPedido = '***') {
  if (!validarValorPix(valor)) {
    return null;
  }

  const chave = normalizarChavePix(CONFIG.pagamento.pix.chave);
  const nome = normalizarTexto(CONFIG.pagamento.pix.nomeRecebedor).substring(0, 25);
  const cidade = normalizarTexto(CONFIG.pagamento.pix.cidade).substring(0, 15);
  const valorStr = valor.toFixed(2);
  const txidLimpo = normalizarTexto(String(numeroPedido)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 25);
  const txid = txidLimpo || '***';

  // Subcampos do Merchant Account Information (ID 26)
  const gui = formatarTlv('00', 'br.gov.bcb.pix');
  const campoChave = formatarTlv('01', chave);
  const conta = formatarTlv('26', gui + campoChave);

  // Campo adicional com identificador do pedido (ID 62)
  const campoTxid = formatarTlv('05', txid);
  const campoAdicional = formatarTlv('62', campoTxid);

  let payload = 
    formatarTlv('00', '01') +      // 000201: Payload Format Indicator
    formatarTlv('01', '11') +      // 010211: Point of Initiation Method (11 = QR Estático)
    conta +                        // 26...: Merchant Account Information
    formatarTlv('52', '0000') +    // 52040000: Merchant Category Code (0000)
    formatarTlv('53', '986') +     // 5303986: Moeda (986 = BRL)
    formatarTlv('54', valorStr) +  // 54...: Valor da transação (obrigatório pelo requisito)
    formatarTlv('58', 'BR') +      // 5802BR: País
    formatarTlv('59', nome) +      // 59...: Nome do recebedor
    formatarTlv('60', cidade) +    // 60...: Cidade
    campoAdicional +               // 62...: Dados adicionais (txid)
    '6304';                        // Início do CRC16

  payload += calcularCrc16(payload);
  return payload;
}

/**
 * Retorna os dados completos para renderização do Pix na interface
 * @param {number} valorTotal
 * @param {string|number} numeroPedido
 * @returns {Object}
 */
export function obterDadosPix(valorTotal, numeroPedido) {
  if (!validarValorPix(valorTotal)) {
    return {
      valido: false,
      erro: "Não foi possível gerar os dados do Pix. Revise o valor do pedido.",
      chave: CONFIG.pagamento.pix.chave,
      chaveFormatada: CONFIG.pagamento.pix.chaveFormatada || CONFIG.pagamento.pix.chave,
      nomeRecebedor: CONFIG.pagamento.pix.nomeRecebedor,
      cidade: CONFIG.pagamento.pix.cidade,
      valor: valorTotal,
      payload: null,
      qrCodeSvg: null
    };
  }

  const payload = gerarPayloadPix(valorTotal, numeroPedido);
  const qrCodeSvg = payload ? gerarQrCodeSvg(payload, 4, 1) : null;

  return {
    valido: true,
    chave: CONFIG.pagamento.pix.chave,
    chaveFormatada: CONFIG.pagamento.pix.chaveFormatada || CONFIG.pagamento.pix.chave,
    nomeRecebedor: CONFIG.pagamento.pix.nomeRecebedor,
    cidade: CONFIG.pagamento.pix.cidade,
    valor: valorTotal,
    payload,
    qrCodeSvg
  };
}

/**
 * Valida o valor pago em dinheiro e calcula o troco necessário
 * @param {number} totalPedido 
 * @param {number} valorRecebido 
 * @returns {{ valido: boolean, troco: number, erro?: string }}
 */
export function calcularTroco(totalPedido, valorRecebido) {
  if (typeof valorRecebido !== 'number' || isNaN(valorRecebido) || valorRecebido <= 0) {
    return {
      valido: false,
      troco: 0,
      erro: "Informe um valor numérico válido para o cálculo do troco."
    };
  }

  if (valorRecebido < totalPedido) {
    return {
      valido: false,
      troco: 0,
      erro: `O valor informado (R$ ${valorRecebido.toFixed(2).replace('.', ',')}) é menor que o total do pedido (R$ ${totalPedido.toFixed(2).replace('.', ',')}).`
    };
  }

  const troco = Number((valorRecebido - totalPedido).toFixed(2));
  return {
    valido: true,
    troco
  };
}

/**
 * Constrói o link oficial do WhatsApp com a mensagem específica para envio de comprovante Pix
 * @param {Object} param0 
 * @returns {string} Link do WhatsApp
 */
export function gerarLinkComprovantePix({ numeroPedido, nomeCliente, valorTotal }) {
  const valorFormatado = `R$ ${Number(valorTotal).toFixed(2).replace('.', ',')}`;
  const texto = 
`Olá, boa noite! 🍕

Realizei o pagamento via Pix referente ao pedido #${numeroPedido}.

👤 *Nome:* ${nomeCliente}
💰 *Valor:* ${valorFormatado}

Estou enviando o comprovante em seguida.`;

  return `https://api.whatsapp.com/send?phone=${CONFIG.empresa.whatsapp}&text=${encodeURIComponent(texto)}`;
}
