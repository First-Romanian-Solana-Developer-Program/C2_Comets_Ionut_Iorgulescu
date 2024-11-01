import * as anchor from "@coral-xyz/anchor";
import { Program, web3 } from "@coral-xyz/anchor";
import { Favorites } from "../target/types/favorites";
import { assert } from "chai";

describe("favorites", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(anchor.AnchorProvider.env());
  const user = (provider.wallet as anchor.Wallet).payer;
  const program = anchor.workspace.Favorites as Program<Favorites>;

  before(async () => {
    const balance = await provider.connection.getBalance(user.publicKey);

    const balanceInSol = balance / web3.LAMPORTS_PER_SOL;

    const formatBalance = new Intl.NumberFormat().format(balanceInSol);

    console.log(`Balance: ${formatBalance} SOL`);
  });

  it("Save user favorites", async () => {
    const number = new anchor.BN(23);
    const color = "blue";
    const hobbies = ["ski", "dive", "hike"];
    const tx = await program.methods
      .setFavorites(number, color, hobbies)
      .signers([user])
      .rpc();

    console.log("Your transaction hash: ", tx);

    const [favoritesPda, bump] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("favorites"), user.publicKey.toBuffer()],
      program.programId
    );

    const pdaData = await program.account.favorites.fetch(favoritesPda);

    assert.equal(pdaData.color, color);
    assert.equal(pdaData.number.toString(), number.toString());
    assert.deepEqual(pdaData.hobbies, hobbies);
  });

  it("Should fail when sending transaction with an unauthorized signer", async () => {
    const number = new anchor.BN(40);
    const color = "red";
    const hobbies = ["tennis", "swim", "bike"];

    const newUser = anchor.web3.Keypair.generate();

    try {
      await program.methods
        .setFavorites(number, color, hobbies)
        .signers([newUser])
        .rpc();

      assert.fail(
        "Transaction should have failed with an unauthorized signer."
      );
    } catch (error) {
      assert.include(
        error.message,
        "unknown signer",
        "Expected unknown signer error."
      );
    }
  });
});
