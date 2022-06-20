import {
  Wrapper,
  GiftIcon,
  Header,
  SubHeader,
  HeroButton,
} from "./RewardHero.styles";

const RewardHero = () => {
  return (
    <Wrapper>
      <GiftIcon />
      <Header>Across Airdrop</Header>
      <SubHeader>
        If you've been a part of the the Across Community,
        <br /> there's a chance that you're eligible for the airdrop.
      </SubHeader>
      <HeroButton>Check eligibility</HeroButton>
    </Wrapper>
  );
};

export default RewardHero;
