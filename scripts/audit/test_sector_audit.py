import unittest
from sector_audit import detect


class SectorAuditTests(unittest.TestCase):
    def fixture(self):
        return {"sectors": [{"id": "a", "name": "A"}, {"id": "b", "name": "B"}],
                "events": [{"id": "e", "name": "Evento", "sector_id": "a"}],
                "prayer_houses": [{"id": "ha", "sector_id": "a"}, {"id": "hb", "sector_id": "b"}, {"id": "hn", "sector_id": None}]}

    def test_valid_rows(self):
        data = self.fixture()
        data["attendees"] = [{"id": "p", "event_id": "e", "prayer_house_id": "ha"}]
        self.assertEqual(detect(data)["ocorrencias"], [])

    def test_mismatch_is_not_asserted_as_bypass(self):
        data = self.fixture()
        data["attendees"] = [{"id": "p", "event_id": "e", "prayer_house_id": "hb"}]
        row = detect(data)["ocorrencias"][0]
        self.assertEqual(row["tipo"], "PRESENCA_DIVERGE_SETOR_ATUAL")
        self.assertIn("não é possível distinguir", row["observacao"])
        self.assertIsNone(row["usuario_responsavel"])

    def test_missing_house_sector_and_training(self):
        data = self.fixture()
        data["training_attendees"] = [{"id": "p", "event_id": "e", "prayer_house_id": "hn"}]
        self.assertEqual(detect(data)["ocorrencias"][0]["tipo"], "PRESENCA_CASA_SEM_SETOR")

    def test_invalid_event_sector(self):
        data = self.fixture()
        data["events"][0]["sector_id"] = "missing"
        self.assertEqual(detect(data)["ocorrencias"][0]["tipo"], "EVENTO_SETOR_INEXISTENTE")

    def test_captured_attempts(self):
        attempts = [{"event_id": "e", "prayer_house_id": h, "http_status": 400, "user_id": "user", "timestamp": "2026-10-08"} for h in ("hb", "hn")]
        rows = detect(self.fixture(), attempts)["ocorrencias"]
        self.assertEqual([r["tipo"] for r in rows], ["TENTATIVA_CASA_OUTRO_SETOR", "TENTATIVA_CASA_SEM_SETOR"])
        self.assertTrue(all(r["usuario_responsavel"] == "user" for r in rows))

    def test_detection_does_not_modify_input(self):
        import copy
        data = self.fixture()
        original = copy.deepcopy(data)
        detect(data)
        self.assertEqual(data, original)

    def test_captured_sector_names_survive_cleanup(self):
        attempt = {"event": {"id": "removed-e", "sector_id": "removed-a"},
                   "house": {"id": "removed-h", "sector_id": "removed-b"},
                   "event_sector": {"id": "removed-a", "nome": "Temporary A"},
                   "house_sector": {"id": "removed-b", "nome": "Temporary B"}}
        row = detect({}, [attempt])["ocorrencias"][0]
        self.assertEqual(row["setor_evento"]["nome"], "Temporary A")
        self.assertEqual(row["setor_casa"]["nome"], "Temporary B")


if __name__ == "__main__":
    unittest.main()