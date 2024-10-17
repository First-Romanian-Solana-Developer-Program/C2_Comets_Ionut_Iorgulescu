import "dotenv/config";
import {getExplorerLink, getKeypairFromEnvironment} from '@solana-developers/helpers';
import { Connection, clusterApiUrl } from "@solana/web3.js";
import {createMint} from '@solana/spl-token';

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

const user = getKeypairFromEnvironment("SECRET_KEY");

const DECIMALS = 6;

const tokenMint = await createMint(connection, user, user.publicKey, null, DECIMALS);

const link = getExplorerLink("address", tokenMint.toString(), "devnet");

console.log(`Token Mint: ${link}`);
