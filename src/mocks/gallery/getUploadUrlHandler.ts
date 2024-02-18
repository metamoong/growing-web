import { NullableResponse, createApiHandler } from 'mocks/createApiHandler';
import { GetUploadUrlRequestDto, GetUploadUrlResponseDto } from 'models/chat';

type Params = {
  coupleId: string;
};

const data: GetUploadUrlResponseDto = {
  url: 'photo-uploaded-url',
  s3Path: 's3Path',
};

export const getUploadUrlHandler = createApiHandler<
  Params,
  GetUploadUrlRequestDto,
  NullableResponse<GetUploadUrlResponseDto>
>('/couples/:coupleId/gallerys/photos/get-upload-url', 'post', () => ({
  200: data,
  400: null,
}));
