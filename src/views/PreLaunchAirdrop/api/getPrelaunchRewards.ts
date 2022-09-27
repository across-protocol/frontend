import getApiEndpoint from "utils/serverless-api";
// import * as jose from "jose";
// garbage JWT
// Built the following way:
// const jwt = await new jose.EncryptJWT({
//   username: address,
//   password: "password",
// })
//   .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
//   .setIssuedAt()
//   .setIssuer("urn:example:issuer")
//   .setAudience("urn:example:audience")
//   .setExpirationTime("2h")
//   .encrypt(new Uint8Array(32));
const TEST_JWT =
  "eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..IFJ1oL_VAa-nnhEX.HmM1L9g8uBlrSggZeQr8f-cpIslh8rTnVe1HVXxf0Kgkm6GO-TmdDxokln4vG1udByCTgTAOvTAWVDcvyJy4L_tTxSLwhoaEBIYnN_G3lZXg4JYen7__7qqdI2oZOLTJ0iSVGoL4Ro_TvWe_ZPLTLugx-Figkr20pabxUorw7yw8mqWCLDuWR56ZpH94RUGN5CjRTs0z1FXPac0TKo_Q-gtLcmnpwj383A.ZYkHwm56_n5GHvB-7y6Tag";
export default async function getPrelaunchRewards(address: string) {
  return getApiEndpoint().prelaunch.rewards(address, TEST_JWT, {
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
