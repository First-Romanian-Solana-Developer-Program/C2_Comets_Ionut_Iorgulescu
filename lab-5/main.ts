import { createProgrammableNft, mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata'
import {
  createGenericFile,
  generateSigner,
  percentAmount,
  signerIdentity,
  createSignerFromKeypair,
} from '@metaplex-foundation/umi';
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { base58 } from '@metaplex-foundation/umi/serializers'
import { Keypair } from '@solana/web3.js';
import * as fs from 'fs';

const loadKeypair = (pathToKeypair: string) => {
  const keypairData = JSON.parse(fs.readFileSync(pathToKeypair, 'utf-8'));
  return Keypair.fromSecretKey(new Uint8Array(keypairData));
};

const create = async () => {
  //
  // ** Setting Up Umi **
  //

  const umi = createUmi('https://api.devnet.solana.com')
    .use(mplTokenMetadata())
    .use(
      irysUploader({
        address: "https://devnet.irys.xyz",
      })
    );

  // Load Solana keypair from JSON file
  const solanaKeypair = loadKeypair('./secret.json');

  // Convert Solana keypair into Umi-compatible keypair using the raw secret key
  const umiKeypair = umi.eddsa.createKeypairFromSecretKey(solanaKeypair.secretKey);

  // Create Umi signer from the converted keypair
  const signer = createSignerFromKeypair(umi, umiKeypair);

  umi.use(signerIdentity(signer));

  const imageFile = fs.readFileSync("image.png");

  const umiImageFile = createGenericFile(imageFile, "image.png", {
    tags: [{ name: "Content-Type", value: "image/png" }],
  });


  console.log("Uploading image...");
  const imageUri = await umi.uploader.upload([umiImageFile]).catch((err) => {
    throw new Error(err);
  });
  console.log(`Image URI: ${imageUri[0]}`);

  //
  // ** Upload Metadata to Arweave **
  //

  const metadata = {
    name: "My test Nft",
    description: "This is an Nft on Solana",
    image: imageUri[0],
    symbol: "TST"
  };

  // Call upon umi's uploadJson function to upload our metadata to Arweave via Irys.
  console.log("Uploading metadata...");
  const metadataUri = await umi.uploader.uploadJson(metadata).catch((err) => {
    throw new Error(err);
  });

  //
  // ** Creating the Nft **
  //

  // We generate a signer for the Nft
  const nftSigner = generateSigner(umi);

  const ruleset = null;

  console.log("Creating Nft...");
  const tx = await createProgrammableNft(umi, {
    mint: nftSigner,
    sellerFeeBasisPoints: percentAmount(5.5),
    name: metadata.name,
    uri: metadataUri,
    symbol: metadata.symbol,
    ruleSet: ruleset,
  }).sendAndConfirm(umi);

  const signature = base58.deserialize(tx.signature)[0];

  // Log out the signature and the links to the transaction and the NFT.
  console.log("\npNFT Created")
  console.log("View Transaction on Solana Explorer");
  console.log(`https://explorer.solana.com/tx/${signature}?cluster=devnet`);
  console.log("\n");
  console.log("View NFT on Metaplex Explorer");
  console.log(`https://explorer.solana.com/address/${nftSigner.publicKey}?cluster=devnet`);
}

create().then((): void => {
  console.log("NFT created");
})
