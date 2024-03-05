import styled from 'styled-components';
import { hoverShrinkEffect } from 'styles/common/mixin';

export const Box = styled.button`
  display: flex;
  align-items: center;
  padding: 16px 20px;
  gap: 8px;

  background: ${({ theme }) => theme.color.white};
  border: 1px solid ${({ theme }) => theme.color.gray200};
  border-radius: 20px;

  ${hoverShrinkEffect}
`;

export const ImgButton = styled.img``;

export const Title = styled.div`
  flex: 1;

  color: ${({ theme }) => theme.color.gray600};
  font-family: 'PretendardMedium';
  font-size: 16px;
  line-height: 17px;

  text-align: center;
  background-clip: text;
`;
