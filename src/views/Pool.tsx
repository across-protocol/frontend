import { FC, useState, useEffect } from "react";
import { ethers } from "ethers";
import Layout from "components/Layout";
import PoolSelection from "components/PoolSelection";
import PoolForm from "components/PoolForm";
import { POOL_LIST, Token } from "utils";
import { useAppSelector, useConnection } from "state/hooks";
import get from "lodash/get";
import { poolClient } from "state/poolsApi";

const Pool: FC = () => {
  const [token, setToken] = useState<Token>(POOL_LIST[0]);
  const [totalPoolSize, setTotalPoolSize] = useState(
    ethers.BigNumber.from("0")
  );
  const [apy, setApy] = useState("0.00%");

  const pool = useAppSelector((state) => state.pools.pools[token.bridgePool]);
  const connection = useAppSelector((state) => state.connection);
  const userPosition = useAppSelector((state) =>
    get(state, [
      "pools",
      "users",
      state?.connection?.account || "",
      token.bridgePool,
    ])
  );

  const { isConnected } = useConnection();

  // Get pool state on mount of view.
  useEffect(() => {
    poolClient.updatePool(token.bridgePool);
  }, [token]);

  useEffect(() => {
    if (pool) {
      setTotalPoolSize(ethers.BigNumber.from(pool.totalPoolSize || "0"));
      setApy(`${Number(pool.estimatedApy || 0) * 100}%`);
    }
  }, [token, pool]);

  useEffect(() => {
    if (isConnected && connection.account && token.bridgePool) {
      poolClient.updateUser(connection.account, token.bridgePool);
    }
  }, [isConnected, connection.account, token.bridgePool]);

  return (
    <Layout>
      <PoolSelection setToken={setToken} />
      <PoolForm
        symbol={token.symbol}
        icon={token.logoURI}
        decimals={token.decimals}
        totalPoolSize={totalPoolSize}
        apy={apy}
        position={ethers.BigNumber.from(userPosition?.totalDeposited || "0")}
        feesEarned={ethers.BigNumber.from(userPosition?.feesEarned || "0")}
        totalPosition={ethers.BigNumber.from(
          userPosition?.positionValue || "0"
        )}
      />
    </Layout>
  );
};
export default Pool;
