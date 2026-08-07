"""Seed: crear/restablecer la cuenta de administrador.

Hace dos cosas:
1) Supabase Auth (Admin REST API, SERVICE_ROLE_KEY): crea el usuario con
   email/password admin, o si ya existe, le restablece la contraseña.
2) BD de datos: upsert en la tabla `users` con role='admin' (requisito de
   verify_admin_role).

Uso (con PostgreSQL levantado, p.ej. vía docker-compose):
  backend/venv/Scripts/python.exe backend/scripts/create_admin.py

Lee SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / DATABASE_URL del
backend/app/asthma-predictor-api/.env
"""
import os
import sys
import json
import urllib.request
import urllib.error

ENV_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..",
    "app",
    "asthma-predictor-api",
    ".env",
)

ADMIN_EMAIL = "emmanuelpenaruizuni@gmail.com"
ADMIN_PASSWORD = "Admin123!"


def load_env(path):
    out = {}
    if not os.path.exists(path):
        return out
    with open(path, encoding="utf-8-sig") as fh:
        for line in fh:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, _, v = line.partition("=")
            out[k.strip()] = v.strip().strip('"').strip("'")
    return out


def _req(url, api_key, method, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("apikey", api_key)
    req.add_header("Authorization", f"Bearer {api_key}")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read().decode()
            payload = json.loads(raw) if raw else {}
            return resp.status, payload
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, {"raw": raw}


def ensure_supabase(supabase, service_key):
    import urllib.parse

    base = supabase.rstrip("/")
    email_qs = urllib.parse.quote(ADMIN_EMAIL)
    status, data = _req(
        f"{base}/auth/v1/admin/users?email={email_qs}", service_key, "GET"
    )
    existing = data.get("users")[0] if status == 200 and data.get("users") else None

    if existing:
        uid = existing["id"]
        st, upd = _req(
            f"{base}/auth/v1/admin/users/{uid}", service_key, "PUT",
            {"password": ADMIN_PASSWORD, "email_confirm": True},
        )
        print(f"[supabase] usuario ya existia - contraseña restablecida (HTTP {st})")
        return uid

    st, created = _req(
        f"{base}/auth/v1/admin/users", service_key, "POST",
        {
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD,
            "email_confirm": True,
            "user_metadata": {"full_name": "Administrador", "role": "admin"},
        },
    )
    if st in (200, 201):
        print(f"[supabase] usuario admin creado (HTTP {st})")
        return created["id"]
    print(f"[supabase] ERROR creando usuario: HTTP {st} {created}")
    sys.exit(1)


def ensure_db(database_url, supabase_uid):
    from sqlalchemy import create_engine, text

    engine = create_engine(database_url)
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                INSERT INTO users (supabase_uid, email, full_name, role, is_active, email_verified)
                VALUES (:uid, :email, 'Administrador', 'admin', TRUE, TRUE)
                ON CONFLICT (email) DO UPDATE
                  SET supabase_uid = EXCLUDED.supabase_uid,
                      role = 'admin',
                      is_active = TRUE,
                      email_verified = TRUE;
                """
            ),
            {"uid": supabase_uid, "email": ADMIN_EMAIL},
        )
    print("[db] users.role='admin' aplicado en la BD de datos.")


def main():
    env = load_env(ENV_PATH)
    missing = [k for k in ("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "DATABASE_URL")
               if not env.get(k)]
    if missing:
        print("Faltan variables en el archivo:", ", ".join(missing))
        sys.exit(1)

    uid = ensure_supabase(env["SUPABASE_URL"], env["SUPABASE_SERVICE_ROLE_KEY"])
    ensure_db(env["DATABASE_URL"], uid)
    print("Listo. Admin ->", ADMIN_EMAIL, "|", ADMIN_PASSWORD)


if __name__ == "__main__":
    main()