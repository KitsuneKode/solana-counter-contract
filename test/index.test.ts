import path from "path";
import * as borsh from "borsh";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { beforeEach, describe, expect, test } from "bun:test";
import {
  COUNTER_SIZE,
  CounterAccount,
  schema,
  loadKeypairFromFile,
} from "./utils/borsh";
import { LiteSVM } from "litesvm";

test("Account Initialization Test", () => {
  const svm = new LiteSVM();

  const contract = loadKeypairFromFile(
    "../target/deploy/counter_program_solana-keypair.json",
  );
  console.log(contract.publicKey.toString());
  svm.addProgramFromFile(
    contract.publicKey,
    path.join(__dirname, "../target/deploy/counter_program_solana.so"),
  );

  const adminAccount = new Keypair();
  const dataAccount = new Keypair();
  svm.airdrop(adminAccount.publicKey, BigInt(10 * LAMPORTS_PER_SOL));
  const lamports = Number(
    svm.minimumBalanceForRentExemption(BigInt(COUNTER_SIZE)),
  );
  const transaction = new Transaction();
  const ix = [
    SystemProgram.createAccount({
      fromPubkey: adminAccount.publicKey,
      lamports,
      programId: contract.publicKey,
      space: COUNTER_SIZE,
      newAccountPubkey: dataAccount.publicKey,
    }),
  ];

  transaction.add(...ix);

  transaction.recentBlockhash = svm.latestBlockhash();
  transaction.feePayer = adminAccount.publicKey;
  transaction.sign(adminAccount, dataAccount);
  svm.sendTransaction(transaction);

  const account = svm.getAccount(dataAccount.publicKey)?.owner.toBase58();
  expect(account).toBe(contract.publicKey.toBase58());
});

describe("Counter Program Tests", () => {
  let svm: LiteSVM;
  let dataAccount: Keypair;
  let adminAccount: Keypair;

  const contract = loadKeypairFromFile(
    "../target/deploy/counter_program_solana-keypair.json",
  );
  console.log("Contract PublicKey : ", contract.publicKey.toString());

  beforeEach(() => {
    svm = new LiteSVM();

    svm.addProgramFromFile(
      contract.publicKey,
      path.join(__dirname, "../target/deploy/counter_program_solana.so"),
    );

    adminAccount = new Keypair();
    dataAccount = new Keypair();
    svm.airdrop(adminAccount.publicKey, BigInt(10 * LAMPORTS_PER_SOL));
    const lamports = Number(
      svm.minimumBalanceForRentExemption(BigInt(COUNTER_SIZE)),
    );
    const transaction = new Transaction();
    const ix = [
      SystemProgram.createAccount({
        fromPubkey: adminAccount.publicKey,
        lamports,
        programId: contract.publicKey,
        space: COUNTER_SIZE,
        newAccountPubkey: dataAccount.publicKey,
      }),
    ];

    transaction.add(...ix);

    transaction.recentBlockhash = svm.latestBlockhash();
    transaction.feePayer = adminAccount.publicKey;
    transaction.sign(adminAccount, dataAccount);
    svm.sendTransaction(transaction);

    const account = svm.getAccount(dataAccount.publicKey)?.owner.toBase58();
    console.log("New Data Account createdAccount with owner :", account);
  });

  test("Add counter to Account", () => {
    console.log("1");

    const ix = new TransactionInstruction({
      programId: contract.publicKey,
      keys: [
        { pubkey: adminAccount.publicKey, isSigner: true, isWritable: false },
        { pubkey: dataAccount.publicKey, isSigner: false, isWritable: true },
      ],
      data: Buffer.from([]),
    });

    console.log("2");

    const transaction = new Transaction();

    transaction.add(ix);
    transaction.recentBlockhash = svm.latestBlockhash();

    transaction.feePayer = adminAccount.publicKey;
    transaction.sign(adminAccount);
    const txn = svm.sendTransaction(transaction);

    console.log(txn.toString());

    const data = svm.getAccount(dataAccount.publicKey)?.data;

    console.log(data);
    if (!data) {
      console.error("No data in the accoount");
      return;
    }
    const deserializedData = borsh.deserialize(schema, data) as CounterAccount;
    console.log(deserializedData);

    expect(deserializedData.count).toBe(12);
  });
});

//since testing for cpis is hard for contracts in direct chain so we are using LiteSVM to test the contract

// const adminAccount = Keypair.generate();
// const dataAccount = Keypair.generate();
//
// const nameContractProgramId = new PublicKey(
//   "5nue6NULTPwJyf7EUPjFo4vyhUi1KHS91DpSYq7vFdbp",
// );
// const connection = new Connection("http://127.0.0.1:8899", "confirmed");
// const airDroptx = await connection.requestAirdrop(
//   adminAccount.publicKey,
//   50 * LAMPORTS_PER_SOL,
// );
//
// const { blockhash, lastValidBlockHeight } =
//   await connection.getLatestBlockhash();
// const airdropSignature = await connection.confirmTransaction({
//   blockhash,
//   signature: airDroptx,
//   lastValidBlockHeight,
// });
//
// console.log("Airdrop of 50 SOL completed. Signature:", airdropSignature);
//
// test("Account Initialization", async () => {
//   const transaction = new Transaction();
//   const lamports =
//     await connection.getMinimumBalanceForRentExemption(NAME_SIZE);
//
//   const tx = SystemProgram.createAccount({
//     fromPubkey: adminAccount.publicKey,
//     lamports,
//     newAccountPubkey: dataAccount.publicKey,
//     programId: nameContractProgramId,
//     space: NAME_SIZE,
//   });
//
//   transaction.add(tx);
//   transaction.recentBlockhash = (
//     await connection.getLatestBlockhash()
//   ).blockhash;
//
//   const signature = await sendAndConfirmTransaction(connection, transaction, [
//     adminAccount,
//     dataAccount,
//   ]);
//   console.log(
//     "signature",
//     signature,
//     "dataAccount",
//     dataAccount.publicKey.toString(),
//     "\n",
//   );
//
//   const dataAccountData = await connection.getAccountInfo(
//     dataAccount.publicKey,
//   );
//   if (!dataAccountData) {
//     console.error("No data in the account");
//     return;
//   }
//   const desirializedData = borsh.deserialize(
//     schema,
//     dataAccountData.data,
//   ) as NameAccount;
//   if (!desirializedData) {
//     console.error("Unable to deserialize the data");
//     return;
//   }
//
//   console.log(desirializedData.name);
//
//   expect(desirializedData.name).toBe("");
// });
