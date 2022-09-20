import * as jose from "jose";
import getApiEndpoint from "utils/serverless-api";
export default async function getPrelaunchRewards(address: string) {
  // garbage JWT
  const jwt = await new jose.EncryptJWT({
    username: address,
    password: "password",
  })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setIssuer("urn:example:issuer")
    .setAudience("urn:example:audience")
    .setExpirationTime("2h")
    .encrypt(new Uint8Array(32));

  return getApiEndpoint().prelaunchRewards(address, jwt, {
    welcomeTravellerRewards: {
      walletEligible: true,
      completed: false,
      payout: "1",
    },
    earlyUserRewards: {
      walletEligible: true,
      completed: false,
      payout: "2",
    },
    liquidityProviderRewards: {
      walletEligible: true,
      completed: false,
      payout: "5",
    },
    communityRewards: {
      walletEligible: true,
      completed: false,
      payout: "10",
    },
  });
}
