import { FC, useState, ChangeEvent } from "react";
import { ethers } from "ethers";
import Tabs from "../Tabs";
import AddLiquidityForm from "./AddLiquidityForm";
import RemoveLiqudityForm from "./RemoveLiquidityForm";
import {
  Wrapper,
  Info,
  InfoText,
  ROIWrapper,
  ROIItem,
  Logo,
  TabContentWrapper,
  PositionWrapper,
  PositionBlock,
  PositionBlockItem,
  PositionBlockItemBold,
} from "./PoolForm.styles";

interface Props {
  symbol: string;
  icon: string;
  apy: string;
  totalPoolSize: string;
  position: ethers.BigNumber;
  feesEarned: ethers.BigNumber;
}

const PoolForm: FC<Props> = ({
  symbol,
  icon,
  totalPoolSize,
  apy,
  position,
  feesEarned,
}) => {
  const [inputAmount, setInputAmount] = useState("");
  const [removeAmount, setRemoveAmount] = useState(0);
  const [error] = useState<Error>();

  return (
    <Wrapper>
      <Info>
        <Logo src={icon} />
        <InfoText>{symbol} Pool</InfoText>
        <PositionWrapper>
          <PositionBlock>
            <PositionBlockItem>My position</PositionBlockItem>
            <PositionBlockItem>
              {position.toString()} {symbol}
            </PositionBlockItem>
          </PositionBlock>
          <PositionBlock>
            <PositionBlockItem>Fees earned</PositionBlockItem>
            <PositionBlockItem>
              {feesEarned.toString()} {symbol}
            </PositionBlockItem>
          </PositionBlock>
          <PositionBlock>
            <PositionBlockItemBold>Total</PositionBlockItemBold>
            <PositionBlockItemBold>
              {position.add(feesEarned).toString()} ETH
            </PositionBlockItemBold>
          </PositionBlock>
        </PositionWrapper>
        <ROIWrapper>
          <ROIItem>Total Pool Size:</ROIItem>
          <ROIItem>
            {totalPoolSize} {symbol}
          </ROIItem>
        </ROIWrapper>
        <ROIWrapper>
          <ROIItem>Estimated APY:</ROIItem>
          <ROIItem>{apy}</ROIItem>
        </ROIWrapper>
      </Info>
      <Tabs>
        <TabContentWrapper data-label="Add">
          <AddLiquidityForm
            error={error}
            amount={inputAmount}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setInputAmount(event.target.value)
            }
            buttonClickHandler={() => console.log("Add")}
          />
        </TabContentWrapper>
        <TabContentWrapper data-label="Remove">
          <RemoveLiqudityForm
            removeAmount={removeAmount}
            setRemoveAmount={setRemoveAmount}
          />
        </TabContentWrapper>
      </Tabs>
    </Wrapper>
  );
};

export default PoolForm;
