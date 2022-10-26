import {inject} from '@loopback/core';
import {FilterExcludingWhere, repository} from '@loopback/repository';
import {
  post,
  param,
  get,
  getModelSchemaRef,
  patch,
  del,
  oas,
  Request,
  requestBody,
  response,
  RestBindings,
  Response,
  HttpErrors,
} from '@loopback/rest';
import {FILE_UPLOAD_SERVICE} from '../keys';
import {STORAGE_DIRECTORY} from '../keys';
import {Uploads} from '../models';
import {UploadsRepository, UsersRepository} from '../repositories';
import {FileUploadHandler} from '../types';
import fs from 'fs';
import path from 'path';

export interface fileRequest extends Request {
  fileRequest: any;
}

export class UploadsController {
  constructor(
    @repository(UploadsRepository)
    public uploadsRepository: UploadsRepository,

    @repository(UsersRepository)
    public usersRepository: UsersRepository,

    @inject(FILE_UPLOAD_SERVICE)
    private handler: FileUploadHandler,

    // @inject(STORAGE_DIRECTORY)
    // private storageDirectory: string,
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

  @post('/uploads/create')
  @response(200, {
    description: 'Uploads model instance',
    content: {'application/json': {schema: {type: 'object'}}},
  })
  async create(
    @requestBody.file()
    request: Request,
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ): Promise<object> {
    return new Promise<object>((resolve, reject) => {
      this.handler(request, response, async (err: unknown) => {
        if (err) reject({data: [], status: false, message: err});
        else {
          let res = await UploadsController.getFilesAndFields(request);
          let fileName = res.fields.fileName;

          let body = {
            userId: res.fields.userId,
            label: res.fields.label,
            fileName: fileName,
            sharedTo: [],
          };

          let createUpload = await this.uploadsRepository.create(body);
          resolve({
            data: createUpload,
            status: true,
            message: 'Successfully uploaded!',
          });
        }
      });
    });
  }

  private static async getFilesAndFields(request: Request) {
    const uploadedFiles = request.files;
    const mapper = (f: globalThis.Express.Multer.File) => ({
      fieldname: f.fieldname,
      originalname: f.originalname,
      encoding: f.encoding,
      mimetype: f.mimetype,
      size: f.size,
    });

    let files: object[] = [];
    if (Array.isArray(uploadedFiles)) {
      files = uploadedFiles.map(mapper);
    } else {
      for (const filename in uploadedFiles) {
        files.push(...uploadedFiles[filename].map(mapper));
      }
    }

    return {files, fields: request.body};
  }

  @get('/uploads/download/{filename}')
  @oas.response.file()
  downloadFile(
    @param.path.string('filename') fileName: string,
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ) {
    const file = this.validateFileName(fileName);
    // response.download(file, fileName);
    return response;
  }

  /**
   * Validate file names to prevent them goes beyond the designated directory
   * @param fileName - File name
   */
  private validateFileName(fileName: string) {
    // const resolved = path.resolve(this.storageDirectory, fileName);
    // if (resolved.startsWith(this.storageDirectory)) return resolved;
    // The resolved file is outside sandbox
    throw new HttpErrors.BadRequest(`Invalid file name: ${fileName}`);
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
    return {data: upload, status: true, message: 'Upload has been updated!'};
  }

  @del('/uploads/delete/{id}')
  @response(204, {
    description: 'Uploads DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<{}> {
    let upload = await this.uploadsRepository.findOne({
      where: {id: id},
    });

    if (fs.existsSync(`./public/uploads/${upload?.fileName}`)) {
      fs.unlinkSync(`./public/uploads/${upload?.fileName}`);
    }

    await this.uploadsRepository.deleteById(id);
    return {
      data: [],
      status: true,
      message: 'Upload has been deleted!',
    };
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
  async findById(@param.path.string('id') id: string): Promise<{}> {
    const uploads = await this.uploadsRepository.find({
      where: {userId: id},
    });
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
  async getSharedList(@param.path.string('id') id: string[]): Promise<{}> {
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
