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

  const AREAS_VALIDAS = [
    "SAUDE",
    "ASSISTENCIA_DESENV_SOCIAL",
    "CULTURA",
    "DESENV_ECONOMICO_SUSTENTAVEL",
    "GESTAO_PLANEJAMENTO",
    "INFRAESTRUTURA_OBRAS",
    "JUSTICA_CIDADANIA",
    "EDUCACAO",
    "TRANSITO_MOBILIDADE",
    "TURISMO_ESPORTE",
    "FAZENDA",
    "GOVERNO_GABINETE_COMUNICACAO"
  ];

  const AREAS_ROTULOS = {
    SAUDE: "Secretaria da Saúde",
    ASSISTENCIA_DESENV_SOCIAL: "Secretaria de Assistência e Desenvolvimento Social",
    CULTURA: "Secretaria de Cultura",
    DESENV_ECONOMICO_SUSTENTAVEL: "Secretaria de Desenvolvimento Econômico Sustentável",
    GESTAO_PLANEJAMENTO: "Secretaria de Gestão e Planejamento",
    INFRAESTRUTURA_OBRAS: "Secretaria de Infraestrutura Urbana e Obras",
    JUSTICA_CIDADANIA: "Secretaria de Justiça e Cidadania",
    EDUCACAO: "Secretaria de Educação",
    TRANSITO_MOBILIDADE: "Secretaria de Trânsito e Mobilidade Urbana",
    TURISMO_ESPORTE: "Secretaria de Turismo e Esporte",
    FAZENDA: "Secretaria Municipal da Fazenda",
    GOVERNO_GABINETE_COMUNICACAO: "Gabinete, Governo e Comunicação"
  };

  const AREAS_DESCRICOES = {
    SAUDE: "Unidades, exames, atendimento clínico e vigilância sanitária.",
    ASSISTENCIA_DESENV_SOCIAL: "Proteção social, acolhimento, CRAS, CREAS e apoio socioassistencial.",
    CULTURA: "Ações culturais, banda municipal e equipamentos de formação cidadã.",
    DESENV_ECONOMICO_SUSTENTAVEL: "Sustentabilidade, transbordo, apoio rural e políticas ambientais.",
    GESTAO_PLANEJAMENTO: "Tecnologia, suprimentos, estrutura administrativa e apoio corporativo.",
    INFRAESTRUTURA_OBRAS: "Pavimentação, drenagem, manutenção urbana e obras estruturantes.",
    JUSTICA_CIDADANIA: "Controle de acesso, cidadania, CEJUSC e apoio institucional jurídico.",
    EDUCACAO: "Rede escolar, merenda, transporte escolar e unidades de ensino.",
    TRANSITO_MOBILIDADE: "Frota, combustíveis, pneus, seguros e serviços de transporte.",
    TURISMO_ESPORTE: "Turismo, eventos, feiras, trilhas e atividades esportivas.",
    FAZENDA: "Arrecadação, carnês, IPTU e relacionamento financeiro institucional.",
    GOVERNO_GABINETE_COMUNICACAO: "Paço municipal, comunicação institucional e órgãos centrais."
  };

  const AREA_POR_OBJETO_EXATO = {
    "SOFTWARE DE GESTAO PUBLICA": "GESTAO_PLANEJAMENTO",
    "AGRICULTURA FAMILIAR": "EDUCACAO",
    OFICINEIROS: "ASSISTENCIA_DESENV_SOCIAL",
    "LIXO HOSPITALAR": "SAUDE",
    "PROFISSIONAIS ESPORTIVOS": "TURISMO_ESPORTE",
    "SISTEMA INFORMATIZADO - 1DOC": "GESTAO_PLANEJAMENTO",
    "TRANSPORTE DE PACIENTES": "SAUDE",
    INTERNET: "GESTAO_PLANEJAMENTO",
    "LOCACAO DE EQUIP DE INFORMATICA": "GESTAO_PLANEJAMENTO",
    "MANUTENCAO EQUIP. DA SAUDE": "SAUDE",
    "MANUTENCAO DE EQUIP. ODONTOLOGICOS": "SAUDE",
    "TELEATENDIMENTO EM PEDIATRIA": "SAUDE",
    "MANUTENCAO EQUIP. DE FISIOTERAPIA": "SAUDE",
    TRILHAS: "TURISMO_ESPORTE",
    "TRANSPORTE FLUVIAL": "TRANSITO_MOBILIDADE",
    "SEGURO DE VEICULOS": "TRANSITO_MOBILIDADE",
    "ARBITRAGEM FUTEBOL": "TURISMO_ESPORTE",
    "MATERIAL DE ENFERMAGEM": "SAUDE",
    "CARRO DE SOM": "TURISMO_ESPORTE",
    "AQUISICAO DE MEDICAMENTOS": "SAUDE",
    "LOCACAO MAO DE OBRA": "GESTAO_PLANEJAMENTO",
    "CONTROLADOR DE ACESSO": "JUSTICA_CIDADANIA",
    "GAS DE COZINHA": "GESTAO_PLANEJAMENTO",
    COMBUSTIVEL: "TRANSITO_MOBILIDADE",
    "PACO MUNICIPAL": "GOVERNO_GABINETE_COMUNICACAO",
    "PACO MUNICIPAL-PREDIO TOLEDO": "GOVERNO_GABINETE_COMUNICACAO",
    "ALMOXARIFADO/ARQUIVO": "GESTAO_PLANEJAMENTO",
    CRAS: "ASSISTENCIA_DESENV_SOCIAL",
    "SERVICO FUNERARIO": "ASSISTENCIA_DESENV_SOCIAL",
    SAICA: "ASSISTENCIA_DESENV_SOCIAL",
    "SAICA*": "ASSISTENCIA_DESENV_SOCIAL",
    "CONSELHO TUTELAR": "ASSISTENCIA_DESENV_SOCIAL",
    "CREDENCIAMENTO BUILT SUIT VIRGINIA CRAS": "ASSISTENCIA_DESENV_SOCIAL",
    "CRED.BUILT SUIT CREAS": "ASSISTENCIA_DESENV_SOCIAL",
    "REFORMA CASA DA CRIANCA": "ASSISTENCIA_DESENV_SOCIAL",
    "AQUISICAO DE UNIFORME BANDA": "CULTURA",
    "BANDA MUNICIPAL": "CULTURA",
    "MOB. CASA DA JUVENTUDE": "CULTURA",
    "CLINICA PET": "DESENV_ECONOMICO_SUSTENTAVEL",
    "EQUIPAMENTOS SUSTENTAVEL": "DESENV_ECONOMICO_SUSTENTAVEL",
    TRANSBORDO: "DESENV_ECONOMICO_SUSTENTAVEL",
    ITESP: "DESENV_ECONOMICO_SUSTENTAVEL",
    "ELETRICA UNIDADE MISTA": "INFRAESTRUTURA_OBRAS",
    "DADE 2018 LOTE 01": "INFRAESTRUTURA_OBRAS",
    "DADE 2018 LOTE 02": "INFRAESTRUTURA_OBRAS",
    "REFORMA DO CAPS": "SAUDE",
    "UBS NOVA IGUAPE": "SAUDE",
    "ELETRICA FESTA DE AGOSTO": "TURISMO_ESPORTE",
    "FORRO IGREJA SAO BENEDITO": "INFRAESTRUTURA_OBRAS",
    "CRECHE JARDIM PRIMAVERA": "EDUCACAO",
    "PAVIMENTACAO JAIRE": "INFRAESTRUTURA_OBRAS",
    "REFORMA TADASHI NAMBA": "EDUCACAO",
    "LIMPEZA PUBLICA": "INFRAESTRUTURA_OBRAS",
    "CONJUNTO HABITACIONAL": "INFRAESTRUTURA_OBRAS",
    "PONTO DE ONIBUS": "INFRAESTRUTURA_OBRAS",
    "INTERTRAVADA GUARICANA": "INFRAESTRUTURA_OBRAS",
    "PAVIMENTACAO INTERTRAVADA": "INFRAESTRUTURA_OBRAS",
    "PAV. CONJUNTO HABITACIONAL": "INFRAESTRUTURA_OBRAS",
    "DRENAGEM BAIRRO GUARICANA": "INFRAESTRUTURA_OBRAS",
    "INTERTRAVADO NOVA IGUAPE": "INFRAESTRUTURA_OBRAS",
    "OBRAS DE ESTABILIZACAO JAIRE": "INFRAESTRUTURA_OBRAS",
    "PEM - BANCO DO BRASIL LOTE 1": "INFRAESTRUTURA_OBRAS",
    "PEM - BANCO DO BRASIL LOTE 2": "INFRAESTRUTURA_OBRAS",
    "PEM - BANCO DO BRASIL LOTE 3": "INFRAESTRUTURA_OBRAS",
    "PEM - BANCO DO BRASIL LOTE 4": "INFRAESTRUTURA_OBRAS",
    "REVITALIZACAO DA ORLA DO MAR PEQUENO - FASE III": "INFRAESTRUTURA_OBRAS",
    "REFORMA ESCOLA AMANCIA": "EDUCACAO",
    "REFORMA DO GINASIO": "TURISMO_ESPORTE",
    "CAMPO DE FUTEBOL NA BARRA": "TURISMO_ESPORTE",
    "CENTRO MULTIUSO DO CANTO DO MORRO": "INFRAESTRUTURA_OBRAS",
    "REFORMA ESCOLA ZELY": "EDUCACAO",
    "ESF AEROPORTO": "SAUDE",
    "DADE 2023": "INFRAESTRUTURA_OBRAS",
    "REFORMA ESF ITIMIRIM": "SAUDE",
    "ESF-ITIMIRIM I": "SAUDE",
    "SETOR DE FISIOTERAPIA": "SAUDE",
    "RESIDENCIA TERAPEUTICA": "SAUDE",
    "REFORMA BENEDITO ROSA FASE II": "EDUCACAO",
    "PAVIMENTACAO JUREIA": "INFRAESTRUTURA_OBRAS",
    "CRED. INSTITUICAO FINANCEIRA": "FAZENDA",
    "CRED. PODA E ROCADA": "INFRAESTRUTURA_OBRAS",
    "CREDENCIAMENTO ESPECIALIDADES MEDICAS (NOVO)": "SAUDE",
    "CHAMADA PUBLICA O.S": "SAUDE",
    "CREDENCIAMENTO LIMPEZA VERAO": "TURISMO_ESPORTE",
    ULTRASON: "SAUDE",
    "EXAMES LABORATORIAIS": "SAUDE",
    ESTRUTURAS: "TURISMO_ESPORTE",
    "CAMARIM, CONTEINER ESCRITORIO": "TURISMO_ESPORTE",
    PNEUS: "TRANSITO_MOBILIDADE",
    SINALIZACAO: "INFRAESTRUTURA_OBRAS",
    "MATERIAL GRAFICO": "GOVERNO_GABINETE_COMUNICACAO",
    GELO: "TURISMO_ESPORTE",
    "OLEO E LUBRIFICANTE": "TRANSITO_MOBILIDADE",
    "AQUISICAO DE SUPLEMENTOS": "SAUDE",
    OXIGENIO: "SAUDE",
    BUFFET: "TURISMO_ESPORTE",
    "CADEIRAS GIRATORIAS": "GESTAO_PLANEJAMENTO",
    "VAN ESPORTE": "TURISMO_ESPORTE",
    "EMPRESA DE ENFERMAGEM": "SAUDE",
    "JORNAL GAZETA": "GOVERNO_GABINETE_COMUNICACAO",
    "MATERIAIS DE ACABAMENTO": "INFRAESTRUTURA_OBRAS",
    "CONFECCAO DE CARNES E IPTU": "FAZENDA",
    "AQUISICAO DE AGUA MINERAL": "GESTAO_PLANEJAMENTO",
    "AGREGADOS MINERAIS": "INFRAESTRUTURA_OBRAS",
    "TRASNSPORTE ESCOLAR ONIBUS": "EDUCACAO",
    "TRANSFORME ESCOLAR KOMBI": "EDUCACAO",
    "TRANSPORTE COLETIVO ZONA RURAL": "TRANSITO_MOBILIDADE",
    TONNER: "GESTAO_PLANEJAMENTO",
    "AR CONDICIONADO": "INFRAESTRUTURA_OBRAS",
    "AR CONDICIONADO SRP": "INFRAESTRUTURA_OBRAS",
    "FEIRA DE GASTRONOMIA": "TURISMO_ESPORTE",
    "BANHEIRO QUIMICO": "TURISMO_ESPORTE",
    "LEVANTAMENTO PETROLEO": "TRANSITO_MOBILIDADE",
    "CARTORIO ELEITORAL": "JUSTICA_CIDADANIA",
    "DELEGACIA - ROCIO": "JUSTICA_CIDADANIA",
    "CEJUSC, FAZ, PUBL E PROTOCOLO": "JUSTICA_CIDADANIA",
    "UNIDADE ESCOLAR DO BAIRRO ICAPARA": "EDUCACAO",
    "CENTRO DE FORMACAO EDUCACIONAL": "EDUCACAO",
    "LOCACAO PREDIO VIGILANCIA SANITARIA": "SAUDE",
    "DEP. CULT. TURISMO E EVENTOS": "TURISMO_ESPORTE"
  };

  const PALAVRAS_CHAVE_AREA = {
    SAUDE: ["UBS", "CAPS", "ESF", "SAUDE", "ENFERMAG", "MEDIC", "ODONTO", "FISIOTERAP", "PEDIATR", "LABORAT", "OXIGEN", "VIGILANCIA SANITARIA", "UNIDADE MISTA"],
    ASSISTENCIA_DESENV_SOCIAL: ["CRAS", "CREAS", "CONSELHO TUTELAR", "SAICA", "FUNERARIO", "ASSISTENCIA", "SOCIAL", "CASA DA CRIANCA"],
    CULTURA: ["BANDA", "CULTURA", "JUVENTUDE"],
    DESENV_ECONOMICO_SUSTENTAVEL: ["PET", "SUSTENT", "TRANSBORDO", "ITESP"],
    GESTAO_PLANEJAMENTO: ["GESTAO PUBLICA", "1DOC", "INTERNET", "INFORMATICA", "ALMOXARIFADO", "ARQUIVO", "TONNER", "AGUA MINERAL", "CADEIRAS GIRATORIAS", "LOCACAO MAO DE OBRA", "GAS DE COZINHA"],
    INFRAESTRUTURA_OBRAS: ["PAVIMENT", "DRENAGEM", "OBRA", "REFORMA", "REVITALIZ", "INTERTRAV", "HABITACIONAL", "PONTO DE ONIBUS", "ACABAMENTO", "AGREGADOS", "SINALIZACAO", "LIMPEZA PUBLICA", "PODA", "ROCADA", "AR CONDICIONADO", "FORRO"],
    JUSTICA_CIDADANIA: ["CEJUSC", "CARTORIO ELEITORAL", "DELEGACIA", "JUSTICA", "CIDADANIA", "CONTROLADOR DE ACESSO"],
    EDUCACAO: ["ESCOLA", "CRECHE", "ESCOLAR", "FORMACAO EDUCACIONAL", "MERENDA", "AGRICULTURA FAMILIAR"],
    TRANSITO_MOBILIDADE: ["PNEU", "COMBUST", "LUBRIFIC", "OLEO", "VEICUL", "TRANSPORTE FLUVIAL", "TRANSPORTE COLETIVO", "TRANSITO", "MOBILIDADE"],
    TURISMO_ESPORTE: ["EVENTO", "FESTA", "FEIRA", "CAMARIM", "BUFFET", "GELO", "BANHEIRO QUIMICO", "CARRO DE SOM", "TRILHAS", "ARBITRAGEM", "ESTRUTURAS", "ESPORTE", "GINASIO", "FUTEBOL"],
    FAZENDA: ["IPTU", "CARNE", "INSTITUICAO FINANCEIRA", "FAZENDA"],
    GOVERNO_GABINETE_COMUNICACAO: ["PACO MUNICIPAL", "GOVERNO", "GABINETE", "COMUNICACAO", "JORNAL", "MATERIAL GRAFICO"]
  };

  const GESTORES_REFERENCIA_SECRETARIA = [
    { secretaria: "FAZENDA", termos: ["ANGELO ROSA VIEIRA", "EDSON LUIZ NOVAIS MACHADO"] },
    { secretaria: "JUSTICA_CIDADANIA", termos: ["ANTONIO MATHEUS DA VEIGA NETO"] },
    { secretaria: "TURISMO_ESPORTE", termos: ["ANISIA LOURENCO MENDES", "ANISIA LOURENCO", "FERNANDO EIJI YANAGUIZAWA"] },
    { secretaria: "CULTURA", termos: ["ODAIL GOMES", "ODA GOMES"] },
    { secretaria: "DESENV_ECONOMICO_SUSTENTAVEL", termos: ["SELMA XAVIER PONTES"] },
    { secretaria: "SAUDE", termos: ["ANA LETICIA CARDOSO MORAIS", "FERNANDO RORATO", "VICTOR PEREIRA DE MATOS", "KARIMY DE RAMOS AGUIAR"] },
    { secretaria: "ASSISTENCIA_DESENV_SOCIAL", termos: ["ISABELLE MARTINS BENETTI", "VIRGINIA LUCIA", "SAMUEL ROBERTO"] },
    { secretaria: "EDUCACAO", termos: ["FABIANO JOSE DE OLIVEIRA XAVIER", "CINDI MOREIRA CUNHA", "LUCIANO PEREIRA VIANA", "THALES KODI NAMBA"] },
    { secretaria: "TRANSITO_MOBILIDADE", termos: ["IBANES SOUZA VIEIRA", "VICTOR GOMES DIAS"] },
    { secretaria: "INFRAESTRUTURA_OBRAS", termos: ["RICARDO OLIVEIRA RAGNI", "RAFAEL DE BARROS LEITE"] },
    { secretaria: "GOVERNO_GABINETE_COMUNICACAO", termos: ["ADMINISTRACAO", "CELIO PAULO", "ERIKA SILVA OISHI"] }
  ];

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
    area: "area",
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
    resumoAreas: document.getElementById("resumo-areas"),
    mensagemStatus: document.getElementById("mensagem-status"),
    estadoVazio: document.getElementById("estado-vazio"),
    gradeAreas: document.getElementById("grade-areas"),
    navCategorias: document.getElementById("nav-categorias"),
    listaVencimentos: document.getElementById("lista-vencimentos"),
    listaPendencias: document.getElementById("lista-pendencias"),
    listaDadosPendentes: document.getElementById("lista-dados-pendentes"),
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
      semVigenciaMeta: document.getElementById("metrica-sem-vigencia-meta"),
      pendencias: document.getElementById("metrica-pendencias"),
      pendenciasMeta: document.getElementById("metrica-pendencias-meta")
    },
    filtros: {
      processo: document.getElementById("filtro-processo"),
      modalidade: document.getElementById("filtro-modalidade"),
      tipo: document.getElementById("filtro-tipo"),
      ano: document.getElementById("filtro-ano"),
      area: document.getElementById("filtro-area"),
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
      area: "",
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

  function normalizarParaMaiusculas(valor) {
    return String(valor || "").trim().toLocaleUpperCase("pt-BR");
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

  function rotuloArea(valor) {
    return AREAS_ROTULOS[valor] || AREAS_ROTULOS.GOVERNO_GABINETE_COMUNICACAO;
  }

  function descricaoArea(valor) {
    return AREAS_DESCRICOES[valor] || AREAS_DESCRICOES.GOVERNO_GABINETE_COMUNICACAO;
  }

  function obterCategoriaNormalizada(categoria) {
    const normalizada = normalizarTexto(categoria);
    return CATEGORIAS_VALIDAS.includes(normalizada) ? normalizada : "OUTROS";
  }

  function contemAlgumaExpressao(texto, expressoes) {
    return expressoes.some(function (expressao) {
      return texto.includes(expressao);
    });
  }

  function inferirSecretariaPorGestor(gestorFiscal) {
    const gestorNormalizado = normalizarTexto(gestorFiscal);

    if (!gestorNormalizado) {
      return "";
    }

    const grupo = GESTORES_REFERENCIA_SECRETARIA.find(function (item) {
      return item.termos.some(function (termo) {
        return gestorNormalizado.includes(termo);
      });
    });

    return grupo ? grupo.secretaria : "";
  }

  function inferirAreaTematica(item) {
    const objeto = normalizarTexto(item.objeto);
    const secretariaPorGestor = inferirSecretariaPorGestor(item.gestor_fiscal);

    if (AREA_POR_OBJETO_EXATO[objeto]) {
      return AREA_POR_OBJETO_EXATO[objeto];
    }

    if (contemAlgumaExpressao(objeto, PALAVRAS_CHAVE_AREA.SAUDE)) {
      return "SAUDE";
    }

    if (contemAlgumaExpressao(objeto, PALAVRAS_CHAVE_AREA.ASSISTENCIA_DESENV_SOCIAL)) {
      return "ASSISTENCIA_DESENV_SOCIAL";
    }

    if (contemAlgumaExpressao(objeto, PALAVRAS_CHAVE_AREA.CULTURA)) {
      return "CULTURA";
    }

    if (contemAlgumaExpressao(objeto, PALAVRAS_CHAVE_AREA.DESENV_ECONOMICO_SUSTENTAVEL)) {
      return "DESENV_ECONOMICO_SUSTENTAVEL";
    }

    if (contemAlgumaExpressao(objeto, PALAVRAS_CHAVE_AREA.GESTAO_PLANEJAMENTO)) {
      return "GESTAO_PLANEJAMENTO";
    }

    if (contemAlgumaExpressao(objeto, PALAVRAS_CHAVE_AREA.JUSTICA_CIDADANIA)) {
      return "JUSTICA_CIDADANIA";
    }

    if (contemAlgumaExpressao(objeto, PALAVRAS_CHAVE_AREA.EDUCACAO)) {
      return "EDUCACAO";
    }

    if (contemAlgumaExpressao(objeto, PALAVRAS_CHAVE_AREA.INFRAESTRUTURA_OBRAS)) {
      return "INFRAESTRUTURA_OBRAS";
    }

    if (contemAlgumaExpressao(objeto, PALAVRAS_CHAVE_AREA.TRANSITO_MOBILIDADE)) {
      return "TRANSITO_MOBILIDADE";
    }

    if (contemAlgumaExpressao(objeto, PALAVRAS_CHAVE_AREA.TURISMO_ESPORTE)) {
      return "TURISMO_ESPORTE";
    }

    if (contemAlgumaExpressao(objeto, PALAVRAS_CHAVE_AREA.FAZENDA)) {
      return "FAZENDA";
    }

    if (contemAlgumaExpressao(objeto, PALAVRAS_CHAVE_AREA.GOVERNO_GABINETE_COMUNICACAO)) {
      return "GOVERNO_GABINETE_COMUNICACAO";
    }

    if (secretariaPorGestor) {
      return secretariaPorGestor;
    }

    return "GOVERNO_GABINETE_COMUNICACAO";
  }

  function comporIndiceBusca(item) {
    return normalizarTexto([
      rotuloArea(item.area),
      item.categoriaOriginal,
      rotuloCategoria(item.categoria),
      item.numero,
      item.fornecedor,
      item.objeto,
      item.processo,
      item.modalidade,
      item.tipo,
      item.observacoes,
      item.gestor_fiscal,
      item.status_excel,
      item.resumoPendenciasCadastro,
      (item.pendenciasCadastro || []).join(" ")
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
      gestor_fiscal: normalizarParaMaiusculas(item.gestor_fiscal)
    };

    contratoBase.area = inferirAreaTematica(contratoBase);
    contratoBase.pendenciasCadastro = listarPendenciasCadastro(contratoBase);
    contratoBase.pendenteCadastro = contratoBase.pendenciasCadastro.length > 0;
    contratoBase.resumoPendenciasCadastro = resumirPendenciasCadastro(contratoBase);

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
      if (valor && typeof valor === "object") {
        opcao.value = String(valor.value || "");
        opcao.textContent = String(valor.label || valor.value || "");
      } else {
        opcao.value = valor;
        opcao.textContent = valor;
      }
      elemento.appendChild(opcao);
    });

    const valoresDisponiveis = valores.map(function (valor) {
      return valor && typeof valor === "object" ? String(valor.value || "") : String(valor);
    });

    elemento.value = valorAtual && valoresDisponiveis.includes(valorAtual) ? valorAtual : "";
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

    const areas = AREAS_VALIDAS.filter(function (area) {
      return state.contratos.some(function (contrato) {
        return contrato.area === area;
      });
    }).map(function (area) {
      return {
        value: area,
        label: rotuloArea(area)
      };
    });

    popularSelect(DOM.filtros.processo, processos, "Todos os processos");
    popularSelect(DOM.filtros.modalidade, modalidades, "Todas as modalidades");
    popularSelect(DOM.filtros.tipo, tipos, "Todos os tipos");
    popularSelect(DOM.filtros.ano, anos, "Todos os anos");
    popularSelect(DOM.filtros.area, areas, "Todas as secretarias");
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

    if (DOM.metaOrigem) {
      DOM.metaOrigem.textContent = state.origemArquivo || "Não informado";
    }
    DOM.fatoTotalCadastro.textContent = String(state.contratos.length);
    DOM.fatoTotalCadastroMeta.textContent = state.contratos.length === 1
      ? "1 contrato registrado na base"
      : state.contratos.length + " contratos registrados na base";
    DOM.fatoCobertura.textContent = obterCoberturaAnos(state.contratos);
    DOM.fatoCoberturaMeta.textContent = "Intervalo anual encontrado no cadastro";

    const areasComDados = new Set(state.contratos.map(function (contrato) {
      return contrato.area;
    })).size;
    DOM.fatoCategorias.textContent = String(areasComDados);
    DOM.fatoCategoriasMeta.textContent = areasComDados === 1
      ? "1 secretaria com contratos"
      : areasComDados + " secretarias e órgãos centrais com contratos";
  }

  function obterFiltrosDoDom() {
    return {
      processo: DOM.filtros.processo.value,
      modalidade: DOM.filtros.modalidade.value,
      tipo: DOM.filtros.tipo.value,
      ano: DOM.filtros.ano.value,
      area: DOM.filtros.area.value,
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
    DOM.filtros.area.value = state.filtros.area;
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

    if (filtros.area && contrato.area !== filtros.area) {
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

  function agruparPorArea(contratos) {
    const mapa = new Map();

    AREAS_VALIDAS.forEach(function (area) {
      mapa.set(area, []);
    });

    contratos.forEach(function (contrato) {
      if (!mapa.has(contrato.area)) {
        mapa.set(contrato.area, []);
      }
      mapa.get(contrato.area).push(contrato);
    });

    return mapa;
  }

  function obterContratosParaGradeAreas() {
    const filtrosSemArea = Object.assign({}, state.filtros, {
      area: ""
    });

    return state.contratos.filter(function (contrato) {
      return contratoAtendeFiltros(contrato, filtrosSemArea);
    });
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

  function listarPendenciasCadastro(contrato) {
    const pendencias = [];
    const exigeDadosContratuais = contrato.status_excel === "VIGENTE" ||
      contrato.status_excel === "ENCERRADO" ||
      Boolean(
        contrato.numero ||
        contrato.fornecedor ||
        contrato.inicio_vigencia ||
        contrato.fim_vigencia ||
        contrato.valorTexto ||
        Number(contrato.valor)
      );

    if (!contrato.objeto) {
      pendencias.push("Objeto");
    }

    if (!contrato.processo) {
      pendencias.push("Processo");
    }

    if (!contrato.modalidade) {
      pendencias.push("Modalidade");
    }

    if (exigeDadosContratuais) {
      if (!contrato.numero) {
        pendencias.push("Número");
      }

      if (!contrato.fornecedor) {
        pendencias.push("Fornecedor");
      }

      if (!(Number(contrato.valor) > 0 || contrato.valorTexto)) {
        pendencias.push("Valor");
      }

      if (!contrato.inicio_vigencia) {
        pendencias.push("Início da vigência");
      }

      if (!contrato.fim_vigencia) {
        pendencias.push("Fim da vigência");
      }
    }

    if ((contrato.status_excel === "VIGENTE" || contrato.status_excel === "ENCERRADO") && !contrato.gestor_fiscal) {
      pendencias.push("Gestor/Fiscal");
    }

    return pendencias;
  }

  function resumirPendenciasCadastro(contrato) {
    if (!contrato.pendenciasCadastro.length) {
      return "Cadastro completo";
    }

    return "Pendente: " + contrato.pendenciasCadastro.join(", ");
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
      pendenciasCadastro: contratos.filter(function (contrato) {
        return contrato.pendenteCadastro;
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
    DOM.metricas.pendencias.textContent = String(metricas.pendenciasCadastro);
    DOM.metricas.pendenciasMeta.textContent = metricas.pendenciasCadastro === 1
      ? "1 cadastro com campo relevante ausente"
      : metricas.pendenciasCadastro + " cadastros com campos relevantes ausentes";

    DOM.resumoGeral.textContent =
      metricas.ativos + " ativos, " +
      metricas.pendenciasCadastro + " com pendência cadastral, " +
      metricas.semVigencia + " sem vigência e " +
      metricas.encerrado + " encerrados no recorte atual.";

    DOM.resumoFiltros.textContent =
      "Recorte com " +
      metricas.total +
      (metricas.total === 1 ? " contrato visível" : " contratos visíveis") +
      ", ordenado por " + rotuloOrdenacao(state.filtros.ordenacao).toLowerCase() + ".";
  }

  function criarChipArea(texto) {
    const chip = document.createElement("span");
    chip.className = "area-card__fact";
    if (String(texto || "").trim().startsWith("R$")) {
      chip.classList.add("area-card__fact--value");
    }
    chip.textContent = texto;
    return chip;
  }

  function renderizarGradeAreas() {
    const contratosBase = obterContratosParaGradeAreas();
    const grupos = agruparPorArea(contratosBase);
    const totalBase = contratosBase.length;

    DOM.gradeAreas.replaceChildren();
    DOM.resumoAreas.textContent = totalBase
      ? "Os cards abaixo respeitam os filtros atuais e ajudam a alternar a leitura por secretaria responsável."
      : "Nenhum contrato atende aos filtros atuais; ajuste o recorte para visualizar as secretarias mapeadas.";

    AREAS_VALIDAS.forEach(function (area) {
      const contratos = ordenarContratos(grupos.get(area) || []);
      const botao = document.createElement("button");
      const topo = document.createElement("div");
      const titulo = document.createElement("strong");
      const contador = document.createElement("span");
      const descricao = document.createElement("p");
      const fatos = document.createElement("div");
      const valorTotal = contratos.reduce(function (acumulado, contrato) {
        return acumulado + (Number(contrato.valor) || 0);
      }, 0);
      const urgentes = contratos.filter(function (contrato) {
        return contrato.situacao.chave === "urgente";
      }).length;
      const pendentes = contratos.filter(function (contrato) {
        return contrato.pendenteCadastro;
      }).length;
      const categoriasInternas = new Set(contratos.map(function (contrato) {
        return contrato.categoria;
      })).size;

      botao.type = "button";
      botao.className = "area-card";
      if (state.filtros.area === area) {
        botao.classList.add("is-active");
      }
      if (!contratos.length && state.filtros.area !== area) {
        botao.disabled = true;
      }

      topo.className = "area-card__topline";
      titulo.className = "area-card__title";
      contador.className = "area-card__count";
      descricao.className = "area-card__description";
      fatos.className = "area-card__facts";

      titulo.textContent = rotuloArea(area);
      contador.textContent = String(contratos.length);
      descricao.textContent = descricaoArea(area);

      fatos.appendChild(criarChipArea(formatarMoeda(valorTotal)));
      fatos.appendChild(criarChipArea(
        urgentes + (urgentes === 1 ? " urgente" : " urgentes")
      ));
      fatos.appendChild(criarChipArea(
        pendentes + (pendentes === 1 ? " pendência" : " pendências")
      ));
      fatos.appendChild(criarChipArea(
        categoriasInternas + (categoriasInternas === 1 ? " categoria" : " categorias")
      ));

      topo.appendChild(titulo);
      topo.appendChild(contador);
      botao.appendChild(topo);
      botao.appendChild(descricao);
      botao.appendChild(fatos);
      botao.setAttribute("aria-pressed", state.filtros.area === area ? "true" : "false");

      botao.addEventListener("click", function () {
        DOM.filtros.area.value = state.filtros.area === area ? "" : area;
        atualizarPainel();
      });

      DOM.gradeAreas.appendChild(botao);
    });
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

  function preencherListaDadosPendentes() {
    const itens = state.filtrados.filter(function (contrato) {
      return contrato.pendenteCadastro;
    }).slice().sort(function (a, b) {
      const diferenca = b.pendenciasCadastro.length - a.pendenciasCadastro.length;
      if (diferenca !== 0) {
        return diferenca;
      }

      return obterComparador(state.filtros.ordenacao)(a, b);
    }).slice(0, 6);

    DOM.listaDadosPendentes.replaceChildren();

    if (!itens.length) {
      DOM.listaDadosPendentes.appendChild(criarItemListaVazio("Não há contratos com pendência cadastral no recorte atual."));
      return;
    }

    itens.forEach(function (contrato) {
      DOM.listaDadosPendentes.appendChild(criarItemLista(
        contrato,
        contrato.pendenciasCadastro.join(", ")
      ));
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

  function criarTabelaArea(area, contratos, totalVisivel) {
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
    const pendentes = contratos.filter(function (contrato) {
      return contrato.pendenteCadastro;
    }).length;
    const categoriasInternas = new Set(contratos.map(function (contrato) {
      return contrato.categoria;
    })).size;
    const percentual = totalVisivel ? Math.round((contratos.length / totalVisivel) * 100) : 0;

    secao.className = "category-section";
    secao.id = "area-" + slugify(area);
    cabecalho.className = "category-section__head";
    titulo.className = "category-section__title";
    meta.className = "category-section__meta";
    fatos.className = "category-section__facts";
    acoes.className = "category-section__actions";
    wrapper.className = "table-wrap";
    tabela.className = "contracts-table";
    nota.className = "results-note";

    titulo.textContent = rotuloArea(area);
    meta.textContent = contratos.length + (contratos.length === 1 ? " contrato" : " contratos") +
      " nesta secretaria • " + percentual + "% do recorte";

    [
      contratos.length + " visíveis",
      formatarMoeda(totalValor),
      pendentes + (pendentes === 1 ? " com pendência cadastral" : " com pendências cadastrais"),
      categoriasInternas + (categoriasInternas === 1 ? " categoria interna" : " categorias internas"),
      urgentes + " em risco imediato"
    ].forEach(function (texto) {
      const pill = document.createElement("span");
      pill.className = "category-section__fact";
      if (String(texto || "").trim().startsWith("R$")) {
        pill.classList.add("category-section__fact--value");
      }
      pill.textContent = texto;
      fatos.appendChild(pill);
    });

    botaoExportar.type = "button";
    botaoExportar.className = "button button--section";
    botaoExportar.textContent = "Exportar secretaria";
    botaoExportar.addEventListener("click", function () {
      exportarArea(area);
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
      const detalheSituacao = [
        contrato.status_excel || "",
        contrato.pendenteCadastro ? contrato.resumoPendenciasCadastro : ""
      ].filter(Boolean).join(" • ");

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
      celulaValor.className = "contracts-table__cell--value";

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
        ""
      ));

      const situacaoWrap = document.createElement("div");
      situacaoWrap.className = "contracts-table__main";
      situacaoWrap.appendChild(criarBadgeSituacao(contrato));
      if (contrato.pendenteCadastro) {
        const pendenciaChip = document.createElement("span");
        pendenciaChip.className = "status-chip status-chip--pending-data";
        pendenciaChip.textContent = "Dados pendentes";
        situacaoWrap.appendChild(pendenciaChip);
      }
      if (detalheSituacao) {
        const apoioStatus = document.createElement("span");
        apoioStatus.className = "contracts-table__sub";
        apoioStatus.textContent = detalheSituacao;
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

    const areas = Array.from(grupos.entries()).filter(function (entrada) {
      return entrada[1].length > 0;
    });

    if (!areas.length) {
      return;
    }

    areas.forEach(function (entrada, indice) {
      const area = entrada[0];
      const contratos = entrada[1];
      const botao = document.createElement("button");

      botao.type = "button";
      botao.className = "category-nav__button";
      if (indice === 0) {
        botao.classList.add("is-active");
      }

      botao.dataset.target = "area-" + slugify(area);
      botao.innerHTML =
        "<span>" + rotuloArea(area) + "</span>" +
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
    const grupos = agruparPorArea(ordenarContratos(state.filtrados));
    const areasComDados = Array.from(grupos.entries()).filter(function (entrada) {
      return entrada[1].length > 0;
    });

    DOM.secoesCategorias.replaceChildren();
    DOM.estadoVazio.hidden = areasComDados.length > 0;

    renderizarNavegacao(grupos);

    if (!areasComDados.length) {
      observarSecoes();
      return;
    }

    areasComDados.forEach(function (entrada) {
      DOM.secoesCategorias.appendChild(criarTabelaArea(entrada[0], entrada[1], state.filtrados.length));
    });

    observarSecoes();
  }

  function adicionarItemDrawer(rotulo, valor, semQuebra) {
    if (!valor) {
      return;
    }

    const bloco = document.createElement("dl");
    const titulo = document.createElement("dt");
    const descricao = document.createElement("dd");

    bloco.className = "drawer__item";
    if (semQuebra) {
      bloco.classList.add("drawer__item--value");
    }
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
    DOM.drawerCategoria.textContent = rotuloArea(contrato.area);
    DOM.drawerTitulo.textContent = contrato.numero || "Contrato sem numero";
    DOM.drawerObjeto.textContent = contrato.objeto || "Objeto não informado.";
    DOM.drawerSituacao.className = "status-badge status-badge--" + contrato.situacao.chave;
    DOM.drawerSituacao.textContent = contrato.situacao.rotulo;
    DOM.drawerStatusExcel.textContent = contrato.status_excel || "Sem status no Excel";
    DOM.drawerGrid.replaceChildren();

    adicionarItemDrawer("Secretaria responsável", rotuloArea(contrato.area));
    adicionarItemDrawer("Categoria licitatória", contrato.categoriaOriginal || rotuloCategoria(contrato.categoria));
    adicionarItemDrawer("Fornecedor", contrato.fornecedor || "Não informado");
    adicionarItemDrawer("Processo", contrato.processo || "Não informado");
    adicionarItemDrawer("Modalidade", contrato.modalidade || "Não informada");
    adicionarItemDrawer("Tipo", contrato.tipo || "Não informado");
    adicionarItemDrawer("Ano", contrato.ano ? String(contrato.ano) : "Não informado");
    adicionarItemDrawer("Valor exibido", obterTextoValorContrato(contrato), true);
    adicionarItemDrawer("Início da vigência", formatarData(contrato.inicio_vigencia));
    adicionarItemDrawer("Fim da vigência", formatarData(contrato.fim_vigencia));
    adicionarItemDrawer("Prazo calculado", formatarResumoDias(contrato.situacao.diasRestantes));
    adicionarItemDrawer("Gestor e fiscal", contrato.gestor_fiscal || "Não informado");
    adicionarItemDrawer("Pendências de cadastro", contrato.resumoPendenciasCadastro);
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
      "Secretaria responsável",
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
      "Pendências cadastrais",
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
      rotuloArea(contrato.area),
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
      contrato.pendenciasCadastro.join(", "),
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

  function exportarArea(area) {
    const contratos = ordenarContratos(state.filtrados.filter(function (contrato) {
      return contrato.area === area;
    }));

    if (!contratos.length) {
      mostrarMensagem("Não há contratos visíveis nesta secretaria para exportar.", "info");
      return;
    }

    const linhas = [obterCabecalhosCsv()].concat(contratos.map(obterLinhaCsv));
    baixarCsv("contratos-" + slugify(area) + ".csv", linhas);
    mostrarMensagem("CSV da secretaria gerado com sucesso.", "info");
  }

  function atualizarPainel() {
    state.filtros = obterFiltrosDoDom();
    sincronizarFiltrosNaUrl();
    state.filtrados = state.contratos.filter(function (contrato) {
      return contratoAtendeFiltros(contrato, state.filtros);
    });

    atualizarMetricas();
    renderizarGradeAreas();
    preencherListaVencimentos();
    preencherListaPendencias();
    preencherListaDadosPendentes();
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
      area: "",
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
