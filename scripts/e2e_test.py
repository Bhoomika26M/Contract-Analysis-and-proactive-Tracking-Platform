"""End-to-end test: FastAPI <-> SQLite for the obligations + renewals scope.

Mirrors exactly what the React app calls, in the order the app calls it.
"""

import json
import sys
from datetime import date, timedelta

import httpx

BASE = "http://127.0.0.1:8000/api"

passed, failed = 0, 0
failures = []


def check(label, condition, detail=""):
    global passed, failed
    if condition:
        passed += 1
        print(f"  PASS  {label}")
    else:
        failed += 1
        failures.append(label)
        print(f"  FAIL  {label} {detail}")


def main() -> int:
    client = httpx.Client(base_url=BASE, timeout=60.0)
    today = date.today()

    print("\n[1] Health (no auth)")
    health = client.get("/health")
    check("health returns 200", health.status_code == 200, health.text[:200])
    check("database connected", health.json().get("database") == "connected", health.text[:200])
    check("API requires no authentication", client.get("/obligations").status_code == 200)

    print("\n[2] Options")
    opts = client.get("/options").json()
    for key in ("departments", "obligation_priorities", "obligation_statuses", "approval_statuses"):
        check(f"options expose {key}", key in opts and bool(opts[key]))

    print("\n[3] Obligation CRUD")
    ob = client.post("/obligations", json={
        "title": "Annual SOC 2 evidence submission",
        "description": "Upload the SOC 2 Type II report to the vendor portal.",
        "contract_title": "Northwind Analytics MSA",
        "department": "Technology",
        "due_date": (today + timedelta(days=9)).isoformat(),
        "priority": "critical",
        "status": "todo",
        "completion": 0,
    })
    check("obligation created", ob.status_code == 201, ob.text[:300])
    obligation = ob.json()
    oid = obligation["id"]
    check("contract title stored", obligation["contract_title"] == "Northwind Analytics MSA")
    check("department stored", obligation["department"] == "Technology")

    ob2 = client.post("/obligations", json={
        "title": "Quarterly invoice reconciliation",
        "contract_title": "Northwind Analytics MSA",
        "due_date": (today - timedelta(days=5)).isoformat(),
        "priority": "high",
        "status": "in-progress",
        "completion": 60,
    })
    check("second obligation created", ob2.status_code == 201, ob2.text[:200])
    oid2 = ob2.json()["id"]

    bad = client.post("/obligations", json={"title": "x", "priority": "nonsense"})
    check("invalid priority rejected with 422", bad.status_code == 422, str(bad.status_code))

    listed = client.get("/obligations").json()
    check("list returns both rows", len(listed) == 2, str(len(listed)))
    check(
        "list is ordered by due date, undated last",
        listed[0]["id"] == oid2,
        str([o["id"] for o in listed]),
    )

    found = client.get("/obligations", params={"search": "SOC 2"}).json()
    check("search matches on title", len(found) == 1 and found[0]["id"] == oid, str(len(found)))
    by_contract = client.get("/obligations", params={"contract_title": "northwind analytics msa"}).json()
    check("contract filter is case-insensitive", len(by_contract) == 2, str(len(by_contract)))
    by_dept = client.get("/obligations", params={"department": "Technology"}).json()
    check("department filter works", len(by_dept) == 1, str(len(by_dept)))

    summary = client.get("/obligations/summary").json()
    check("summary counts rows", summary["total"] == 2, json.dumps(summary))
    check("summary counts overdue", summary["overdue"] == 1, str(summary["overdue"]))
    check("summary by_status", summary["by_status"]["in-progress"] == 1, json.dumps(summary["by_status"]))
    check("summary by_priority", summary["by_priority"]["critical"] == 1)
    check("summary completion average", summary["completion_average"] == 30.0, str(summary["completion_average"]))

    overdue = client.get("/obligations", params={"overdue_only": True}).json()
    check("overdue filter returns only the overdue row", [o["id"] for o in overdue] == [oid2], str([o["id"] for o in overdue]))

    patched = client.patch(f"/obligations/{oid}", json={"status": "done", "completion": 100})
    check("obligation update returns 200", patched.status_code == 200, patched.text[:200])
    check("status persisted", patched.json()["status"] == "done")
    check("completion persisted", patched.json()["completion"] == 100)
    check(
        "update survives a re-read",
        client.get(f"/obligations/{oid}").json()["completion"] == 100,
    )
    remaining_overdue = client.get("/obligations", params={"overdue_only": True}).json()
    check(
        "marking done removes an obligation from the overdue set",
        [o["id"] for o in remaining_overdue] == [oid2],
        str([o["id"] for o in remaining_overdue]),
    )

    out_of_range = client.patch(f"/obligations/{oid}", json={"completion": 500})
    check("completion above 100 rejected with 422", out_of_range.status_code == 422, str(out_of_range.status_code))

    print("\n[4] Renewal CRUD")
    expiry = (today + timedelta(days=21)).isoformat()
    rn = client.post("/renewals", json={
        "contract_title": "Northwind Analytics MSA",
        "counterparty": "Northwind Analytics Ltd",
        "department": "Technology",
        "current_expiry": expiry,
        "renewal_date": expiry,
        "proposed_value": 533500,
        "currency": "USD",
        "auto_renew": False,
        "approval_status": "pending",
        "notes": "10% uplift to be signed off by Finance.",
    })
    check("renewal created", rn.status_code == 201, rn.text[:300])
    renewal = rn.json()
    rid = renewal["id"]
    check("contract title stored", renewal["contract_title"] == "Northwind Analytics MSA")
    check("value stored as a number", float(renewal["proposed_value"]) == 533500.0, str(renewal["proposed_value"]))

    empty_title = client.post("/renewals", json={"contract_title": ""})
    check("renewal requires a contract title", empty_title.status_code == 422, str(empty_title.status_code))

    rs = client.get("/renewals/summary").json()
    check("renewal summary has_data", rs["has_data"] is True)
    check("renewal summary counts the record", rs["total"] == 1, str(rs["total"]))
    check("21 days out buckets as upcoming", rs["buckets"]["upcoming"] == 1, json.dumps(rs["buckets"]))
    check("due_in_30_days counts it", rs["due_in_30_days"] == 1, str(rs["due_in_30_days"]))
    check("pipeline value", rs["pipeline_value_90d"] == 533500.0, str(rs["pipeline_value_90d"]))
    check("monthly series has 6 entries", len(rs["monthly"]) == 6, str(len(rs["monthly"])))
    check("by_approval counted", rs["by_approval"]["pending"] == 1, json.dumps(rs["by_approval"]))

    rap = client.patch(f"/renewals/{rid}", json={"approval_status": "approved", "notes": "Signed off."})
    check("renewal update returns 200", rap.status_code == 200, rap.text[:200])
    check("approval persisted", client.get(f"/renewals/{rid}").json()["approval_status"] == "approved")

    by_dep = client.get("/renewals", params={"department": "Technology"}).json()
    check("renewal department filter works", len(by_dep) == 1, str(len(by_dep)))
    by_appr = client.get("/renewals", params={"approval_status": "approved"}).json()
    check("renewal approval filter works", len(by_appr) == 1, str(len(by_appr)))
    by_search = client.get("/renewals", params={"search": "northwind"}).json()
    check("renewal search is case-insensitive", len(by_search) == 1, str(len(by_search)))

    # An overdue renewal must land in the overdue bucket.
    client.post("/renewals", json={
        "contract_title": "Slack Business Plan",
        "renewal_date": (today - timedelta(days=12)).isoformat(),
        "current_expiry": (today - timedelta(days=20)).isoformat(),
        "proposed_value": 36000,
        "approval_status": "draft",
    })
    buckets = client.get("/renewals/summary").json()["buckets"]
    check("past-dated renewal buckets as overdue", buckets["overdue"] == 1, json.dumps(buckets))

    print("\n[5] Deletes and empty states")
    d = client.delete(f"/obligations/{oid2}")
    check("obligation delete returns 200", d.status_code == 200, d.text[:200])
    check("deleted obligation is gone", client.get(f"/obligations/{oid2}").status_code == 404)
    check("remaining obligation untouched", client.get(f"/obligations/{oid}").status_code == 200)

    check("delete of a missing row returns 404", client.delete("/obligations/999999").status_code == 404)
    check("get of a missing row returns 404", client.get("/obligations/999999").status_code == 404)

    for existing in client.get("/renewals").json():
        client.delete(f"/renewals/{existing['id']}")
    check("renewal list is empty after deletes", client.get("/renewals").json() == [])
    check("renewal summary reports no data", client.get("/renewals/summary").json()["has_data"] is False)
    check("an obligation survives every renewal delete", client.get(f"/obligations/{oid}").status_code == 200)

    client.close()
    print(f"\n{'=' * 52}\n  {passed} passed, {failed} failed")
    if failures:
        print(f"  failing: {', '.join(failures)}")
    print("=" * 52)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())