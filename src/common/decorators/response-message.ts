import { SetMetadata } from '@nestjs/common';

export const MESSAGE_KEY = 'custom_message';
export const CustomMessage = (message: string) =>
  SetMetadata(MESSAGE_KEY, message);
