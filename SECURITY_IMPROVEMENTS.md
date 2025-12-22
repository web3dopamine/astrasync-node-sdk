# Security Improvements Needed

## 🔒 Critical Security Enhancements

### 1. Add Security Warnings to Code

Update `src/services/crypto.ts`:

```typescript
export class CryptoService {
  /**
   * Generate a complete wallet from scratch
   *
   * ⚠️ SECURITY WARNING:
   * - NEVER share your mnemonic phrase with anyone
   * - NEVER log or expose your private key
   * - Store mnemonic in secure, offline location
   * - Consider using hardware wallets for production
   *
   * @param wordCount - Mnemonic word count (12 or 24)
   * @returns Complete wallet information
   */
  static generateWallet(wordCount: 12 | 24 = 12): {
    mnemonic: string;
    seed: string;
    hdKey: HDKey;
    keyPair: ReturnType<typeof KeyPairService.fromHDKey>;
    address: string;
  } {
    // Emit security warning
    console.warn("\n⚠️  SECURITY WARNING: Private keys generated!");
    console.warn(
      "📝 Write down your mnemonic phrase and store it safely offline."
    );
    console.warn("🔐 Never share your private key or mnemonic with anyone.");
    console.warn("💾 Consider using a hardware wallet for production use.\n");

    const mnemonic = MnemonicService.generate(wordCount);
    // ... rest of implementation
  }
}
```

### 2. Environment Variable Support

Create `.env.example`:

```bash
# AstraSync SDK Configuration
ASTRASYNC_EMAIL=your-email@example.com
ASTRASYNC_API_KEY=your-api-key-here
ASTRASYNC_API_URL=https://astrasync.ai/api
```

Update `src/index.ts`:

```typescript
export class AstraSync {
  constructor(options?: Partial<AstraSyncOptions>) {
    const config: AstraSyncOptions = {
      developerEmail:
        options?.developerEmail || process.env.ASTRASYNC_EMAIL || "",
      apiKey: options?.apiKey || process.env.ASTRASYNC_API_KEY,
      password: options?.password,
      apiUrl: options?.apiUrl || process.env.ASTRASYNC_API_URL,
    };

    if (!config.developerEmail) {
      throw new Error("Developer email is required");
    }

    if (!config.apiKey && !config.password) {
      throw new Error(
        "Authentication required: set ASTRASYNC_API_KEY environment variable or provide apiKey/password"
      );
    }

    this.api = new AstraSyncAPI(
      config.developerEmail,
      config.apiKey,
      config.password,
      config.apiUrl
    );
  }
}
```

### 3. Add Key Encryption

Create `src/utils/encryption.ts`:

```typescript
import {
  randomBytes,
  createCipheriv,
  createDecipheriv,
  pbkdf2Sync,
} from "crypto";

/**
 * Encrypt sensitive data using AES-256-GCM
 */
export class Encryption {
  private static readonly ALGORITHM = "aes-256-gcm";
  private static readonly KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 16;
  private static readonly SALT_LENGTH = 32;
  private static readonly TAG_LENGTH = 16;
  private static readonly ITERATIONS = 100000;

  /**
   * Encrypt data with password
   */
  static encrypt(data: string, password: string): string {
    const salt = randomBytes(this.SALT_LENGTH);
    const key = pbkdf2Sync(
      password,
      salt,
      this.ITERATIONS,
      this.KEY_LENGTH,
      "sha256"
    );
    const iv = randomBytes(this.IV_LENGTH);

    const cipher = createCipheriv(this.ALGORITHM, key, iv);
    let encrypted = cipher.update(data, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    // Combine: salt + iv + authTag + encrypted data
    return Buffer.concat([
      salt,
      iv,
      authTag,
      Buffer.from(encrypted, "hex"),
    ]).toString("base64");
  }

  /**
   * Decrypt data with password
   */
  static decrypt(encryptedData: string, password: string): string {
    const buffer = Buffer.from(encryptedData, "base64");

    const salt = buffer.slice(0, this.SALT_LENGTH);
    const iv = buffer.slice(
      this.SALT_LENGTH,
      this.SALT_LENGTH + this.IV_LENGTH
    );
    const authTag = buffer.slice(
      this.SALT_LENGTH + this.IV_LENGTH,
      this.SALT_LENGTH + this.IV_LENGTH + this.TAG_LENGTH
    );
    const encrypted = buffer.slice(
      this.SALT_LENGTH + this.IV_LENGTH + this.TAG_LENGTH
    );

    const key = pbkdf2Sync(
      password,
      salt,
      this.ITERATIONS,
      this.KEY_LENGTH,
      "sha256"
    );

    const decipher = createDecipheriv(this.ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted.toString("hex"), "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }

  /**
   * Encrypt mnemonic phrase
   */
  static encryptMnemonic(mnemonic: string, password: string): string {
    if (!password || password.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }
    return this.encrypt(mnemonic, password);
  }

  /**
   * Decrypt mnemonic phrase
   */
  static decryptMnemonic(encryptedMnemonic: string, password: string): string {
    return this.decrypt(encryptedMnemonic, password);
  }
}
```

### 4. Add Custom Error Types

Create `src/errors/CryptoError.ts`:

```typescript
export class CryptoError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = "CryptoError";
  }
}

export const CryptoErrorCodes = {
  INVALID_MNEMONIC: "INVALID_MNEMONIC",
  KEY_GENERATION_FAILED: "KEY_GENERATION_FAILED",
  SIGNING_FAILED: "SIGNING_FAILED",
  VERIFICATION_FAILED: "VERIFICATION_FAILED",
  ENCRYPTION_FAILED: "ENCRYPTION_FAILED",
  DECRYPTION_FAILED: "DECRYPTION_FAILED",
  INVALID_PRIVATE_KEY: "INVALID_PRIVATE_KEY",
  INVALID_PUBLIC_KEY: "INVALID_PUBLIC_KEY",
  DERIVATION_FAILED: "DERIVATION_FAILED",
};
```

### 5. Add Input Validation

Update `src/services/crypto.ts`:

```typescript
export class MnemonicService {
  /**
   * Generate a BIP39 mnemonic phrase with validation
   */
  static generate(wordCount: 12 | 24 = 12): string {
    if (wordCount !== 12 && wordCount !== 24) {
      throw new CryptoError(
        "Word count must be 12 or 24",
        CryptoErrorCodes.INVALID_MNEMONIC,
        { wordCount }
      );
    }

    try {
      const strength = wordCount === 12 ? 128 : 256;
      const mnemonic = bip39.generateMnemonic(wordlist, strength);

      // Verify generated mnemonic
      if (!this.validate(mnemonic)) {
        throw new Error("Generated mnemonic failed validation");
      }

      return mnemonic;
    } catch (error) {
      throw new CryptoError(
        "Failed to generate mnemonic",
        CryptoErrorCodes.KEY_GENERATION_FAILED,
        { originalError: error }
      );
    }
  }

  /**
   * Validate mnemonic with detailed error
   */
  static validate(mnemonic: string): boolean {
    if (!mnemonic || typeof mnemonic !== "string") {
      return false;
    }

    const words = mnemonic.trim().split(/\s+/);
    if (words.length !== 12 && words.length !== 24) {
      return false;
    }

    return bip39.validateMnemonic(mnemonic, wordlist);
  }
}
```

### 6. Add Rate Limiting

Create `src/utils/rateLimiter.ts`:

```typescript
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  constructor(
    private maxRequests: number = 10,
    private windowMs: number = 60000 // 1 minute
  ) {}

  /**
   * Check if request is allowed
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // Remove old requests outside the window
    const validRequests = requests.filter((time) => now - time < this.windowMs);

    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }

  /**
   * Reset rate limit for key
   */
  reset(key: string): void {
    this.requests.delete(key);
  }
}
```

Update `src/utils/cryptoKeysApi.ts`:

```typescript
export class CryptoKeysAPI {
  private rateLimiter: RateLimiter;

  constructor(/* ... */) {
    // ... existing code
    this.rateLimiter = new RateLimiter(10, 60000); // 10 requests per minute
  }

  async createKey(request: CreateCryptoKeyRequest): Promise<CryptoKeyResponse> {
    if (!this.rateLimiter.isAllowed(this.email)) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }

    // ... rest of implementation
  }
}
```

### 7. Memory Cleanup

Add secure memory cleanup:

```typescript
export class SecureMemory {
  /**
   * Securely wipe sensitive data from memory
   */
  static wipe(buffer: Buffer | Uint8Array): void {
    if (buffer instanceof Buffer) {
      buffer.fill(0);
    } else {
      buffer.fill(0);
    }
  }

  /**
   * Create a secure string that wipes itself
   */
  static createSecureString(value: string): SecureString {
    return new SecureString(value);
  }
}

class SecureString {
  private value: string;
  private wiped: boolean = false;

  constructor(value: string) {
    this.value = value;
  }

  getValue(): string {
    if (this.wiped) {
      throw new Error("SecureString has been wiped");
    }
    return this.value;
  }

  wipe(): void {
    // Overwrite with random data multiple times
    for (let i = 0; i < 3; i++) {
      this.value = randomBytes(this.value.length).toString("hex");
    }
    this.value = "";
    this.wiped = true;
  }
}
```

---

## 📋 Implementation Checklist

### Phase 1: Critical (Week 1)

- [ ] Add security warnings to all methods
- [ ] Implement environment variable support
- [ ] Add input validation
- [ ] Create custom error types
- [ ] Add `.env.example` file

### Phase 2: Important (Week 2)

- [ ] Implement key encryption/decryption
- [ ] Add rate limiting
- [ ] Memory cleanup utilities
- [ ] Update examples with security best practices
- [ ] Create security documentation

### Phase 3: Testing (Week 3)

- [ ] Write security tests
- [ ] Test key encryption/decryption
- [ ] Test rate limiting
- [ ] Penetration testing
- [ ] Code review with security expert

### Phase 4: Documentation (Week 3)

- [ ] Security best practices guide
- [ ] Threat model documentation
- [ ] Incident response plan
- [ ] Update README with security section

---

## 🎯 Quick Wins (Do First)

1. **Add `.env.example` file** (5 minutes)
2. **Add security warnings to console** (10 minutes)
3. **Update examples to use env variables** (15 minutes)
4. **Add input validation** (30 minutes)
5. **Create custom error types** (30 minutes)

Total time: ~90 minutes for immediate security improvements!
