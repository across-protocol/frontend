import { useRef } from "react";
import styled from "@emotion/styled";
import { motion } from "framer-motion";

import { useCenteredInViewport } from "hooks";

type Props = {
  cards: React.ReactElement[];
};

export function VerticalCardsList({ cards }: Props) {
  return (
    <Wrapper>
      {cards.map((card, i) => (
        <CardListItem key={i} Card={card} />
      ))}
    </Wrapper>
  );
}

function CardListItem({ Card }: { Card: React.ReactElement }) {
  const slideRef = useRef<HTMLDivElement>(null);

  const centeredInViewport = useCenteredInViewport(slideRef);

  return (
    <motion.div
      ref={slideRef}
      initial={{
        opacity: 0.5,
      }}
      animate={{
        opacity: centeredInViewport ? 1 : 0.5,
      }}
      style={{
        boxShadow: centeredInViewport
          ? "0px 40px 96px rgba(0, 0, 0, 0.45)"
          : "",
        borderRadius: 16,
        scrollSnapAlign: "center",
        scrollSnapStop: "always",
      }}
      onClick={() => {
        if (slideRef && slideRef.current) {
          slideRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }}
    >
      {Card}
    </motion.div>
  );
}

const Wrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
  padding-top: 20%;
  padding-bottom: 20%;
  overflow-y: scroll;
  gap: 16px;
  scroll-snap-type: y mandatory;

  // hide scrollbar
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
  ::-webkit-scrollbar {
    display: none; /* Chrome, Safari and Opera */
  }
`;
