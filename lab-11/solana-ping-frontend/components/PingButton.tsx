import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import * as web3 from '@solana/web3.js';
import { FC } from 'react';
import styles from '../styles/PingButton.module.css';
export const PingButton: FC = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const onClick = async () => {
    if (!connection || !publicKey) {
      return;
    }

    const programId = new web3.PublicKey(
      'ChT1B39WKLS8qUrkLvFDXMhEJ4F1XZzwUNHUt4AU9aVa',
    );

    const programDataAccount = new web3.PublicKey(
      'Ah9K7dQ8EHaZqcAsgBW8w37yN2eAy3koFmUn4x3CJtod',
    );

    const transaction = new web3.Transaction();

    const instruction = new web3.TransactionInstruction({
      keys: [
        {
          pubkey: programDataAccount,
          isSigner: false,
          isWritable: true,
        },
      ],
      programId,
    });

    transaction.add(instruction);

    const signature = await sendTransaction(transaction, connection);

    console.log('transaction', transaction);
    console.log('signature', signature);
  };

  return (
    <div className={styles.buttonContainer} onClick={onClick}>
      <button className={styles.button}>Ping!</button>
    </div>
  );
};
