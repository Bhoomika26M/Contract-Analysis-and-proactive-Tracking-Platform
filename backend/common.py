from calendar import monthrange
from datetime import date, datetime


def now() -> str:
    return datetime.now().astimezone().isoformat()


def today() -> str:
    return date.today().isoformat()


def add_months(value: str, months: int) -> str:
    current = date.fromisoformat(value)
    month_index = current.month - 1 + months
    year = current.year + month_index // 12
    month = month_index % 12 + 1
    day = min(current.day, monthrange(year, month)[1])
    return date(year, month, day).isoformat()
