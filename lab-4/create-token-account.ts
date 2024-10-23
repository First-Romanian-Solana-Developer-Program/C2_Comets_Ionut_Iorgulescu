import "dotenv/config";
import {getExplorerLink, getKeypairFromEnvironment} from '@solana-developers/helpers';
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import {getOrCreateAssociatedTokenAccount} from '@solana/spl-token';

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

const user = getKeypairFromEnvironment("SECRET_KEY");

const tokenMint = new PublicKey("8dtWDJKTnmohRHkWMVYsvDVC1zrdGmR6Vr6UpyUAkD96");

const recipient = new PublicKey("2JELcDKm9Hk1fWqBp45gtJYXUFoMV3HsKZN5jneHe7Sn");

// @ts-ignore
const tokenAccount = await getOrCreateAssociatedTokenAccount(connection, user, tokenMint, recipient);

console.log(`Token account: ${tokenAccount.address.toBase58()}`);

const link = getExplorerLink("address", tokenAccount.address.toBase58(), "devnet");

console.log(`Created token account link: ${link}`);
