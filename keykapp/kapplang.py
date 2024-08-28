import os
import pytest
from eventsourcing.domain import Aggregate, event
from eventsourcing.application import Application
from eventsourcing.system import NotificationLogReader


class Stack(Aggregate):
    @event("create-applied")
    def __init__(self):
        self.items = []

    # Helper methods for common type checks
    def has_at_least_items(self, n):
        return len(self.items) >= n

    def is_int(self, item):
        return isinstance(item, int) and not isinstance(item, bool)

    def is_float(self, item):
        return isinstance(item, float)

    def is_number(self, item):
        return self.is_int(item) or self.is_float(item)

    def is_bool(self, item):
        return isinstance(item, bool)

    # Existing methods with added float support

    def typecheck_pop(self):
        return self.has_at_least_items(1)

    @event("pop-applied")
    def pop(self):
        if not self.typecheck_pop():
            return
        self.items.pop()

    def typecheck_dup(self):
        return self.has_at_least_items(1)

    @event("dup-applied")
    def dup(self):
        if not self.typecheck_dup():
            return
        self.items.append(self.items[-1])

    def typecheck_swap(self):
        return self.has_at_least_items(2)

    @event("swap-applied")
    def swap(self):
        if not self.typecheck_swap():
            return
        self.items[-1], self.items[-2] = self.items[-2], self.items[-1]

    def typecheck_over(self):
        return self.has_at_least_items(2)

    @event("over-applied")
    def over(self):
        if not self.typecheck_over():
            return
        self.items.append(self.items[-2])

    def typecheck_rot(self):
        return self.has_at_least_items(3)

    @event("rot-applied")
    def rot(self):
        if not self.typecheck_rot():
            return
        self.items[-3], self.items[-2], self.items[-1] = (
            self.items[-2],
            self.items[-1],
            self.items[-3],
        )

    def typecheck_zero(self):
        return True

    @event("zero-applied")
    def zero(self):
        if not self.typecheck_zero():
            return
        self.items.append(0)

    def typecheck_succ(self):
        return self.has_at_least_items(1) and self.is_number(self.items[-1])

    @event("succ-applied")
    def succ(self):
        if not self.typecheck_succ():
            return
        self.items.append(self.items.pop() + 1)

    def typecheck_pred(self):
        return self.has_at_least_items(1) and self.is_number(self.items[-1])

    @event("pred-applied")
    def pred(self):
        if not self.typecheck_pred():
            return
        self.items.append(self.items.pop() - 1)

    def typecheck_add(self):
        return (
            self.has_at_least_items(2)
            and self.is_number(self.items[-1])
            and self.is_number(self.items[-2])
        )

    @event("add-applied")
    def add(self):
        if not self.typecheck_add():
            return
        a = self.items.pop()
        b = self.items.pop()
        self.items.append(b + a)

    def typecheck_sub(self):
        return (
            self.has_at_least_items(2)
            and self.is_number(self.items[-1])
            and self.is_number(self.items[-2])
        )

    @event("sub-applied")
    def sub(self):
        if not self.typecheck_sub():
            return
        a = self.items.pop()
        b = self.items.pop()
        self.items.append(b - a)

    def typecheck_mul(self):
        return (
            self.has_at_least_items(2)
            and self.is_number(self.items[-1])
            and self.is_number(self.items[-2])
        )

    @event("mul-applied")
    def mul(self):
        if not self.typecheck_mul():
            return
        a = self.items.pop()
        b = self.items.pop()
        self.items.append(b * a)

    def typecheck_div(self):
        return (
            self.has_at_least_items(2)
            and self.items[-1] != 0
            and self.is_number(self.items[-1])
            and self.is_number(self.items[-2])
        )

    @event("div-applied")
    def div(self):
        if not self.typecheck_div():
            return
        a = self.items.pop()
        b = self.items.pop()
        self.items.append(b / a)

    def typecheck_true(self):
        return True

    @event("true-applied")
    def true(self):
        if not self.typecheck_true():
            return
        self.items.append(True)

    def typecheck_false(self):
        return True

    @event("false-applied")
    def false(self):
        if not self.typecheck_false():
            return
        self.items.append(False)

    def typecheck_not_op(self):
        return self.has_at_least_items(1) and self.is_bool(self.items[-1])

    @event("not_op-applied")
    def not_op(self):
        if not self.typecheck_not_op():
            return
        self.items.append(not self.items.pop())

    def typecheck_and_op(self):
        return (
            self.has_at_least_items(2)
            and self.is_bool(self.items[-1])
            and self.is_bool(self.items[-2])
        )

    @event("and_op-applied")
    def and_op(self):
        if not self.typecheck_and_op():
            return
        a = self.items.pop()
        b = self.items.pop()
        self.items.append(b and a)

    def typecheck_or_op(self):
        return (
            self.has_at_least_items(2)
            and self.is_bool(self.items[-1])
            and self.is_bool(self.items[-2])
        )

    @event("or_op-applied")
    def or_op(self):
        if not self.typecheck_or_op():
            return
        a = self.items.pop()
        b = self.items.pop()
        self.items.append(b or a)

    def typecheck_eq_op(self):
        return self.has_at_least_items(2)

    @event("eq_op-applied")
    def eq_op(self):
        if not self.typecheck_eq_op():
            return
        a = self.items.pop()
        b = self.items.pop()
        self.items.append(b == a)

    def typecheck_neq_op(self):
        return self.has_at_least_items(2)

    @event("neq_op-applied")
    def neq_op(self):
        if not self.typecheck_neq_op():
            return
        a = self.items.pop()
        b = self.items.pop()
        self.items.append(b != a)

    def typecheck_gt_op(self):
        return (
            self.has_at_least_items(2)
            and self.is_number(self.items[-1])
            and self.is_number(self.items[-2])
        )

    @event("gt_op-applied")
    def gt_op(self):
        if not self.typecheck_gt_op():
            return
        a = self.items.pop()
        b = self.items.pop()
        self.items.append(b > a)

    def typecheck_to_float(self):
        return self.has_at_least_items(1) and self.is_int(self.items[-1])

    @event("to_float-applied")
    def to_float(self):
        if not self.typecheck_to_float():
            return
        self.items.append(float(self.items.pop()))

    def typecheck_round(self):
        return self.has_at_least_items(1) and self.is_float(self.items[-1])

    @event("round-applied")
    def round(self):
        if not self.typecheck_round():
            return
        self.items.append(int(round(self.items.pop())))

    def typecheck_floor(self):
        return self.has_at_least_items(1) and self.is_float(self.items[-1])

    @event("floor-applied")
    def floor(self):
        if not self.typecheck_floor():
            return
        self.items.append(int(self.items.pop()))

    def typecheck_ceiling(self):
        return self.has_at_least_items(1) and self.is_float(self.items[-1])

    @event("ceiling-applied")
    def ceiling(self):
        if not self.typecheck_ceiling():
            return
        self.items.append(int(self.items.pop() + 1))

    def typecheck_to_int(self):
        return self.has_at_least_items(1) and self.is_float(self.items[-1])

    @event("to_int-applied")
    def to_int(self):
        if not self.typecheck_to_int():
            return
        self.items.append(int(self.items.pop()))


class KapplangApp(Application):
    GROUNDED_KAPPS = [
        {"name": "pop", "typecheck": "typecheck_pop"},
        {"name": "dup", "typecheck": "typecheck_dup"},
        {"name": "swap", "typecheck": "typecheck_swap"},
        {"name": "over", "typecheck": "typecheck_over"},
        {"name": "rot", "typecheck": "typecheck_rot"},
        {"name": "zero", "typecheck": "typecheck_zero"},
        {"name": "succ", "typecheck": "typecheck_succ"},
        {"name": "pred", "typecheck": "typecheck_pred"},
        {"name": "add", "typecheck": "typecheck_add"},
        {"name": "sub", "typecheck": "typecheck_sub"},
        {"name": "mul", "typecheck": "typecheck_mul"},
        {"name": "div", "typecheck": "typecheck_div"},
        {"name": "true", "typecheck": "typecheck_true"},
        {"name": "false", "typecheck": "typecheck_false"},
        {"name": "not_op", "typecheck": "typecheck_not_op"},
        {"name": "and_op", "typecheck": "typecheck_and_op"},
        {"name": "or_op", "typecheck": "typecheck_or_op"},
        {"name": "eq_op", "typecheck": "typecheck_eq_op"},
        {"name": "neq_op", "typecheck": "typecheck_neq_op"},
        {"name": "gt_op", "typecheck": "typecheck_gt_op"},
        {"name": "to_float", "typecheck": "typecheck_to_float"},
        {"name": "round", "typecheck": "typecheck_round"},
        {"name": "floor", "typecheck": "typecheck_floor"},
        {"name": "ceiling", "typecheck": "typecheck_ceiling"},
        {"name": "to_int", "typecheck": "typecheck_to_int"},
    ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def create_stack(self):
        stack = Stack()
        self.save(stack)
        return stack.id

    def push_int(self, value):
        kapps = ["zero"]
        if value > 0:
            kapps.extend(["succ"] * value)
        elif value < 0:
            kapps.extend(["pred"] * -value)
        return kapps

    def get_stack(self, stack_id):
        stack = self.repository.get(stack_id)
        return stack.items

    def dispatch(self, stack_id, kapp_name):
        stack = self.repository.get(stack_id)
        grounded_kapp = next(
            (k for k in self.GROUNDED_KAPPS if k["name"] == kapp_name), None
        )
        if grounded_kapp is None:
            raise ValueError(f"Kapp {kapp_name} not grounded")
        kapp_method = getattr(stack, kapp_name, None)
        if kapp_method is None:
            raise ValueError(f"Kapp {kapp_name} implementation not found")
        kapp_method()
        self.save(stack)

    def get_event_log(self, start=1):
        reader = NotificationLogReader(self.notification_log)
        return [
            (
                n.id,
                n.originator_id,
                n.originator_version,
                n.topic.split(".")[-1].replace("-applied", ""),
            )
            for n in reader.read(start=start)
        ]

    def get_kapp_counts(self, start=1):
        reader = NotificationLogReader(self.notification_log)
        kapp_counts = {k["name"]: 0 for k in self.GROUNDED_KAPPS}
        for n in reader.read(start=start):
            kapp_name = n.topic.split(".")[-1].replace("-applied", "")
            if kapp_name in kapp_counts:
                kapp_counts[kapp_name] += 1
        return kapp_counts

    def filter_kapp_counts_with_typechecking(self, stack_id, kapp_counts):
        """
        Filters the kapp_counts dictionary based on typechecking against the current stack state.
        """
        filtered_kapp_counts = {}
        stack = self.repository.get(stack_id)
        for kapp_name, count in kapp_counts.items():
            # Find the corresponding typecheck method
            grounded_kapp = next(
                (k for k in self.GROUNDED_KAPPS if k["name"] == kapp_name),
                None,
            )
            if grounded_kapp:
                typecheck_method = getattr(
                    stack, grounded_kapp["typecheck"], None
                )
                if typecheck_method and typecheck_method():
                    filtered_kapp_counts[kapp_name] = count
        return filtered_kapp_counts


@pytest.fixture(scope="module")
def app():
    os.environ["PERSISTENCE_MODULE"] = "eventsourcing.sqlite"
    os.environ["SQLITE_DBNAME"] = "keykapp-test.db"
    return KapplangApp()


@pytest.fixture
def stack_id(app):
    return app.create_stack()


@pytest.fixture(scope="module", autouse=True)
def setup_and_teardown():
    # Setup: Ensure database is created
    db_path = "keykapp-test.db"
    if os.path.exists(db_path):
        os.remove(db_path)
    yield
    # Teardown: Ensure database is deleted
    if os.path.exists(db_path):
        os.remove(db_path)


def test_push_zero(app, stack_id):
    app.dispatch(stack_id, "zero")
    assert app.get_stack(stack_id) == [0]

    app.dispatch(stack_id, "zero")
    assert app.get_stack(stack_id) == [0, 0]


def test_dup(app, stack_id):
    for kapp in app.push_int(1):
        app.dispatch(stack_id, kapp)
    app.dispatch(stack_id, "dup")
    assert app.get_stack(stack_id) == [1, 1]


def test_swap(app, stack_id):
    for kapp in app.push_int(1):
        app.dispatch(stack_id, kapp)
    for kapp in app.push_int(2):
        app.dispatch(stack_id, kapp)
    app.dispatch(stack_id, "swap")
    assert app.get_stack(stack_id) == [2, 1]


def test_over(app, stack_id):
    for kapp in app.push_int(1):
        app.dispatch(stack_id, kapp)
    for kapp in app.push_int(2):
        app.dispatch(stack_id, kapp)
    app.dispatch(stack_id, "over")
    assert app.get_stack(stack_id) == [1, 2, 1]


def test_rot(app, stack_id):
    for kapp in app.push_int(1):
        app.dispatch(stack_id, kapp)
    for kapp in app.push_int(2):
        app.dispatch(stack_id, kapp)
    for kapp in app.push_int(3):
        app.dispatch(stack_id, kapp)
    app.dispatch(stack_id, "rot")
    assert app.get_stack(stack_id) == [2, 3, 1]


def test_succ(app, stack_id):
    for kapp in app.push_int(0):
        app.dispatch(stack_id, kapp)
    app.dispatch(stack_id, "succ")
    assert app.get_stack(stack_id) == [1]


def test_pred(app, stack_id):
    for kapp in app.push_int(0):
        app.dispatch(stack_id, kapp)
    app.dispatch(stack_id, "pred")
    assert app.get_stack(stack_id) == [-1]


def test_add(app, stack_id):
    for kapp in app.push_int(1):
        app.dispatch(stack_id, kapp)
    for kapp in app.push_int(2):
        app.dispatch(stack_id, kapp)
    app.dispatch(stack_id, "add")
    assert app.get_stack(stack_id) == [3]


def test_sub(app, stack_id):
    for kapp in app.push_int(3):
        app.dispatch(stack_id, kapp)
    for kapp in app.push_int(2):
        app.dispatch(stack_id, kapp)
    app.dispatch(stack_id, "sub")
    assert app.get_stack(stack_id) == [1]


def test_mul(app, stack_id):
    for kapp in app.push_int(2):
        app.dispatch(stack_id, kapp)
    for kapp in app.push_int(3):
        app.dispatch(stack_id, kapp)
    app.dispatch(stack_id, "mul")
    assert app.get_stack(stack_id) == [6]


def test_div(app, stack_id):
    for kapp in app.push_int(6):
        app.dispatch(stack_id, kapp)
    for kapp in app.push_int(2):
        app.dispatch(stack_id, kapp)
    app.dispatch(stack_id, "div")
    assert app.get_stack(stack_id) == [3]


def test_true(app, stack_id):
    app.dispatch(stack_id, "true")
    assert app.get_stack(stack_id) == [True]


def test_false(app, stack_id):
    app.dispatch(stack_id, "false")
    assert app.get_stack(stack_id) == [False]


def test_not(app, stack_id):
    app.dispatch(stack_id, "true")
    app.dispatch(stack_id, "not_op")
    assert app.get_stack(stack_id) == [False]


def test_and(app, stack_id):
    app.dispatch(stack_id, "true")
    app.dispatch(stack_id, "false")
    app.dispatch(stack_id, "and_op")
    assert app.get_stack(stack_id) == [False]


def test_or(app, stack_id):
    app.dispatch(stack_id, "true")
    app.dispatch(stack_id, "false")
    app.dispatch(stack_id, "or_op")
    assert app.get_stack(stack_id) == [True]


def test_or_typecheck(app, stack_id):
    app.dispatch(stack_id, "true")
    app.dispatch(stack_id, "zero")
    app.dispatch(stack_id, "or_op")
    assert app.get_stack(stack_id) == [True, 0]


def test_event_log(app):
    start_log_length = len(app.get_event_log())
    stack_id = app.create_stack()
    kapps = app.push_int(1) + ["dup", "swap", "add"]
    for kapp in kapps:
        app.dispatch(stack_id, kapp)
    event_log = app.get_event_log(start=start_log_length + 1)
    expected_kapps = ["create"] + kapps
    actual_kapps = [event[3] for event in event_log]
    assert (
        actual_kapps == expected_kapps
    ), f"Expected {expected_kapps}, but got {actual_kapps}"


def test_kapp_counts(app):
    start_log_length = len(app.get_event_log())
    stack_id = app.create_stack()
    kapps = app.push_int(1) + ["dup", "swap", "add"]
    for kapp in kapps:
        app.dispatch(stack_id, kapp)

    kapp_counts = app.get_kapp_counts(start=start_log_length + 1)

    # Filter out kapps with zero counts
    filtered_kapp_counts = {k: v for k, v in kapp_counts.items() if v > 0}

    expected_kapp_counts = {
        "zero": 1,
        "succ": 1,
        "dup": 1,
        "swap": 1,
        "add": 1,
    }

    assert (
        filtered_kapp_counts == expected_kapp_counts
    ), f"Expected {expected_kapp_counts}, but got {filtered_kapp_counts}"


if __name__ == "__main__":
    pytest.main()
