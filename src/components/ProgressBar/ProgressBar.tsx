import { Wrapper, StyledProgress } from "./ProgressBar.styles";

interface Props {
  percent: number;
}

const ProgressBar: React.FC<Props> = ({ percent }) => {
  return (
    <Wrapper>
      <StyledProgress width={percent} />
    </Wrapper>
  );
};

export default ProgressBar;
