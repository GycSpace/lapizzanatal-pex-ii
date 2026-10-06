// js/carrinho.js — Gerenciamento Completo do Estado do Carrinho da LaPizzaNatal (PEX II)

const STORAGE_KEY = 'lapizza_carrinho';

/**
 * Carrega o carrinho armazenado no localStorage de forma segura
 * @returns {Array<Object>}
 */
function carregarCarrinhoArmazenado() {
  if (typeof localStorage === 'undefined' || typeof localStorage.getItem !== 'function') return [];
  try {
    const salvo = localStorage.getItem(STORAGE_KEY);
    return salvo ? JSON.parse(salvo) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Salva o carrinho no localStorage
 */
function salvarCarrinho() {
  if (typeof localStorage === 'undefined' || typeof localStorage.setItem !== 'function') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(itensCarrinho));
  } catch (e) {
    // ignora em caso de cota excedida
  }
}

/**
 * Estado interno do carrinho
 * @type {Array<Object>}
 */
let itensCarrinho = carregarCarrinhoArmazenado();

/**
 * Callbacks de ouvintes para atualização de interface
 * @type {Array<Function>}
 */
const ouvintesCarrinho = [];

/**
 * Notifica todos os ouvintes registrados
 */
function notificar() {
  salvarCarrinho();
  const lista = obterCarrinho();
  ouvintesCarrinho.forEach(fn => {
    try {
      fn(lista);
    } catch (e) {
      console.error("Erro ao notificar ouvinte do carrinho:", e);
    }
  });
}

/**
 * Adiciona um item configurado ao carrinho
 * @param {Object} itemConfigurado
 * @returns {Object} O item adicionado com ID gerado
 */
export function adicionarAoCarrinho(itemConfigurado) {
  // Suporte a bebidas ou itens diretos
  if (itemConfigurado.tipo === 'bebida' || !itemConfigurado.sabor1) {
    const nomeFinal = itemConfigurado.nome || 'Bebida';
    const precoUnitario = Number((itemConfigurado.preco || itemConfigurado.precoUnitario || 0).toFixed(2));
    const quantidadeInicial = itemConfigurado.quantidade || 1;
    const subtotal = Number((precoUnitario * quantidadeInicial).toFixed(2));

    const item = {
      id: `item-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      tipo: 'bebida',
      nome: nomeFinal,
      precoUnitario: precoUnitario,
      quantidade: quantidadeInicial,
      total: subtotal
    };

    itensCarrinho.push(item);
    notificar();
    return item;
  }

  // Suporte a pizzas configuradas
  const nomeFinal = itemConfigurado.sabor2 
    ? `${itemConfigurado.sabor1.nome} + ${itemConfigurado.sabor2.nome}`
    : itemConfigurado.sabor1.nome;

  const precoUnitario = Number((itemConfigurado.precoPizza + (itemConfigurado.precoBorda || 0)).toFixed(2));
  const quantidadeInicial = itemConfigurado.quantidade || 1;
  const subtotal = Number((precoUnitario * quantidadeInicial).toFixed(2));

  const item = {
    id: `item-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    tipo: 'pizza',
    nome: nomeFinal,
    sabor1: itemConfigurado.sabor1,
    sabor2: itemConfigurado.sabor2 || null,
    isMeioAMeio: Boolean(itemConfigurado.sabor2),
    tamanho: itemConfigurado.tamanho,
    borda: itemConfigurado.borda || null,
    precoPizza: itemConfigurado.precoPizza,
    precoBorda: itemConfigurado.precoBorda || 0,
    precoUnitario: precoUnitario,
    quantidade: quantidadeInicial,
    total: subtotal
  };

  itensCarrinho.push(item);
  notificar();
  return item;
}

/**
 * Adiciona uma bebida individual diretamente ao carrinho
 * @param {Object} bebida
 * @returns {Object}
 */
export function adicionarBebidaAoCarrinho(bebida) {
  return adicionarAoCarrinho({
    tipo: 'bebida',
    nome: bebida.nome,
    preco: bebida.preco,
    quantidade: 1
  });
}

/**
 * Altera a quantidade de um item no carrinho (+1 ou -1)
 * Se a quantidade resultante for <= 0, o item é removido automaticamente.
 * @param {string} itemId 
 * @param {number} delta - Variação (+1 ou -1)
 */
export function alterarQuantidade(itemId, delta) {
  const index = itensCarrinho.findIndex(i => i.id === itemId);
  if (index === -1) return;

  const item = itensCarrinho[index];
  item.quantidade += delta;

  if (item.quantidade <= 0) {
    itensCarrinho.splice(index, 1);
  } else {
    item.total = Number((item.precoUnitario * item.quantidade).toFixed(2));
  }

  notificar();
}

/**
 * Remove completamente um item do carrinho
 * @param {string} itemId 
 */
export function removerItem(itemId) {
  itensCarrinho = itensCarrinho.filter(i => i.id !== itemId);
  notificar();
}

/**
 * Retorna uma cópia segura dos itens do carrinho
 * @returns {Array<Object>}
 */
export function obterCarrinho() {
  return [...itensCarrinho];
}

/**
 * Retorna a quantidade de itens configurados no carrinho
 * @returns {number}
 */
export function obterQuantidadeItens() {
  return itensCarrinho.length;
}

/**
 * Retorna o valor total somado do carrinho (subtotal dos itens)
 * @returns {number}
 */
export function obterTotalCarrinho() {
  const soma = itensCarrinho.reduce((acc, item) => acc + item.total, 0);
  return Number(soma.toFixed(2));
}

/**
 * Registra um ouvinte para alterações no carrinho
 * @param {Function} callback 
 */
export function observarCarrinho(callback) {
  if (typeof callback === 'function') {
    ouvintesCarrinho.push(callback);
    callback(obterCarrinho());
  }
}

/**
 * Limpa todos os itens do carrinho
 */
export function limparCarrinho() {
  itensCarrinho = [];
  notificar();
}
