import { Keypair } from  '@solana/web3.js';

const keypair = Keypair.generate();

console.log('Public key: ', keypair.publicKey.toString());
console.log('Private key: ', keypair.secretKey);
