"""Simple password hashing using hashlib (built-in)"""
import hashlib
import os

def hash_password(password):
    """Hash a password using SHA-256 with salt"""
    salt = os.urandom(32)
    pwd_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    # Return salt + hash (both hex encoded for storage in DB)
    return salt.hex() + pwd_hash.hex()

def verify_password(stored_hash, password):
    """Verify a password against stored hash"""
    try:
        # Extract salt from first 64 chars (32 bytes = 64 hex chars)
        salt = bytes.fromhex(stored_hash[:64])
        stored_pwd_hash = stored_hash[64:]
        
        # Hash the provided password with same salt
        pwd_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
        
        # Compare hashes
        return pwd_hash.hex() == stored_pwd_hash
    except:
        return False

def is_password_hashed(password_field):
    """Check if a password is already hashed (contains + or is very long)"""
    return len(password_field) > 64
