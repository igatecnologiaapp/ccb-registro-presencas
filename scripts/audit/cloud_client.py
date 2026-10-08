"""Local-only audit access. Never import this module into the web application."""
import os
import requests

TABLES = (
    "events", "attendees", "training_attendees", "sectors", "prayer_houses",
    "functions", "instruments", "function_instruments", "profiles", "user_roles", "participants",
)


class CloudClient:
    def __init__(self):
        self.url = os.environ["SUPABASE_URL"].rstrip("/")
        self.admin = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
        self.public = os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY") or os.environ.get("SUPABASE_PUBLISHABLE_KEY")
        if not self.public:
            raise RuntimeError("Missing publishable key in environment")

    def request(self, method, path, body=None, token=None, auth_admin=False):
        key = self.public if token else self.admin
        headers = {"apikey": key, "Content-Type": "application/json", "Prefer": "return=representation"}
        if token or auth_admin:
            headers["Authorization"] = "Bearer " + (token or self.admin)
        return requests.request(method, self.url + path, headers=headers, json=body, timeout=30)

    def checked(self, method, path, body=None, **kwargs):
        response = self.request(method, path, body, **kwargs)
        if not response.ok:
            # Never emit responses from Auth, which can contain credentials or account details.
            raise RuntimeError(f"{method} operation failed with HTTP {response.status_code}")
        return response.json() if response.content else None

    def rows(self, table, select="*", filters=""):
        result = []
        offset = 0
        while True:
            batch = self.checked("GET", f"/rest/v1/{table}?select={select}&order=id&limit=500&offset={offset}{filters}")
            result.extend(batch)
            if len(batch) < 500:
                return result
            offset += len(batch)

    def snapshot(self):
        return {table: self.rows(table) for table in TABLES}

    def attendance(self, event_id):
        return self.rows("attendees", filters=f"&event_id=eq.{event_id}")