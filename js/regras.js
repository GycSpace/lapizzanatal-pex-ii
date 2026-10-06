// js/regras.js — Motor de Regras de Negócio e Cálculo da LaPizzaNatal (PEX II)
import { CARDAPIO } from '../data/cardapio.js';

/**
 * Retorna a lista completa com todas as 34 pizzas cadastradas
 * @returns {Array}
 */
export function obterTodasPizzas() {
  return [...CARDAPIO.pizzasSalgadas, ...CARDAPIO.pizzasDoces];
}

/**
 * Busca uma pizza pelo seu ID único
 * @param {string} id 
 * @returns {Object|null}
 */
export function buscarPizzaPorId(id) {
  if (!id) return null;
  return obterTodasPizzas().find(p => p.id === id) || null;
}

/**
 * Busca uma borda pelo seu ID único
 * @param {string} id 
 * @returns {Object|null}
 */
export function buscarBordaPorId(id) {
  if (!id) return null;
  return CARDAPIO.bordas.find(b => b.id === id) || null;
}

/**
 * REGRA 1: Obtém o preço exato de uma pizza para um tamanho específico
 * @param {Object} pizza 
 * @param {string} tamanho - "P", "M" ou "G"
 * @returns {number}
 */
export function obterPrecoPizza(pizza, tamanho) {
  if (!pizza || !pizza.precos || typeof pizza.precos[tamanho] !== 'number') {
    throw new Error(`Preço não encontrado para a pizza ${pizza ? pizza.nome : 'indefinida'} no tamanho ${tamanho}`);
  }
  return pizza.precos[tamanho];
}

/**
 * REGRA 2: Calcula o preço da pizza (1 sabor ou meio a meio)
 * REGRA OFICIAL MEIO A MEIO:
 * Quando a pizza for meio a meio, o preço será SEMPRE o preço do sabor MAIS CARO no tamanho escolhido.
 * Fórmula: preço = maior(preço do sabor 1, preço do sabor 2)
 * Nunca divide, nunca soma os sabores, nunca faz média.
 * 
 * @param {Object} sabor1 - Objeto da primeira pizza
 * @param {Object|null} sabor2 - Objeto da segunda pizza (opcional)
 * @param {string} tamanho - "P", "M" ou "G"
 * @returns {number}
 */
export function calcularPrecoMeioAMeio(sabor1, sabor2, tamanho) {
  if (!sabor1) {
    throw new Error("Pelo menos o primeiro sabor deve ser selecionado.");
  }

  const preco1 = obterPrecoPizza(sabor1, tamanho);

  // Pizza de um sabor só
  if (!sabor2) {
    return preco1;
  }

  // Pizza meio a meio (2 sabores): cobra o sabor mais caro no tamanho
  const preco2 = obterPrecoPizza(sabor2, tamanho);
  return Math.max(preco1, preco2);
}

/**
 * REGRA 3: Retorna o preço da borda selecionada (ou 0 se nenhuma borda)
 * Apenas UMA borda permitida por pizza.
 * @param {Object|null} borda 
 * @returns {number}
 */
export function calcularPrecoBorda(borda) {
  if (!borda || typeof borda.preco !== 'number') {
    return 0;
  }
  return borda.preco;
}

/**
 * REGRA 4: Calcula o valor total da configuração da pizza (Pizza + Borda)
 * Funciona tanto para pizza de 1 sabor quanto para pizza meio a meio.
 * 
 * @param {Object} sabor1
 * @param {Object|null} sabor2
 * @param {string} tamanho
 * @param {Object|null} borda
 * @returns {{ precoPizza: number, precoBorda: number, total: number }}
 */
export function calcularTotalConfiguracao(sabor1, sabor2, tamanho, borda) {
  const precoPizza = calcularPrecoMeioAMeio(sabor1, sabor2, tamanho);
  const precoBorda = calcularPrecoBorda(borda);
  const total = Number((precoPizza + precoBorda).toFixed(2));

  return {
    precoPizza,
    precoBorda,
    total
  };
}

/**
 * VALIDAÇÕES DE CONFIGURAÇÃO
 * Impede:
 * - tamanho vazio ou inválido;
 * - primeiro sabor vazio;
 * - segundo sabor igual ao primeiro;
 * - mais de dois sabores;
 * - mais de uma borda.
 * 
 * @param {Object} config
 * @returns {{ valido: boolean, erro?: string }}
 */
export function validarConfiguracao({ sabor1, sabor2, tamanho, borda }) {
  if (!tamanho || !["P", "M", "G"].includes(tamanho)) {
    return { valido: false, erro: "Selecione um tamanho válido (P, M ou G)." };
  }

  if (!sabor1 || !sabor1.id) {
    return { valido: false, erro: "O sabor principal da pizza é obrigatório." };
  }

  if (sabor2) {
    if (sabor2.id === sabor1.id) {
      return { valido: false, erro: "O segundo sabor não pode ser igual ao primeiro sabor." };
    }
  }

  return { valido: true };
}
