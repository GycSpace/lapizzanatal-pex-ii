// js/utils.js — Funções Utilitárias Centrais da LaPizzaNatal (PEX II)

/**
 * Formata um número no padrão monetário brasileiro (ex: R$ 36,90)
 * @param {number} valor
 * @returns {string}
 */
export function formatarMoeda(valor) {
  if (typeof valor !== 'number' || isNaN(valor)) {
    return 'R$ 0,00';
  }
  return `R$ ${valor.toFixed(2).replace('.', ',')}`;
}

/**
 * Converte estritamente o texto digitado no campo de troco em número.
 * Aceita apenas inteiros não negativos ou decimais com 1 ou 2 casas (ponto ou vírgula).
 * @param {string} valorBruto
 * @returns {number}
 */
export function converterValorTroco(valorBruto) {
  if (typeof valorBruto !== 'string') return NaN;
  const texto = valorBruto.trim();
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(texto)) {
    return NaN;
  }
  return Number(texto.replace(',', '.'));
}

/**
 * Copia um texto para a área de transferência com tratamento seguro e fallback
 * @param {string} texto
 * @returns {Promise<boolean>}
 */
export async function copiarParaAreaDeTransferencia(texto) {
  if (typeof texto !== 'string' || !texto) return false;

  // 1. Tentar Clipboard API moderna
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(texto);
      return true;
    } catch (e) {
      // Falha ou falta de permissão; prossegue para o fallback
    }
  }

  // 2. Fallback usando textarea temporário
  if (typeof document !== 'undefined') {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = texto;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.setAttribute('readonly', '');
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const copiado = document.execCommand('copy');
      document.body.removeChild(textArea);
      return Boolean(copiado);
    } catch (err) {
      return false;
    }
  }

  return false;
}
