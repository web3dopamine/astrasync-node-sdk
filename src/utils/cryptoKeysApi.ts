import {
  CryptoKey,
  CreateCryptoKeyRequest,
  CryptoKeyResponse,
  CryptoKeysListResponse,
  SignatureRequest,
  SignatureResponse,
} from '../types';

const DEFAULT_API_URL = 'https://astrasync.ai/api';

/**
 * Crypto Keys API Client
 * Provides full CRUD operations for /api/crypto-keys/* endpoints
 */
export class CryptoKeysAPI {
  private apiUrl: string;
  private email: string;
  private apiKey?: string;
  private password?: string;

  constructor(email: string, apiKey?: string, password?: string, apiUrl: string = DEFAULT_API_URL) {
    this.email = email;
    this.apiKey = apiKey;
    this.password = password;
    this.apiUrl = apiUrl;

    if (!apiKey && !password) {
      throw new Error('Authentication required: provide either apiKey or password');
    }
  }

  /**
   * Get authentication token
   * @private
   */
  private async getAuthToken(): Promise<string> {
    if (this.apiKey) {
      return this.apiKey;
    }

    if (this.password) {
      const response = await fetch(`${this.apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-source': 'sdk',
        },
        body: JSON.stringify({
          email: this.email,
          password: this.password,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Authentication failed: ${error}`);
      }

      const result = await response.json() as { data: { token: string } };
      return result.data.token;
    }

    throw new Error('No authentication method available');
  }

  /**
   * Create a new crypto key
   * @param request - Key creation request
   * @returns Created crypto key
   */
  async createKey(request: CreateCryptoKeyRequest): Promise<CryptoKeyResponse> {
    const token = await this.getAuthToken();

    const response = await fetch(`${this.apiUrl}/crypto-keys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-source': 'sdk',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `Failed to create key: ${error}`,
      };
    }

    return response.json() as Promise<CryptoKeyResponse>;
  }

  /**
   * Get a crypto key by ID
   * @param keyId - Key ID
   * @returns Crypto key
   */
  async getKey(keyId: string): Promise<CryptoKeyResponse> {
    const token = await this.getAuthToken();

    const response = await fetch(`${this.apiUrl}/crypto-keys/${keyId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-source': 'sdk',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `Failed to get key: ${error}`,
      };
    }

    return response.json() as Promise<CryptoKeyResponse>;
  }

  /**
   * List all crypto keys for the authenticated user
   * @param keyType - Optional filter by key type
   * @returns List of crypto keys
   */
  async listKeys(keyType?: string): Promise<CryptoKeysListResponse> {
    const token = await this.getAuthToken();

    const url = new URL(`${this.apiUrl}/crypto-keys`);
    if (keyType) {
      url.searchParams.append('keyType', keyType);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-source': 'sdk',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `Failed to list keys: ${error}`,
      };
    }

    return response.json() as Promise<CryptoKeysListResponse>;
  }

  /**
   * Update a crypto key
   * @param keyId - Key ID
   * @param updates - Partial key updates
   * @returns Updated crypto key
   */
  async updateKey(keyId: string, updates: Partial<CryptoKey>): Promise<CryptoKeyResponse> {
    const token = await this.getAuthToken();

    const response = await fetch(`${this.apiUrl}/crypto-keys/${keyId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-source': 'sdk',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `Failed to update key: ${error}`,
      };
    }

    return response.json() as Promise<CryptoKeyResponse>;
  }

  /**
   * Delete a crypto key
   * @param keyId - Key ID
   * @returns Deletion result
   */
  async deleteKey(keyId: string): Promise<CryptoKeyResponse> {
    const token = await this.getAuthToken();

    const response = await fetch(`${this.apiUrl}/crypto-keys/${keyId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-source': 'sdk',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `Failed to delete key: ${error}`,
      };
    }

    return response.json() as Promise<CryptoKeyResponse>;
  }

  /**
   * Sign a message with a stored key
   * @param request - Signature request
   * @returns Signature result
   */
  async signMessage(request: SignatureRequest): Promise<SignatureResponse> {
    const token = await this.getAuthToken();

    const response = await fetch(`${this.apiUrl}/crypto-keys/sign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-source': 'sdk',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `Failed to sign message: ${error}`,
      };
    }

    return response.json() as Promise<SignatureResponse>;
  }

  /**
   * Verify a signature
   * @param message - Original message
   * @param signature - Signature to verify
   * @param keyId - Key ID to verify against
   * @returns Verification result
   */
  async verifySignature(
    message: string,
    signature: string,
    keyId: string
  ): Promise<{ success: boolean; valid?: boolean; error?: string }> {
    const token = await this.getAuthToken();

    const response = await fetch(`${this.apiUrl}/crypto-keys/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-source': 'sdk',
      },
      body: JSON.stringify({ message, signature, keyId }),
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `Failed to verify signature: ${error}`,
      };
    }

    return response.json() as Promise<{ success: boolean; valid?: boolean; error?: string }>;
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
    const token = await this.getAuthToken();

    const response = await fetch(`${this.apiUrl}/crypto-keys/${keyId}/export?format=${format}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-source': 'sdk',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `Failed to export public key: ${error}`,
      };
    }

    return response.json() as Promise<{ success: boolean; publicKey?: string; error?: string }>;
  }
}
