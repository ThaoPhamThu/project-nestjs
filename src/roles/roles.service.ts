import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role, RoleDocument } from './schemas/role.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { async } from 'rxjs';
import { User } from 'src/decorator/customize';
import { IUser } from 'src/users/user.interface';
import mongoose from 'mongoose';
import aqp from 'api-query-params';
import { ADMIN_ROLE } from 'src/databases/sample';

@Injectable()
export class RolesService {
  constructor(@InjectModel(Role.name) private roleModel: SoftDeleteModel<RoleDocument>) { }

  async create(createRoleDto: CreateRoleDto, @User() user: IUser) {
    const { name, description, isActive, permissions } = createRoleDto;

    const isExist = await this.roleModel.findOne({ name: name });
    if (isExist) {
      throw new BadRequestException('Name đã tồn tại')
    }

    const newRole = await this.roleModel.create({
      name, description, isActive, permissions,
      createdBy: {
        _id: user._id,
        email: user.email
      }
    })
    return {
      _id: newRole?._id,
      createdAt: newRole?.createdAt
    };
  }

  async findAll(currentPage: number, limit: number, qs: string) {
    const { filter, sort, population, projection } = aqp(qs);
    delete filter.current;
    delete filter.pageSize;

    const skip = (+currentPage - 1) * (+limit);
    const defaultlimit = +limit ? +limit : 10;
    const totalItems = (await this.roleModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultlimit);

    const result = await this.roleModel.find(filter)
      .skip(skip)
      .limit(limit)
      .sort(sort as any)
      .populate(population)
      .select(projection as any)
      .exec()

    return {
      meta: {
        current: currentPage,
        pageSize: limit,
        pages: totalPages,
        total: totalItems
      },
      result
    }
  }

  async findOne(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('not found resumes')
    }

    return await this.roleModel.findOne({ _id: id })
      .populate({ path: 'permissions', select: { _id: 1, apiPath: 1, name: 1, method: 1, module: 1 } });
  }

  async update(id: string, updateRoleDto: UpdateRoleDto, @User() user: IUser) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('not found resumes')
    }

    const { name, description, isActive, permissions } = updateRoleDto;

    return await this.roleModel.updateOne({ _id: id }, {
      name, description, isActive, permissions,
      updatedBy: {
        _id: user._id,
        email: user.email
      }
    });
  }

  async remove(id: string, @User() user: IUser) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('not found resumes')
    }

    const foundRole = await this.roleModel.findById(id);
    if (foundRole.name === ADMIN_ROLE) {
      throw new BadRequestException('không thể xóa role ADMIN')
    }

    const deleteUpdate = await this.roleModel.updateOne({ _id: id }, {
      deletedBy: {
        _id: user._id,
        email: user.email
      }
    })
    return await this.roleModel.softDelete({ _id: id });
  }
}
