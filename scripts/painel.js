(function () {
  "use strict";

  const CATEGORIAS_VALIDAS = [
    "PREGAO ELETRONICO",
    "PRORROGACAO",
    "LOCACAO",
    "CONCORRENCIA ELETRONICA",
    "CHAMADA PUBLICA",
    "TOMADA DE PRECOS",
    "CONCORRENCIA PRESENCIAL",
    "DISPENSA"
  ];

  const CATEGORIAS_ROTULOS = {
    "PREGAO ELETRONICO": "PREGÃO ELETRÔNICO",
    "PRORROGACAO": "PRORROGAÇÃO",
    "LOCACAO": "LOCAÇÃO",
    "CONCORRENCIA ELETRONICA": "CONCORRÊNCIA ELETRÔNICA",
    "CHAMADA PUBLICA": "CHAMADA PÚBLICA",
    "TOMADA DE PRECOS": "TOMADA DE PREÇOS",
    "CONCORRENCIA PRESENCIAL": "CONCORRÊNCIA PRESENCIAL",
    "DISPENSA": "DISPENSA",
    OUTROS: "OUTROS"
  };

  const ORDEM_SITUACAO = {
    urgente: 0,
    atencao: 1,
    regular: 2,
    sem_vigencia: 3,
    encerrado: 4
  };

  const ROTULOS_SITUACAO = {
    urgente: "Vence em até 30 dias",
    atencao: "Vence em 31 a 90 dias",
    regular: "Vigente regular",
    sem_vigencia: "Sem vigência informada",
    encerrado: "Encerrado"
  };

  const QUERY_PARAM_MAP = {
    processo: "processo",
    modalidade: "modalidade",
    tipo: "tipo",
    ano: "ano",
    situacao: "situacao",
    ordenacao: "ordenacao",
    busca: "busca"
  };

  const formatadorMoeda = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

  const formatadorData = new Intl.DateTimeFormat("pt-BR");
  const formatadorDataHora = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const collator = new Intl.Collator("pt-BR", {
    numeric: true,
    sensitivity: "base"
  });

  const DOM = {
    exportarRecorte: document.getElementById("exportar-recorte"),
    limparFiltros: document.getElementById("limpar-filtros"),
    metaAtualizacao: document.getElementById("meta-atualizacao"),
    metaOrigem: document.getElementById("meta-origem"),
    fatoTotalCadastro: document.getElementById("fato-total-cadastro"),
    fatoTotalCadastroMeta: document.getElementById("fato-total-cadastro-meta"),
    fatoCobertura: document.getElementById("fato-cobertura"),
    fatoCoberturaMeta: document.getElementById("fato-cobertura-meta"),
    fatoCategorias: document.getElementById("fato-categorias"),
    fatoCategoriasMeta: document.getElementById("fato-categorias-meta"),
    resumoGeral: document.getElementById("resumo-geral"),
    resumoFiltros: document.getElementById("resumo-filtros"),
    mensagemStatus: document.getElementById("mensagem-status"),
    estadoVazio: document.getElementById("estado-vazio"),
    navCategorias: document.getElementById("nav-categorias"),
    listaVencimentos: document.getElementById("lista-vencimentos"),
    listaPendencias: document.getElementById("lista-pendencias"),
    listaDistribuicao: document.getElementById("lista-distribuicao"),
    secoesCategorias: document.getElementById("secoes-categorias"),
    metricas: {
      visiveis: document.getElementById("metrica-visiveis"),
      visiveisMeta: document.getElementById("metrica-visiveis-meta"),
      valor: document.getElementById("metrica-valor"),
      urgente: document.getElementById("metrica-urgente"),
      urgenteMeta: document.getElementById("metrica-urgente-meta"),
      atencao: document.getElementById("metrica-atencao"),
      atencaoMeta: document.getElementById("metrica-atencao-meta"),
      semVigencia: document.getElementById("metrica-sem-vigencia"),
      semVigenciaMeta: document.getElementById("metrica-sem-vigencia-meta")
    },
    filtros: {
      processo: document.getElementById("filtro-processo"),
      modalidade: document.getElementById("filtro-modalidade"),
      tipo: document.getElementById("filtro-tipo"),
      ano: document.getElementById("filtro-ano"),
      situacao: document.getElementById("filtro-situacao"),
      ordenacao: document.getElementById("filtro-ordenacao"),
      busca: document.getElementById("filtro-busca")
    },
    drawer: document.getElementById("drawer"),
    drawerFechar: document.getElementById("drawer-fechar"),
    drawerCategoria: document.getElementById("drawer-categoria"),
    drawerTitulo: document.getElementById("drawer-titulo"),
    drawerObjeto: document.getElementById("drawer-objeto"),
    drawerSituacao: document.getElementById("drawer-situacao"),
    drawerStatusExcel: document.getElementById("drawer-status-excel"),
    drawerGrid: document.getElementById("drawer-grid")
  };

  const state = {
    contratos: [],
    filtrados: [],
    referencia: obterDataReferenciaSegura(""),
    ultimaAtualizacao: "",
    origemArquivo: "",
    contratoAbertoId: "",
    observador: null,
    filtros: {
      processo: "",
      modalidade: "",
      tipo: "",
      ano: "",
      situacao: "",
      ordenacao: "risco",
      busca: ""
    }
  };

  function normalizarTexto(valor) {
    return String(valor || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .trim();
  }

  function slugify(valor) {
    return normalizarTexto(valor)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function compararTexto(a, b) {
    return collator.compare(String(a || ""), String(b || ""));
  }

  function escaparCsv(valor) {
    const texto = String(valor == null ? "" : valor);
    return /[;"\n\r]/.test(texto) ? '"' + texto.replace(/"/g, '""') + '"' : texto;
  }

  function formatarMoeda(valor) {
    return formatadorMoeda.format(Number(valor) || 0);
  }

  function parsearDataIso(valor) {
    const texto = String(valor || "").trim();
    if (!texto) {
      return null;
    }

    const partes = texto.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!partes) {
      return null;
    }

    const ano = Number(partes[1]);
    const mes = Number(partes[2]) - 1;
    const dia = Number(partes[3]);
    const data = new Date(ano, mes, dia);
    data.setHours(0, 0, 0, 0);

    if (
      Number.isNaN(data.getTime()) ||
      data.getFullYear() !== ano ||
      data.getMonth() !== mes ||
      data.getDate() !== dia
    ) {
      return null;
    }

    return data;
  }

  function formatarData(valor) {
    const data = parsearDataIso(valor);
    return data ? formatadorData.format(data) : "Não informado";
  }

  function obterDataReferenciaSegura(valor) {
    const data = valor ? new Date(valor) : new Date();
    if (Number.isNaN(data.getTime())) {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      return hoje;
    }

    data.setHours(0, 0, 0, 0);
    return data;
  }

  function calcularDiasRestantes(fimVigencia, referencia) {
    const fim = parsearDataIso(fimVigencia);
    if (!fim) {
      return null;
    }

    return Math.round((fim.getTime() - referencia.getTime()) / 86400000);
  }

  function obterSituacaoContrato(contrato, referencia) {
    const diasRestantes = calcularDiasRestantes(contrato.fim_vigencia, referencia);

    if (diasRestantes === null) {
      return {
        chave: "sem_vigencia",
        rotulo: ROTULOS_SITUACAO.sem_vigencia,
        diasRestantes: null
      };
    }

    if (diasRestantes < 0) {
      return {
        chave: "encerrado",
        rotulo: ROTULOS_SITUACAO.encerrado,
        diasRestantes: diasRestantes
      };
    }

    if (diasRestantes <= 30) {
      return {
        chave: "urgente",
        rotulo: ROTULOS_SITUACAO.urgente,
        diasRestantes: diasRestantes
      };
    }

    if (diasRestantes <= 90) {
      return {
        chave: "atencao",
        rotulo: ROTULOS_SITUACAO.atencao,
        diasRestantes: diasRestantes
      };
    }

    return {
      chave: "regular",
      rotulo: ROTULOS_SITUACAO.regular,
      diasRestantes: diasRestantes
    };
  }

  function parsearValor(valor) {
    if (typeof valor === "number" && Number.isFinite(valor)) {
      return valor;
    }

    const texto = String(valor || "").trim();
    if (!texto) {
      return 0;
    }

    const normalizado = texto
      .replace(/\s/g, "")
      .replace(/\./g, "")
      .replace(",", ".")
      .replace(/[^\d.-]/g, "");

    const numero = Number(normalizado);
    return Number.isFinite(numero) ? numero : 0;
  }

  function inferirAno(item) {
    const anoDireto = Number(item.ano);
    if (Number.isFinite(anoDireto)) {
      return anoDireto;
    }

    const match = String(item.numero || "").match(/(19|20)\d{2}/);
    return match ? Number(match[0]) : "";
  }

  function rotuloCategoria(valor) {
    return CATEGORIAS_ROTULOS[valor] || valor || CATEGORIAS_ROTULOS.OUTROS;
  }

  function obterCategoriaNormalizada(categoria) {
    const normalizada = normalizarTexto(categoria);
    return CATEGORIAS_VALIDAS.includes(normalizada) ? normalizada : "OUTROS";
  }

  function comporIndiceBusca(item) {
    return normalizarTexto([
      item.numero,
      item.fornecedor,
      item.objeto,
      item.processo,
      item.modalidade,
      item.tipo,
      item.observacoes,
      item.gestor_fiscal,
      item.status_excel
    ].join(" "));
  }

  function sanearContrato(item, indice) {
    const contratoBase = {
      id: "contrato-" + indice,
      ano: inferirAno(item),
      numero: String(item.numero || "").trim(),
      fornecedor: String(item.fornecedor || "").trim(),
      objeto: String(item.objeto || "").trim(),
      processo: String(item.processo || "").trim(),
      categoria: obterCategoriaNormalizada(item.categoria),
      categoriaOriginal: String(item.categoria || "").trim(),
      modalidade: String(item.modalidade || "").trim(),
      tipo: String(item.tipo || "").trim(),
      valor: parsearValor(item.valor),
      valorTexto: String(item.valor_texto || "").trim(),
      inicio_vigencia: String(item.inicio_vigencia || "").trim(),
      fim_vigencia: String(item.fim_vigencia || "").trim(),
      status_excel: String(item.status_excel || "").trim(),
      observacoes: String(item.observacoes || "").trim(),
      gestor_fiscal: String(item.gestor_fiscal || "").trim()
    };

    const situacao = obterSituacaoContrato(contratoBase, state.referencia);

    return Object.assign(contratoBase, {
      situacao: situacao,
      indiceBusca: comporIndiceBusca(contratoBase)
    });
  }

  function obterContratoFonte() {
    const payload = window.PAINEL_CONTRATOS_DATA;
    if (!payload || !Array.isArray(payload.contratos)) {
      return {
        contratos: [],
        erro: "Nenhum conjunto de contratos foi carregado. Verifique o arquivo contratos-data.js."
      };
    }

    return {
      contratos: payload.contratos,
      erro: ""
    };
  }

  function popularSelect(elemento, valores, rotuloPadrao) {
    const valorAtual = elemento.value;
    elemento.replaceChildren();

    const opcaoVazia = document.createElement("option");
    opcaoVazia.value = "";
    opcaoVazia.textContent = rotuloPadrao;
    elemento.appendChild(opcaoVazia);

    valores.forEach(function (valor) {
      const opcao = document.createElement("option");
      opcao.value = valor;
      opcao.textContent = valor;
      elemento.appendChild(opcao);
    });

    elemento.value = valorAtual && valores.includes(valorAtual) ? valorAtual : "";
  }

  function preencherFiltros() {
    const processos = Array.from(new Set(state.contratos.map(function (contrato) {
      return contrato.processo;
    }).filter(Boolean))).sort(compararTexto);

    const modalidades = Array.from(new Set(state.contratos.map(function (contrato) {
      return contrato.modalidade;
    }).filter(Boolean))).sort(compararTexto);

    const tipos = Array.from(new Set(state.contratos.map(function (contrato) {
      return contrato.tipo;
    }).filter(Boolean))).sort(compararTexto);

    const anos = Array.from(new Set(state.contratos.map(function (contrato) {
      return contrato.ano;
    }).filter(function (ano) {
      return ano !== "";
    }))).sort(function (a, b) {
      return b - a;
    }).map(String);

    popularSelect(DOM.filtros.processo, processos, "Todos os processos");
    popularSelect(DOM.filtros.modalidade, modalidades, "Todas as modalidades");
    popularSelect(DOM.filtros.tipo, tipos, "Todos os tipos");
    popularSelect(DOM.filtros.ano, anos, "Todos os anos");
  }

  function obterCoberturaAnos(contratos) {
    const anos = contratos.map(function (contrato) {
      return contrato.ano;
    }).filter(function (ano) {
      return typeof ano === "number" && Number.isFinite(ano);
    });

    if (!anos.length) {
      return "-";
    }

    return Math.min.apply(null, anos) + " - " + Math.max.apply(null, anos);
  }

  function atualizarHero() {
    DOM.metaAtualizacao.textContent = state.ultimaAtualizacao
      ? "Atualizado em " + formatadorDataHora.format(new Date(state.ultimaAtualizacao))
      : "Data de atualização não informada";

    DOM.metaOrigem.textContent = state.origemArquivo || "Não informado";
    DOM.fatoTotalCadastro.textContent = String(state.contratos.length);
    DOM.fatoTotalCadastroMeta.textContent = state.contratos.length === 1
      ? "1 contrato registrado na base"
      : state.contratos.length + " contratos registrados na base";
    DOM.fatoCobertura.textContent = obterCoberturaAnos(state.contratos);
    DOM.fatoCoberturaMeta.textContent = "Intervalo anual encontrado no cadastro";

    const categoriasComDados = new Set(state.contratos.map(function (contrato) {
      return contrato.categoria;
    })).size;
    DOM.fatoCategorias.textContent = String(categoriasComDados);
    DOM.fatoCategoriasMeta.textContent = categoriasComDados === 1
      ? "1 categoria com contratos"
      : categoriasComDados + " categorias com contratos";
  }

  function obterFiltrosDoDom() {
    return {
      processo: DOM.filtros.processo.value,
      modalidade: DOM.filtros.modalidade.value,
      tipo: DOM.filtros.tipo.value,
      ano: DOM.filtros.ano.value,
      situacao: DOM.filtros.situacao.value,
      ordenacao: DOM.filtros.ordenacao.value || "risco",
      busca: DOM.filtros.busca.value.trim()
    };
  }

  function aplicarFiltrosDoEstadoNaInterface() {
    DOM.filtros.processo.value = state.filtros.processo;
    DOM.filtros.modalidade.value = state.filtros.modalidade;
    DOM.filtros.tipo.value = state.filtros.tipo;
    DOM.filtros.ano.value = state.filtros.ano;
    DOM.filtros.situacao.value = state.filtros.situacao;
    DOM.filtros.ordenacao.value = state.filtros.ordenacao;
    DOM.filtros.busca.value = state.filtros.busca;
  }

  function lerFiltrosDaUrl() {
    const params = new URLSearchParams(window.location.search);

    Object.keys(QUERY_PARAM_MAP).forEach(function (chave) {
      const valor = params.get(QUERY_PARAM_MAP[chave]) || "";
      state.filtros[chave] = valor;
    });

    if (!state.filtros.ordenacao) {
      state.filtros.ordenacao = "risco";
    }
  }

  function sincronizarFiltrosNaUrl() {
    try {
      const url = new URL(window.location.href);

      Object.keys(QUERY_PARAM_MAP).forEach(function (chave) {
        const valor = state.filtros[chave];
        if (valor) {
          url.searchParams.set(QUERY_PARAM_MAP[chave], valor);
        } else {
          url.searchParams.delete(QUERY_PARAM_MAP[chave]);
        }
      });

      window.history.replaceState({}, "", url.toString());
    } catch (erro) {
      return;
    }
  }

  function contratoAtendeFiltros(contrato, filtros) {
    if (filtros.processo && contrato.processo !== filtros.processo) {
      return false;
    }

    if (filtros.modalidade && contrato.modalidade !== filtros.modalidade) {
      return false;
    }

    if (filtros.tipo && contrato.tipo !== filtros.tipo) {
      return false;
    }

    if (filtros.ano && String(contrato.ano) !== filtros.ano) {
      return false;
    }

    if (filtros.situacao && contrato.situacao.chave !== filtros.situacao) {
      return false;
    }

    if (filtros.busca) {
      const termo = normalizarTexto(filtros.busca);
      if (!contrato.indiceBusca.includes(termo)) {
        return false;
      }
    }

    return true;
  }

  function obterTimestampFim(contrato) {
    const data = parsearDataIso(contrato.fim_vigencia);
    return data ? data.getTime() : Number.MAX_SAFE_INTEGER;
  }

  function obterComparador(sortKey) {
    if (sortKey === "vencimento") {
      return function (a, b) {
        const resultado = obterTimestampFim(a) - obterTimestampFim(b);
        return resultado !== 0 ? resultado : compararTexto(a.numero, b.numero);
      };
    }

    if (sortKey === "maior_valor") {
      return function (a, b) {
        const resultado = (b.valor || 0) - (a.valor || 0);
        return resultado !== 0 ? resultado : compararTexto(a.numero, b.numero);
      };
    }

    if (sortKey === "menor_valor") {
      return function (a, b) {
        const resultado = (a.valor || 0) - (b.valor || 0);
        return resultado !== 0 ? resultado : compararTexto(a.numero, b.numero);
      };
    }

    if (sortKey === "fornecedor") {
      return function (a, b) {
        const resultado = compararTexto(a.fornecedor, b.fornecedor);
        return resultado !== 0 ? resultado : compararTexto(a.numero, b.numero);
      };
    }

    if (sortKey === "ano_desc") {
      return function (a, b) {
        const resultado = (Number(b.ano) || 0) - (Number(a.ano) || 0);
        return resultado !== 0 ? resultado : compararTexto(a.numero, b.numero);
      };
    }

    return function (a, b) {
      const situacaoA = ORDEM_SITUACAO[a.situacao.chave] || 99;
      const situacaoB = ORDEM_SITUACAO[b.situacao.chave] || 99;

      if (situacaoA !== situacaoB) {
        return situacaoA - situacaoB;
      }

      const vencimento = obterTimestampFim(a) - obterTimestampFim(b);
      if (vencimento !== 0) {
        return vencimento;
      }

      return compararTexto(a.numero, b.numero);
    };
  }

  function ordenarContratos(contratos) {
    return contratos.slice().sort(obterComparador(state.filtros.ordenacao));
  }

  function agruparPorCategoria(contratos) {
    const mapa = new Map();

    CATEGORIAS_VALIDAS.forEach(function (categoria) {
      mapa.set(categoria, []);
    });

    if (!mapa.has("OUTROS")) {
      mapa.set("OUTROS", []);
    }

    contratos.forEach(function (contrato) {
      if (!mapa.has(contrato.categoria)) {
        mapa.set(contrato.categoria, []);
      }
      mapa.get(contrato.categoria).push(contrato);
    });

    return mapa;
  }

  function formatarResumoDias(diasRestantes) {
    if (diasRestantes === null) {
      return "Sem vigência informada";
    }

    if (diasRestantes < 0) {
      return "Encerrado há " + Math.abs(diasRestantes) + (Math.abs(diasRestantes) === 1 ? " dia" : " dias");
    }

    if (diasRestantes === 0) {
      return "Vence hoje";
    }

    if (diasRestantes === 1) {
      return "1 dia restante";
    }

    return diasRestantes + " dias restantes";
  }

  function obterTextoValorContrato(contrato) {
    if (contrato.valorTexto) {
      return contrato.valorTexto;
    }

    return formatarMoeda(contrato.valor);
  }

  function calcularMetricas(contratos) {
    return {
      total: contratos.length,
      valor: contratos.reduce(function (acumulado, contrato) {
        return acumulado + (Number(contrato.valor) || 0);
      }, 0),
      urgente: contratos.filter(function (contrato) {
        return contrato.situacao.chave === "urgente";
      }).length,
      atencao: contratos.filter(function (contrato) {
        return contrato.situacao.chave === "atencao";
      }).length,
      semVigencia: contratos.filter(function (contrato) {
        return contrato.situacao.chave === "sem_vigencia";
      }).length,
      encerrado: contratos.filter(function (contrato) {
        return contrato.situacao.chave === "encerrado";
      }).length,
      ativos: contratos.filter(function (contrato) {
        return contrato.situacao.chave === "regular" ||
          contrato.situacao.chave === "urgente" ||
          contrato.situacao.chave === "atencao";
      }).length
    };
  }

  function atualizarMetricas() {
    const metricas = calcularMetricas(state.filtrados);

    DOM.metricas.visiveis.textContent = String(metricas.total);
    DOM.metricas.visiveisMeta.textContent = metricas.total === 1
      ? "1 contrato no recorte atual"
      : metricas.total + " contratos no recorte atual";
    DOM.metricas.valor.textContent = formatarMoeda(metricas.valor);
    DOM.metricas.urgente.textContent = String(metricas.urgente);
    DOM.metricas.urgenteMeta.textContent = metricas.urgente === 1
      ? "1 contrato exige atenção imediata"
      : metricas.urgente + " contratos exigem atenção imediata";
    DOM.metricas.atencao.textContent = String(metricas.atencao);
    DOM.metricas.atencaoMeta.textContent = metricas.atencao === 1
      ? "1 contrato em faixa preventiva"
      : metricas.atencao + " contratos em faixa preventiva";
    DOM.metricas.semVigencia.textContent = String(metricas.semVigencia);
    DOM.metricas.semVigenciaMeta.textContent = metricas.semVigencia === 1
      ? "1 contrato sem data final válida"
      : metricas.semVigencia + " contratos sem data final válida";

    DOM.resumoGeral.textContent =
      metricas.ativos + " ativos, " +
      metricas.semVigencia + " sem vigência e " +
      metricas.encerrado + " encerrados no recorte atual.";

    DOM.resumoFiltros.textContent =
      "Recorte com " +
      metricas.total +
      (metricas.total === 1 ? " contrato visível" : " contratos visíveis") +
      ", ordenado por " + rotuloOrdenacao(state.filtros.ordenacao).toLowerCase() + ".";
  }

  function rotuloOrdenacao(chave) {
    const rotulos = {
      risco: "Risco e vencimento",
      vencimento: "Data de vigência",
      maior_valor: "Maior valor",
      menor_valor: "Menor valor",
      fornecedor: "Fornecedor",
      ano_desc: "Ano mais recente"
    };

    return rotulos[chave] || "Risco e vencimento";
  }

  function mostrarMensagem(texto, tipo) {
    if (!texto) {
      DOM.mensagemStatus.hidden = true;
      DOM.mensagemStatus.textContent = "";
      DOM.mensagemStatus.className = "status-banner";
      return;
    }

    DOM.mensagemStatus.hidden = false;
    DOM.mensagemStatus.textContent = texto;
    DOM.mensagemStatus.className = "status-banner status-banner--" + tipo;
  }

  function criarItemLista(contracto, detalhe) {
    const item = document.createElement("li");
    const topline = document.createElement("div");
    const titulo = document.createElement("p");
    const badge = document.createElement("span");
    const meta = document.createElement("p");

    topline.className = "priority-list__topline";
    titulo.className = "priority-list__title";
    badge.className = "status-badge status-badge--" + contracto.situacao.chave;
    meta.className = "priority-list__meta";

    titulo.textContent = contracto.numero || "Sem número";
    badge.textContent = detalhe;
    meta.textContent = [contracto.objeto || "Objeto não informado", contracto.fornecedor || "Fornecedor não informado"].join(" • ");

    item.appendChild(topline);
    topline.appendChild(titulo);
    topline.appendChild(badge);
    item.appendChild(meta);
    item.tabIndex = 0;
    item.setAttribute("role", "button");
    item.setAttribute("aria-label", "Abrir detalhes do contrato " + (contracto.numero || "sem número"));

    item.addEventListener("click", function () {
      abrirDrawer(contracto.id);
    });

    item.addEventListener("keydown", function (evento) {
      if (evento.key === "Enter" || evento.key === " ") {
        evento.preventDefault();
        abrirDrawer(contracto.id);
      }
    });

    return item;
  }

  function preencherListaVencimentos() {
    const itens = ordenarContratos(state.filtrados.filter(function (contrato) {
      return contrato.situacao.chave === "urgente" || contrato.situacao.chave === "atencao";
    })).slice(0, 6);

    DOM.listaVencimentos.replaceChildren();

    if (!itens.length) {
      DOM.listaVencimentos.appendChild(criarItemListaVazio("Nenhum contrato em janela de vencimento no recorte atual."));
      return;
    }

    itens.forEach(function (contrato) {
      DOM.listaVencimentos.appendChild(criarItemLista(contrato, formatarResumoDias(contrato.situacao.diasRestantes)));
    });
  }

  function preencherListaPendencias() {
    const itens = ordenarContratos(state.filtrados.filter(function (contrato) {
      return contrato.situacao.chave === "sem_vigencia";
    })).slice(0, 6);

    DOM.listaPendencias.replaceChildren();

    if (!itens.length) {
      DOM.listaPendencias.appendChild(criarItemListaVazio("Não há contratos sem vigência informada no recorte atual."));
      return;
    }

    itens.forEach(function (contrato) {
      DOM.listaPendencias.appendChild(criarItemLista(contrato, contrato.status_excel || "Sem status"));
    });
  }

  function criarItemListaVazio(texto) {
    const item = document.createElement("li");
    const meta = document.createElement("p");

    meta.className = "priority-list__meta";
    meta.textContent = texto;
    item.appendChild(meta);
    return item;
  }

  function preencherDistribuicao() {
    const grupos = agruparPorCategoria(state.filtrados);
    const total = state.filtrados.length || 1;
    const categoriasComDados = Array.from(grupos.entries()).filter(function (entrada) {
      return entrada[1].length > 0;
    }).sort(function (a, b) {
      return b[1].length - a[1].length;
    });

    DOM.listaDistribuicao.replaceChildren();

    if (!categoriasComDados.length) {
      const vazio = document.createElement("p");
      vazio.className = "distribution__meta";
      vazio.textContent = "A distribuição aparece assim que houver contratos no recorte.";
      DOM.listaDistribuicao.appendChild(vazio);
      return;
    }

    categoriasComDados.forEach(function (entrada) {
      const categoria = entrada[0];
      const contratos = entrada[1];
      const percentual = Math.max(6, Math.round((contratos.length / total) * 100));
      const linha = document.createElement("div");
      const topline = document.createElement("div");
      const nome = document.createElement("strong");
      const volume = document.createElement("span");
      const barra = document.createElement("div");
      const preenchimento = document.createElement("div");
      const meta = document.createElement("span");
      const valorTotal = contratos.reduce(function (acumulado, contrato) {
        return acumulado + (Number(contrato.valor) || 0);
      }, 0);

      linha.className = "distribution__row";
      topline.className = "distribution__topline";
      barra.className = "distribution__bar";
      preenchimento.className = "distribution__fill";
      meta.className = "distribution__meta";

      nome.textContent = rotuloCategoria(categoria);
      volume.textContent = contratos.length;
      preenchimento.style.width = percentual + "%";
      meta.textContent = formatarMoeda(valorTotal) + " no recorte";

      topline.appendChild(nome);
      topline.appendChild(volume);
      barra.appendChild(preenchimento);
      linha.appendChild(topline);
      linha.appendChild(barra);
      linha.appendChild(meta);
      DOM.listaDistribuicao.appendChild(linha);
    });
  }

  function criarCelulaResumo(principal, secundario) {
    const caixa = document.createElement("div");
    const forte = document.createElement("strong");
    const suave = document.createElement("span");

    caixa.className = "contracts-table__main";
    forte.textContent = principal;
    suave.className = "contracts-table__sub";
    suave.textContent = secundario;
    caixa.appendChild(forte);
    caixa.appendChild(suave);
    return caixa;
  }

  function criarCelulaSimples(valor, secundario) {
    const caixa = document.createElement("div");
    const principal = document.createElement("span");

    caixa.className = "contracts-table__main";
    principal.textContent = valor;
    caixa.appendChild(principal);

    if (secundario) {
      const apoio = document.createElement("span");
      apoio.className = "contracts-table__sub";
      apoio.textContent = secundario;
      caixa.appendChild(apoio);
    }

    return caixa;
  }

  function criarBadgeSituacao(contrato) {
    const badge = document.createElement("span");
    badge.className = "status-badge status-badge--" + contrato.situacao.chave;
    badge.textContent = contrato.situacao.rotulo;
    return badge;
  }

  function criarTabelaCategoria(categoria, contratos, totalVisivel) {
    const colunas = [
      "Contrato",
      "Objeto",
      "Fornecedor",
      "Processo / modalidade",
      "Vigência",
      "Valor",
      "Situação"
    ];
    const secao = document.createElement("section");
    const cabecalho = document.createElement("div");
    const blocoTitulo = document.createElement("div");
    const titulo = document.createElement("h3");
    const meta = document.createElement("p");
    const fatos = document.createElement("div");
    const acoes = document.createElement("div");
    const botaoExportar = document.createElement("button");
    const wrapper = document.createElement("div");
    const tabela = document.createElement("table");
    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody");
    const nota = document.createElement("p");
    const totalValor = contratos.reduce(function (acumulado, contrato) {
      return acumulado + (Number(contrato.valor) || 0);
    }, 0);
    const urgentes = contratos.filter(function (contrato) {
      return contrato.situacao.chave === "urgente";
    }).length;
    const percentual = totalVisivel ? Math.round((contratos.length / totalVisivel) * 100) : 0;

    secao.className = "category-section";
    secao.id = "categoria-" + slugify(categoria);
    cabecalho.className = "category-section__head";
    titulo.className = "category-section__title";
    meta.className = "category-section__meta";
    fatos.className = "category-section__facts";
    acoes.className = "category-section__actions";
    wrapper.className = "table-wrap";
    tabela.className = "contracts-table";
    nota.className = "results-note";

    titulo.textContent = rotuloCategoria(categoria);
    meta.textContent = contratos.length + (contratos.length === 1 ? " contrato" : " contratos") +
      " nesta categoria • " + percentual + "% do recorte";

    [
      contratos.length + " visíveis",
      formatarMoeda(totalValor),
      urgentes + " em risco imediato"
    ].forEach(function (texto) {
      const pill = document.createElement("span");
      pill.className = "category-section__fact";
      pill.textContent = texto;
      fatos.appendChild(pill);
    });

    botaoExportar.type = "button";
    botaoExportar.className = "button button--section";
    botaoExportar.textContent = "Exportar categoria";
    botaoExportar.addEventListener("click", function () {
      exportarCategoria(categoria);
    });

    blocoTitulo.appendChild(titulo);
    blocoTitulo.appendChild(meta);
    blocoTitulo.appendChild(fatos);
    acoes.appendChild(botaoExportar);
    cabecalho.appendChild(blocoTitulo);
    cabecalho.appendChild(acoes);
    secao.appendChild(cabecalho);

    tabela.appendChild(thead);
    tabela.appendChild(tbody);
    thead.innerHTML = "<tr>" + colunas.map(function (coluna) {
      return "<th scope='col'>" + coluna + "</th>";
    }).join("") + "</tr>";

    contratos.forEach(function (contrato) {
      const linha = document.createElement("tr");
      const celulaContrato = document.createElement("td");
      const celulaObjeto = document.createElement("td");
      const celulaFornecedor = document.createElement("td");
      const celulaProcesso = document.createElement("td");
      const celulaVigencia = document.createElement("td");
      const celulaValor = document.createElement("td");
      const celulaSituacao = document.createElement("td");

      linha.tabIndex = 0;
      linha.setAttribute("role", "button");
      linha.setAttribute("aria-label", "Abrir detalhes do contrato " + (contrato.numero || "sem número"));
      celulaContrato.dataset.label = colunas[0];
      celulaObjeto.dataset.label = colunas[1];
      celulaFornecedor.dataset.label = colunas[2];
      celulaProcesso.dataset.label = colunas[3];
      celulaVigencia.dataset.label = colunas[4];
      celulaValor.dataset.label = colunas[5];
      celulaSituacao.dataset.label = colunas[6];

      celulaContrato.appendChild(criarCelulaResumo(
        contrato.numero || "Sem número",
        [contrato.ano || "Ano não informado", contrato.tipo || "Tipo não informado"].join(" • ")
      ));

      celulaObjeto.appendChild(criarCelulaSimples(
        contrato.objeto || "Objeto não informado",
        contrato.categoriaOriginal || rotuloCategoria(contrato.categoria)
      ));

      celulaFornecedor.appendChild(criarCelulaSimples(
        contrato.fornecedor || "Fornecedor não informado",
        contrato.gestor_fiscal || "Gestor/fiscal não informado"
      ));

      celulaProcesso.appendChild(criarCelulaSimples(
        contrato.processo || "Processo não informado",
        contrato.modalidade || "Modalidade não informada"
      ));

      celulaVigencia.appendChild(criarCelulaSimples(
        formatarData(contrato.fim_vigencia),
        "Início: " + formatarData(contrato.inicio_vigencia) + " • " + formatarResumoDias(contrato.situacao.diasRestantes)
      ));

      celulaValor.appendChild(criarCelulaSimples(
        obterTextoValorContrato(contrato),
        contrato.valorTexto ? formatarMoeda(contrato.valor) : "Valor numérico"
      ));

      const situacaoWrap = document.createElement("div");
      situacaoWrap.className = "contracts-table__main";
      situacaoWrap.appendChild(criarBadgeSituacao(contrato));
      if (contrato.status_excel) {
        const apoioStatus = document.createElement("span");
        apoioStatus.className = "contracts-table__sub";
        apoioStatus.textContent = contrato.status_excel;
        situacaoWrap.appendChild(apoioStatus);
      }
      celulaSituacao.appendChild(situacaoWrap);

      linha.appendChild(celulaContrato);
      linha.appendChild(celulaObjeto);
      linha.appendChild(celulaFornecedor);
      linha.appendChild(celulaProcesso);
      linha.appendChild(celulaVigencia);
      linha.appendChild(celulaValor);
      linha.appendChild(celulaSituacao);

      linha.addEventListener("click", function () {
        abrirDrawer(contrato.id);
      });

      linha.addEventListener("keydown", function (evento) {
        if (evento.key === "Enter" || evento.key === " ") {
          evento.preventDefault();
          abrirDrawer(contrato.id);
        }
      });

      tbody.appendChild(linha);
    });

    wrapper.appendChild(tabela);
    nota.textContent = "Clique em uma linha para ver detalhes completos, observações e gestor/fiscal vinculado.";
    secao.appendChild(wrapper);
    secao.appendChild(nota);

    return secao;
  }

  function renderizarNavegacao(grupos) {
    DOM.navCategorias.replaceChildren();

    const categorias = Array.from(grupos.entries()).filter(function (entrada) {
      return entrada[1].length > 0;
    });

    if (!categorias.length) {
      return;
    }

    categorias.forEach(function (entrada, indice) {
      const categoria = entrada[0];
      const contratos = entrada[1];
      const botao = document.createElement("button");

      botao.type = "button";
      botao.className = "category-nav__button";
      if (indice === 0) {
        botao.classList.add("is-active");
      }

      botao.dataset.target = "categoria-" + slugify(categoria);
      botao.innerHTML =
        "<span>" + rotuloCategoria(categoria) + "</span>" +
        "<span class='category-nav__count'>" + contratos.length + "</span>";

      botao.addEventListener("click", function () {
        const destino = document.getElementById(botao.dataset.target);
        if (destino) {
          destino.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });

      DOM.navCategorias.appendChild(botao);
    });
  }

  function observarSecoes() {
    if (state.observador) {
      state.observador.disconnect();
      state.observador = null;
    }

    const botoes = Array.from(DOM.navCategorias.querySelectorAll(".category-nav__button"));
    const secoes = Array.from(DOM.secoesCategorias.querySelectorAll(".category-section"));

    if (!("IntersectionObserver" in window) || !botoes.length || !secoes.length) {
      return;
    }

    state.observador = new IntersectionObserver(function (entradas) {
      const visiveis = entradas.filter(function (entrada) {
        return entrada.isIntersecting;
      }).sort(function (a, b) {
        return Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top);
      });

      if (!visiveis.length) {
        return;
      }

      const alvo = visiveis[0].target.id;

      botoes.forEach(function (botao) {
        botao.classList.toggle("is-active", botao.dataset.target === alvo);
      });
    }, {
      rootMargin: "-30% 0px -55% 0px",
      threshold: [0.2, 0.45, 0.7]
    });

    secoes.forEach(function (secao) {
      state.observador.observe(secao);
    });
  }

  function renderizarSecoes() {
    const grupos = agruparPorCategoria(ordenarContratos(state.filtrados));
    const categoriasComDados = Array.from(grupos.entries()).filter(function (entrada) {
      return entrada[1].length > 0;
    });

    DOM.secoesCategorias.replaceChildren();
    DOM.estadoVazio.hidden = categoriasComDados.length > 0;

    renderizarNavegacao(grupos);

    if (!categoriasComDados.length) {
      observarSecoes();
      return;
    }

    categoriasComDados.forEach(function (entrada) {
      DOM.secoesCategorias.appendChild(criarTabelaCategoria(entrada[0], entrada[1], state.filtrados.length));
    });

    observarSecoes();
  }

  function adicionarItemDrawer(rotulo, valor) {
    if (!valor) {
      return;
    }

    const bloco = document.createElement("dl");
    const titulo = document.createElement("dt");
    const descricao = document.createElement("dd");

    bloco.className = "drawer__item";
    titulo.textContent = rotulo;
    descricao.textContent = valor;
    bloco.appendChild(titulo);
    bloco.appendChild(descricao);
    DOM.drawerGrid.appendChild(bloco);
  }

  function obterContratoPorId(id) {
    return state.contratos.find(function (contrato) {
      return contrato.id === id;
    }) || null;
  }

  function preencherDrawer(contrato) {
    DOM.drawerCategoria.textContent = contrato.categoriaOriginal || rotuloCategoria(contrato.categoria);
    DOM.drawerTitulo.textContent = contrato.numero || "Contrato sem numero";
    DOM.drawerObjeto.textContent = contrato.objeto || "Objeto não informado.";
    DOM.drawerSituacao.className = "status-badge status-badge--" + contrato.situacao.chave;
    DOM.drawerSituacao.textContent = contrato.situacao.rotulo;
    DOM.drawerStatusExcel.textContent = contrato.status_excel || "Sem status no Excel";
    DOM.drawerGrid.replaceChildren();

    adicionarItemDrawer("Fornecedor", contrato.fornecedor || "Não informado");
    adicionarItemDrawer("Processo", contrato.processo || "Não informado");
    adicionarItemDrawer("Modalidade", contrato.modalidade || "Não informada");
    adicionarItemDrawer("Tipo", contrato.tipo || "Não informado");
    adicionarItemDrawer("Ano", contrato.ano ? String(contrato.ano) : "Não informado");
    adicionarItemDrawer("Valor exibido", obterTextoValorContrato(contrato));
    if (contrato.valorTexto) {
      adicionarItemDrawer("Valor numérico base", formatarMoeda(contrato.valor));
    }
    adicionarItemDrawer("Início da vigência", formatarData(contrato.inicio_vigencia));
    adicionarItemDrawer("Fim da vigência", formatarData(contrato.fim_vigencia));
    adicionarItemDrawer("Prazo calculado", formatarResumoDias(contrato.situacao.diasRestantes));
    adicionarItemDrawer("Gestor e fiscal", contrato.gestor_fiscal || "Não informado");
    adicionarItemDrawer("Observações", contrato.observacoes || "Sem observações registradas");
  }

  function abrirDrawer(id) {
    const contrato = obterContratoPorId(id);
    if (!contrato) {
      return;
    }

    state.contratoAbertoId = id;
    preencherDrawer(contrato);
    DOM.drawer.hidden = false;
    DOM.drawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("drawer-open");

    window.requestAnimationFrame(function () {
      DOM.drawer.classList.add("is-open");
    });
  }

  function fecharDrawer() {
    state.contratoAbertoId = "";
    DOM.drawer.classList.remove("is-open");
    DOM.drawer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("drawer-open");

    window.setTimeout(function () {
      if (!DOM.drawer.classList.contains("is-open")) {
        DOM.drawer.hidden = true;
      }
    }, 240);
  }

  function obterCabecalhosCsv() {
    return [
      "Categoria",
      "Ano",
      "Número",
      "Fornecedor",
      "Objeto",
      "Processo",
      "Modalidade",
      "Tipo",
      "Valor",
      "Valor original",
      "Início vigência",
      "Fim vigência",
      "Situação",
      "Status Excel",
      "Observações",
      "Gestor/Fiscal"
    ];
  }

  function serializarLinhasCsv(linhas) {
    return linhas.map(function (linha) {
      return linha.map(escaparCsv).join(";");
    }).join("\r\n");
  }

  function obterLinhaCsv(contrato) {
    return [
      contrato.categoriaOriginal || rotuloCategoria(contrato.categoria),
      contrato.ano || "",
      contrato.numero || "",
      contrato.fornecedor || "",
      contrato.objeto || "",
      contrato.processo || "",
      contrato.modalidade || "",
      contrato.tipo || "",
      (Number(contrato.valor) || 0).toFixed(2).replace(".", ","),
      contrato.valorTexto || "",
      contrato.inicio_vigencia || "",
      contrato.fim_vigencia || "",
      contrato.situacao.rotulo,
      contrato.status_excel || "",
      contrato.observacoes || "",
      contrato.gestor_fiscal || ""
    ];
  }

  function baixarCsv(nomeArquivo, linhas) {
    const blob = new Blob(["\ufeff", serializarLinhasCsv(linhas)], {
      type: "text/csv;charset=utf-8;"
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = nomeArquivo;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.setTimeout(function () {
      window.URL.revokeObjectURL(url);
    }, 1000);
  }

  function exportarRecorteAtual() {
    if (!state.filtrados.length) {
      mostrarMensagem("Não há contratos visíveis para exportar no recorte atual.", "info");
      return;
    }

    const linhas = [obterCabecalhosCsv()].concat(ordenarContratos(state.filtrados).map(obterLinhaCsv));
    baixarCsv("painel-contratos-recorte.csv", linhas);
    mostrarMensagem("CSV do recorte atual gerado com sucesso.", "info");
  }

  function exportarCategoria(categoria) {
    const contratos = ordenarContratos(state.filtrados.filter(function (contrato) {
      return contrato.categoria === categoria;
    }));

    if (!contratos.length) {
      mostrarMensagem("Não há contratos visíveis nesta categoria para exportar.", "info");
      return;
    }

    const linhas = [obterCabecalhosCsv()].concat(contratos.map(obterLinhaCsv));
    baixarCsv("contratos-" + slugify(categoria) + ".csv", linhas);
    mostrarMensagem("CSV da categoria gerado com sucesso.", "info");
  }

  function atualizarPainel() {
    state.filtros = obterFiltrosDoDom();
    sincronizarFiltrosNaUrl();
    state.filtrados = state.contratos.filter(function (contrato) {
      return contratoAtendeFiltros(contrato, state.filtros);
    });

    atualizarMetricas();
    preencherListaVencimentos();
    preencherListaPendencias();
    preencherDistribuicao();
    renderizarSecoes();
    mostrarMensagem("", "info");
  }

  function limparFiltros() {
    state.filtros = {
      processo: "",
      modalidade: "",
      tipo: "",
      ano: "",
      situacao: "",
      ordenacao: "risco",
      busca: ""
    };

    aplicarFiltrosDoEstadoNaInterface();
    atualizarPainel();
  }

  function configurarEventos() {
    DOM.exportarRecorte.addEventListener("click", exportarRecorteAtual);
    DOM.limparFiltros.addEventListener("click", limparFiltros);

    Object.keys(DOM.filtros).forEach(function (chave) {
      const evento = chave === "busca" ? "input" : "change";
      DOM.filtros[chave].addEventListener(evento, atualizarPainel);
    });

    DOM.drawerFechar.addEventListener("click", fecharDrawer);
    DOM.drawer.addEventListener("click", function (evento) {
      if (evento.target && evento.target.getAttribute("data-close-drawer") === "true") {
        fecharDrawer();
      }
    });

    document.addEventListener("keydown", function (evento) {
      if (evento.key === "Escape" && !DOM.drawer.hidden) {
        fecharDrawer();
      }
    });
  }

  function carregarBase() {
    const fonte = obterContratoFonte();

    if (fonte.erro) {
      mostrarMensagem(fonte.erro, "error");
      return false;
    }

    state.ultimaAtualizacao = window.PAINEL_CONTRATOS_DATA.ultimaAtualizacao || "";
    state.origemArquivo = window.PAINEL_CONTRATOS_DATA.origemArquivo || "";
    state.referencia = obterDataReferenciaSegura(state.ultimaAtualizacao);
    state.contratos = fonte.contratos.map(sanearContrato);

    return true;
  }

  function iniciar() {
    if (!carregarBase()) {
      return;
    }

    preencherFiltros();
    lerFiltrosDaUrl();
    aplicarFiltrosDoEstadoNaInterface();
    atualizarHero();
    configurarEventos();
    atualizarPainel();
  }

  iniciar();
})();
