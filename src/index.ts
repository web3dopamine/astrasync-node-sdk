import { Agent, RegistrationResponse, AstraSyncOptions, AgentFormat, CreateCryptoKeyRequest, CryptoKeyResponse, CryptoKeysListResponse, SignatureRequest, SignatureResponse, WalletInfo } from './types';
import { AstraSyncAPI } from './utils/api';
import { CryptoKeysAPI } from './utils/cryptoKeysApi';
import { detectAgentFormat } from './utils/detector';
import { calculateTrustScore } from './utils/trustScore';
import { CryptoService } from './services/crypto';

export class AstraSync {
  private api: AstraSyncAPI;
  private cryptoKeysApi: CryptoKeysAPI;

  constructor(options: AstraSyncOptions) {
    this.api = new AstraSyncAPI(
      options.developerEmail,
      options.apiKey,
      options.password,
      options.apiUrl
    );
    
    this.cryptoKeysApi = new CryptoKeysAPI(
      options.developerEmail,
      options.apiKey,
      options.password,
      options.apiUrl
    );
  }

  // ============================================
  // Agent Management Methods
  // ============================================

  async register(agentData: any): Promise<RegistrationResponse> {
    // Auto-detect format
    const detection = detectAgentFormat(agentData);
    
    if (detection.format === 'unknown' || !detection.agent) {
      throw new Error('Unable to detect agent format. Please check your agent data.');
    }

    // Calculate trust score
    const trustScore = calculateTrustScore(detection.agent);

    // Register with API
    const response = await this.api.registerAgent(detection.agent);

    // Enhance response with detected format
    return {
      ...response,
      detectedFormat: detection.format,
      trustScore: `${trustScore}%`
    };
  }

  async verify(agentId: string): Promise<boolean> {
    return this.api.verifyAgent(agentId);
  }

  detect(agentData: any): AgentFormat {
    return detectAgentFormat(agentData).format;
  }

  async health(): Promise<boolean> {
    return this.api.checkHealth();
  }

  // ============================================
  // Cryptographic Methods
  // ============================================

  /**
   * Generate a new mnemonic phrase
   * @param wordCount - Number of words (12 or 24)
   * @returns Mnemonic phrase
   */
  generateMnemonic(wordCount: 12 | 24 = 12): string {
    return CryptoService.Mnemonic.generate(wordCount);
  }

  /**
   * Validate a mnemonic phrase
   * @param mnemonic - The mnemonic to validate
   * @returns true if valid
   */
  validateMnemonic(mnemonic: string): boolean {
    return CryptoService.Mnemonic.validate(mnemonic);
  }

  /**
   * Generate a complete wallet from scratch
   * @param wordCount - Mnemonic word count (12 or 24)
   * @returns Complete wallet information
   */
  generateWallet(wordCount: 12 | 24 = 12): WalletInfo {
    const wallet = CryptoService.generateWallet(wordCount);
    return {
      mnemonic: wallet.mnemonic,
      seed: wallet.seed,
      address: wallet.address,
      publicKey: wallet.keyPair.publicKey.toString('hex'),
      derivationPath: "m/44'/60'/0'/0/0",
    };
  }

  /**
   * Restore wallet from mnemonic
   * @param mnemonic - BIP39 mnemonic phrase
   * @returns Restored wallet information
   */
  restoreWallet(mnemonic: string): WalletInfo {
    const wallet = CryptoService.restoreWallet(mnemonic);
    return {
      mnemonic: wallet.mnemonic,
      seed: wallet.seed,
      address: wallet.address,
      publicKey: wallet.keyPair.publicKey.toString('hex'),
      derivationPath: "m/44'/60'/0'/0/0",
    };
  }

  /**
   * Sign a message with a private key (local signing)
   * @param message - Message to sign
   * @param privateKeyHex - Private key in hex format
   * @returns Signature and recovery ID
   */
  signMessage(message: string, privateKeyHex: string): { signature: string; recovery: number } {
    const privateKey = Buffer.from(privateKeyHex, 'hex');
    const result = CryptoService.KeyPair.sign(message, privateKey);
    return {
      signature: result.signature.toString('hex'),
      recovery: result.recovery,
    };
  }

  /**
   * Verify a signature (local verification)
   * @param message - Original message
   * @param signatureHex - Signature in hex format
   * @param publicKeyHex - Public key in hex format
   * @returns true if signature is valid
   */
  verifySignature(message: string, signatureHex: string, publicKeyHex: string): boolean {
    const signature = Buffer.from(signatureHex, 'hex');
    const publicKey = Buffer.from(publicKeyHex, 'hex');
    return CryptoService.KeyPair.verify(message, signature, publicKey);
  }

  // ============================================
  // Crypto Keys API Methods (Server-side)
  // ============================================

  /**
   * Create a new crypto key on the server
   * @param request - Key creation request
   * @returns Created crypto key
   */
  async createCryptoKey(request: CreateCryptoKeyRequest): Promise<CryptoKeyResponse> {
    return this.cryptoKeysApi.createKey(request);
  }

  /**
   * Get a crypto key by ID
   * @param keyId - Key ID
   * @returns Crypto key
   */
  async getCryptoKey(keyId: string): Promise<CryptoKeyResponse> {
    return this.cryptoKeysApi.getKey(keyId);
  }

  /**
   * List all crypto keys
   * @param keyType - Optional filter by key type
   * @returns List of crypto keys
   */
  async listCryptoKeys(keyType?: string): Promise<CryptoKeysListResponse> {
    return this.cryptoKeysApi.listKeys(keyType);
  }

  /**
   * Update a crypto key
   * @param keyId - Key ID
   * @param updates - Partial key updates
   * @returns Updated crypto key
   */
  async updateCryptoKey(keyId: string, updates: any): Promise<CryptoKeyResponse> {
    return this.cryptoKeysApi.updateKey(keyId, updates);
  }

  /**
   * Delete a crypto key
   * @param keyId - Key ID
   * @returns Deletion result
   */
  async deleteCryptoKey(keyId: string): Promise<CryptoKeyResponse> {
    return this.cryptoKeysApi.deleteKey(keyId);
  }

  /**
   * Sign a message with a stored key (server-side)
   * @param request - Signature request
   * @returns Signature result
   */
  async signWithStoredKey(request: SignatureRequest): Promise<SignatureResponse> {
    return this.cryptoKeysApi.signMessage(request);
  }

  /**
   * Verify a signature (server-side)
   * @param message - Original message
   * @param signature - Signature to verify
   * @param keyId - Key ID to verify against
   * @returns Verification result
   */
  async verifyWithStoredKey(
    message: string,
    signature: string,
    keyId: string
  ): Promise<{ success: boolean; valid?: boolean; error?: string }> {
    return this.cryptoKeysApi.verifySignature(message, signature, keyId);
  }

  /**
   * Export public key
   * @param keyId - Key ID
   * @param format - Export format (pem, hex, base64)
   * @returns Exported public key
   */
  async exportPublicKey(
    keyId: string,
    format: 'pem' | 'hex' | 'base64' = 'hex'
  ): Promise<{ success: boolean; publicKey?: string; error?: string }> {
    return this.cryptoKeysApi.exportPublicKey(keyId, format);
  }
}

// Export everything
export * from './types';
export { detectAgentFormat } from './utils/detector';
export { calculateTrustScore } from './utils/trustScore';
export { CryptoService } from './services/crypto';
