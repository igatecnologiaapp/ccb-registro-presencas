"""Live isolation test: temporary fixtures only; never repairs functional failures."""
import argparse
import datetime
import json
import secrets
import uuid
from pathlib import Path
from cloud_client import CloudClient, TABLES
from sector_audit import detect


LABELS = (
    "Casa do mesmo Setor aceita", "Casa de outro Setor recusada", "Casa sem Setor recusada",
    "Nenhuma presença inválida criada", "Novos registros seguem o Setor B",
    "Histórico preservado", "Limpeza dos dados temporários", "Dados reais preservados",
)


def run(output):
    client = CloudClient()
    output.mkdir(parents=True, exist_ok=True)
    tag = "ZZTESTE-AUTOMATICO-" + datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%dT%H%M%SZ") + "-" + uuid.uuid4().hex[:8]
    manifest_path = output / "manifest.json"
    manifest = {"test_id": tag, "records": [], "auth_user_id": None}
    report = {"test_id": tag, "verificacoes": {label: False for label in LABELS}, "tentativas": [], "falhas": []}
    before = client.snapshot()
    report["contagens_reais_antes"] = {t: len(before[t]) for t in TABLES}

    def persist():
        manifest_path.write_text(json.dumps(manifest, indent=2))

    def create(table, values):
        rid = str(uuid.uuid4())
        manifest["records"].append({"table": table, "id": rid})
        persist()  # Record exact ownership before submitting, including ambiguous network failures.
        return client.checked("POST", f"/rest/v1/{table}", {"id": rid, **values})[0]

    def verify(label, passed):
        report["verificacoes"][label] = bool(passed)
        if not passed:
            raise AssertionError(label)

    try:
        sa = create("sectors", {"name": tag + " SETOR A"})
        sb = create("sectors", {"name": tag + " SETOR B"})
        ha = create("prayer_houses", {"name": tag + " CASA A", "sector_id": sa["id"]})
        hb = create("prayer_houses", {"name": tag + " CASA B", "sector_id": sb["id"]})
        hn = create("prayer_houses", {"name": tag + " CASA SEM SETOR"})
        fn = create("functions", {"name": tag + " FUNCAO"})
        event = create("events", {"name": tag + " EVENTO", "date": datetime.date.today().isoformat(),
                                  "event_type": "reuniao_musical", "sector_id": sa["id"], "status": "aberto"})
        email = "zzteste-automatico-" + uuid.uuid4().hex + "@example.com"
        password = secrets.token_urlsafe(32)
        user = client.checked("POST", "/auth/v1/admin/users", {"email": email, "password": password, "email_confirm": True}, auth_admin=True)
        uid = user["id"]
        manifest["auth_user_id"] = uid
        persist()
        # Touch only the newly created user's profile, never any existing account.
        profile = client.rows("profiles", filters=f"&id=eq.{uid}")
        if profile:
            client.checked("PATCH", f"/rest/v1/profiles?id=eq.{uid}", {"display_name": tag, "active": True, "sector_id": sa["id"], "all_prayer_houses": True})
        else:
            client.checked("POST", "/rest/v1/profiles", {"id": uid, "display_name": tag, "email": email,
                                                        "active": True, "sector_id": sa["id"], "all_prayer_houses": True})
        create("user_roles", {"user_id": uid, "role": "operator"})
        login = client.checked("POST", "/auth/v1/token?grant_type=password", {"email": email, "password": password})
        token = login["access_token"]

        def attempt(house, label):
            count_before = len(client.attendance(event["id"]))
            payload = {"event_id": event["id"], "name": tag + " " + label, "prayer_house_id": house["id"],
                       "function_id": fn["id"], "instrument_id": None, "participant_id": None, "phone": None}
            response = client.request("POST", "/rest/v1/attendees", payload, token=token)
            count_after = len(client.attendance(event["id"]))
            evidence = {"timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(), "user_id": uid,
                        "event_id": event["id"], "prayer_house_id": house["id"], "event": dict(event), "house": house,
                        "request": {"method": "POST", "path": "/rest/v1/attendees", "body": payload},
                        "http_status": response.status_code, "response": response.json(),
                        "count_before": count_before, "count_after": count_after}
            report["tentativas"].append(evidence)
            return response, count_before, count_after

        accepted, a, b = attempt(ha, "ACEITA A")
        verify(LABELS[0], accepted.status_code == 201 and a == 0 and b == 1)
        history = client.attendance(event["id"])[0]

        def refused(house, label):
            response, a, b = attempt(house, label)
            data = response.json()
            passed = response.status_code == 400 and data.get("code") == "P0001" and "não pertence ao Setor" in data.get("message", "") and a == b
            return passed

        verify(LABELS[1], refused(hb, "RECUSADA B"))
        verify(LABELS[2], refused(hn, "RECUSADA SEM SETOR"))
        client.checked("PATCH", f"/rest/v1/events?id=eq.{event['id']}", {"sector_id": sb["id"]})
        event["sector_id"] = sb["id"]
        verify("Setor A recusado após troca", refused(ha, "RECUSADA A APOS TROCA"))
        accepted_b, a, b = attempt(hb, "ACEITA B APOS TROCA")
        verify(LABELS[4], accepted_b.status_code == 201 and a == 1 and b == 2)
        current = client.attendance(event["id"])
        verify(LABELS[5], next((r for r in current if r["id"] == history["id"]), None) == history)
        verify(LABELS[3], len(current) == 2 and all("RECUSADA" not in r["name"] for r in current)
    except Exception as error:
        report["falhas"].append(str(error))
    finally:
        # Always clean exact run-owned IDs, including unexpectedly accepted invalid writes.
        cleanup_errors = []
        owned_events = [r["id"] for r in manifest["records"] if r["table"] == "events"]
        for eid in owned_events:
            try:
                client.checked("DELETE", f"/rest/v1/attendees?event_id=eq.{eid}")
                client.checked("DELETE", f"/rest/v1/training_attendees?event_id=eq.{eid}")
            except Exception as error:
                cleanup_errors.append(str(error))
        uid = manifest["auth_user_id"]
        if uid:
            try:
                client.checked("DELETE", f"/rest/v1/profiles?id=eq.{uid}")
                client.checked("DELETE", f"/rest/v1/user_roles?user_id=eq.{uid}")
                client.checked("DELETE", f"/auth/v1/admin/users/{uid}", auth_admin=True)
            except Exception as error:
                cleanup_errors.append(str(error))
        for record in reversed(manifest["records"]):
            try:
                client.checked("DELETE", f"/rest/v1/{record['table']}?id=eq.{record['id']}")
            except Exception as error:
                cleanup_errors.append(str(error))
        try:
            after = client.snapshot()
            owned = {(r["table"], r["id"]) for r in manifest["records"]}
            remaining = [(t, r["id"]) for t, rows in after.items() for r in rows
                         if (t, r["id"]) in owned or (t in ("profiles", "user_roles") and (r.get("id") == uid or r.get("user_id") == uid))]
            report["contagens_reais_depois"] = {t: len(after[t]) for t in TABLES}
            report["verificacoes"][LABELS[6]] = not remaining and not cleanup_errors
            report["verificacoes"][LABELS[7]] = before == after
            report["tabelas_diferentes"] = [t for t in TABLES if before[t] != after[t]]
            report["temporarios_restantes"] = remaining
        except Exception as error:
            cleanup_errors.append(str(error))
        report["falhas"].extend(cleanup_errors)
        report["resultado_geral"] = "APROVADO" if all(report["verificacoes"].values()) and not report["falhas"] else "REPROVADO"
        (output / "attempts.json").write_text(json.dumps(report["tentativas"], ensure_ascii=False, indent=2))
        (output / "attempt-audit.json").write_text(json.dumps(detect(before, report["tentativas"]), ensure_ascii=False, indent=2))
        (output / "result.json").write_text(json.dumps(report, ensure_ascii=False, indent=2))
        print(json.dumps({k: v for k, v in report.items() if k != "tentativas"}, ensure_ascii=False, indent=2))
    return report["resultado_geral"] == "APROVADO"


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=Path("/tmp/ccb-audit") / uuid.uuid4().hex)
    args = parser.parse_args()
    raise SystemExit(0 if run(args.output) else 1)