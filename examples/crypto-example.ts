/**
 * Example: Using AstraSync SDK Cryptographic Features
 * 
 * This example demonstrates:
 * - Generating mnemonics (BIP39)
 * - Creating HD wallets (BIP44)
 * - Generating key pairs (secp256k1)
 * - Signing and verifying messages
 * - Managing crypto keys via API
 */

import { AstraSync, CryptoService } from '../src';

async function main() {
  console.log('🔐 AstraSync Crypto Example\n');

  // Initialize the SDK
  const client = new AstraSync({
    developerEmail: 'your-email@example.com',
    apiKey: 'your-api-key', // Get from https://astrasync.ai/settings/developer-tools
  });

  // ============================================
  // 1. Generate a new mnemonic (12 or 24 words)
  // ============================================
  console.log('📝 Generating Mnemonic...');
  const mnemonic12 = client.generateMnemonic(12);
  const mnemonic24 = client.generateMnemonic(24);
  
  console.log(`12-word mnemonic: ${mnemonic12}`);
  console.log(`24-word mnemonic: ${mnemonic24}\n`);

  // ============================================
  // 2. Validate a mnemonic
  // ============================================
  console.log('✅ Validating Mnemonic...');
  const isValid = client.validateMnemonic(mnemonic12);
  console.log(`Mnemonic is valid: ${isValid}\n`);

  // ============================================
  // 3. Generate a complete wallet
  // ============================================
  console.log('💼 Generating Wallet...');
  const wallet = client.generateWallet(12);
  console.log('Wallet generated:');
  console.log(`  Address: ${wallet.address}`);
  console.log(`  Public Key: ${wallet.publicKey}`);
  console.log(`  Mnemonic: ${wallet.mnemonic}`);
  console.log(`  Derivation Path: ${wallet.derivationPath}\n`);

  // ⚠️ IMPORTANT: Store mnemonic securely! Never share or commit to version control.

  // ============================================
  // 4. Restore wallet from mnemonic
  // ============================================
  console.log('🔄 Restoring Wallet from Mnemonic...');
  const restoredWallet = client.restoreWallet(wallet.mnemonic);
  console.log('Wallet restored:');
  console.log(`  Address: ${restoredWallet.address}`);
  console.log(`  Matches original: ${restoredWallet.address === wallet.address}\n`);

  // ============================================
  // 5. Generate a key pair (local)
  // ============================================
  console.log('🔑 Generating Key Pair...');
  const keyPair = CryptoService.KeyPair.generate();
  console.log('Key pair generated:');
  console.log(`  Private Key: ${keyPair.privateKey.toString('hex').substring(0, 20)}...`);
  console.log(`  Public Key: ${keyPair.publicKey.toString('hex')}\n`);

  // ============================================
  // 6. Sign and verify a message (local)
  // ============================================
  console.log('✍️  Signing Message...');
  const message = 'Hello, AstraSync!';
  const signature = client.signMessage(message, keyPair.privateKey.toString('hex'));
  console.log(`Message: "${message}"`);
  console.log(`Signature: ${signature.signature.substring(0, 40)}...`);
  console.log(`Recovery ID: ${signature.recovery}\n`);

  console.log('🔍 Verifying Signature...');
  const isValidSignature = client.verifySignature(
    message,
    signature.signature,
    keyPair.publicKey.toString('hex')
  );
  console.log(`Signature is valid: ${isValidSignature}\n`);

  // ============================================
  // 7. Create a crypto key on the server
  // ============================================
  console.log('☁️  Creating Crypto Key on Server...');
  try {
    const serverKey = await client.createCryptoKey({
      keyType: 'secp256k1',
      metadata: {
        name: 'My Test Key',
        description: 'A key for testing purposes',
      },
    });

    if (serverKey.success && serverKey.data) {
      console.log('Server key created:');
      console.log(`  Key ID: ${serverKey.data.id}`);
      console.log(`  Public Key: ${serverKey.data.publicKey}\n`);

      // ============================================
      // 8. List all crypto keys
      // ============================================
      console.log('📋 Listing All Crypto Keys...');
      const keys = await client.listCryptoKeys();
      if (keys.success && keys.data) {
        console.log(`Total keys: ${keys.count}`);
        keys.data.forEach((key, index) => {
          console.log(`  ${index + 1}. ${key.keyType} - ${key.metadata?.name || 'Unnamed'}`);
        });
        console.log('');
      }

      // ============================================
      // 9. Sign with stored key (server-side)
      // ============================================
      console.log('✍️  Signing with Stored Key...');
      const serverSignature = await client.signWithStoredKey({
        message: 'Server-signed message',
        keyId: serverKey.data.id!,
      });

      if (serverSignature.success) {
        console.log(`Server signature: ${serverSignature.signature?.substring(0, 40)}...\n`);
      }

      // ============================================
      // 10. Export public key
      // ============================================
      console.log('📤 Exporting Public Key...');
      const exportedKey = await client.exportPublicKey(serverKey.data.id!, 'hex');
      if (exportedKey.success) {
        console.log(`Exported public key: ${exportedKey.publicKey}\n`);
      }

      // ============================================
      // 11. Delete the test key
      // ============================================
      console.log('🗑️  Cleaning up test key...');
      const deleted = await client.deleteCryptoKey(serverKey.data.id!);
      console.log(`Key deleted: ${deleted.success}\n`);
    }
  } catch (error) {
    console.error('Error with server operations:', error);
    console.log('Note: Server-side operations require a running AstraSync API backend.\n');
  }

  // ============================================
  // Advanced: HD Wallet with Multiple Accounts
  // ============================================
  console.log('🏦 Generating Multiple HD Wallet Accounts...');
  const accounts = CryptoService.HDWallet.deriveMultipleAccounts(wallet.mnemonic, 3);
  accounts.forEach((account, index) => {
    const address = CryptoService.HDWallet.getEthereumAddress(account);
    console.log(`  Account ${index}: ${address}`);
  });

  console.log('\n✅ Crypto example completed!');
}

// Run the example
main().catch(console.error);
