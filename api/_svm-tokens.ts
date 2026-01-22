import {
  Address as SolanaKitAddress,
  getAddressEncoder,
  getProgramDerivedAddress,
  fetchEncodedAccount,
} from "@solana/kit";
import * as borsh from "borsh";
import { getSVMRpc } from "./_providers";
import { TokenNotFoundError } from "./_errors";
import { fetchMint } from "@solana-program/token-2022";

const TOKEN_METADATA_PROGRAM =
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s" as SolanaKitAddress;

class TokenMetadata {
  name: string;
  symbol: string;
  uri: string;

  constructor(args: { name: string; symbol: string; uri: string }) {
    this.name = args.name;
    this.symbol = args.symbol;
    this.uri = args.uri;
  }
}

export async function getSvmTokenInfo(address: string, chainId: number) {
  const mint = address as SolanaKitAddress;
  const rpc = getSVMRpc(chainId);
  const addressEncoder = getAddressEncoder();

  const metadataSchema = new Map([
    [
      TokenMetadata,
      {
        kind: "struct",
        fields: [
          ["name", "string"],
          ["symbol", "string"],
          ["uri", "string"],
        ],
      },
    ],
  ]);

  const seed1 = new Uint8Array(Buffer.from("metadata"));
  const seed2 = addressEncoder.encode(TOKEN_METADATA_PROGRAM);
  const seed3 = addressEncoder.encode(mint);
  const seeds = [seed1, seed2, seed3];

  const [pda] = await getProgramDerivedAddress({
    programAddress: TOKEN_METADATA_PROGRAM,
    seeds,
  });
  const [metadataAccount, mintInfo] = await Promise.all([
    fetchEncodedAccount(rpc, pda),
    fetchMint(rpc, mint),
  ]);

  if (metadataAccount.exists) {
    const decodedMetadata = borsh.deserialize(
      metadataSchema,
      TokenMetadata,
      Buffer.from(metadataAccount.data.slice(65, 319))
    );

    const name = decodedMetadata.name.replace(/\0/g, "").trim();
    const symbol = decodedMetadata.symbol.replace(/\0/g, "").trim();
    const decimals = mintInfo.data.decimals;

    return {
      address,
      decimals,
      chainId,
      name,
      symbol,
    };
  }

  throw new TokenNotFoundError({
    chainId,
    address,
  });
}
