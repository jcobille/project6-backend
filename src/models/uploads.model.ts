import {Entity, model, property} from '@loopback/repository';

@model()
export class Uploads extends Entity {
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
    required: false,
  })
  label: string;

  @property({
    type: 'string',
    required: false,
  })
  fileName: string;

  @property({
    type: 'array',
    itemType: 'string',
  })
  sharedTo: string[];


  constructor(data?: Partial<Uploads>) {
    super(data);
  }
}

export interface UploadsRelations {
  // describe navigational properties here
}

export type UploadsWithRelations = Uploads & UploadsRelations;
