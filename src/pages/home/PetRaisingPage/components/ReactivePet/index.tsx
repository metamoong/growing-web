import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { LottieRefCurrentProps } from 'lottie-react';
import { useNavigate } from 'react-router-dom';
import {
  usePetData,
  usePetFeedMutation,
  usePetPlayMutation,
} from 'hooks/queries';
import store from 'stores/RootStore';
import Modal from 'components/common/Modal/Modal';
import MENT_HOME from 'constants/ments';
import queryKeys from 'libs/react-query/queryKeys';
import foodAnimation from 'assets/lottie/foodAnimation.json';
import heartsAnimation from 'assets/lottie/heartsAnimation.json';
import PET_GAUGE_MAX from 'constants/constants';
import { AxiosResponse } from 'axios';
import { PetReactionDto } from 'models/pet';
import * as S from './ReactivePet.styled';
import { PetOption } from '../../types/PetOption';
import { ModalOption } from '../../types/ModalOption';
import PetMainSection from '../PetMainSection';

interface Props {
  reactionType: PetOption;
}

const ReactivePet = ({ reactionType }: Props) => {
  const { userStore } = store;
  const navigation = useNavigate();
  const queryClient = useQueryClient();

  const foodLottieRef = useRef<LottieRefCurrentProps | null>(null);
  const heartsLottieRef = useRef<LottieRefCurrentProps | null>(null);

  const [reactionUrl, setReactionUrl] = useState<string | null>(null);
  const [gauge, setGauge] = useState<number>(0);
  const [modalState, setModalState] = useState<ModalOption>({
    on: false,
    text: '',
  });

  const { data: pet } = usePetData({
    coupleId: userStore.user?.coupleId!,
    petId: userStore.petId!,
    options: {
      suspense: false,
    },
  });

  const title =
    reactionType === 'feed' ? MENT_HOME.PET_FEED : MENT_HOME.PET_PLAY;

  const handleSetOnModal = (state: boolean) => {
    setModalState((prevState) => ({ ...prevState, on: state }));
  };

  const petReactionCallback = useCallback(
    (
      res: AxiosResponse<PetReactionDto>,
      successMessage: string,
      failMessage: string
    ) => {
      const isSuccess =
        reactionType === 'feed'
          ? res.data.hungryGauge > (pet?.hungryGauge || 0)
          : res.data.attentionGauge > (pet?.attentionGauge || 0);

      if (isSuccess) {
        heartsLottieRef.current?.goToAndPlay(1);
        setReactionUrl(res.data.petImageUrl);
        setTimeout(
          () => setModalState({ on: true, text: successMessage }),
          3000
        );
      } else {
        setModalState({ on: true, text: failMessage });
      }
      queryClient.invalidateQueries(queryKeys.petKeys.all);
    },
    [pet, reactionType, queryClient]
  );

  const { mutateAsync: feedPet } = usePetFeedMutation({
    coupleId: userStore.user?.coupleId,
    petId: userStore.petId,
    options: {
      onSuccess: (res) =>
        petReactionCallback(
          res,
          MENT_HOME.PET_FEED_SUCCESS,
          MENT_HOME.PET_FEED_FAIL_TIME
        ),
    },
  });

  const { mutateAsync: playPet } = usePetPlayMutation({
    coupleId: userStore.user?.coupleId,
    petId: userStore.petId,
    options: {
      onSuccess: (res) =>
        petReactionCallback(
          res,
          MENT_HOME.PET_PLAY_SUCCESS,
          MENT_HOME.PET_PLAY_FAIL
        ),
    },
  });

  const handlePetReaction = useCallback(async () => {
    if (gauge >= PET_GAUGE_MAX) return;

    const increaseAmount =
      reactionType === 'feed' ? PET_GAUGE_MAX / 4 : PET_GAUGE_MAX / 5;
    setGauge((prev) => prev + increaseAmount);

    foodLottieRef.current?.goToAndPlay(1);
    heartsLottieRef.current?.goToAndPlay(1);

    if (gauge + increaseAmount >= PET_GAUGE_MAX) {
      if (reactionType === 'feed') {
        await feedPet({});
      } else {
        await playPet({});
      }
    }
  }, [gauge, reactionType, feedPet, playPet]);

  useEffect(() => {
    setReactionUrl(pet?.imageUrl || '');
  }, [pet]);

  useEffect(() => {
    foodLottieRef.current?.pause();
    heartsLottieRef.current?.pause();
  }, [foodLottieRef, heartsLottieRef]);

  return (
    <>
      <PetMainSection title={title} gauge={gauge} />

      <S.PetContainer>
        {reactionType === 'feed' && (
          <S.FoodLottie
            lottieRef={foodLottieRef}
            animationData={foodAnimation}
            loop={false}
          />
        )}

        <S.Pet
          url={reactionUrl ?? (pet?.imageUrl || '')}
          size={300}
          onClick={handlePetReaction}
        />
      </S.PetContainer>

      <S.HearLottie
        lottieRef={heartsLottieRef}
        animationData={heartsAnimation}
        loop={false}
      />

      <Modal
        onModal={modalState.on}
        setOnModal={handleSetOnModal}
        description={modalState.text}
        mainActionLabel="확인"
        onMainAction={() => navigation(-1)}
      />
    </>
  );
};

export default ReactivePet;
