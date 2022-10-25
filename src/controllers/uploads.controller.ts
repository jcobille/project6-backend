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
import {UploadsRepository} from '../repositories';

export class UploadsController {
  constructor(
    @repository(UploadsRepository)
    public uploadsRepository: UploadsRepository,
  ) {}

  @get('/uploads')
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
  async find(
    @param.filter(Uploads) filter?: Filter<Uploads>,
  ): Promise<Uploads[]> {
    return this.uploadsRepository.find(filter);
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

  @put('/uploads/{id}')
  @response(204, {
    description: 'Uploads PUT success',
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() uploads: Uploads,
  ): Promise<void> {
    await this.uploadsRepository.replaceById(id, uploads);
  }

  @del('/uploads/{id}')
  @response(204, {
    description: 'Uploads DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.uploadsRepository.deleteById(id);
  }

  @get('/uploads/{id}')
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
    @param.filter(Uploads, {exclude: 'where'})
    filter?: FilterExcludingWhere<Uploads>,
  ): Promise<{}> {
    const uploads = await this.uploadsRepository.find({
      where: {userId: id},
    });
    // this.uploadsRepository.findById(id, filter);
    return {data: uploads, status: true, message: ''};
  }
}
