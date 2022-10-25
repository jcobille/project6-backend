import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DashboardDataSource} from '../datasources';
import {Uploads, UploadsRelations} from '../models';

export class UploadsRepository extends DefaultCrudRepository<
  Uploads,
  typeof Uploads.prototype.id,
  UploadsRelations
> {
  constructor(
    @inject('datasources.dashboard') dataSource: DashboardDataSource,
  ) {
    super(Uploads, dataSource);
  }
}
