import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { ResponseMessage, User } from 'src/decorator/customize';
import { IUser } from 'src/users/user.interface';
import { use } from 'passport';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('permissions')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) { }

  @ResponseMessage('Create a new permission')
  @Post()
  async create(@Body() createPermissionDto: CreatePermissionDto, @User() user: IUser) {
    const permission = await this.permissionsService.create(createPermissionDto, user);
    return {
      _id: permission?._id,
      createdAt: permission?.createdAt
    }
  }

  @ResponseMessage('Fetch permissions with paginate')
  @Get()
  findAll(@Query('current') currentPage: string, @Query('pageSize') limit: string, @Query() qs: string) {
    return this.permissionsService.findAll(+currentPage, +limit, qs);
  }

  @ResponseMessage('Fetch a permission by id')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(id);
  }

  @ResponseMessage('Update a permission')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePermissionDto: UpdatePermissionDto, @User() user: IUser) {
    return this.permissionsService.update(id, updatePermissionDto, user);
  }

  @ResponseMessage('Delete a permission')
  @Delete(':id')
  remove(@Param('id') id: string, @User() user: IUser) {
    return this.permissionsService.remove(id, user);
  }
}
