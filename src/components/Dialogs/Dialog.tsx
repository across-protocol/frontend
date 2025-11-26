import Modal from "components/Modal";
import { ModalProps } from "components/Modal/Modal";
import styled from "@emotion/styled";
import { COLORS, QUERIES, withOpacity } from "utils";
import { ReactComponent as Warning } from "assets/icons/warning_triangle_filled.svg";
import { ReactComponent as Siren } from "assets/icons/siren.svg";
import { ReactComponent as Info } from "assets/icons/info.svg";
import { PropsWithChildren } from "react";

type Variant = "warn" | "error" | "info";

const defaultIcons: Record<Variant, React.ReactNode> = {
  warn: <Warning />,
  error: <Siren />,
  info: <Info />,
};

const defaultColors: Record<Variant, string> = {
  warn: "rgba(255, 149, 0, 1)",
  error: COLORS.error,
  info: COLORS.white,
};

// DialogWrapper - The main container that wraps everything
export type DialogWrapperProps = ModalProps & {
  className?: string;
};

export function DialogWrapper({
  children,
  className,
  ...props
}: DialogWrapperProps) {
  return (
    <Wrapper className={className} {...props}>
      {children}
    </Wrapper>
  );
}

// DialogIcon - For displaying icons with variant-based styling
export type DialogIconProps = {
  variant?: Variant;
  icon?: React.ReactNode;
  color?: string;
  className?: string;
};

export function DialogIcon({
  variant = "info",
  icon,
  color,
  className,
}: DialogIconProps) {
  const Icon = icon ?? defaultIcons[variant];
  const iconColor = color ?? defaultColors[variant];

  return (
    <IconWrapper color={iconColor} className={className}>
      {Icon}
    </IconWrapper>
  );
}

// DialogContent - For the main content area
export type DialogContentProps = {
  children: React.ReactNode;
  className?: string;
};

export function DialogContent({ children, className }: DialogContentProps) {
  return <ContentWrapper className={className}>{children}</ContentWrapper>;
}

// DialogButtonRow - Container for buttons
export type DialogButtonRowProps = {
  children: React.ReactNode;
  className?: string;
};

export function DialogButtonRow({ children, className }: DialogButtonRowProps) {
  return <ButtonRow className={className}>{children}</ButtonRow>;
}

// DialogButtonPrimary - Primary action button
export type DialogButtonPrimaryProps = {
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
};

export function DialogButtonPrimary({
  children,
  onClick,
  className,
}: DialogButtonPrimaryProps) {
  return (
    <PrimaryButton onClick={onClick} className={className}>
      {children}
    </PrimaryButton>
  );
}

// DialogButtonSecondary - Secondary action button
export type DialogButtonSecondaryProps = {
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
};

export function DialogButtonSecondary({
  children,
  onClick,
  className,
}: DialogButtonSecondaryProps) {
  return (
    <SecondaryButton onClick={onClick} className={className}>
      {children}
    </SecondaryButton>
  );
}

// Legacy Dialog component for backward compatibility
export type DoYourOwnResearchDialogProps = ModalProps & {
  variant: Variant;
  primaryAction?: () => void;
  secondaryAction?: () => void;
  icon?: React.ReactNode;
  color?: string;
  className?: string;
};

export function Dialog({
  children,
  className,
  variant,
  icon,
  primaryAction,
  secondaryAction,
  ...props
}: DoYourOwnResearchDialogProps) {
  const Icon = icon ?? defaultIcons[variant];
  return (
    <Wrapper className={className} {...props}>
      <IconWrapper color={defaultColors[variant]}>{Icon}</IconWrapper>
      {children}
      {(secondaryAction || primaryAction) && (
        <ButtonRow>
          {secondaryAction && <PrimaryButton onClick={secondaryAction} />}
          {primaryAction && <PrimaryButton onClick={primaryAction} />}
        </ButtonRow>
      )}
    </Wrapper>
  );
}

// Styled components
const ButtonRow = styled.div`
  display: flex;
  gap: 16px;
  justify-content: center;
  width: 100%;
  align-items: center;
  flex-direction: column;
  flex-wrap: wrap;

  @media ${QUERIES.tabletAndUp} {
    flex-direction: row;
  }
`;

const PrimaryButton = styled.button`
  display: flex;
  height: 48px;
  width: auto;
  padding: 0 var(--Spacing-Medium, 16px);
  justify-content: center;
  align-items: center;
  border-radius: 12px;
  background: rgba(224, 243, 255, 0.1);
  cursor: pointer;
  color: white;
  border: 1px solid transparent;
  flex: 1 0 auto;
  font-size: 16px;
  font-weight: 600;

  &:hover {
    background: none;
    border: 1px solid rgba(224, 243, 255, 0.1);
  }
`;

const SecondaryButton = styled(PrimaryButton)`
  background: transparent;
  border: 1px solid rgba(224, 243, 255, 0.1);

  &:hover {
    background: rgba(224, 243, 255, 0.1);
    border-color: transparent;
  }
`;

const Wrapper = styled(Modal)`
  width: 100%;
  max-width: 450px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
`;

const IconWrapper = styled.div<{ color: string }>`
  background-color: ${({ color }) => withOpacity(color, 0.2)};
  border-radius: 50%;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 32px;
    height: 32px;
    color: ${({ color }) => color};
  }
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
`;
