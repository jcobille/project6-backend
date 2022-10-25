import {
  model,
  property,
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
import {Users} from '../models';
import {UsersRepository} from '../repositories';
import {genSalt, hash} from 'bcryptjs';
import _ from 'lodash';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export class UsersController {
  constructor(
    @repository(UsersRepository)
    public usersRepository: UsersRepository,
  ) {}

  @get('/users')
  @response(200, {
    description: 'Array of Users model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Users, {includeRelations: true}),
        },
      },
    },
  })
  async find(@param.filter(Users) filter?: Filter<Users>): Promise<{}> {
    const users = await this.usersRepository.find({fields: {password: false}});
    return {data: users, status: true, message: ''};
  }

  @patch('/users')
  @response(200, {
    description: 'Users PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Users, {partial: true}),
        },
      },
    })
    users: Users,
    @param.where(Users) where?: Where<Users>,
  ): Promise<Count> {
    return this.usersRepository.updateAll(users, where);
  }

  @get('/users/details/{id}')
  @response(200, {
    description: 'Users model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Users, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Users, {exclude: 'where'})
    filter?: FilterExcludingWhere<Users>,
  ): Promise<{}> {
    const details = await this.usersRepository.findById(
      id,
      filter || {fields: {password: false}},
    );
    return {data: details, status: true, message: ''};
  }

  @patch('/users/edit/{id}')
  @response(204, {
    description: 'Users PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Users, {partial: true}),
        },
      },
    })
    users: Users,
  ): Promise<{}> {
    await this.usersRepository.updateById(id, users);
    return {data: [], status: true, message: 'User updated!'};
  }

  @put('/users/{id}')
  @response(204, {
    description: 'Users PUT success',
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() users: Users,
  ): Promise<void> {
    await this.usersRepository.replaceById(id, users);
  }

  @del('/users/{id}')
  @response(204, {
    description: 'Users DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<{}> {
    await this.usersRepository.deleteById(id);
    return {data: [], status: true, message: 'User deleted'};
  }

  @post('/users/login')
  @response(204, {
    description: 'User LOGIN instance',
  })
  async login(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              token: {
                type: 'string',
              },
            },
          },
        },
      },
    })
    user: Omit<{email: ''; password: ''}, 'id'>,
  ): Promise<{}> {
    const userFind = await this.usersRepository.findOne({
      where: {email: user.email},
    });
    if (userFind) {
      if (await bcrypt.compare(user.password, userFind.password)) {
        const token = jwt.sign(
          {id: userFind.id, email: user.email, type: 'user'},
          await genSalt(),
        );

        return {
          data: {
            token: token,
            user: {
              id: userFind.id,
              email: userFind.email,
              name: userFind.name,
            },
          },
          status: true,
          message: 'User Authenticated!',
        };
      }
    }

    return {data: [], status: false, message: 'Invalid credentials'};
  }

  @post('/users/create')
  @response(204, {
    description: 'User CREATE instance',
  })
  async signUp(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Users, {
            title: 'NewUser',
          }),
        },
      },
    })
    user: Omit<Users, 'id'>,
  ): Promise<{}> {
    const password = await hash(user.password, await genSalt());
    const userFind = await this.usersRepository.findOne({
      where: {email: user.email},
    });

    if (!userFind) {
      const savedUser = await this.usersRepository.create({
        ...user,
        password: password,
      });
      return {data: savedUser.id, status: true, message: 'New user created!'};
    } else {
      return {
        data: [],
        status: false,
        message: 'Email already registered',
      };
    }
  }
}
