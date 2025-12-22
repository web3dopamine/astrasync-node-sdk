# AstraSync SDK

[![npm version](https://badge.fury.io/js/@astrasyncai%2Fsdk.svg)](https://www.npmjs.com/package/@astrasyncai/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Universal TypeScript/Node.js SDK for registering AI agents with AstraSync's blockchain-based compliance platform.

## Features

- 🚀 **Auto-detection** for 5 major agent formats (MCP, Letta, ACP, OpenAI, AutoGPT)
- 🔐 **Blockchain compliance** layer for AI agents
- 📊 **Trust score** calculation based on agent metadata
- 🛠️ **Beautiful CLI** with progress indicators
- 📦 **Zero configuration** - works out of the box
- 🔍 **TypeScript** support with full type safety

## Installation

```bash
npm install @astrasyncai/sdk
```

Or install globally for CLI usage:

```bash
npm install -g @astrasyncai/sdk
```

## Quick Start

First install the SDK:

```bash
npm install @astrasyncai/sdk
```

Then create a JavaScript file (e.g., `register-agent.js`):

```javascript
const { AstraSync } = require("@astrasyncai/sdk");

async function main() {
  // Initialize the client with authentication
  const client = new AstraSync({
    developerEmail: "your-email@example.com",
    apiKey: "your-api-key", // Get from https://astrasync.ai/settings/developer-tools
    // OR use password: 'your-password' (not recommended for production)
  });

  // Your agent data (the SDK auto-detects the format)
  const agentData = {
    protocol: "ai-agent",
    name: "My AI Agent",
    description: "An example AI agent",
    skills: [{ name: "chat" }, { name: "analyze" }],
  };

  try {
    // Register the agent
    const result = await client.register(agentData);
    console.log("✅ Agent registered successfully!");
    console.log(`Agent ID: ${result.agentId}`);
    console.log(`Trust Score: ${result.trustScore}`);
    console.log(`Format Detected: ${result.detectedFormat}`);
  } catch (error) {
    console.error("❌ Registration failed:", error.message);
  }
}

main();
```

Run your code:

```bash
node register-agent.js
```

## CLI Usage

After installing globally, use the `astrasync` command:

```bash
# Check API health
astrasync health

# Register an agent from a JSON file
astrasync register agent.json --email your@email.com

# Register with environment variable
export ASTRASYNC_EMAIL=your@email.com
astrasync register agent.json

# Verify an agent exists
astrasync verify TEMP-123456

# Detect agent format without registering
astrasync detect agent.json

# Get help
astrasync --help
```

## Supported Agent Formats

The SDK automatically detects and supports:

### MCP (Model Context Protocol)

Anthropic's protocol for AI model interactions

```json
{
  "protocol": "ai-agent",
  "name": "MCP Agent",
  "skills": [{ "name": "skill1" }]
}
```

### Letta (formerly MemGPT)

Memory-enabled autonomous agents

```json
{
  "type": "agent",
  "name": "Letta Agent",
  "memory": {}
}
```

### ACP (Agent Communication Protocol)

IBM's protocol for agent-to-agent communication

```json
{
  "agentId": "acp-123",
  "authentication": {},
  "name": "ACP Agent"
}
```

### OpenAI Assistants

OpenAI's assistant API format

```json
{
  "model": "gpt-4",
  "name": "OpenAI Assistant",
  "instructions": "You are a helpful assistant"
}
```

### AutoGPT

Autonomous GPT agents

```json
{
  "ai_name": "AutoGPT Agent",
  "ai_role": "Assistant",
  "ai_goals": ["goal1", "goal2"]
}
```

## Cryptographic Features

AstraSync SDK includes enterprise-grade cryptographic functionality for secure key management and digital signatures.

### Features

- 🔐 **BIP39 Mnemonic Generation** - 12 and 24-word phrase support
- 🔑 **HD Wallet Derivation** - BIP44 path: `m/44'/60'/0'/0/0` (Ethereum-compatible)
- ✍️ **secp256k1 Key Pairs** - Elliptic curve cryptography
- 🔒 **Digital Signatures** - Sign and verify messages
- ☁️ **Crypto Keys API** - Full CRUD operations for server-managed keys
- 🛡️ **Secure Key Management** - Client-side and server-side options

### Quick Start: Crypto

```typescript
import { AstraSync } from "@astrasyncai/sdk";

const client = new AstraSync({
  developerEmail: "your-email@example.com",
  apiKey: "your-api-key",
});

// Generate a mnemonic
const mnemonic = client.generateMnemonic(12);
console.log("Mnemonic:", mnemonic);

// Generate a wallet
const wallet = client.generateWallet(12);
console.log("Address:", wallet.address);
console.log("Public Key:", wallet.publicKey);

// Sign a message
const signature = client.signMessage("Hello World", privateKeyHex);
console.log("Signature:", signature.signature);

// Verify a signature
const isValid = client.verifySignature(
  "Hello World",
  signature.signature,
  publicKeyHex
);
console.log("Valid:", isValid);
```

### Crypto API Methods

#### Mnemonic Operations

```typescript
// Generate a 12 or 24-word mnemonic
const mnemonic12 = client.generateMnemonic(12);
const mnemonic24 = client.generateMnemonic(24);

// Validate a mnemonic
const isValid = client.validateMnemonic(mnemonic);
```

#### Wallet Operations

```typescript
// Generate a new wallet
const wallet = client.generateWallet(12);
// Returns: { mnemonic, seed, address, publicKey, derivationPath }

// Restore wallet from mnemonic
const restored = client.restoreWallet(mnemonic);
```

#### Local Signing & Verification

```typescript
// Sign a message with a private key (client-side)
const signature = client.signMessage(message, privateKeyHex);
// Returns: { signature, recovery }

// Verify a signature (client-side)
const isValid = client.verifySignature(message, signatureHex, publicKeyHex);
// Returns: boolean
```

#### Server-Managed Keys (Crypto Keys API)

```typescript
// Create a key on the server
const key = await client.createCryptoKey({
  keyType: "secp256k1",
  metadata: {
    name: "My Signing Key",
    description: "Used for transaction signing",
  },
});

// List all keys
const keys = await client.listCryptoKeys();

// Get a specific key
const key = await client.getCryptoKey(keyId);

// Sign with a stored key
const signature = await client.signWithStoredKey({
  message: "Transaction data",
  keyId: key.data.id,
});

// Verify with a stored key
const result = await client.verifyWithStoredKey(message, signature, keyId);

// Export public key
const exported = await client.exportPublicKey(keyId, "hex");

// Update key metadata
await client.updateCryptoKey(keyId, {
  metadata: { name: "Updated Name" },
});

// Delete a key
await client.deleteCryptoKey(keyId);
```

#### Advanced Crypto Operations

```typescript
import { CryptoService } from "@astrasyncai/sdk";

// Generate multiple HD wallet accounts
const accounts = CryptoService.HDWallet.deriveMultipleAccounts(mnemonic, 5);

// Get Ethereum address from HD key
const hdkey = CryptoService.HDWallet.derive(mnemonic);
const address = CryptoService.HDWallet.getEthereumAddress(hdkey);

// Generate a raw key pair
const keyPair = CryptoService.KeyPair.generate();
// Returns: { privateKey, publicKey, publicKeyUncompressed }

// Recover public key from signature
const recovered = CryptoService.KeyPair.recoverPublicKey(
  message,
  signature,
  recovery
);
```

### Key Types

The SDK supports the following key types:

- `mnemonic` - BIP39 mnemonic phrases
- `hd_wallet` - HD wallet derived keys (BIP44)
- `secp256k1` - Raw secp256k1 key pairs
- `ethereum` - Ethereum-compatible keys

### Security Best Practices

⚠️ **Important Security Notes:**

1. **Never store private keys or mnemonics in plain text**
2. **Never commit sensitive keys to version control**
3. **Use environment variables for API keys**
4. **Use server-managed keys for production applications**
5. **Always use HTTPS in production**
6. **Implement proper key rotation policies**

```typescript
// ✅ Good: Use environment variables
const client = new AstraSync({
  developerEmail: process.env.ASTRASYNC_EMAIL,
  apiKey: process.env.ASTRASYNC_API_KEY,
});

// ❌ Bad: Hardcoded credentials
const client = new AstraSync({
  developerEmail: "user@example.com",
  apiKey: "sk-1234567890",
});
```

## API Reference

### `new AstraSync(options)`

Create a new AstraSync client.

```typescript
const client = new AstraSync({
  developerEmail: "developer@example.com", // Required
  apiUrl: "https://api.astrasync.ai", // Optional, uses default
});
```

### `client.register(agentData)`

Register an agent with auto-format detection.

```typescript
const result = await client.register(agentData);
// Returns: { agentId, status, trustScore, detectedFormat, ... }
```

### `client.verify(agentId)`

Check if an agent ID exists in the system.

```typescript
const exists = await client.verify("TEMP-123456");
// Returns: boolean
```

### `client.detect(agentData)`

Detect agent format without registering.

```typescript
const format = client.detect(agentData);
// Returns: 'mcp' | 'letta' | 'acp' | 'openai' | 'autogpt' | 'unknown'
```

### `client.health()`

Check API health status.

```typescript
const isHealthy = await client.health();
// Returns: boolean
```

## TypeScript Usage

The SDK includes full TypeScript definitions. Make sure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "target": "ES2015",
    "module": "commonjs",
    "lib": ["ES2015", "DOM"],
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

Example with types:

```typescript
import {
  AstraSync,
  Agent,
  AgentFormat,
  RegistrationResponse,
} from "@astrasyncai/sdk";

const agent: Agent = {
  name: "My Typed Agent",
  description: "A fully typed agent",
  version: "1.0.0",
  capabilities: ["chat", "analyze"],
};

const client = new AstraSync({
  developerEmail: "developer@example.com",
});

// Full type safety and IntelliSense
const format: AgentFormat = client.detect(agent);
const result: RegistrationResponse = await client.register(agent);
```

## Examples

See the `examples/` directory in the [GitHub repository](https://github.com/AstraSyncAI/astrasync-node-sdk) for complete examples.

## Development

```bash
# Clone the repository
git clone https://github.com/AstraSyncAI/astrasync-node-sdk
cd astrasync-node-sdk

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

## Support

- 📧 Email: support@astrasync.ai
- 🐛 Issues: [GitHub Issues](https://github.com/AstraSyncAI/astrasync-node-sdk/issues)
- 📖 Docs: [astrasync.ai/docs](https://astrasync.ai/docs)

## License

MIT © AstraSync AI

---

Built with ❤️ by the AstraSync team
