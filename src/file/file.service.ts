import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileEntity } from '../orm/entities/file.entity';
import { CommentEntity } from '../orm/entities/comment.entity';

import { S3 } from 'aws-sdk';

export type UploadFileParams = {
  fileName: string;
  fileType: string;
  fileSize: number;
  file: Buffer;
  comment?: CommentEntity;
  pictureUrl?: string;
};

@Injectable()
export class FileService {
  private s3 = new S3({
    region: process.env.AWS_S3_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  });

  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
  ) {}

  async checkAndDeleteExistsByUrl(url: string): Promise<void> {
    try {
      const file = await this.fileRepository.findOneBy({ url });

      if (file) {
        const { uuid, key } = file;
        await this.fileRepository.delete({ uuid });

        await this.s3
          .deleteObject({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
          })
          .promise();
      }
    } catch (error) {
      throw new InternalServerErrorException('Failed to delete file');
    }
  }

  async upload(data: UploadFileParams): Promise<FileEntity> {
    const { fileName, file, fileType, fileSize, comment, pictureUrl } = data;

    try {
      await this.checkAndDeleteExistsByUrl(pictureUrl);

      const uploadResult: S3.ManagedUpload.SendData = await this.s3
        .upload({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: `${uuid()}-${fileType}`,
          Body: file,
        })
        .promise();

      const newFile = this.fileRepository.create({
        originalName: fileName,
        type: fileType,
        size: fileSize,
        key: uploadResult.Key,
        url: uploadResult.Location,
        comment: comment,
      });

      await this.fileRepository.save(newFile);

      return newFile;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to upload file');
    }
  }

  async getFileUrlByUuid(uuid: string): Promise<string> {
    try {
      const file = await this.fileRepository.findOneBy({ uuid });

      if (!file) {
        throw new NotFoundException('File not found');
      }

      return file.url;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch file');
    }
  }
}
