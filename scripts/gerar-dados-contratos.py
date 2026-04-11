#!/usr/bin/env python3
"""Gera contratos-data.js a partir de um workbook .xlsx consolidado."""

from __future__ import annotations

import argparse
import json
import re
import unicodedata
from collections import Counter
from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Iterable, List, Optional
from xml.etree import ElementTree as ET
from zipfile import ZipFile


XML_NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
REL_NS = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
PKG_REL_NS = "{http://schemas.openxmlformats.org/package/2006/relationships}"
STATUS_ORDER = (
    "ENCERRADO",
    "SUSPENSO",
    "FRACASSADO",
    "PUBLICADO",
    "LICITANDO",
    "EM ANDAMENTO",
)


@dataclass
class WorkbookSheet:
    name: str
    path: str


def normalize_text(value: object) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def normalize_lookup(value: object) -> str:
    text = normalize_text(value)
    normalized = unicodedata.normalize("NFD", text)
    return "".join(
        char for char in normalized
        if unicodedata.category(char) != "Mn"
    ).upper()


def load_shared_strings(archive: ZipFile) -> List[str]:
    path = "xl/sharedStrings.xml"
    if path not in archive.namelist():
        return []

    root = ET.fromstring(archive.read(path))
    values: List[str] = []
    for item in root.findall(f"{XML_NS}si"):
        values.append(normalize_text("".join(item.itertext())))
    return values


def workbook_sheets(archive: ZipFile) -> List[WorkbookSheet]:
    workbook = ET.fromstring(archive.read("xl/workbook.xml"))
    relationships = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
    rel_map = {
        rel.attrib["Id"]: rel.attrib["Target"]
        for rel in relationships.findall(f"{PKG_REL_NS}Relationship")
    }

    sheets: List[WorkbookSheet] = []
    for node in workbook.findall(f"{XML_NS}sheets/{XML_NS}sheet"):
        rel_id = node.attrib.get(f"{REL_NS}id")
        target = rel_map.get(rel_id or "", "")
        if not target:
            continue
        target = target.lstrip("/")
        if target.startswith("xl/"):
            resolved_target = target
        else:
            resolved_target = "xl/" + target
        if not resolved_target.startswith("xl/worksheets/"):
            continue
        sheets.append(WorkbookSheet(
            name=node.attrib.get("name", ""),
            path=resolved_target,
        ))
    return sheets


def cell_column(cell_ref: str) -> str:
    match = re.match(r"[A-Z]+", cell_ref)
    return match.group(0) if match else ""


def cell_text(cell: ET.Element, shared_strings: List[str]) -> str:
    cell_type = cell.attrib.get("t", "")
    inline = cell.find(f"{XML_NS}is")
    if inline is not None:
        return normalize_text("".join(inline.itertext()))

    raw = cell.find(f"{XML_NS}v")
    value = raw.text if raw is not None and raw.text is not None else ""

    if cell_type == "s":
        try:
            return normalize_text(shared_strings[int(value)])
        except (ValueError, IndexError):
            return ""

    return normalize_text(value)


def iter_sheet_rows(archive: ZipFile, sheet_path: str, shared_strings: List[str]) -> Iterable[Dict[str, str]]:
    root = ET.fromstring(archive.read(sheet_path))
    sheet_data = root.find(f"{XML_NS}sheetData")
    if sheet_data is None:
        return []

    rows: List[Dict[str, str]] = []
    for row in list(sheet_data)[1:]:
        values: Dict[str, str] = {}
        for cell in row:
            values[cell_column(cell.attrib.get("r", ""))] = cell_text(cell, shared_strings)
        if any(normalize_text(value) for value in values.values()):
            rows.append(values)
    return rows


def excel_serial_to_iso(value: str) -> str:
    text = normalize_text(value)
    if not text:
        return ""

    if re.fullmatch(r"\d+(?:\.\d+)?", text):
        date_value = datetime(1899, 12, 30) + timedelta(days=float(text))
        return date_value.date().isoformat()

    match = re.search(r"(\d{2}/\d{2}/\d{4})", text)
    if not match:
        return ""

    try:
        return datetime.strptime(match.group(1), "%d/%m/%Y").date().isoformat()
    except ValueError:
        return ""


def parse_value(raw_value: str) -> tuple[float, str]:
    text = normalize_text(raw_value)
    if not text:
        return 0.0, ""

    if detect_status_from_text(text):
        return 0.0, ""

    if re.fullmatch(r"-?\d+(?:\.\d+)?", text):
        return float(text), ""

    if not re.fullmatch(r"[Rr$\d.,\s%-]+", text):
        return 0.0, text

    if "%" in text or text.count("-") > 1 or (" - " in text):
        return 0.0, text

    numeric_text = text.replace(" ", "")
    numeric_text = numeric_text.replace("R$", "").replace("r$", "")
    negative = numeric_text.startswith("-")
    if negative:
        numeric_text = numeric_text[1:]

    separators = [index for index, char in enumerate(numeric_text) if char in ",."]
    digits_only = re.sub(r"[^\d]", "", numeric_text)

    if not digits_only:
        return 0.0, text

    if separators:
        decimal_index = separators[-1]
        integer_part = re.sub(r"[^\d]", "", numeric_text[:decimal_index]) or "0"
        decimal_part = re.sub(r"[^\d]", "", numeric_text[decimal_index + 1:]) or "00"
        if len(decimal_part) == 1:
            decimal_part += "0"
        elif len(decimal_part) > 2:
            decimal_part = decimal_part[:2]
        normalized = f"{integer_part}.{decimal_part}"
    else:
        normalized = digits_only

    if negative:
        normalized = "-" + normalized

    try:
        return float(normalized), ""
    except ValueError:
        return 0.0, text


def detect_status_from_text(text: str) -> str:
    lookup = normalize_lookup(text)
    if "SUSPENSO" in lookup:
        return "SUSPENSO"
    if "FRACASSADO" in lookup:
        return "FRACASSADO"
    if "PUBLICADO" in lookup:
        return "PUBLICADO"
    if "LICITANDO" in lookup:
        return "LICITANDO"
    if "EM ANDAMENTO" in lookup or re.search(r"\bANDAMENTO\b", lookup):
        return "EM ANDAMENTO"
    if "ENCERRADO" in lookup or "FINALIZADO" in lookup:
        return "ENCERRADO"
    return ""


def detect_status(row: Dict[str, str]) -> str:
    for column in ("M", "J", "I", "H", "G"):
        status = detect_status_from_text(row.get(column, ""))
        if status:
            return status
    return "VIGENTE"


def infer_year(*values: str) -> object:
    for value in values:
        match = re.search(r"(19|20)\d{2}", normalize_lookup(value))
        if match:
            return int(match.group(0))
    return ""


def infer_type(contract_number: str) -> str:
    return "Ata" if normalize_lookup(contract_number).startswith("ATA") else "Contrato"


def join_manager_and_inspector(manager: str, inspector: str) -> str:
    parts = []
    manager_value = normalize_text(manager)
    inspector_value = normalize_text(inspector)
    if manager_value:
        parts.append("GESTOR: " + manager_value)
    if inspector_value:
        parts.append("FISCAL: " + inspector_value)
    return " | ".join(parts)


def convert_row(row: Dict[str, str]) -> Dict[str, object]:
    contract_number = normalize_text(row.get("E", ""))
    supplier = normalize_text(row.get("G", ""))
    if detect_status_from_text(supplier) and not contract_number:
        supplier = ""

    value, value_text = parse_value(row.get("F", ""))

    return {
        "ano": infer_year(contract_number, row.get("B", ""), row.get("D", "")),
        "numero": contract_number,
        "fornecedor": supplier,
        "objeto": normalize_text(row.get("C", "")),
        "processo": normalize_text(row.get("D", "")),
        "categoria": normalize_text(row.get("A", "")),
        "modalidade": normalize_text(row.get("B", "")),
        "tipo": infer_type(contract_number),
        "valor": value,
        "valor_texto": value_text,
        "inicio_vigencia": excel_serial_to_iso(row.get("H", "")),
        "fim_vigencia": excel_serial_to_iso(row.get("I", "")),
        "status_excel": detect_status(row),
        "observacoes": normalize_text(row.get("J", "")),
        "gestor_fiscal": join_manager_and_inspector(row.get("K", ""), row.get("L", "")),
    }


def generate_payload(workbook_path: Path) -> Dict[str, object]:
    with ZipFile(workbook_path) as archive:
        sheets = workbook_sheets(archive)
        if not sheets:
            raise RuntimeError("Nenhuma aba legivel foi encontrada no workbook.")

        shared_strings = load_shared_strings(archive)
        rows = list(iter_sheet_rows(archive, sheets[0].path, shared_strings))

    contracts = [convert_row(row) for row in rows]
    return {
        "ultimaAtualizacao": datetime.fromtimestamp(workbook_path.stat().st_mtime).strftime("%Y-%m-%dT%H:%M:%S"),
        "origemArquivo": workbook_path.name,
        "contratos": contracts,
    }


def write_payload(output_path: Path, payload: Dict[str, object]) -> None:
    output = (
        "// Gerado automaticamente por scripts/gerar-dados-contratos.py\n"
        "window.PAINEL_CONTRATOS_DATA = "
        + json.dumps(payload, ensure_ascii=True, separators=(",", ":"))
        + ";\n"
    )
    output_path.write_text(output, encoding="utf-8")


def print_summary(payload: Dict[str, object]) -> None:
    contracts = payload["contratos"]
    categories = Counter(item["categoria"] for item in contracts)
    statuses = Counter(item["status_excel"] for item in contracts)

    print("Arquivo gerado: contratos-data.js")
    print("Origem:", payload["origemArquivo"])
    print("Total de registros:", len(contracts))
    print("Categorias:")
    for category, count in categories.items():
        print(" -", category + ":", count)
    print("Status:")
    for status in STATUS_ORDER:
        if status in statuses:
            print(" -", status + ":", statuses[status])
    if statuses.get("VIGENTE"):
        print(" - VIGENTE:", statuses["VIGENTE"])


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Gera contratos-data.js a partir de um arquivo .xlsx consolidado."
    )
    parser.add_argument(
        "--workbook",
        required=True,
        help="Caminho do workbook .xlsx que sera usado como fonte unica dos dados.",
    )
    parser.add_argument(
        "--output",
        default=str(Path(__file__).resolve().parents[1] / "contratos-data.js"),
        help="Arquivo de saida do payload JavaScript.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    workbook_path = Path(args.workbook).expanduser().resolve()
    output_path = Path(args.output).expanduser().resolve()

    if not workbook_path.is_file():
        raise FileNotFoundError(f"Workbook nao encontrado: {workbook_path}")

    payload = generate_payload(workbook_path)
    write_payload(output_path, payload)
    print_summary(payload)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
