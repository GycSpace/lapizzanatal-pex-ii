// data/cardapio.js — Fonte Oficial de Dados da LaPizzaNatal

export const CARDAPIO = {
  informacoesPizzaria: {
    nome: "LaPizzaNatal",
    endereco: "Av. Senhor do Bonfim, 4135 – Natal/RN",
    horario: "Todos os dias, das 18h às 23h.",
    whatsapp: "(84) 99899-2266",
    whatsappNumero: "5584998992266",
    instagram: "@lapizzanatal"
  },

  regrasNegocio: {
    tamanhos: ["P", "M", "G"],
    meioAMeio: {
      maximoSabores: 2,
      regraPreco: "maior_valor",
      descricao: "Em pizzas com 2 sabores, o preço final será sempre o do sabor mais caro para o tamanho escolhido. Nunca somar ou calcular média."
    },
    bordas: {
      maximoPorPizza: 1,
      cobradaSeparadamente: true,
      permiteEmMeioAMeio: true,
      descricao: "Máximo de 1 borda por pizza, cobrada à parte e sem alterar o preço-base."
    },
    adicionaisIngredientes: {
      permitidos: false,
      descricao: "Não existem adicionais de ingredientes (bacon extra, queijo extra, etc.)."
    },
    entrega: {
      taxa: 0.00,
      regiaoAtendida: "Zona Norte de Natal/RN",
      descricao: "Entrega gratuita realizada exclusivamente na Zona Norte de Natal/RN."
    }
  },

  pizzasSalgadas: [
    {
      id: "a-moda-da-casa",
      nome: "A Moda da Casa",
      ingredientes: "molho de tomate, mussarela, presunto, ervilha, tomate, orégano.",
      precos: { P: 36.90, M: 47.90, G: 49.90 }
    },
    {
      id: "atum",
      nome: "Atum",
      ingredientes: "molho, mussarela, atum, cebola, orégano.",
      precos: { P: 45.90, M: 50.90, G: 52.90 }
    },
    {
      id: "bacon",
      nome: "Bacon",
      ingredientes: "molho, mussarela, bacon crocante, orégano.",
      precos: { P: 42.90, M: 47.90, G: 49.90 }
    },
    {
      id: "bacon-com-cheddar",
      nome: "Bacon com Cheddar",
      ingredientes: "molho, mussarela, bacon crocante, cheddar cremoso, orégano.",
      precos: { P: 47.90, M: 51.90, G: 53.90 }
    },
    {
      id: "calabresa",
      nome: "Calabresa",
      ingredientes: "molho, mussarela, calabresa, cebola, orégano.",
      precos: { P: 42.90, M: 47.90, G: 49.90 }
    },
    {
      id: "camarao",
      nome: "Camarão",
      ingredientes: "molho, mussarela, camarão refogado no alho e óleo, cebola, tomate, orégano.",
      precos: { P: 57.90, M: 62.90, G: 64.90 }
    },
    {
      id: "carne-de-sol",
      nome: "Carne de Sol",
      ingredientes: "molho, mussarela, carne de sol desfiada, cebola, orégano.",
      precos: { P: 48.90, M: 53.90, G: 55.90 }
    },
    {
      id: "carne-de-sol-com-cream-cheese",
      nome: "Carne de Sol com Cream Cheese",
      ingredientes: "molho, mussarela, carne de sol desfiada, cream cheese, orégano.",
      precos: { P: 49.90, M: 55.90, G: 57.90 }
    },
    {
      id: "frango-com-bacon",
      nome: "Frango com Bacon",
      ingredientes: "molho, mussarela, frango desfiado, bacon crocante, orégano.",
      precos: { P: 47.90, M: 52.90, G: 55.90 }
    },
    {
      id: "frango-com-cheddar",
      nome: "Frango com Cheddar",
      ingredientes: "molho, mussarela, frango desfiado, cheddar cremoso, orégano.",
      precos: { P: 47.90, M: 52.90, G: 55.90 }
    },
    {
      id: "frango-com-milho",
      nome: "Frango com Milho",
      ingredientes: "molho, mussarela, frango desfiado, milho verde, orégano.",
      precos: { P: 47.90, M: 52.90, G: 55.90 }
    },
    {
      id: "gorgonzola",
      nome: "Gorgonzola",
      ingredientes: "molho, mussarela, queijo gorgonzola, manjericão.",
      precos: { P: 47.90, M: 52.90, G: 55.90 }
    },
    {
      id: "italiana",
      nome: "Italiana",
      ingredientes: "molho, mussarela, presunto, peperoni, salame, orégano.",
      precos: { P: 52.90, M: 57.90, G: 59.90 }
    },
    {
      id: "lombo-com-catupiry",
      nome: "Lombo com Catupiry",
      ingredientes: "molho, mussarela, lombo canadense, catupiry, orégano.",
      precos: { P: 52.90, M: 57.90, G: 59.90 }
    },
    {
      id: "lombinho",
      nome: "Lombinho",
      ingredientes: "molho, mussarela, lombo canadense, cebola, orégano.",
      precos: { P: 48.90, M: 53.90, G: 55.90 }
    },
    {
      id: "marguerita",
      nome: "Marguerita",
      ingredientes: "molho, mussarela, tomate fresco, manjericão.",
      precos: { P: 42.90, M: 47.90, G: 49.90 }
    },
    {
      id: "mista",
      nome: "Mista",
      ingredientes: "molho, mussarela, presunto, orégano.",
      precos: { P: 42.90, M: 47.90, G: 49.90 }
    },
    {
      id: "mista-2",
      nome: "Mista 2",
      ingredientes: "molho, mussarela, calabresa, orégano.",
      precos: { P: 42.90, M: 47.90, G: 49.90 }
    },
    {
      id: "mussarela",
      nome: "Mussarela",
      ingredientes: "molho, mussarela, orégano.",
      precos: { P: 42.90, M: 47.90, G: 49.90 }
    },
    {
      id: "napolitana",
      nome: "Napolitana",
      ingredientes: "molho, mussarela, tomate fresco, parmesão, orégano.",
      precos: { P: 42.90, M: 47.90, G: 49.90 }
    },
    {
      id: "peperoni",
      nome: "Peperoni",
      ingredientes: "molho, mussarela, pepperoni, orégano.",
      precos: { P: 48.90, M: 53.90, G: 55.90 }
    },
    {
      id: "portuguesa",
      nome: "Portuguesa",
      ingredientes: "molho, mussarela, presunto, ovo cozido, cebola, orégano.",
      precos: { P: 42.90, M: 47.90, G: 49.90 }
    },
    {
      id: "quase-tudo",
      nome: "Quase Tudo",
      ingredientes: "molho, mussarela, frango, presunto, calabresa, bacon, milho, cebola, orégano.",
      precos: { P: 48.90, M: 53.90, G: 55.90 }
    },
    {
      id: "sertaneja",
      nome: "Sertaneja",
      ingredientes: "molho, mussarela, carne de sol, cebola, queijo coalho, orégano.",
      precos: { P: 52.90, M: 57.90, G: 59.90 }
    },
    {
      id: "siciliana",
      nome: "Siciliana",
      ingredientes: "molho, mussarela, champignon, bacon, orégano.",
      precos: { P: 45.90, M: 50.90, G: 52.90 }
    },
    {
      id: "toscana",
      nome: "Toscana",
      ingredientes: "molho, mussarela, Calabresa, presunto, orégano.",
      precos: { P: 48.90, M: 53.90, G: 55.90 }
    }
  ],

  pizzasDoces: [
    {
      id: "banana-com-canela",
      nome: "Banana com Canela",
      ingredientes: "mussarela, banana, açúcar, canela, leite condensado.",
      precos: { P: 42.90, M: 47.90, G: 49.90 }
    },
    {
      id: "banana-com-chocolate",
      nome: "Banana com Chocolate",
      ingredientes: "mussarela, banana, chocolate ao leite.",
      precos: { P: 47.90, M: 52.90, G: 55.90 }
    },
    {
      id: "banana-com-doce-de-leite",
      nome: "Banana com Doce de Leite",
      ingredientes: "mussarela, banana, doce de leite.",
      precos: { P: 47.90, M: 52.90, G: 55.90 }
    },
    {
      id: "banana-nevada",
      nome: "Banana Nevada",
      ingredientes: "mussarela, banana, chocolate brando e canela.",
      precos: { P: 47.90, M: 52.90, G: 55.90 }
    },
    {
      id: "beijinho",
      nome: "Beijinho",
      ingredientes: "mussarela, chocolate ao leite, coco ralado.",
      precos: { P: 47.90, M: 52.90, G: 55.90 }
    },
    {
      id: "chocolate-ao-leite",
      nome: "Chocolate ao Leite",
      ingredientes: "mussarela, Chocolate ao leite cremoso.",
      precos: { P: 48.90, M: 53.90, G: 55.90 }
    },
    {
      id: "dois-amores",
      nome: "Dois Amores",
      ingredientes: "mussarela, chocolate ao leite, chocolate branco.",
      precos: { P: 48.90, M: 53.90, G: 55.90 }
    },
    {
      id: "romeu-e-julieta",
      nome: "Romeu e Julieta",
      ingredientes: "mussarela e goiabada.",
      precos: { P: 48.90, M: 53.90, G: 55.90 }
    }
  ],

  bordas: [
    {
      id: "borda-de-catupiry",
      nome: "Borda de Catupiry",
      preco: 10.00
    },
    {
      id: "borda-de-cheddar",
      nome: "Borda de Cheddar",
      preco: 10.00
    },
    {
      id: "borda-de-cream-cheese",
      nome: "Borda de Cream Cheese",
      preco: 10.00
    },
    {
      id: "borda-de-chocolate",
      nome: "Borda de Chocolate",
      preco: 12.00
    }
  ],

  bebidas: [
    {
      id: "coca-cola-1l",
      nome: "Coca-Cola 1L",
      preco: 12.00
    },
    {
      id: "guarana-1l",
      nome: "Guaraná 1L",
      preco: 10.00
    },
    {
      id: "pepsi-1l",
      nome: "Pepsi 1L",
      preco: 10.00
    }
  ]
};
