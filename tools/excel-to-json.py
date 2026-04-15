#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import math
import re
from collections import Counter
from datetime import date, datetime
from pathlib import Path
from typing import Iterable
import unicodedata

import pandas as pd


SHEET_NAME = "CONTROLE DE PRAZOS"
PENDING_FIELDS = ("contrato", "valor", "empresa", "data_inicio", "vencimento", "gestor", "fiscal")

STATUS_TEXT_MAP = {
    "NAO ASSINOU": "nao_assinou",
    "NAO INICIOU": "nao_iniciou",
    "PUBLICADO": "publicado",
    "IPHAN": "iphan",
    "EM ANDAMENTO": "em_andamento",
    "ANDAMENTO": "em_andamento",
}

AREA_PREFIX_PATTERNS = (
    ("SMADS", re.compile(r"\bSMADS\s*:\s*", re.IGNORECASE)),
    ("SAUDE", re.compile(r"\b(?:GESTOR\s+)?SAUDE\s*:\s*", re.IGNORECASE)),
)

COMPOSITE_GESTOR_RE = re.compile(
    r"^\s*GEST\s*-?\s*(.*?)\s*/\s*FISC(?:AL|AIS)?\s*-?\s*(.*?)\s*$",
    re.IGNORECASE,
)
EMBEDDED_FISCAL_RE = re.compile(r"\s*-\s*FISC(?:AL|AIS)\s*:\s*", re.IGNORECASE)
DATE_TOKEN_RE = re.compile(r"(\d{1,2}/\d{1,2}/\d{4})")
YEAR_RE = re.compile(r"(20\d{2}|19\d{2})")


def is_blank(value: object) -> bool:
    if value is None:
        return True
    try:
        return bool(pd.isna(value))
    except Exception:
        return False


def clean_text(value: object) -> str | None:
    if is_blank(value):
        return None
    text = str(value).strip()
    return text or None


def normalize_for_match(value: object) -> str:
    text = clean_text(value) or ""
    normalized = unicodedata.normalize("NFKD", text)
    normalized = normalized.encode("ASCII", "ignore").decode("ASCII")
    normalized = re.sub(r"\s+", " ", normalized).strip().upper()
    return normalized


def normalize_upper(value: object, report: Counter, key: str) -> str | None:
    text = clean_text(value)
    if not text:
        return None
    normalized = re.sub(r"\s+", " ", text).upper()
    if normalized != text:
        report[key] += 1
    return normalized


def merge_observations(*parts: object) -> str | None:
    merged: list[str] = []
    seen: set[str] = set()
    for part in parts:
        if is_blank(part):
            continue
        text = re.sub(r"\s+", " ", str(part).strip())
        if text and text not in seen:
            seen.add(text)
            merged.append(text)
    return " | ".join(merged) if merged else None


def unique_join(values: Iterable[str | None], separator: str = "; ") -> str | None:
    ordered: list[str] = []
    seen: set[str] = set()
    for value in values:
        if not value:
            continue
        if value not in seen:
            seen.add(value)
            ordered.append(value)
    return separator.join(ordered) if ordered else None


def fix_invalid_date_token(token: str, report: Counter) -> str:
    if token == "31/09/2026":
        report["datas_invalidas_corrigidas"] += 1
        return "30/09/2026"
    return token


def parse_date_token(token: str) -> str | None:
    try:
        parsed = datetime.strptime(token, "%d/%m/%Y")
    except ValueError:
        return None
    return parsed.date().isoformat()


def detect_status_tokens(text: str) -> list[str]:
    normalized = normalize_for_match(text)
    statuses: list[str] = []
    for source, target in STATUS_TEXT_MAP.items():
        if source in normalized:
            statuses.append(target)
    return list(dict.fromkeys(statuses))


def parse_date_value(value: object, field_name: str, report: Counter) -> tuple[str | None, str | None]:
    if is_blank(value):
        return None, None

    if isinstance(value, pd.Timestamp):
        return value.date().isoformat(), None

    if isinstance(value, datetime):
        return value.date().isoformat(), None

    if isinstance(value, date):
        return value.isoformat(), None

    text = clean_text(value)
    if not text:
        return None, None

    statuses = detect_status_tokens(text)
    date_tokens = DATE_TOKEN_RE.findall(text)
    if date_tokens:
        chosen = date_tokens[0] if field_name == "data_inicio" else date_tokens[-1]
        chosen = fix_invalid_date_token(chosen, report)
        parsed = parse_date_token(chosen)
        if parsed:
            if text != chosen:
                report["datas_extraidas_de_texto"] += 1
            return parsed, unique_join(statuses)

    text_fixed = fix_invalid_date_token(text, report)

    try:
        looks_iso = bool(re.match(r"^\d{4}-\d{2}-\d{2}(?:\s+\d{2}:\d{2}:\d{2})?$", text_fixed))
        parsed = pd.to_datetime(text_fixed, errors="raise", dayfirst=not looks_iso)
    except Exception:
        parsed = None

    if parsed is not None and not pd.isna(parsed):
        if isinstance(parsed, pd.Timestamp):
            return parsed.date().isoformat(), unique_join(statuses)

    if statuses:
        return None, unique_join(statuses)

    return None, None


def sanitize_company(value: object, report: Counter) -> tuple[str | None, str | None]:
    text = clean_text(value)
    if not text:
        return None, None

    statuses = detect_status_tokens(text)
    if statuses:
        report["empresa_convertida_em_status"] += 1
        return None, unique_join(statuses)

    return re.sub(r"\s+", " ", text), None


def parse_number_token(token: str) -> float | None:
    token = re.sub(r"[^\d,.\-]", "", token.strip())
    if not token:
        return None

    token = token.replace("-", "")
    if not token:
        return None

    separators = [match.start() for match in re.finditer(r"[,.]", token)]
    if not separators:
        try:
            return float(token)
        except ValueError:
            return None

    last_sep = separators[-1]
    integer_part = re.sub(r"\D", "", token[:last_sep])
    decimal_part = re.sub(r"\D", "", token[last_sep + 1 :])

    if not decimal_part:
        combined = integer_part or re.sub(r"\D", "", token)
        try:
            return float(combined)
        except ValueError:
            return None

    combined = f"{integer_part or '0'}.{decimal_part}"
    try:
        return float(combined)
    except ValueError:
        return None


def looks_numeric(value: object) -> bool:
    if is_blank(value):
        return False
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return not math.isnan(float(value))
    text = clean_text(value)
    if not text:
        return False
    if re.search(r"[A-Za-zÀ-ÿ]", text):
        return False
    return parse_number_token(text) is not None


def should_swap_value_and_company(value: object, company: object) -> bool:
    value_text = clean_text(value)
    company_text = clean_text(company)
    if not value_text or not company_text:
        return False
    has_letters_in_value = bool(re.search(r"[A-Za-zÀ-ÿ]", value_text))
    return has_letters_in_value and not looks_numeric(value_text) and looks_numeric(company_text)


def parse_value(value: object, report: Counter) -> tuple[float | None, str | None]:
    if is_blank(value):
        return None, None

    if isinstance(value, (int, float)) and not isinstance(value, bool):
        if math.isnan(float(value)):
            return None, None
        return round(float(value), 2), None

    text = clean_text(value)
    if not text:
        return None, None

    normalized = re.sub(r"\s+", " ", text).upper()
    if "DESCONTO" in normalized:
        report["valores_movidos_para_observacoes"] += 1
        return None, text

    if "TARIFA" in normalized:
        report["valores_movidos_para_observacoes"] += 1
        return None, text

    range_tokens = re.findall(r"\d[\d.,]*", text)
    if len(range_tokens) >= 2 and "-" in text:
        parsed_values = [parse_number_token(token) for token in range_tokens]
        parsed_values = [value for value in parsed_values if value is not None]
        if parsed_values:
            report["faixas_de_valor_normalizadas"] += 1
            return round(max(parsed_values), 2), text

    parsed = parse_number_token(text)
    if parsed is not None:
        if re.search(r"[R$.,]", text):
            report["valores_textuais_convertidos"] += 1
        return round(parsed, 2), None

    report["valores_movidos_para_observacoes"] += 1
    return None, text


def extract_area_reference(text: str | None, report: Counter) -> tuple[str | None, str | None]:
    if not text:
        return None, None

    cleaned = text
    areas: list[str] = []
    for area, pattern in AREA_PREFIX_PATTERNS:
        if pattern.search(cleaned):
            areas.append(area)
            cleaned = pattern.sub("", cleaned)

    if areas:
        report["areas_referencia_extraidas"] += 1

    cleaned = re.sub(r"\s+", " ", cleaned).strip(" ,;-")
    return (cleaned or None), unique_join(areas)


def split_manager_and_fiscal(
    gestor_value: object, fiscal_value: object, report: Counter
) -> tuple[str | None, str | None, str | None]:
    gestor_text = clean_text(gestor_value)
    fiscal_text = clean_text(fiscal_value)

    area_refs: list[str | None] = []
    if gestor_text:
        gestor_text, area_ref = extract_area_reference(gestor_text, report)
        area_refs.append(area_ref)
    if fiscal_text:
        fiscal_text, area_ref = extract_area_reference(fiscal_text, report)
        area_refs.append(area_ref)

    if gestor_text:
        composite_match = COMPOSITE_GESTOR_RE.match(gestor_text)
        if composite_match:
            report["gestores_compostos_separados"] += 1
            gestor_text = composite_match.group(1)
            embedded_fiscal = composite_match.group(2)
            fiscal_text = unique_join([embedded_fiscal, fiscal_text], " | ")
        elif EMBEDDED_FISCAL_RE.search(gestor_text):
            report["gestores_compostos_separados"] += 1
            left, right = EMBEDDED_FISCAL_RE.split(gestor_text, maxsplit=1)
            gestor_text = left
            fiscal_text = unique_join([right, fiscal_text], " | ")

    if fiscal_text:
        fiscal_text = re.sub(r"^\s*FISC(?:AL|AIS)?\s*:\s*", "", fiscal_text, flags=re.IGNORECASE)
        fiscal_text = re.sub(r"\s+", " ", fiscal_text).strip(" ,;-")

    gestor = normalize_upper(gestor_text, report, "gestores_normalizados")
    fiscal = normalize_upper(fiscal_text, report, "fiscais_normalizados")
    area_referencia = unique_join(area_refs)
    return gestor, fiscal, area_referencia


def extract_year(*values: object) -> int | None:
    for value in values:
        text = clean_text(value)
        if not text:
            continue
        match = YEAR_RE.search(text)
        if match:
            return int(match.group(1))
    return None


def build_pending_fields(record: dict[str, object]) -> list[str]:
    pending: list[str] = []
    for field in PENDING_FIELDS:
        value = record.get(field)
        if value is None:
            pending.append(field)
    return pending


def clean_row(row_index: int, row: pd.Series, report: Counter) -> dict[str, object]:
    observacoes = clean_text(row.get("OBSERVAÇÕES"))

    value_raw = row.get("VALOR DO CONTRATO R$")
    company_raw = row.get("EMPRESA CONTRATADA")
    if should_swap_value_and_company(value_raw, company_raw):
        value_raw, company_raw = company_raw, value_raw
        report["colunas_invertidas_corrigidas"] += 1

    valor, obs_from_value = parse_value(value_raw, report)
    empresa, company_status = sanitize_company(company_raw, report)

    data_inicio, start_status = parse_date_value(row.get("DATA INÍCIO"), "data_inicio", report)
    vencimento, due_status = parse_date_value(row.get("VENCIMENTO"), "vencimento", report)

    gestor, fiscal, area_referencia = split_manager_and_fiscal(row.get("GESTOR"), row.get("FISCAL"), report)

    dias_status = None
    dias_text = clean_text(row.get("DIAS PARA VENCIMENTO"))
    if dias_text and not dias_text.isdigit():
        dias_status = unique_join(detect_status_tokens(dias_text))

    status_especial = unique_join([start_status, due_status, company_status, dias_status])
    if status_especial:
        report["status_especial_detectado"] += 1

    observacoes = merge_observations(observacoes, obs_from_value)

    contrato = clean_text(row.get("CONTRATO"))
    modalidade = clean_text(row.get("MODALIDADE"))
    processo = clean_text(row.get("PROCESSO Nº"))
    tipo = clean_text(row.get("TIPO"))
    objeto = clean_text(row.get("OBJETO"))
    ano = extract_year(contrato, processo, data_inicio)

    record = {
        "id": row_index + 1,
        "tipo": tipo,
        "modalidade": modalidade,
        "objeto": objeto,
        "processo": processo,
        "contrato": contrato,
        "valor": round(valor, 2) if valor is not None else None,
        "empresa": empresa,
        "data_inicio": data_inicio,
        "vencimento": vencimento,
        "observacoes": observacoes,
        "gestor": gestor,
        "fiscal": fiscal,
        "status_especial": status_especial,
        "ano": ano,
        "area_referencia": area_referencia,
    }

    record["campos_pendentes"] = build_pending_fields(record)
    report["campos_pendentes_total"] += len(record["campos_pendentes"])
    if record["campos_pendentes"]:
        report["registros_com_pendencias"] += 1

    return record


def build_output(records: list[dict[str, object]], source_name: str) -> dict[str, object]:
    return {
        "metadata": {
            "gerado_em": datetime.now().replace(microsecond=0).isoformat(),
            "total_registros": len(records),
            "fonte": source_name,
            "versao": "1.0",
        },
        "contratos": records,
    }


def build_report_text(report: Counter, output: dict[str, object]) -> str:
    lines = [
        "RELATORIO DE LIMPEZA - CONTROLE DE PRAZOS",
        f"Gerado em: {output['metadata']['gerado_em']}",
        f"Fonte: {output['metadata']['fonte']}",
        f"Total de registros: {output['metadata']['total_registros']}",
        "",
        "Resumo das correcoes:",
        f"- Colunas invertidas corrigidas: {report['colunas_invertidas_corrigidas']}",
        f"- Valores textuais convertidos em numericos: {report['valores_textuais_convertidos']}",
        f"- Valores movidos para observacoes: {report['valores_movidos_para_observacoes']}",
        f"- Faixas de valor normalizadas pelo maior valor: {report['faixas_de_valor_normalizadas']}",
        f"- Datas extraidas de campos textuais: {report['datas_extraidas_de_texto']}",
        f"- Datas invalidas corrigidas: {report['datas_invalidas_corrigidas']}",
        f"- Status especiais detectados: {report['status_especial_detectado']}",
        f"- Empresas convertidas em status especial: {report['empresa_convertida_em_status']}",
        f"- Gestores normalizados: {report['gestores_normalizados']}",
        f"- Fiscais normalizados: {report['fiscais_normalizados']}",
        f"- Gestores compostos separados: {report['gestores_compostos_separados']}",
        f"- Areas de referencia extraidas: {report['areas_referencia_extraidas']}",
        f"- Registros com campos pendentes: {report['registros_com_pendencias']}",
        f"- Total de campos pendentes sinalizados: {report['campos_pendentes_total']}",
        "",
        "Observacao:",
        "- O campo 'DIAS PARA VENCIMENTO' nao foi copiado. Ele deve ser recalculado dinamicamente no front-end.",
    ]
    return "\n".join(lines) + "\n"


def run(input_path: Path, output_json: Path, output_report: Path) -> None:
    dataframe = pd.read_excel(input_path, sheet_name=SHEET_NAME)
    report: Counter = Counter()

    cleaned_records = [clean_row(index, row, report) for index, row in dataframe.iterrows()]
    output = build_output(cleaned_records, input_path.name)

    output_json.parent.mkdir(parents=True, exist_ok=True)
    output_report.parent.mkdir(parents=True, exist_ok=True)
    output_json.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    output_report.write_text(build_report_text(report, output), encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Converte a planilha de contratos administrativos em contratos.json para o painel estatico."
    )
    parser.add_argument(
        "--input",
        required=True,
        help="Caminho do arquivo Excel de origem.",
    )
    parser.add_argument(
        "--output-json",
        default="contratos.json",
        help="Caminho do arquivo JSON de saida.",
    )
    parser.add_argument(
        "--output-report",
        default="relatorio_limpeza.txt",
        help="Caminho do relatorio textual de limpeza.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    run(Path(args.input), Path(args.output_json), Path(args.output_report))


if __name__ == "__main__":
    main()
