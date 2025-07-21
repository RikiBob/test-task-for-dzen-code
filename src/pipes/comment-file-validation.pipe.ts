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
    if (metadata.type === 'custom' && file) {
      await this.validateFile(file);
    }
    return file;
  }

  private async validateFile(file: Express.Multer.File): Promise<void> {
    this.validateFileFormat(file);
    this.validateTextFileSize(file);

    if (file.mimetype !== 'text/plain') {
      await this.validateAndResizeImage(file);
    }
  }

  private validateFileFormat(file: Express.Multer.File): void {
    const allowedFormats = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain',
    ];

    if (!allowedFormats.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file format.');
    }
  }

  private validateTextFileSize(file: Express.Multer.File): void {
    const maxSize = 100 * 1024;

    if (file.mimetype === 'text/plain' && file.size > maxSize) {
      throw new BadRequestException(
        'Text file size exceeds the limit of 100 KB.',
      );
    }
  }

  private async validateAndResizeImage(
    file: Express.Multer.File,
  ): Promise<void> {
    const metadata = await sharp(file.buffer).metadata();

    const targetWidth = 320;
    const targetHeight = 240;

    if (metadata.width !== targetWidth || metadata.height !== targetHeight) {
      file.buffer = await this.resizeImage(
        file.buffer,
        targetWidth,
        targetHeight,
        file.mimetype,
      );
      file.size = file.buffer.length;
    }
  }

  private async resizeImage(
    fileBuffer: Buffer,
    targetWidth: number,
    targetHeight: number,
    mimetype: string,
  ): Promise<Buffer> {
    const image = sharp(fileBuffer).resize({
      width: targetWidth,
      height: targetHeight,
      fit: 'cover',
      position: 'centre',
    });

    if (mimetype === 'image/jpeg') {
      return await image.jpeg({ quality: 85 }).toBuffer();
    } else if (mimetype === 'image/png') {
      return await image.png({ compressionLevel: 9 }).toBuffer();
    } else if (mimetype === 'image/gif') {
      return await image.toBuffer();
    }

    return fileBuffer;
  }
}
