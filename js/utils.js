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
