/* eslint-disable @typescript-eslint/no-unused-vars */
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useState, useRef } from 'react';
import { observer } from 'mobx-react';
import { yupResolver } from '@hookform/resolvers/yup';
import TopBar from '../../components/common/TopBar/TopBar';
import Icon from '../../components/common/Icon/Icon';
import Profile from '../../components/pages/more/Profile';
import SideButton from '../../components/pages/more/SideButton';
import InputContainer from '../../components/pages/more/InputContainer';
import { ProfileFormValues, profileSchema } from '../../types/InputSchema';
import PaddingContainer from '../../styles/common/layout';
import Modal from '../../components/common/Modal/Modal';
import ModalBottomSheet from '../../components/common/Modal/ModalBottomSheet/ModalBottomSheet';
import BottomSheetMenu from '../../components/common/Modal/ModalBottomSheet/BottomSheetMenu';
import store from '../../stores/RootStore';
import {
  usePatchUserInfoMutation,
  usePutProfilePhotoMutation,
} from '../../hooks/queries/user.queries';
import { usePatchCoupleMutation } from '../../hooks/queries/couple.queries';

const StyledForm = styled.form`
  flex-direction: column;
  align-items: center;
`;

const StyledInput = styled.input`
  font-family: 'PretendardRegular';
  background-color: transparent;
`;

const ProfileContainer = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  width: 100%;
  padding: 60px 0;
`;

const Background = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  left: 0px;
  top: 0px;
  z-index: -1;
  background-color: ${({ theme }) => theme.color.gray50};
`;

function ProfilePage() {
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);
  const [onCompleteModal, setOnCompleteModal] = useState(false);
  const [onCancelModal, setOnCanelModal] = useState(false);
  const [onBottomSheet, setOnButtomSheet] = useState(false);
  const nickname = store.userStore.user?.nickName ?? '';
  const imgUrl = store.userStore.user?.imageUrl ?? '';
  const birthday =
    new Date(store.userStore.user?.birthDay!).toISOString().substring(0, 10) ??
    '';
  const anniversary =
    new Date(store.userStore.user?.anniversaryDay!)
      .toISOString()
      .substring(0, 10) ?? '';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      nickname,
      birthday,
      anniversary,
    },
  });

  const { mutateAsync: patchUserInfo } = usePatchUserInfoMutation({
    userId: store.userStore.user?.id!,
  });
  const { mutateAsync: patchCoupleInfo } = usePatchCoupleMutation({
    coupleId: store.userStore.user?.coupleId!,
  });
  const { mutateAsync: putPorfilePhoto } = usePutProfilePhotoMutation({
    userId: store.userStore.user?.id!,
  });

  const modifyProfile = async (data: {
    nickname: string;
    birthday: string;
    anniversary: string;
  }) => {
    await patchUserInfo({
      nickName: data.nickname,
      birthDay: new Date(data.birthday),
    });
    await patchCoupleInfo({
      anniversaryDay: data.anniversary,
    });
    setOnCompleteModal(true);
  };

  return (
    <StyledForm
      onSubmit={handleSubmit((data) => modifyProfile(data))}
      ref={formRef}
    >
      <TopBar
        leftNode={<Icon icon="IconArrowLeft" />}
        onLeftClick={() => setOnCanelModal(true)}
        title="프로필 수정"
        rightMainNode={
          <StyledInput
            type="submit"
            value="완료"
            className="text-gradient400"
          />
        }
      />
      <PaddingContainer>
        <Background />
        <ProfileContainer>
          <Profile imgUrl={imgUrl} border={false} />
          <SideButton
            value="사진 수정"
            abLeft="calc(50% + 19px)"
            abTop="179px"
            onClick={() => setOnButtomSheet(true)} // TODO : 프로필 사진 수정
          />
        </ProfileContainer>
        <InputContainer
          title="애칭"
          type="text"
          value={nickname}
          {...register('nickname', { required: '애칭을 입력해주세요!' })}
          error={errors.nickname}
        />
        <InputContainer
          title="생년월일"
          type="date"
          value={birthday}
          {...register('birthday')}
          error={errors.birthday}
        />
        <InputContainer
          title="기념일"
          type="date"
          value={anniversary}
          {...register('anniversary')}
          error={errors.anniversary}
        />
        {onCompleteModal && (
          <Modal
            onModal={onCompleteModal}
            setOnModal={setOnCompleteModal}
            title="프로필 수정 성공🎉"
            description="프로필이 수정되었습니다."
            mainActionLabel="확인"
            onMainAction={() => navigate('/more')}
          />
        )}
        {onCancelModal && (
          <Modal
            onModal={onCancelModal}
            setOnModal={setOnCanelModal}
            title="프로필 수정 취소"
            description={'변경하신 내용이 취소됩니다.\n정말 나가시겠습니까?'}
            mainActionLabel="확인"
            onMainAction={() => navigate('/more')}
            subActionLabel="취소"
            onSubAction={() => setOnCanelModal(false)}
          />
        )}
        {onBottomSheet && (
          <ModalBottomSheet open={onBottomSheet} setOpen={setOnButtomSheet}>
            <BottomSheetMenu>
              <Icon icon="IconShare" themeColor="gray50" />
              라이브러리에서 선택
            </BottomSheetMenu>
            <BottomSheetMenu>
              <Icon icon="IconGallery" themeColor="gray50" />앱 내 갤러리에서
              선택
            </BottomSheetMenu>
            <BottomSheetMenu onClick={() => {}}>
              <Icon icon="IconTrash" themeColor="gray50" />
              현재 사진 삭제
            </BottomSheetMenu>
          </ModalBottomSheet>
        )}
      </PaddingContainer>
    </StyledForm>
  );
}
export default observer(ProfilePage);
