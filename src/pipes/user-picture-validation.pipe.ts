import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import * as sharp from 'sharp';

@Injectable()
export class UserPictureValidationPipe
  implements PipeTransform<Express.Multer.File>
{
  async transform(
    file: Express.Multer.File,
    metadata: ArgumentMetadata,
  ): Promise<Express.Multer.File> {
    if (metadata.type === 'custom') {
      await this.validateFile(file);
    }

    return file;
  }

  private async validateFile(file: Express.Multer.File): Promise<void> {
    if (file) {
      this.validateFileFormat(file);
      this.validateFileSize(file);
      await this.resizeImageIfNeeded(file);
    }
  }

  private async resizeImageIfNeeded(file: Express.Multer.File): Promise<void> {
    const { width, height } = await sharp(file.buffer).metadata();

    const targetWidth = 150;
    const targetHeight = 150;

    if (width !== targetWidth || height !== targetHeight) {
      file.buffer = await this.resizeImage(
        file.buffer,
        targetWidth,
        targetHeight,
      );
    }
  }

  private async resizeImage(
    fileBuffer: Buffer,
    targetWidth: number,
    targetHeight: number,
  ): Promise<Buffer> {
    return await sharp(fileBuffer)
      .resize({
        width: targetWidth,
        height: targetHeight,
        fit: 'cover',
      })
      .toBuffer();
  }

  private validateFileFormat(file: Express.Multer.File): void {
    const allowedFormats = ['image/jpeg', 'image/png', 'image/gif'];

    if (!allowedFormats.includes(file.mimetype)) {
      throw new BadRequestException('Invalid avatar file format.');
    }
  }

  private validateFileSize(file: Express.Multer.File): void {
    const maxSize = 2 * 1024 * 1024; // 2 MB

    if (file.size > maxSize) {
      throw new BadRequestException('Avatar file size exceeds 2MB.');
    }
  }
}
