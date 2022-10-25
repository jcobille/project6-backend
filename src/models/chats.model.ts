import {Entity, model, property} from '@loopback/repository';

@model()
export class Chats extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  id?: string;

  @property({
    type: 'string',
    required: false,
  })
  userId: string;

  @property({
    type: 'string',
    required: true,
  })
  toUserId: string;

  @property({
    type: 'string',
    required: true,
  })
  message: string;

  @property({
    type: 'date',
    required: false,
  })
  timestamp: string;

  constructor(data?: Partial<Chats>) {
    super(data);
  }
}

export interface ChatsRelations {
  // describe navigational properties here
}

export type ChatsWithRelations = Chats & ChatsRelations;
