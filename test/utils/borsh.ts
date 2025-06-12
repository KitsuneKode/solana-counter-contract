import * as borsh from "borsh";
import { readFileSync } from "fs";
import { Keypair } from "@solana/web3.js";
import path from "path";
export class CounterAccount {
  count: number;

  constructor({ count }: { count: number }) {
    this.count = count;
  }
}

export const schema: borsh.Schema = {
  struct: {
    count: "u32",
  },
};

export const COUNTER_SIZE = borsh.serialize(
  schema,
  new CounterAccount({ count: 0 }),
).length;

export function loadKeypairFromFile(filePath: string): Keypair {
  const resolvedPath = path.join(__dirname, "../", filePath);
  const loadedKeyBytes = Uint8Array.from(
    JSON.parse(readFileSync(resolvedPath, "utf8")),
  );
  return Keypair.fromSecretKey(loadedKeyBytes);
}
