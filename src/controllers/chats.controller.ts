import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getModelSchemaRef,
  patch,
  put,
  del,
  requestBody,
  response,
} from '@loopback/rest';
import {Chats} from '../models';
import {ChatsRepository, UsersRepository} from '../repositories';

export class ChatsController {
  constructor(
    @repository(ChatsRepository)
    public chatsRepository: ChatsRepository,

    @repository(UsersRepository)
    public usersRepository: UsersRepository,
  ) {}

  @post('/chats/create')
  @response(200, {
    description: 'Chats model instance',
    content: {'application/json': {schema: getModelSchemaRef(Chats)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Chats, {
            title: 'NewChats',
            exclude: ['id'],
          }),
        },
      },
    })
    chat: Omit<Chats, 'id'>,
  ): Promise<{}> {
    const date = new Date();
    chat = {...chat, timestamp: date.toISOString()};

    const newChat = await this.chatsRepository.create(chat);
    const users = await this.usersRepository.find();
    const user = users.find(user => user.id == chat.userId);
    let message = {};

    if (user) {
      message = {
        user: user.name,
        message: chat.message,
        timestamp: chat.timestamp,
      };
      return {data: message, status: true, message: 'New chat submitted!'};
    } else {
      return {data: [], status: false, message: 'Internal server error!'};
    }
  }

  @get('/chats')
  @response(200, {
    description: 'Array of Chats model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Chats, {includeRelations: true}),
        },
      },
    },
  })
  async find(): Promise<{}> {
    const chats = await this.chatsRepository.find();
    const users = await this.usersRepository.find();
    let messages: object[] = [];

    chats.map(chat => {
      let user = users.find(user => user.id == chat.userId);
      let receiver = users.find(user => user.id == chat.toUserId);
      if (user) {
        messages.push({
          user: user.name,
          receiver: receiver?.id,
          message: chat.message,
          timestamp: chat.timestamp,
        });
      }
    });

    return {data: messages, status: true, message: ''};
  }

  @del('/chats/{id}')
  @response(204, {
    description: 'Chats DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.chatsRepository.deleteById(id);
  }
}
