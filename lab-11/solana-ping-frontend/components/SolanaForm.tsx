import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {FC, useState} from 'react';
import {LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction} from '@solana/web3.js';

export const SolanaForm: FC = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signTransaction } = useWallet();
  const [amount, setAmount] = useState(0);
  const [wallet, setWallet] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!connection || !publicKey) {
      return;
    }
    const tx = new Transaction();

    const instruction = SystemProgram.transfer({
        fromPubkey: publicKey, toPubkey: new PublicKey(wallet), lamports: amount * LAMPORTS_PER_SOL
      }
    );

    tx.add(instruction);

    const blockhash = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash.blockhash;
    tx.feePayer = publicKey;

    const signedTx = await signTransaction(tx);

    const sig = await sendTransaction(signedTx, connection);
    console.log({sig});
  }

  const handleAmountChange = (event) => {
    setAmount(event.target.value);
  }

  const handleWalletChange = (event) => {
    setWallet(event.target.value);
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Amount:
        <input type="text" name="amount" onChange={handleAmountChange}/>
      </label>
      <label>
        Wallet:
        <input type="text" name="wallet" onChange={handleWalletChange}/>
      </label>
      <input type="submit" value="Submit"/>
    </form>
  );
};
