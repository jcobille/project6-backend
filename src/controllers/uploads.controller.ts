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
import {Uploads} from '../models';
import {UploadsRepository, UsersRepository} from '../repositories';

export class UploadsController {
  constructor(
    @repository(UploadsRepository)
    public uploadsRepository: UploadsRepository,

    @repository(UsersRepository)
    public usersRepository: UsersRepository,
  ) {}

  @get('/uploads/{id}')
  @response(200, {
    description: 'Array of Uploads model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Uploads, {includeRelations: true}),
        },
      },
    },
  })
  async getList(
    @param.path.string('id') id: string,
    @param.filter(Uploads, {exclude: 'where'})
    filter?: FilterExcludingWhere<Uploads>,
  ): Promise<{}> {
    const uploadsList = await this.uploadsRepository.find({
      where: {userId: id},
    });
    return {data: uploadsList, status: true, message: ''};
  }

  @post('/uploads')
  @response(200, {
    description: 'Uploads model instance',
    content: {'application/json': {schema: getModelSchemaRef(Uploads)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Uploads, {
            title: 'NewUploads',
            exclude: ['id'],
          }),
        },
      },
    })
    uploads: Omit<Uploads, 'id'>,
  ): Promise<Uploads> {
    return this.uploadsRepository.create(uploads);
  }

  @patch('/uploads/update/{id}')
  @response(204, {
    description: 'Uploads PUT success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody() upload: Uploads,
  ): Promise<{}> {
    await this.uploadsRepository.updateById(id, upload);
    return {data: [], status: true, message: 'Upload has been updated!'};
  }

  @del('/uploads/delete/{id}')
  @response(204, {
    description: 'Uploads DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<{}> {
    await this.uploadsRepository.deleteById(id);
    return {data: [], status: true, message: 'Upload has been deleted!'};
  }

  @get('/uploads/details/{id}')
  @response(200, {
    description: 'Uploads model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Uploads, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
  ): Promise<{}> {
    const uploads = await this.uploadsRepository.find({
      where: {userId: id},
    });
    // this.uploadsRepository.findById(id, filter);
    return {data: uploads, status: true, message: ''};
  }

  @get('/uploads/shared/{id}')
  @response(200, {
    description: 'Array of Uploads model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Uploads, {includeRelations: true}),
        },
      },
    },
  })
  async getSharedList(@param.path.string('id') id: string): Promise<{}> {
    const sharedUploadsList = await this.uploadsRepository.find({
      where: {sharedTo: {inq: [id]}},
    });
    const usersList = await this.usersRepository.find();
    let fileShared: object[] = [];
    sharedUploadsList.map(data => {
      let user = usersList.find(
        user => String(user.id) === String(data.userId),
      );
      if (user) {
        fileShared.push({
          id: data.id,
          label: data.label,
          fileName: data.fileName,
          sharedBy: user.name,
        });
      }
    });

    return {data: fileShared, status: true, message: id};
  }
}
