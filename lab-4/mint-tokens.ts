import "dotenv/config";
import {getExplorerLink, getKeypairFromEnvironment} from '@solana-developers/helpers';
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import {mintTo} from '@solana/spl-token';

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

const AMOUNT = 9;
const DECIMALS = 6;
const user = getKeypairFromEnvironment("SECRET_KEY");

const tokenMint = new PublicKey("8dtWDJKTnmohRHkWMVYsvDVC1zrdGmR6Vr6UpyUAkD96");

const destTokenAccount = new PublicKey("5cD1Kexgap8KWdV8h9yoK7BCWKFne13wQubzfoUmzJc7");

const sig = await mintTo(connection, user, tokenMint, destTokenAccount, user, AMOUNT * (10 ** DECIMALS));

const link = getExplorerLink("tx", sig, "devnet");

console.log(`Minted ${AMOUNT} tokens: ${link}`);
