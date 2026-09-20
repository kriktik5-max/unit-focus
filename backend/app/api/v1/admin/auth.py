"""Проверка пароля администратора через заголовок X-Admin-Password."""
from fastapi import Header, HTTPException, status

from app.config import settings


def require_admin(x_admin_password: str = Header(default="")) -> None:
    """FastAPI-зависимость: проверяет пароль в заголовке X-Admin-Password.

    Использование:
        @router.get("/secure", dependencies=[Depends(require_admin)])
        def secure_endpoint(): ...
    """
    if not settings.admin_password:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Пароль администратора не настроен на сервере",
        )
    if x_admin_password != settings.admin_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный пароль администратора",
        )
