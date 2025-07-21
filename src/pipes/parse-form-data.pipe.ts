import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class MultipartValidationPipe implements PipeTransform {
  constructor(private readonly DTOClass: any) {}

  async transform(value: any) {
    const dtoObject = plainToInstance(this.DTOClass, value);

    const errors = await validate(dtoObject, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }

    return dtoObject;
  }
}
