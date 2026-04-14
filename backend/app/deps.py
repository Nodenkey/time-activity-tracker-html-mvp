from typing import Dict

from fastapi import Query


def pagination_params(skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=1000)) -> Dict[str, int]:
    return {"skip": skip, "limit": limit}
