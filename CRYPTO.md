# Cryptographic Signatures

AstraSync SDK provides enterprise-grade cryptographic functionality for key management, digital signatures, and blockchain integration.

## Features

- ✅ **BIP39 Mnemonics** - Generate 12/24-word recovery phrases
- ✅ **BIP44 HD Wallets** - Ethereum-compatible multi-account derivation
- ✅ **ECDSA Signing** - secp256k1 digital signatures with recovery
- ✅ **Signature Verification** - Public key validation
- ✅ **Key Management** - Generate and restore wallets

## Installation

```bash
npm install @astrasyncai/sdk
```

## Quick Start

```typescript
import { AstraSync } from '@astrasyncai/sdk';

const sdk = new AstraSync({
  developerEmail: 'dev@example.com',
  apiKey: 'your-api-key'
});

// Generate wallet
const wallet = sdk.generateWallet(12);
console.log('Address:', wallet.address);
console.log('Mnemonic:', wallet.mnemonic);

// Sign a message
const signature = sdk.signMessage('Hello World', privateKeyHex);

// Verify signature
const valid = sdk.verifySignature('Hello World', signature.signature, publicKeyHex);

// Restore wallet from mnemonic
const restored = sdk.restoreWallet(wallet.mnemonic);
```

## API Reference

### AstraSync Methods

#### Mnemonics
- `generateMnemonic(wordCount: 12 | 24): string` - Generate BIP39 phrase
- `validateMnemonic(mnemonic: string): boolean` - Validate phrase

#### Wallets
- `generateWallet(wordCount: 12 | 24): WalletInfo` - Create new wallet
- `restoreWallet(mnemonic: string): WalletInfo` - Restore from mnemonic

#### Signatures
- `signMessage(message: string, privateKeyHex: string): { signature: string; recovery: number }` - Sign message
- `verifySignature(message: string, signatureHex: string, publicKeyHex: string): boolean` - Verify signature

### CryptoService (Advanced)

```typescript
import { CryptoService } from '@astrasyncai/sdk';

// Mnemonic operations
CryptoService.Mnemonic.generate(12);
CryptoService.Mnemonic.validate(mnemonic);
CryptoService.Mnemonic.toSeed(mnemonic, passphrase?);

// HD Wallet
CryptoService.HDWallet.derive(mnemonic, derivationPath?, accountIndex?);
CryptoService.HDWallet.getEthereumAddress(hdkey);
CryptoService.HDWallet.deriveMultipleAccounts(mnemonic, count);

// Key Pair
CryptoService.KeyPair.generate();
CryptoService.KeyPair.fromHDKey(hdkey);
CryptoService.KeyPair.sign(message, privateKey);
CryptoService.KeyPair.verify(message, signature, publicKey);
CryptoService.KeyPair.recoverPublicKey(message, signature, recovery);
```

## Types

```typescript
interface WalletInfo {
  mnemonic: string;
  seed: string;
  address: string;
  publicKey: string;
  derivationPath: string;
}
```

## Standards

- BIP39 - Mnemonic code for generating deterministic keys
- BIP44 - Multi-account hierarchy for deterministic wallets
- secp256k1 - Elliptic curve cryptography
- ECDSA - Elliptic Curve Digital Signature Algorithm
- Ethereum - Address generation with Keccak-256

## Dependencies

- `@scure/bip32` - HD wallet derivation
- `@scure/bip39` - Mnemonic generation
- `ethereum-cryptography` - Keccak-256 hashing
- `secp256k1` - ECDSA signing

## Security

- **Client-side only** - No server dependency
- **Standard libraries** - Industry-proven implementations
- **Type-safe** - Full TypeScript support
- **Key management** - Never expose private keys

### Best Practices

```typescript
// ✅ Good - Use environment variables
const privateKey = process.env.PRIVATE_KEY;

// ❌ Bad - Never hardcode keys
const privateKey = '0x123abc...';

// ✅ Good - Validate before use
if (sdk.validateMnemonic(mnemonic)) {
  const wallet = sdk.restoreWallet(mnemonic);
}

// ✅ Good - Keep mnemonics secure
// Store offline, encrypted, or in a hardware wallet
```

## Use Cases

1. **Wallet Management** - Generate and restore crypto wallets
2. **Digital Signatures** - Sign transactions and messages
3. **Multi-Account Derivation** - Multiple accounts from one seed
4. **Blockchain Integration** - Ethereum address generation and signing

## Examples

### Generate Multiple Accounts

```typescript
const mnemonic = sdk.generateMnemonic(12);
const accounts = CryptoService.HDWallet.deriveMultipleAccounts(mnemonic, 5);

accounts.forEach((account, i) => {
  const address = CryptoService.HDWallet.getEthereumAddress(account);
  console.log(`Account ${i}: ${address}`);
});
```

### Sign and Verify

```typescript
const wallet = sdk.generateWallet(12);
const message = 'Transaction data';

// Sign
const sig = sdk.signMessage(message, privateKeyHex);

// Verify
const isValid = sdk.verifySignature(message, sig.signature, wallet.publicKey);
console.log('Valid:', isValid);
```

### Wallet Recovery

```typescript
// Save this securely
const mnemonic = wallet.mnemonic;

// Later, recover wallet
const recovered = sdk.restoreWallet(mnemonic);
console.log('Same address:', recovered.address === wallet.address); // true
```

## License

MIT
