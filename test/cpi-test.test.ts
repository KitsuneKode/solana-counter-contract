import path from "path";
import { expect, test, describe, beforeAll } from "bun:test";
import { LiteSVM } from "litesvm";

import * as borsh from "borsh";

import {
  loadKeypairFromFile,
  schema,
  COUNTER_SIZE,
  CounterAccount,
} from "./utils/borsh";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";

// test("Account Initialization Test", () => {
//   const svm = new LiteSVM();
//
//   const contract = loadKeypairFromFile(
//     "../cpi-contract/target/deploy/cpi_contract-keypair.json",
//   );
//   console.log(contract.publicKey.toString());
//   svm.addProgramFromFile(
//     contract.publicKey,
//     path.join(__dirname, "../cpi-contract/target/deploy/cpi_contract.so"),
//   );
//
//   const adminAccount = new Keypair();
//   const dataAccount = new Keypair();
//   svm.airdrop(adminAccount.publicKey, BigInt(10 * LAMPORTS_PER_SOL));
//   const lamports = Number(
//     svm.minimumBalanceForRentExemption(BigInt(COUNTER_SIZE)),
//   );
//   const transaction = new Transaction();
//   const ix = [
//     SystemProgram.createAccount({
//       fromPubkey: adminAccount.publicKey,
//       lamports,
//       programId: contract.publicKey,
//       space: COUNTER_SIZE,
//       newAccountPubkey: dataAccount.publicKey,
//     }),
//   ];
//
//   transaction.add(...ix);
//
//   transaction.recentBlockhash = svm.latestBlockhash();
//   transaction.feePayer = adminAccount.publicKey;
//   transaction.sign(adminAccount, dataAccount);
//   svm.sendTransaction(transaction);
//
//   const account = svm.getAccount(dataAccount.publicKey)?.owner.toBase58();
//   expect(account).toBe(contract.publicKey.toBase58());
// });

describe("CPI invoke", () => {
  let svm: LiteSVM;
  let adminAccount: Keypair;
  let dataAccount: Keypair;
  const cpi_contract = loadKeypairFromFile(
    "../cpi-contract/target/deploy/cpi_contract-keypair.json",
  );
  const contract = loadKeypairFromFile(
    "../target/deploy/counter_program_solana-keypair.json",
  );

  console.log("CPI contract : ", cpi_contract.publicKey.toBase58());
  console.log(`\n \n \n Main contract : ${contract.publicKey.toBase58()}`);

  beforeAll(() => {
    svm = new LiteSVM();

    svm.addProgramFromFile(
      cpi_contract.publicKey,
      path.join(__dirname, "../cpi-contract/target/deploy/cpi_contract.so"),
    );
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

    const tx = new Transaction();

    const ix = [
      SystemProgram.createAccount({
        fromPubkey: adminAccount.publicKey,
        lamports,
        programId: contract.publicKey,
        space: COUNTER_SIZE,
        newAccountPubkey: dataAccount.publicKey,
      }),
    ];

    tx.add(...ix);

    tx.recentBlockhash = svm.latestBlockhash();
    tx.feePayer = adminAccount.publicKey;
    tx.sign(adminAccount, dataAccount);
    svm.sendTransaction(tx);

    const account = svm.getAccount(dataAccount.publicKey)?.owner.toBase58();
    console.log(
      "\n \n \nNew Data Account createdAccount with owner :",
      account,
      "\n\n\n",
    );
  });

  test("increase counter", () => {
    const ix = new TransactionInstruction({
      keys: [
        { pubkey: dataAccount.publicKey, isSigner: false, isWritable: true },
        { pubkey: contract.publicKey, isSigner: false, isWritable: false },
        { pubkey: adminAccount.publicKey, isSigner: true, isWritable: false },
      ],
      programId: cpi_contract.publicKey,
      data: Buffer.from([]),
    });
    const tx = new Transaction().add(ix);
    tx.recentBlockhash = svm.latestBlockhash();
    tx.feePayer = adminAccount.publicKey;
    tx.sign(adminAccount);

    const txn = svm.sendTransaction(tx);

    console.log("Tranaction results", txn.toString(), "\n\n");

    const data = svm.getAccount(dataAccount.publicKey)?.data;

    if (!data) {
      console.error("No data in the account");
      return;
    }
    const deserializedData = borsh.deserialize(schema, data) as CounterAccount;
    console.log("\n\n\nDeserializedData: ", deserializedData);
    expect(deserializedData.count).toBe(12);
  });
});
