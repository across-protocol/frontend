import { FC, useState, useEffect } from "react";
import { ethers } from "ethers";
import Layout from "components/Layout";
import PoolSelection from "components/PoolSelection";
import PoolForm from "components/PoolForm";
import { POOL_LIST, Token } from "utils";
import { useAppDispatch, useAppSelector, useConnection } from "state/hooks";
import { getPoolState, getUserPoolState } from "state/pools";
import get from 'lodash/get'

const Pool: FC = () => {
  const [token, setToken] = useState<Token>(POOL_LIST[0]);
  const [totalPoolSize, setTotalPoolSize] = useState(
    ethers.BigNumber.from("0")
  );
  const [apy, setApy] = useState("0.00%");

  const dispatch = useAppDispatch();
  const pools = useAppSelector((state) => state.pools.pools[token.bridgePool]);
  const connection = useAppSelector((state) => state.connection);
  const userPosition = useAppSelector(
    (state) => get(state,['pools','userData',state?.connection?.account || '','userPoolsData',token.bridgePool])
  );

  const { isConnected } = useConnection();

  // Get pool state on mount of view.
  useEffect(() => {
    dispatch(getPoolState(token.bridgePool));
  }, [dispatch, token]);

  useEffect(() => {
    if (pools) {
      setTotalPoolSize(ethers.BigNumber.from(pools.totalPoolSize));
      setApy(`${Number(pools.estimatedApy) * 100}%`);
    }
  }, [token, pools]);

  useEffect(() => {
    if (isConnected && connection.account && token.bridgePool) {
      dispatch(
        getUserPoolState({
          account: connection.account,
          poolAddress: token.bridgePool,
        })
      );
    }
  }, [isConnected, connection.account, token.bridgePool, dispatch]);

  return (
    <Layout>
      <PoolSelection setToken={setToken} />
      <PoolForm
        symbol={token.symbol}
        icon={token.logoURI}
        decimals={token.decimals}
        totalPoolSize={totalPoolSize}
        apy={apy}
        position={ethers.BigNumber.from(userPosition?.totalDeposited || '0' )}
        feesEarned={ethers.BigNumber.from(userPosition?.feesEarned || '0')}
        totalPosition={ethers.BigNumber.from(userPosition?.positionValue || '0')}
      />
    </Layout>
  );
};
export default Pool;

// const Wrapper = styled.
