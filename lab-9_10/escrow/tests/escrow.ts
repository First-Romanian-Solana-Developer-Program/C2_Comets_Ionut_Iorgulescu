import { randomBytes } from "node:crypto";
import * as anchor from "@coral-xyz/anchor";
import { BN, type Program } from "@coral-xyz/anchor";
import {
  MINT_SIZE,
  TOKEN_2022_PROGRAM_ID,
  type TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  createInitializeMint2Instruction,
  createMintToInstruction,
  getAssociatedTokenAddressSync,
  getMinimumBalanceForRentExemptMint,
} from "@solana/spl-token";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  type TransactionInstruction,
} from "@solana/web3.js";
import { assert } from "chai";
import type { Escrow } from "../target/types/escrow";

import { confirmTransaction, makeKeypairs } from "@solana-developers/helpers";

const TOKEN_PROGRAM: typeof TOKEN_2022_PROGRAM_ID | typeof TOKEN_PROGRAM_ID =
  TOKEN_2022_PROGRAM_ID;

const getRandomBigNumber = (size = 8) => {
  return new BN(randomBytes(size));
};

describe("escrow", async () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const provider = anchor.getProvider();

  const connection = provider.connection;

  const program = anchor.workspace.Escrow as Program<Escrow>;

  // We're going to reuse these accounts across multiple tests
  const accounts: Record<string, PublicKey> = {
    tokenProgram: TOKEN_PROGRAM,
  };

  const [user1, user2, tokenMintA, tokenMintB] = makeKeypairs(4);

  before(
    "Creates User1 and User2 accounts, 2 token mints, and associated token accounts for both tokens for both users",
    async () => {
      const [
        user1TokenAccountA,
        user1TokenAccountB,
        user2TokenAccountA,
        user2TokenAccountB,
      ] = [user1, user2].flatMap((keypair) =>
        [tokenMintA, tokenMintB].map((mint) =>
          getAssociatedTokenAddressSync(
            mint.publicKey,
            keypair.publicKey,
            false,
            TOKEN_PROGRAM
          )
        )
      );

      const minimumLamports = await getMinimumBalanceForRentExemptMint(
        connection
      );

      const sendSolInstructions: Array<TransactionInstruction> = [
        user1,
        user2,
      ].map((account) =>
        SystemProgram.transfer({
          fromPubkey: provider.publicKey,
          toPubkey: account.publicKey,
          lamports: 10 * LAMPORTS_PER_SOL,
        })
      );

      const createMintInstructions: Array<TransactionInstruction> = [
        tokenMintA,
        tokenMintB,
      ].map((mint) =>
        SystemProgram.createAccount({
          fromPubkey: provider.publicKey,
          newAccountPubkey: mint.publicKey,
          lamports: minimumLamports,
          space: MINT_SIZE,
          programId: TOKEN_PROGRAM,
        })
      );

      const mintTokensInstructions: Array<TransactionInstruction> = [
        {
          mint: tokenMintA.publicKey,
          authority: user1.publicKey,
          ata: user1TokenAccountA,
        },
        {
          mint: tokenMintB.publicKey,
          authority: user2.publicKey,
          ata: user2TokenAccountB,
        },
      ].flatMap((mintDetails) => [
        createInitializeMint2Instruction(
          mintDetails.mint,
          6,
          mintDetails.authority,
          null,
          TOKEN_PROGRAM
        ),
        createAssociatedTokenAccountIdempotentInstruction(
          provider.publicKey,
          mintDetails.ata,
          mintDetails.authority,
          mintDetails.mint,
          TOKEN_PROGRAM
        ),
        createMintToInstruction(
          mintDetails.mint,
          mintDetails.ata,
          mintDetails.authority,
          1_000_000_000,
          [],
          TOKEN_PROGRAM
        ),
      ]);

      const tx = new Transaction();
      tx.instructions = [
        ...sendSolInstructions,
        ...createMintInstructions,
        ...mintTokensInstructions,
      ];

      await provider.sendAndConfirm(tx, [tokenMintA, tokenMintB, user1, user2]);

      accounts.maker = user1.publicKey;
      accounts.taker = user2.publicKey;
      accounts.tokenMintA = tokenMintA.publicKey;
      accounts.makerTokenAccountA = user1TokenAccountA;
      accounts.takerTokenAccountA = user2TokenAccountA;
      accounts.tokenMintB = tokenMintB.publicKey;
      accounts.makerTokenAccountB = user1TokenAccountB;
      accounts.takerTokenAccountB = user2TokenAccountB;
    }
  );

  const tokenAOfferedAmount = new BN(1_000_000);
  const tokenBWantedAmount = new BN(1_000_000);

  const make = async () => {
    // Pick a random ID for the offer we'll make
    const offerId = getRandomBigNumber();

    // Then determine the account addresses we'll use for the offer and the vault
    const offer = PublicKey.findProgramAddressSync(
      [
        Buffer.from("offer"),
        accounts.maker.toBuffer(),
        offerId.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    )[0];

    const vault = getAssociatedTokenAddressSync(
      accounts.tokenMintA,
      offer,
      true,
      TOKEN_PROGRAM
    );

    accounts.offer = offer;
    accounts.vault = vault;

    const transactionSignature = await program.methods
      .makeOffer(offerId, tokenAOfferedAmount, tokenBWantedAmount)
      .accounts({ ...accounts })
      .signers([user1])
      .rpc();

    console.log("transactionSignature", transactionSignature);

    await confirmTransaction(connection, transactionSignature);

    const vaultBalanceResponse = await connection.getTokenAccountBalance(vault);
    const vaultBalance = new BN(vaultBalanceResponse.value.amount);
    assert(vaultBalance.eq(tokenAOfferedAmount));

    const offerAccount = await program.account.offer.fetch(offer);

    assert(offerAccount.maker.equals(user1.publicKey));
    assert(offerAccount.tokenMintA.equals(accounts.tokenMintA));
    assert(offerAccount.tokenMintB.equals(accounts.tokenMintB));
    assert(offerAccount.tokenBWantedAmount.eq(tokenBWantedAmount));
  };

  const take = async () => {
    const transactionSignature = await program.methods
      .takeOffer()
      .accounts({ ...accounts })
      .signers([user2])
      .rpc();

    await confirmTransaction(connection, transactionSignature);

    const user2TokenAccountBalanceAfterResponse =
      await connection.getTokenAccountBalance(accounts.takerTokenAccountA);
    const user2TokenAccountBalanceAfter = new BN(
      user2TokenAccountBalanceAfterResponse.value.amount
    );
    assert(user2TokenAccountBalanceAfter.eq(tokenAOfferedAmount));

    const user1TokenAccountBalanceAfterResponse =
      await connection.getTokenAccountBalance(accounts.makerTokenAccountB);
    const user1TokenAccountBalanceAfter = new BN(
      user1TokenAccountBalanceAfterResponse.value.amount
    );
    assert(user1TokenAccountBalanceAfter.eq(tokenBWantedAmount));
  };

  it("Puts the tokens User1 offers into the vault when User1 makes an offer", async () => {
    await make();
  });

  it("Puts the tokens from the vault into User2 account, and gives User1 User2's tokens, when User2 takes an offer", async () => {
    await take();
  });
});
