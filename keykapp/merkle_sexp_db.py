import json
import os
import libsql_experimental as libsql
from dag_json import decode, encode, encoded_cid
from multiformats import CID


class MerkleSexpDB:
    def __init__(self, db_path, mode="local", sync_url=None, auth_token=None):
        if mode == "embedded":
            self.conn = libsql.connect(
                db_path, sync_url=sync_url, auth_token=auth_token
            )
            self.conn.sync()
        elif mode == "local":
            self.conn = libsql.connect(db_path)
        else:
            raise ValueError("Invalid mode. Use 'embedded' or 'local'.")
        self._create_table()

    def _create_table(self):
        self.conn.execute(
            """
            CREATE TABLE IF NOT EXISTS objects (
                cid TEXT PRIMARY KEY,
                data JSON NOT NULL
            );
            """
        )
        self.conn.commit()

    def insert_object(self, data):
        encoded = encode(data)
        cid = encoded_cid(encoded)
        self.conn.execute(
            "INSERT OR IGNORE INTO objects (cid, data) VALUES (?, ?)",
            (str(cid), encoded.decode()),
        )
        self.conn.commit()
        return cid

    def get_object(self, cid):
        row = self.conn.execute(
            "SELECT data FROM objects WHERE cid = ?", (str(cid),)
        ).fetchone()
        if row:
            return decode(row[0])
        return None

    def insert_blob(self, blob_data):
        blob = {"type": "blob", "data": blob_data}
        return self.insert_object(blob)

    def insert_cons(self, car_cid, cdr_cid):
        cons = {"type": "cons", "car": str(car_cid), "cdr": str(cdr_cid)}
        return self.insert_object(cons)

    def get_all_objects(self):
        rows = self.conn.execute("SELECT cid, data FROM objects").fetchall()
        objects = []
        for row in rows:
            cid, encoded_data = row
            data = decode(encoded_data)
            objects.append((CID.decode(cid), data))
        return objects

    def get_sexp(self, cid):
        def recursive_get(cid):
            data = self.get_object(cid)
            if data and data.get("type") == "cons":
                return {
                    "type": "cons",
                    "car": recursive_get(CID.decode(data["car"])),
                    "cdr": recursive_get(CID.decode(data["cdr"])),
                }
            return data

        return recursive_get(cid)


def main():
    mode = "local"  # Change to "embedded" for embedded replicas mode
    url = os.getenv("TURSO_DATABASE_URL")
    auth_token = os.getenv("TURSO_AUTH_TOKEN")

    db = MerkleSexpDB("keykapp-dev.db", mode=mode, sync_url=url, auth_token=auth_token)

    # Example blobs of different DAG-JSON literal types
    cid_string = db.insert_blob("a string value")
    cid_number = db.insert_blob(42)
    cid_boolean = db.insert_blob(True)
    cid_null = db.insert_blob(None)

    # Example cons cells
    cid_cons1 = db.insert_cons(cid_string, cid_null)
    cid_cons2 = db.insert_cons(cid_number, cid_boolean)
    cid_cons3 = db.insert_cons(cid_string, cid_number)
    cid_cons4 = db.insert_cons(cid_boolean, cid_string)

    # Nested cons cell
    cid_nested_cons = db.insert_cons(cid_cons1, cid_cons2)

    # Query and print all objects
    objects = db.get_all_objects()
    for cid, data in objects:
        print(f"CID: {cid}, Data: {data}")

    # Test get_sexp method
    sexp = db.get_sexp(cid_nested_cons)
    print(f"Nested cons cell s-expression: {sexp}")


if __name__ == "__main__":
    main()
