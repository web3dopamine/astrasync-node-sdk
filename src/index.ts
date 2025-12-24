import { Agent, RegistrationResponse, AstraSyncOptions, AgentFormat, WalletInfo } from './types';
import { AstraSyncAPI } from './utils/api';
import { detectAgentFormat } from './utils/detector';
import { calculateTrustScore } from './utils/trustScore';
import { CryptoService } from './services/crypto';

export class AstraSync {
  private api: AstraSyncAPI;

  constructor(options: AstraSyncOptions) {
    this.api = new AstraSyncAPI(
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

  // Removed: Server-side API methods not needed for SDK-only functionality
  // Keep only local cryptographic functions above
}

// Export everything
export * from './types';
export { detectAgentFormat } from './utils/detector';
export { calculateTrustScore } from './utils/trustScore';
export { CryptoService } from './services/crypto';
