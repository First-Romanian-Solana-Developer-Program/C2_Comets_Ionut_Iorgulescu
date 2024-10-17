import "dotenv/config";
import {getExplorerLink, getKeypairFromEnvironment} from '@solana-developers/helpers';
import {Connection, clusterApiUrl, PublicKey} from "@solana/web3.js";
import {getOrCreateAssociatedTokenAccount, transfer} from '@solana/spl-token';

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

const user = getKeypairFromEnvironment("SECRET_KEY");

const recipient = new PublicKey("8RGSTN6on6hVvsAYyqoZEvh8Kpi4nycKVNkvWEwiUbxk");

const tokenMintAccount = new PublicKey("8dtWDJKTnmohRHkWMVYsvDVC1zrdGmR6Vr6UpyUAkD96");

const MINOR_UNIT_PER_MAJOR_UNITS = Math.pow(10, 2);

console.log(`Attemptin to send 1 token to ${recipient.toBase58()}`);

const sourceTokenAccount = await getOrCreateAssociatedTokenAccount(
  connection,
  user,
  tokenMintAccount,
  user.publicKey
);

const destinationTokenAccount = await getOrCreateAssociatedTokenAccount(
  connection,
  user,
  tokenMintAccount,
  recipient
);

const sig = await transfer(
  connection,
  user,
  sourceTokenAccount.address,
  destinationTokenAccount.address,
  user,
  MINOR_UNIT_PER_MAJOR_UNITS
);

const link = getExplorerLink("transaction", sig, "devnet");

console.log(`Transaction confirmed, explore link: ${link}`);
