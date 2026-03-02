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
            count=3,
        ).get_result()
    except Exception as exc:  # pragma: no cover
        print("❌ Error de consulta:", exc)
        return 1

    print("✅ Consulta exitosa")
    print("Resultados encontrados:", response.get("matching_results", 0))

    results = response.get("results", [])
    if not results:
        print("No se encontraron fragmentos.")
        return 0

    for idx, result in enumerate(results, start=1):
        text = result.get("text") or result.get("extracted_text") or ""
        if isinstance(text, list):
            text = " ".join(str(item) for item in text)
        if not isinstance(text, str):
            text = str(text)
        title = result.get("title") or ""
        doc_id = result.get("document_id") or ""
        score = result.get("result_metadata", {}).get("score")
        print(f"\n--- Fragmento {idx} ---")
        if title:
            print(f"Título: {title}")
        if doc_id:
            print(f"Documento: {doc_id}")
        if score is not None:
            print(f"Score: {score:.4f}")
        print(text.strip()[:800])

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
