"""Read-only sector anomaly detection and analysis of sanitized captured requests."""
import argparse
import datetime
import json
from pathlib import Path
from cloud_client import CloudClient


def detect(snapshot, attempts=()):
    sectors = {row["id"]: row for row in snapshot.get("sectors", [])}
    houses = {row["id"]: row for row in snapshot.get("prayer_houses", [])}
    events = {row["id"]: row for row in snapshot.get("events", [])}
    detected_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
    occurrences = []

    def describe(row):
        return {"id": row.get("id"), "nome": row.get("name")} if row else None

    def occurrence(kind, event, house=None, row=None, **extra):
        row = row or {}
        occurrences.append({
            "tipo": kind,
            "evento": describe(event),
            "setor_evento": describe(sectors.get(event.get("sector_id"))) or {"id": event.get("sector_id"), "nome": None},
            "casa": describe(house),
            "setor_casa": describe(sectors.get((house or {}).get("sector_id"))) or {"id": (house or {}).get("sector_id"), "nome": None},
            "data_hora": row.get("created_at") or row.get("timestamp") or event.get("updated_at"),
            "detectado_em": detected_at,
            "usuario_responsavel": row.get("user_id") or row.get("created_by"),
            "registro_id": row.get("id"),
            **extra,
        })

    for event in events.values():
        sid = event.get("sector_id")
        if sid and sid not in sectors:
            occurrence("EVENTO_SETOR_INEXISTENTE", event)
        elif not sid:
            occurrence("EVENTO_SEM_SETOR", event, observacao="Pode ser evento legado; apenas detecção, sem correção.")

    for table in ("attendees", "training_attendees"):
        for row in snapshot.get(table, []):
            event = events.get(row.get("event_id"))
            house = houses.get(row.get("prayer_house_id"))
            if not event:
                occurrence("PRESENCA_EVENTO_INEXISTENTE", {"id": row.get("event_id")}, house, row, tabela=table)
            elif not house:
                occurrence("PRESENCA_CASA_INEXISTENTE", event, {"id": row.get("prayer_house_id")}, row, tabela=table)
            elif not house.get("sector_id"):
                occurrence("PRESENCA_CASA_SEM_SETOR", event, house, row, tabela=table)
            elif house["sector_id"] not in sectors:
                occurrence("PRESENCA_CASA_SETOR_INEXISTENTE", event, house, row, tabela=table)
            elif event.get("sector_id") and house["sector_id"] != event["sector_id"]:
                occurrence("PRESENCA_DIVERGE_SETOR_ATUAL", event, house, row, tabela=table,
                           observacao="Possível histórico após troca de Setor ou bypass; sem trilha da criação não é possível distinguir.")

    # Rejected writes never become attendance rows. Only captured evidence can describe them.
    for attempt in attempts:
        event = attempt.get("event") or events.get(attempt.get("event_id")) or {"id": attempt.get("event_id")}
        house = attempt.get("house") or houses.get(attempt.get("prayer_house_id")) or {"id": attempt.get("prayer_house_id")}
        kind = None
        if not house.get("sector_id"):
            kind = "TENTATIVA_CASA_SEM_SETOR"
        elif event.get("sector_id") and house["sector_id"] != event["sector_id"]:
            kind = "TENTATIVA_CASA_OUTRO_SETOR"
        if kind:
            occurrence(kind, event, house, attempt, origem="REQUISICAO_CAPTURADA",
                       http_status=attempt.get("http_status"), resposta=attempt.get("response"),
                       observacao="Tentativa identificada pelo conteúdo enviado; status HTTP indica se foi recusada.")

    return {"somente_deteccao": True, "detectado_em": detected_at, "ocorrencias": occurrences,
            "limitacoes": [
                "Tentativas recusadas só são detectáveis quando há evidência capturada; não existem como presenças no banco.",
                "Presenças não armazenam o usuário criador; usuário responsável fica nulo quando indisponível.",
                "Divergência atual pode ser histórico legítimo; não prova bypass da interface.",
                "Não detecta bypass que produziu registros coerentes sem trilha de requisição.",
            ]}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--attempts", type=Path, help="JSON sanitized captured attempts from isolation test")
    parser.add_argument("--output", type=Path, default=Path("/tmp/ccb-audit/sector-audit.json"))
    args = parser.parse_args()
    attempts = json.loads(args.attempts.read_text()) if args.attempts else []
    report = detect(CloudClient().snapshot(), attempts)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2))
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()