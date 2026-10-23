// js/config.js — Configurações Centrais da LaPizzaNatal (PEX II)

/**
 * Fonte única e centralizada para dados institucionais, pagamento e regras operacionais.
 * Nenhuma chave Pix ou telefone deve ser duplicado fora deste arquivo.
 */
export const CONFIG = {
  empresa: {
    nome: "LaPizzaNatal",
    endereco: "Av. Senhor do Bonfim, 4135 – Natal/RN",
    horario: "Todos os dias • 18h às 23h",
    whatsapp: "5584998992266",
    whatsappFormatado: "(84) 99899-2266",
    instagram: "@lapizzanatal"
  },

  pagamento: {
    pix: {
      chave: "+5584998992266",
      chaveFormatada: "(84) 99899-2266",
      nomeRecebedor: "Guido O. R. da Trindade",
      cidade: "NATAL"
    }
  },

  entrega: {
    regiao: "Zona Norte de Natal/RN",
    taxa: 0
  }
};
