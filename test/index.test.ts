import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { expect, test } from "bun:test";
import * as borsh from "borsh";
import { COUNTER_SIZE, CounterAccount, schema } from "./utils/borsh";

let counterAccountProgramID: PublicKey = new PublicKey(
  "8vQxnzBf4qDQrpKm61cDFhpC3WNiihXzSJwRqw7qVmXd",
);
let dataAccount: Keypair = Keypair.generate();
let adminAccount: Keypair = Keypair.generate();
const connection = new Connection("http://127.0.0.1:8899", "confirmed");

test("Account initialized", async () => {
  const data = await connection.getAccountInfo(adminAccount.publicKey);
  const airdropTx = await connection.requestAirdrop(
    adminAccount.publicKey,
    10 * LAMPORTS_PER_SOL,
  );

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");
  await connection.confirmTransaction(
    {
      blockhash,
      signature: airdropTx,
      lastValidBlockHeight,
    },
    "confirmed",
  );

  const lamports =
    await connection.getMinimumBalanceForRentExemption(COUNTER_SIZE);
  const transaction = new Transaction();
  const ix = SystemProgram.createAccount({
    fromPubkey: adminAccount.publicKey,
    lamports,
    programId: counterAccountProgramID,
    space: COUNTER_SIZE,
    newAccountPubkey: dataAccount.publicKey,
  });

  transaction.add(ix);

  transaction.recentBlockhash = (
    await connection.getLatestBlockhash()
  ).blockhash;
  transaction.feePayer = adminAccount.publicKey;
  const signature = await sendAndConfirmTransaction(connection, transaction, [
    adminAccount,
    dataAccount,
  ]);

  console.log(
    "signature",
    signature,
    "dataAccount",
    dataAccount.publicKey.toString(),
    "\n",
  );

  const dataAccountData = await connection.getAccountInfo(
    dataAccount.publicKey,
  );
  if (!dataAccountData) {
    console.error("No dataAccountData");
    return;
  }

  const deserializedData = borsh.deserialize(
    schema,
    dataAccountData?.data,
  ) as CounterAccount;
  if (!deserializedData) {
    console.error("No deserializedData");
    return;
  }

  console.log(deserializedData?.count);

  expect(deserializedData.count).toBe(0);
});
