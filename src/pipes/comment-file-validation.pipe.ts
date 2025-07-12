import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import * as sharp from 'sharp';

@Injectable()
export class CommentFileValidationPipe
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
      this.validateTextFileSize(file);
      await this.validateImageResolution(file);
    }
  }

  private async validateImageResolution(
    file: Express.Multer.File,
  ): Promise<void> {
    if (file.mimetype !== 'text/plain') {
      const { width, height } = await sharp(file.buffer).metadata();

      const targetWidth = 320;
      const targetHeight = 240;

      if (width !== targetWidth || height !== targetHeight) {
        file.buffer = await this.resizeImage(
          file.buffer,
          targetWidth,
          targetHeight,
        );
      }
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
        fit: 'fill',
      })
      .toBuffer();
  }

  private validateFileFormat(file: Express.Multer.File): void {
    const allowedFormats = [
      'image/jpeg',
      'image/gif',
      'image/png',
      'text/plain',
    ];

    if (!allowedFormats.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file format.');
    }
  }

  private validateTextFileSize(file: Express.Multer.File): void {
    const maxSize = 100 * 1024;

    if (file.mimetype === 'text/plain' && file.size > maxSize) {
      throw new BadRequestException('Text file size exceeds the limit.');
    }
  }
}
