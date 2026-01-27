import { Controller, Post, UseGuards, UploadedFile, UseInterceptors, Body, Req, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AuthGuard } from '@nestjs/passport';
import { UploadService } from './upload.service';
import { CommitUploadDto } from './dto/commit-upload.dto';

@Controller('api/upload')
@UseGuards(AuthGuard('jwt'))
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post('parse')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async parse(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File is required');
    return this.uploadService.parseFile(file);
  }

  @Post('commit')
  async commit(@Body() dto: CommitUploadDto, @Req() req: any) {
    const user = req.user;
    return this.uploadService.commitParsed(dto, user);
  }
}
