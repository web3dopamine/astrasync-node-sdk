# Cryptographic Features Documentation

## Overview

AstraSync SDK provides enterprise-grade cryptographic functionality for secure key management, digital signatures, and blockchain integration. The implementation follows industry standards including BIP39, BIP44, and uses the secp256k1 elliptic curve.

## Architecture

### Components

1. **Mnemonic Service** - BIP39 mnemonic phrase generation and validation
2. **HD Wallet Service** - BIP44 hierarchical deterministic wallet derivation
3. **Key Pair Service** - secp256k1 elliptic curve key pair operations

### Standards Compliance

- ✅ **BIP39** - Mnemonic code for generating deterministic keys
- ✅ **BIP44** - Multi-account hierarchy for deterministic wallets
- ✅ **secp256k1** - Elliptic curve used by Bitcoin and Ethereum
- ✅ **Ethereum** - Compatible address generation

## Installation

The SDK includes all necessary cryptographic dependencies:

```bash
npm install @astrasyncai/sdk
```

Dependencies installed:

- `@scure/bip39` - Secure BIP39 implementation
- `@scure/bip32` - Secure BIP32 HD wallet implementation
- `secp256k1` - Native secp256k1 library
- `crypto` - Node.js built-in crypto module

## Usage

### 1. Mnemonic Generation

Generate BIP39 mnemonic phrases for wallet creation:

```typescript
import { AstraSync } from "@astrasyncai/sdk";

const client = new AstraSync({
  developerEmail: "dev@example.com",
  apiKey: "your-api-key",
});

// Generate 12-word mnemonic
const mnemonic12 = client.generateMnemonic(12);

// Generate 24-word mnemonic (more entropy)
const mnemonic24 = client.generateMnemonic(24);

// Validate mnemonic
const isValid = client.validateMnemonic(mnemonic12);
```

**Security Note:** Store mnemonics securely. Never commit to version control or transmit over insecure channels.

### 2. Wallet Generation

Generate complete Ethereum-compatible wallets:

```typescript
// Generate new wallet
const wallet = client.generateWallet(12);

console.log(wallet);
// {
//   mnemonic: "word1 word2 word3 ...",
//   seed: "hex-encoded-seed",
//   address: "0x...",
//   publicKey: "hex-encoded-public-key",
//   derivationPath: "m/44'/60'/0'/0/0"
// }

// Restore wallet from mnemonic
const restored = client.restoreWallet(wallet.mnemonic);
console.log(restored.address === wallet.address); // true
```

### 3. Key Pair Operations

Generate and manage secp256k1 key pairs:

```typescript
import { CryptoService } from "@astrasyncai/sdk";

// Generate raw key pair
const keyPair = CryptoService.KeyPair.generate();
console.log({
  privateKey: keyPair.privateKey.toString("hex"),
  publicKey: keyPair.publicKey.toString("hex"),
  publicKeyUncompressed: keyPair.publicKeyUncompressed.toString("hex"),
});

// Generate key pair from HD wallet
const hdkey = CryptoService.HDWallet.derive(mnemonic);
const walletKeyPair = CryptoService.KeyPair.fromHDKey(hdkey);
```

### 4. Digital Signatures

Sign and verify messages using ECDSA:

```typescript
// Sign a message (client-side)
const message = "Transaction: Send 1 ETH to 0x...";
const privateKeyHex = "your-private-key-hex";

const signature = client.signMessage(message, privateKeyHex);
console.log(signature);
// {
//   signature: "hex-encoded-signature",
//   recovery: 0 or 1
// }

// Verify signature (client-side)
const isValid = client.verifySignature(
  message,
  signature.signature,
  publicKeyHex
);

console.log(isValid); // true or false
```

### 5. HD Wallet Derivation

Derive multiple accounts from a single mnemonic:

```typescript
import { CryptoService } from "@astrasyncai/sdk";

// Derive single account
const hdkey = CryptoService.HDWallet.derive(mnemonic);
const address = CryptoService.HDWallet.getEthereumAddress(hdkey);

// Derive multiple accounts
const accounts = CryptoService.HDWallet.deriveMultipleAccounts(mnemonic, 5);
accounts.forEach((account, index) => {
  const address = CryptoService.HDWallet.getEthereumAddress(account);
  console.log(`Account ${index}: ${address}`);
});

// Custom derivation path
const customPath = "m/44'/60'/1'/0/0"; // Account 1
const customKey = CryptoService.HDWallet.derive(mnemonic, customPath);
```

## API Reference

### AstraSync Class Methods

#### Mnemonic Methods

- `generateMnemonic(wordCount: 12 | 24): string` - Generate BIP39 mnemonic
- `validateMnemonic(mnemonic: string): boolean` - Validate mnemonic phrase

#### Wallet Methods

- `generateWallet(wordCount: 12 | 24): WalletInfo` - Generate complete wallet
- `restoreWallet(mnemonic: string): WalletInfo` - Restore wallet from mnemonic

#### Local Crypto Methods

- `signMessage(message: string, privateKeyHex: string): { signature: string; recovery: number }` - Sign message locally
- `verifySignature(message: string, signatureHex: string, publicKeyHex: string): boolean` - Verify signature locally

#### Server Crypto Methods

- `createCryptoKey(request: CreateCryptoKeyRequest): Promise<CryptoKeyResponse>` - Create server key
- `getCryptoKey(keyId: string): Promise<CryptoKeyResponse>` - Get key by ID
- `listCryptoKeys(keyType?: string): Promise<CryptoKeysListResponse>` - List all keys
- `updateCryptoKey(keyId: string, updates: any): Promise<CryptoKeyResponse>` - Update key
- `deleteCryptoKey(keyId: string): Promise<CryptoKeyResponse>` - Delete key
- `verifySignature(message: string, signatureHex: string, publicKeyHex: string): boolean` - Verify signature locally

### CryptoService Class

#### MnemonicService

- `generate(wordCount: 12 | 24): string` - Generate mnemonic
- `validate(mnemonic: string): boolean` - Validate mnemonic
- `toSeed(mnemonic: string, passphrase?: string): Uint8Array` - Convert to seed

#### HDWalletService

- `derive(mnemonic: string, derivationPath?: string, accountIndex?: number): HDKey` - Derive HD key
- `getEthereumAddress(hdkey: HDKey): string` - Get Ethereum address
- `deriveMultipleAccounts(mnemonic: string, count: number): HDKey[]` - Derive multiple accounts

#### KeyPairService

- `generate(): { privateKey, publicKey, publicKeyUncompressed }` - Generate key pair
- `fromHDKey(hdkey: HDKey): { privateKey, publicKey, publicKeyUncompressed }` - Generate from HD key
- `sign(message: string | Buffer, privateKey: Buffer): { signature, recovery }` - Sign message
- `verify(message: string | Buffer, signature: Buffer, publicKey: Buffer): boolean` - Verify signature
- `recoverPublicKey(message: string | Buffer, signature: Buffer, recovery: number): Buffer` - Recover public key

## Types

### WalletInfo

```typescript
interface WalletInfo {
  mnemonic: string;
  seed: string;
  address: string;
  publicKey: string;
  derivationPath: string;
}
```

## Security Considerations

### Best Practices

1. **Never Hardcode Keys**

   ```typescript
   // ❌ Bad
   const privateKey = "0x123abc...";

   // ✅ Good
   const privateKey = process.env.PRIVATE_KEY;
   ```

2. **Use Environment Variables**

   ```bash
   # .env
   ASTRASYNC_EMAIL=dev@example.com
   ASTRASYNC_API_KEY=sk-...
   PRIVATE_KEY=0x...
   ```

3. **Secure Mnemonic Storage**

   - Encrypt mnemonics at rest
   - Use hardware security modules (HSM) for production
   - Implement proper access controls

4. **Key Rotation**

   - Rotate keys periodically
   - Use server-managed keys for easier rotation
   - Maintain key version history

5. **Audit Trails**
   - Log all cryptographic operations
   - Monitor for unusual activity
   - Implement alerting for sensitive operations

### Common Pitfalls

❌ **Don't:**

- Store private keys in databases unencrypted
- Commit keys to version control
- Share mnemonics via email/chat
- Use weak entropy sources
- Reuse keys across environments

✅ **Do:**

- Use hardware wallets for high-value operations
- Implement multi-signature schemes
- Use secure key derivation functions
- Test recovery procedures regularly
- Follow principle of least privilege

## Examples

See `examples/crypto-example.ts` for a complete working example.

Run the example:

```bash
npm run example:crypto
```

## Troubleshooting

### Issue: "Invalid mnemonic phrase"

**Solution:** Ensure the mnemonic has the correct number of words (12 or 24) and uses valid BIP39 words.

### Issue: "Authentication failed"

**Solution:** Verify your API key or password is correct and not expired.

### Issue: "Key not found"

**Solution:** Ensure the key ID exists and belongs to your account.

### Issue: Type errors with Buffer/Uint8Array

**Solution:** The SDK handles these conversions internally. If you encounter issues, ensure you're using Node.js >= 16.

## Additional Resources

- [BIP39 Specification](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki)
- [BIP44 Specification](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)
- [secp256k1 Curve](https://en.bitcoin.it/wiki/Secp256k1)
- [Ethereum Key Derivation](https://ethereum.org/en/developers/docs/accounts/)

## Support

For issues or questions:

- 📧 Email: support@astrasync.ai
- 🐛 GitHub: [Issues](https://github.com/AstraSyncAI/astrasync-node-sdk/issues)
- 📖 Docs: [astrasync.ai/docs](https://astrasync.ai/docs)
