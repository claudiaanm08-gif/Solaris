import os
import sys
from pathlib import Path

from ibm_cloud_sdk_core.authenticators import IAMAuthenticator
from ibm_watson import DiscoveryV2


def load_env_file(env_path: Path) -> None:
    if not env_path.exists():
        return
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        if key and key not in os.environ:
            os.environ[key] = value


def main() -> int:
    load_env_file(Path(__file__).resolve().parent / ".env")

    query = "penalización"
    if len(sys.argv) > 1:
        query = " ".join(sys.argv[1:]).strip() or query

    api_key = os.getenv("WATSON_DISCOVERY_API_KEY")
    url = os.getenv("WATSON_DISCOVERY_URL")
    project_id = os.getenv("WATSON_DISCOVERY_PROJECT_ID")
    collection_id = os.getenv("WATSON_DISCOVERY_COLLECTION_ID")

    missing = [
        name
        for name, value in [
            ("WATSON_DISCOVERY_API_KEY", api_key),
            ("WATSON_DISCOVERY_URL", url),
            ("WATSON_DISCOVERY_PROJECT_ID", project_id),
            ("WATSON_DISCOVERY_COLLECTION_ID", collection_id),
        ]
        if not value
    ]

    if missing:
        print("❌ Faltan variables:", ", ".join(missing))
        return 1

    authenticator = IAMAuthenticator(api_key)
    discovery = DiscoveryV2(version="2023-11-01", authenticator=authenticator)
    discovery.set_service_url(url)

    try:
        response = discovery.query(
            project_id=project_id,
            collection_ids=[collection_id],
            natural_language_query=query,
            count=1,
        ).get_result()
        print("✅ Conexión exitosa")
        print("Resultados encontrados:", response.get("matching_results", 0))
        return 0
    except Exception as exc:  # pragma: no cover - SDK exception type may vary
        print("❌ Error de conexión:", exc)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
