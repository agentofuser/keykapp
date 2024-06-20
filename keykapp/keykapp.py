import json
from textual.app import App, ComposeResult
from textual.widgets import Static
import libsql_experimental as libsql
import os
from dag_json import decode, encode, encoded_cid
from multiformats import CID
from dag_json import DagJsonEncoder


class KeykappApp(App):
    """fleet cyborgism"""

    ENABLE_COMMAND_PALETTE = False

    def compose(self) -> ComposeResult:
        yield StateViz(id="viz")
        yield CommandKeyboard(id="kbd")


class StateViz(Static):
    """pure function of state"""

    def on_mount(self) -> None:
        self.update("State Visualization")


class CommandKeyboard(Static):
    """grown-up command-palette"""

    def on_mount(self) -> None:
        self.update("Command Keyboard")


def insert_object(conn, data):
    encoded = encode(data)  # Use the encode function to get bytes
    cid = str(encoded_cid(encoded))  # Directly convert CID to string
    conn.execute(
        "INSERT OR IGNORE INTO objects (cid, data) VALUES (?, ?)",
        (cid, encoded.decode()),
    )
    conn.commit()


if __name__ == "__main__":
    url = os.getenv("TURSO_DATABASE_URL")
    auth_token = os.getenv("TURSO_AUTH_TOKEN")

    conn = libsql.connect("keykapp-dev.db", sync_url=url, auth_token=auth_token)
    conn.sync()

    conn.execute(
        """
            CREATE TABLE IF NOT EXISTS objects (
                cid TEXT PRIMARY KEY,
                data JSON NOT NULL
            );
        """
    )

    # Example blobs and cons cells
    blob1 = {"type": "blob", "data": b"arbitrary serialized value"}
    blob2 = {"type": "blob", "data": b"another serialized value"}

    # Insert example data
    insert_object(conn, blob1)
    insert_object(conn, blob2)

    # Commit and sync
    conn.commit()

    # Query and print all objects
    rows = conn.execute("SELECT cid, data FROM objects").fetchall()
    for row in rows:
        cid, encoded_data = row
        data = decode(encoded_data)
        print(f"CID: {cid}, Data: {data}")

    # app = KeykappApp()
    # app.run()
