import { Wrapper, StyledProgress } from "./ProgressBar.styles";

interface Props {
  percent: number;
  className?: string;
}

const ProgressBar: React.FC<Props> = ({ percent, className }) => {
  return (
    <Wrapper className={className ?? ""}>
      <StyledProgress width={percent} />
    </Wrapper>
  );
};

export default ProgressBar;
