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

export interface WalletInfo {
  mnemonic: string;
  seed: string;
  address: string;
  publicKey: string;
  derivationPath: string;
}
