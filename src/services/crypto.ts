import * as bip39 from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { HDKey } from '@scure/bip32';
import * as secp256k1 from 'secp256k1';
import { createHash, randomBytes } from 'crypto';
import { keccak256 } from 'ethereum-cryptography/keccak';

/**
 * BIP39 Mnemonic Service
 * Supports 12 and 24-word phrase generation
 */
export class MnemonicService {
  /**
   * Generate a BIP39 mnemonic phrase
   * @param wordCount - Number of words (12 or 24)
   * @returns Mnemonic phrase as a string
   */
  static generate(wordCount: 12 | 24 = 12): string {
    const strength = wordCount === 12 ? 128 : 256; // 128 bits = 12 words, 256 bits = 24 words
    const entropy = randomBytes(strength / 8);
    return bip39.generateMnemonic(wordlist, strength);
  }

  /**
   * Validate a BIP39 mnemonic phrase
   * @param mnemonic - The mnemonic phrase to validate
   * @returns true if valid, false otherwise
   */
  static validate(mnemonic: string): boolean {
    return bip39.validateMnemonic(mnemonic, wordlist);
  }

  /**
   * Convert mnemonic to seed (for HD wallet derivation)
   * @param mnemonic - The mnemonic phrase
   * @param passphrase - Optional passphrase for additional security
   * @returns Seed buffer
   */
  static toSeed(mnemonic: string, passphrase: string = ''): Uint8Array {
    return bip39.mnemonicToSeedSync(mnemonic, passphrase);
  }
}

/**
 * HD Wallet Service
 * Implements BIP44 derivation path for Ethereum: m/44'/60'/0'/0/0
 */
export class HDWalletService {
  private static readonly ETH_DERIVATION_PATH = "m/44'/60'/0'/0/0";

  /**
   * Derive HD wallet from mnemonic
   * @param mnemonic - BIP39 mnemonic phrase
   * @param derivationPath - BIP44 derivation path (defaults to Ethereum path)
   * @param accountIndex - Account index for derivation (default: 0)
   * @returns HDKey instance
   */
  static derive(
    mnemonic: string,
    derivationPath: string = HDWalletService.ETH_DERIVATION_PATH,
    accountIndex: number = 0
  ): HDKey {
    const seed = MnemonicService.toSeed(mnemonic);
    const hdkey = HDKey.fromMasterSeed(seed);
    
    // Support custom account index
    const path = derivationPath.replace('/0/0', `/${accountIndex}/0`);
    return hdkey.derive(path);
  }

  /**
   * Get Ethereum-compatible address from derived key
   * @param hdkey - Derived HD key
   * @returns Ethereum address (0x prefixed)
   */
  static getEthereumAddress(hdkey: HDKey): string {
    if (!hdkey.publicKey) {
      throw new Error('Public key not available');
    }

    // Get uncompressed public key (65 bytes: 0x04 + 64 bytes)
    const privateKeyUint = hdkey.privateKey ? Uint8Array.from(hdkey.privateKey) : undefined;
    if (!privateKeyUint) {
      throw new Error('Private key not available');
    }
    
    const uncompressedPublicKey = secp256k1.publicKeyCreate(privateKeyUint, false);
    
    // Remove the first byte (0x04 prefix) to get the raw 64-byte public key
    const publicKeyRaw = uncompressedPublicKey.slice(1);
    
    // Keccak256 hash of the raw public key (NOT SHA3-256!)
    const hash = keccak256(publicKeyRaw);
    
    // Take last 20 bytes and add 0x prefix
    return '0x' + Buffer.from(hash.slice(-20)).toString('hex');
  }

  /**
   * Derive multiple accounts from a single mnemonic
   * @param mnemonic - BIP39 mnemonic phrase
   * @param count - Number of accounts to derive
   * @returns Array of derived HD keys
   */
  static deriveMultipleAccounts(mnemonic: string, count: number = 5): HDKey[] {
    const accounts: HDKey[] = [];
    for (let i = 0; i < count; i++) {
      accounts.push(this.derive(mnemonic, this.ETH_DERIVATION_PATH, i));
    }
    return accounts;
  }
}

/**
 * Key Pair Service
 * secp256k1 elliptic curve key pair generation
 */
export class KeyPairService {
  /**
   * Generate a new secp256k1 key pair
   * @returns Object containing private key, public key (compressed and uncompressed)
   */
  static generate(): {
    privateKey: Buffer;
    publicKey: Buffer;
    publicKeyUncompressed: Buffer;
  } {
    let privateKey: Uint8Array;
    do {
      privateKey = new Uint8Array(randomBytes(32));
    } while (!secp256k1.privateKeyVerify(privateKey));

    const privateKeyBuffer = Buffer.from(privateKey);
    const publicKey = Buffer.from(secp256k1.publicKeyCreate(privateKey));
    const publicKeyUncompressed = Buffer.from(
      secp256k1.publicKeyCreate(privateKey, false)
    );

    return {
      privateKey: privateKeyBuffer,
      publicKey,
      publicKeyUncompressed,
    };
  }

  /**
   * Generate key pair from HD wallet
   * @param hdkey - Derived HD key
   * @returns Key pair object
   */
  static fromHDKey(hdkey: HDKey): {
    privateKey: Buffer;
    publicKey: Buffer;
    publicKeyUncompressed: Buffer;
  } {
    if (!hdkey.privateKey) {
      throw new Error('Private key not available in HD key');
    }
    if (!hdkey.publicKey) {
      throw new Error('Public key not available in HD key');
    }

    const privateKey = Buffer.from(hdkey.privateKey);
    const privateKeyUint = Uint8Array.from(privateKey);
    const publicKey = Buffer.from(secp256k1.publicKeyCreate(privateKeyUint));
    const publicKeyUncompressed = Buffer.from(
      secp256k1.publicKeyCreate(privateKeyUint, false)
    );

    return {
      privateKey,
      publicKey,
      publicKeyUncompressed,
    };
  }

  /**
   * Sign a message with a private key
   * @param message - Message to sign (will be hashed with SHA256)
   * @param privateKey - Private key buffer
   * @returns Signature object with r, s, and recovery values
   */
  static sign(
    message: string | Buffer,
    privateKey: Buffer
  ): {
    signature: Buffer;
    recovery: number;
  } {
    const messageBuffer = typeof message === 'string'
      ? Buffer.from(message)
      : message;
    
    const messageHash = createHash('sha256').update(Uint8Array.from(messageBuffer)).digest();
    const messageHashUint = Uint8Array.from(messageHash);
    const privateKeyUint = Uint8Array.from(privateKey);

    const { signature, recid } = secp256k1.ecdsaSign(messageHashUint, privateKeyUint);

    return {
      signature: Buffer.from(signature),
      recovery: recid,
    };
  }

  /**
   * Verify a signature
   * @param message - Original message
   * @param signature - Signature buffer
   * @param publicKey - Public key buffer
   * @returns true if signature is valid
   */
  static verify(
    message: string | Buffer,
    signature: Buffer,
    publicKey: Buffer
  ): boolean {
    const messageBuffer = typeof message === 'string'
      ? Buffer.from(message)
      : message;
    
    const messageHash = createHash('sha256').update(Uint8Array.from(messageBuffer)).digest();
    const messageHashUint = Uint8Array.from(messageHash);
    const signatureUint = Uint8Array.from(signature);
    const publicKeyUint = Uint8Array.from(publicKey);

    return secp256k1.ecdsaVerify(signatureUint, messageHashUint, publicKeyUint);
  }

  /**
   * Recover public key from signature
   * @param message - Original message
   * @param signature - Signature buffer
   * @param recovery - Recovery ID
   * @returns Recovered public key
   */
  static recoverPublicKey(
    message: string | Buffer,
    signature: Buffer,
    recovery: number
  ): Buffer {
    const messageBuffer = typeof message === 'string'
      ? Buffer.from(message)
      : message;
    
    const messageHash = createHash('sha256').update(Uint8Array.from(messageBuffer)).digest();
    const messageHashUint = Uint8Array.from(messageHash);
    const signatureUint = Uint8Array.from(signature);

    return Buffer.from(
      secp256k1.ecdsaRecover(signatureUint, recovery, messageHashUint, false)
    );
  }
}

/**
 * Unified Crypto Service
 * Combines all cryptographic operations
 */
export class CryptoService {
  static Mnemonic = MnemonicService;
  static HDWallet = HDWalletService;
  static KeyPair = KeyPairService;

  /**
   * Generate a complete wallet from scratch
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
    const mnemonic = MnemonicService.generate(wordCount);
    const hdKey = HDWalletService.derive(mnemonic);
    const keyPair = KeyPairService.fromHDKey(hdKey);
    const address = HDWalletService.getEthereumAddress(hdKey);
    const seed = MnemonicService.toSeed(mnemonic);

    return {
      mnemonic,
      seed: Buffer.from(seed).toString('hex'),
      hdKey,
      keyPair,
      address,
    };
  }

  /**
   * Restore wallet from mnemonic
   * @param mnemonic - BIP39 mnemonic phrase
   * @returns Restored wallet information
   */
  static restoreWallet(mnemonic: string): {
    mnemonic: string;
    seed: string;
    hdKey: HDKey;
    keyPair: ReturnType<typeof KeyPairService.fromHDKey>;
    address: string;
  } {
    if (!MnemonicService.validate(mnemonic)) {
      throw new Error('Invalid mnemonic phrase');
    }

    const hdKey = HDWalletService.derive(mnemonic);
    const keyPair = KeyPairService.fromHDKey(hdKey);
    const address = HDWalletService.getEthereumAddress(hdKey);
    const seed = MnemonicService.toSeed(mnemonic);

    return {
      mnemonic,
      seed: Buffer.from(seed).toString('hex'),
      hdKey,
      keyPair,
      address,
    };
  }
}
