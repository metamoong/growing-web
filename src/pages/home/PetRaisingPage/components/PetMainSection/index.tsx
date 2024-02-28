import changeEmojiToSpan from 'utils/Text';
import MENT_HOME from 'constants/ments';
import * as S from './PetMainSection.styled';

interface Props {
  title: string;
  gauge: number;
}

const PetMainSection = ({ title, gauge }: Props) => {
  return (
    <S.Main>
      <S.Title
        className="text-gradient400"
        dangerouslySetInnerHTML={changeEmojiToSpan(title)}
      />

      <S.Bar>
        <S.ActiveBar level={gauge} />
      </S.Bar>

      <S.SubTitle>{MENT_HOME.PET_FEED_HELP}</S.SubTitle>
    </S.Main>
  );
};

export default PetMainSection;
