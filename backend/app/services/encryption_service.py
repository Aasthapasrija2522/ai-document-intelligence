from cryptography.fernet import Fernet
from app.core.config import settings

fernet = Fernet(settings.encryption_key.encode())


def encrypt_bytes(data: bytes) -> bytes:
    return fernet.encrypt(data)


def decrypt_bytes(encrypted_data: bytes) -> bytes:
    return fernet.decrypt(encrypted_data)