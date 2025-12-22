export interface Agent {
  name: string;
  description: string;
  version?: string;
  capabilities?: string[];
  [key: string]: any;
}

export interface RegistrationResponse {
  agentId: string;
  status: string;
  trustScore?: string;
  blockchainStatus?: string;
  message?: string;
  verificationUrl?: string;
  detectedFormat?: string; // Added to fix TypeScript error
}

export interface AstraSyncOptions {
  developerEmail: string;
  apiKey?: string;
  password?: string;
  apiUrl?: string;
}

export type AgentFormat = 'mcp' | 'letta' | 'acp' | 'openai' | 'autogpt' | 'unknown';

export interface DetectionResult {
  format: AgentFormat;
  confidence: number;
  agent?: Agent;
}

// Crypto-related types
export type KeyType = 'mnemonic' | 'hd_wallet' | 'secp256k1' | 'ethereum';

export interface CryptoKey {
  id?: string;
  userId?: string;
  keyType: KeyType;
  publicKey: string;
  privateKeyEncrypted?: string; // Encrypted private key (never store plain)
  address?: string; // Ethereum address for ethereum/hd_wallet types
  derivationPath?: string; // BIP44 path (e.g., m/44'/60'/0'/0/0)
  mnemonic?: string; // Only for storage purposes, should be encrypted
  createdAt?: Date;
  updatedAt?: Date;
  metadata?: {
    name?: string;
    description?: string;
    compressed?: boolean;
    [key: string]: any;
  };
}

export interface CreateCryptoKeyRequest {
  keyType: KeyType;
  derivationPath?: string;
  wordCount?: 12 | 24;
  metadata?: CryptoKey['metadata'];
}

export interface CryptoKeyResponse {
  success: boolean;
  data?: CryptoKey;
  message?: string;
  error?: string;
}

export interface CryptoKeysListResponse {
  success: boolean;
  data?: CryptoKey[];
  count?: number;
  message?: string;
  error?: string;
}

export interface SignatureRequest {
  message: string;
  keyId: string;
}

export interface SignatureResponse {
  success: boolean;
  signature?: string;
  recovery?: number;
  message?: string;
  error?: string;
}

export interface WalletInfo {
  mnemonic: string;
  seed: string;
  address: string;
  publicKey: string;
  derivationPath: string;
}
