// js/pagamento.js — Regras e Geração de Pagamento da LaPizzaNatal (PEX II)
import { CONFIG } from './config.js';
import { gerarQrCodeSvg } from './qrcode.js';

/**
 * Calcula o checksum CRC16 CCITT padrão do Banco Central para o BR Code
 * @param {string} str 
 * @returns {string} 4 caracteres hexadecimais em maiúsculo
 */
function calcularCrc16(str) {
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
 * Gera o payload oficial do Pix Copia e Cola (BR Code) com valor dinâmico
 * @param {number} valor 
 * @param {string} numeroPedido 
 * @returns {string} Código Pix completo
 */
export function gerarPayloadPix(valor, numeroPedido = '***') {
  const chave = CONFIG.pagamento.pix.chave;
  const nome = normalizarTexto(CONFIG.pagamento.pix.nomeRecebedor).substring(0, 25);
  const cidade = normalizarTexto(CONFIG.pagamento.pix.cidade).substring(0, 15);
  const valorStr = Number(valor).toFixed(2);
  const txid = normalizarTexto(String(numeroPedido)).replace(/[^a-zA-Z0-9]/g, '') || '***';

  // Subcampos do Merchant Account Information (ID 26)
  const gui = formatarTlv('00', 'br.gov.bcb.pix');
  const campoChave = formatarTlv('01', chave);
  const conta = formatarTlv('26', gui + campoChave);

  // Campo adicional com identificador do pedido (ID 62)
  const campoTxid = formatarTlv('05', txid);
  const campoAdicional = formatarTlv('62', campoTxid);

  let payload = 
    formatarTlv('00', '01') + // Payload Format Indicator
    conta +                   // Merchant Account Information
    formatarTlv('52', '0000') + // Merchant Category Code
    formatarTlv('53', '986') +  // Moeda (986 = BRL)
    formatarTlv('54', valorStr) + // Valor da transação
    formatarTlv('58', 'BR') +   // País
    formatarTlv('59', nome) +   // Nome do recebedor
    formatarTlv('60', cidade) + // Cidade
    campoAdicional +            // Dados adicionais (txid)
    '6304';                     // Início do CRC16

  payload += calcularCrc16(payload);
  return payload;
}

/**
 * Retorna os dados completos para renderização do Pix na interface
 * @param {number} valorTotal 
 * @param {string} numeroPedido 
 * @returns {Object}
 */
export function obterDadosPix(valorTotal, numeroPedido) {
  const payload = gerarPayloadPix(valorTotal, numeroPedido);
  const qrCodeSvg = gerarQrCodeSvg(payload, 4, 1);

  return {
    chave: CONFIG.pagamento.pix.chave,
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
