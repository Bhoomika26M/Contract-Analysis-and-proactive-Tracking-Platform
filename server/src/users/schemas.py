from pydantic import BaseModel


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str
