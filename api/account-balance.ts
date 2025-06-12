import { type, string, Infer } from "superstruct";
import { latestBalanceCache, validAddress } from "./_utils";
import { ApiHandler } from "./_base/api-handler";
import { VercelAdapter } from "./_adapters/vercel-adapter";

const AccountBalanceQueryParamsSchema = type({
  token: validAddress(),
  account: validAddress(),
  chainId: string(),
});

type AccountBalanceQueryParams = Infer<typeof AccountBalanceQueryParamsSchema>;

const AccountBalanceResponseSchema = type({
  balance: string(),
  account: validAddress(),
  token: validAddress(),
});

type AccountBalanceResponse = Infer<typeof AccountBalanceResponseSchema>;

class AccountBalanceHandler extends ApiHandler<
  AccountBalanceQueryParams,
  AccountBalanceResponse
> {
  constructor() {
    super({
      name: "AccountBalance",
      requestSchema: AccountBalanceQueryParamsSchema,
      responseSchema: AccountBalanceResponseSchema,
      headers: {
        "Cache-Control": "s-maxage=60, stale-while-revalidate=60",
      },
    });
  }

  protected async process(
    request: AccountBalanceQueryParams
  ): Promise<AccountBalanceResponse> {
    const { token, account, chainId } = request;

    const balance = await latestBalanceCache({
      chainId: Number(chainId),
      tokenAddress: token,
      address: account,
    }).get();

    return {
      balance: balance.toString(),
      account: account,
      token: token,
    };
  }
}

const handler = new AccountBalanceHandler();
const adapter = new VercelAdapter<
  AccountBalanceQueryParams,
  AccountBalanceResponse
>();
export default adapter.adaptHandler(handler);
