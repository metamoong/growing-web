import { v4 as uuidv4 } from 'uuid';
import Server from 'socket.io-mock';
import SOCKET_KEY from 'constants/socketKeys';
import { ImgDefaultProfile } from 'assets/image';
import {
  NullableResponse,
  createApiHandler,
  getSearchParams,
} from 'mocks/createApiHandler';
import {
  CreateChattingDto,
  ChatPhotoDto,
  ChatPhotoLineDto,
  ChatRequestDto,
  ChattingArchivedDto,
  ChattingDto,
  CreatePhotoRequestDto,
  GetUploadUrlRequestDto,
  GetUploadUrlResponseDto,
  Notice,
  NoticeIsFolden,
  ParentChildChattingDto,
} from 'models/chat';
import { CreatePhotoResponseDto } from 'models/gallery';
import { originData } from './data/chatData';

let chatData: ParentChildChattingDto[] = originData;

const findChatData = (id: string): ChattingDto =>
  chatData.filter((chat) => chat.parentChatting.id === id)[0].parentChatting;

// socket 관련
class MockedSocket {
  private server;

  constructor() {
    this.server = new Server();

    this.server.on('connection', () => {
      console.log('User connected');

      this.server.on('disconnection', () => {
        console.log('User disconnected');
      });

      this.server.on(SOCKET_KEY.CREATE_CHAT, (dto: CreateChattingDto) => {
        console.log('get chat');

        const data: ChattingDto = {
          id: uuidv4(),
          content: dto.content,
          emojiUrl: dto.emojiId && dto.emojiId,
          imageUrls: new Array(dto.imageIds.length).fill(ImgDefaultProfile),
          videoUrls: [],
          voiceMsgUrls: [],
          createdAt: new Date(),
          isMine: true,
          Writer: {
            id: '1',
            name: '연주',
            imageUrl: ImgDefaultProfile,
          },
        };
        chatData = [...chatData, { parentChatting: data, childChatting: null }];

        this.server.emit(SOCKET_KEY.GET_CHAT, data);
      });
    });

    this.connect();
  }

  private connect() {
    this.server.socketClient.emit('connection');
  }

  public disconnect() {
    this.server.socketClient.emit('disconnection');
  }

  public on(event: string, callback: (res: any) => void) {
    this.server.socketClient.on(event, callback);
  }

  public off(event: string) {
    this.server.socketClient.off(event);
  }

  public emit(event: string, dto: any) {
    this.server.socketClient.emit(event, dto);
  }
}

export const socket = new MockedSocket();

// chatting 관련

type ChatGetParams = {
  coupleId: string;
};

type ChatDeleteParams = {
  coupleId: string;
  chattingId: string;
};

const getPartialChat = ({
  base,
  limit,
}: ChatRequestDto): ParentChildChattingDto[] => {
  const startIndex = chatData.length - base - limit;
  if (chatData.length <= base) {
    return [];
  }
  return chatData.slice(startIndex < 0 ? 0 : startIndex, startIndex + limit);
};

export const getChatsHandler = createApiHandler<
  ChatGetParams,
  ChatRequestDto,
  NullableResponse<ParentChildChattingDto[]>
>({
  path: '/couples/:coupleId/chattings',
  method: 'get',
  requestHandler: (_, request) => {
    const searchParams = getSearchParams(request.url);
    const base = Number(searchParams.get('base')) || 0;
    const limit = Number(searchParams.get('limit')) || 8;
    const offset = Number(searchParams.get('offset')) || 0;

    const partialChat = getPartialChat({ base, limit, offset });

    return {
      200: partialChat,
      400: null,
    };
  },
});

export const deleteOurChatHandler = createApiHandler<
  ChatDeleteParams,
  {},
  null
>({
  path: '/couples/:coupleId/chattings/:chattingId/delete-ours',
  method: 'delete',
  requestHandler: () => ({
    200: null,
    400: null,
  }),
  onSuccess: ({ chattingId }) => {
    chatData = chatData.filter((chat) => chat.parentChatting.id !== chattingId);
  },
});

// notice 관련

let noticeData: Notice | null = {
  id: findChatData('1').id,
  content: findChatData('1').content ?? '',
  announcer: findChatData('1').Writer.name,
  isFolden: false,
};

type NoticeGetParams = {
  coupleId: string;
};

export const getNoticesHandler = createApiHandler<
  NoticeGetParams,
  {},
  NullableResponse<Notice>
>({
  path: '/couples/:coupleId/chattings/notices',
  method: 'get',
  requestHandler: () => ({
    200: noticeData,
    400: null,
  }),
});

type NoticePostParams = {
  coupleId: string;
  chattingId: string;
};

export const postNoticeHandler = createApiHandler<NoticePostParams, {}, null>({
  path: '/couples/:coupleId/chattings/:chattingId/notify',
  method: 'post',
  requestHandler: () => ({
    200: null,
    400: null,
  }),
  onSuccess: ({ chattingId }) => {
    noticeData = {
      id: findChatData(chattingId).id,
      content: findChatData(chattingId).content ?? '',
      announcer: findChatData(chattingId).Writer.name,
      isFolden: false,
    };
  },
});

type NoticeFoldParams = {
  coupleId: string;
  noticeId: string;
};

export const postNoticeFoldHandler = createApiHandler<
  NoticeFoldParams,
  NoticeIsFolden,
  null
>({
  path: '/couples/:coupleId/chattings/notices/:noticeId/fold',
  method: 'post',
  requestHandler: () => ({
    200: null,
    400: null,
  }),
  onSuccess: ({ noticeId }) => {
    const origin = noticeData;

    noticeData = {
      id: findChatData(noticeId).id,
      content: findChatData(noticeId).content ?? '',
      announcer: findChatData(noticeId).Writer.name,
      isFolden: !origin?.isFolden,
    };
  },
});

export const postNoticeInvisibleHandler = createApiHandler<
  NoticeFoldParams,
  {},
  null
>({
  path: '/couples/:coupleId/chattings/notices/:noticeId/invisible',
  method: 'post',
  requestHandler: () => ({
    200: null,
    400: null,
  }),
  onSuccess: () => {
    noticeData = null;
  },
});

// archived 관련

let archivedData: ChattingArchivedDto[] = [
  {
    chattingId: findChatData('1').id,
    content: findChatData('1').content ?? '',
    writerName: findChatData('1').Writer.name,
    writedAt: findChatData('1').createdAt,
    archivedAt: new Date('2024.02.14'),
  },
  {
    chattingId: findChatData('2').id,
    content: findChatData('2').content ?? '',
    writerName: findChatData('2').Writer.name,
    writedAt: findChatData('2').createdAt,
    archivedAt: new Date('2024.02.14'),
  },
];

type ArchivedGetParams = {
  coupleId: string;
};

export const getArchivedChatHandler = createApiHandler<
  ArchivedGetParams,
  {},
  NullableResponse<ChattingArchivedDto[]>
>({
  path: '/couples/:coupleId/archived-chattings',
  method: 'get',
  requestHandler: () => ({
    200: archivedData,
    400: null,
  }),
});

type ArchivedPostParams = {
  coupleId: string;
  chattingId: string;
};

export const postArchivedChatHandler = createApiHandler<
  ArchivedPostParams,
  {},
  null
>({
  path: '/couples/:coupleId/chattings/:chattingId/archive',
  method: 'post',
  requestHandler: () => ({
    200: null,
    400: null,
  }),
  onSuccess: ({ chattingId }) => {
    archivedData = [
      ...archivedData,
      {
        chattingId: findChatData(chattingId).id,
        content: findChatData(chattingId).content ?? '',
        writerName: findChatData(chattingId).Writer.name,
        writedAt: findChatData(chattingId).createdAt,
        archivedAt: new Date('2024.02.14'),
      },
    ];
  },
});

export const deleteArchivedChatHandler = createApiHandler<
  ArchivedPostParams,
  {},
  null
>({
  path: '/couples/:coupleId/archived-chattings/:chattingId',
  method: 'delete',
  requestHandler: () => ({
    200: null,
    400: null,
  }),
  onSuccess: ({ chattingId }) => {
    archivedData = archivedData.filter(
      (archived) => archived.chattingId !== chattingId
    );
  },
});

// photo 관련

const findImageChat = (): ChatPhotoLineDto[] =>
  chatData
    .filter(
      (chat) =>
        chat.parentChatting.imageUrls.length > 0 ||
        chat.parentChatting.videoUrls.length > 0
    )
    .map((chat) => {
      if (chat.parentChatting.imageUrls.length > 0) {
        return {
          i: chat.parentChatting.id,
          u: chat.parentChatting.imageUrls,
          c: '',
          t: null,
        };
      }

      return {
        i: chat.parentChatting.id,
        u: chat.parentChatting.videoUrls.map((video) => video.thumbnailUrl),
        c: '',
        t: chat.parentChatting.videoUrls.map((video) => video.time)[0],
      };
    });

type PhotoGetParams = {
  coupleId: string;
};

export const getPhotosHandler = createApiHandler<
  PhotoGetParams,
  {},
  NullableResponse<ChatPhotoLineDto[]>
>({
  path: '/couples/:coupleId/chattings/photos',
  method: 'get',
  requestHandler: () => ({
    200: findImageChat(),
    400: null,
  }),
});

type PhotoDetailGetParams = {
  coupleId: string;
  chattingId: string;
};

export const getPhotoDetailHandler = createApiHandler<
  PhotoDetailGetParams,
  {},
  NullableResponse<ChatPhotoDto>
>({
  path: '/couples/:coupleId/chattings/:chattingId/photos',
  method: 'get',
  requestHandler: ({ chattingId }) => {
    console.log('111');
    const { id, createdAt, Writer, imageUrls, videoUrls } =
      findChatData(chattingId);
    console.log('222');

    const data: ChatPhotoDto = {
      id,
      createdAt: createdAt.toISOString(),
      name: Writer.name,
      photos: imageUrls.map((url) => ({ id: uuidv4(), url })),
      video: videoUrls.map((rest) => ({ id: uuidv4(), ...rest }))[0],
    };

    return {
      200: data,
      400: null,
    };
  },
});

type GalleryPostParams = {
  coupleId: string;
  photoId: string;
};

export const postPutGalleryHandler = createApiHandler<
  GalleryPostParams,
  {},
  null
>({
  path: '/couples/:coupleId/chattings/photos/:photoId/put-gallery',
  method: 'post',
  requestHandler: () => ({
    200: null,
    400: null,
  }),
});

type UploadUrlGetParams = {
  coupleId: string;
};

export const getUploadUrlHandler = createApiHandler<
  UploadUrlGetParams,
  GetUploadUrlRequestDto,
  NullableResponse<GetUploadUrlResponseDto>
>({
  path: '/couples/:coupleId/chattings/photos/get-upload-url',
  method: 'post',
  requestHandler: () => ({
    200: {
      url: 'url',
      s3Path: 'url',
    },
    400: null,
  }),
});

type CreatePhotoParams = {
  coupleId: string;
};

export const createPhotoHandler = createApiHandler<
  CreatePhotoParams,
  CreatePhotoRequestDto,
  NullableResponse<CreatePhotoResponseDto>
>({
  path: '/couples/:coupleId/chattings/photos/create',
  method: 'post',
  requestHandler: () => ({
    200: {
      photoId: '11',
    },
    400: null,
  }),
});
