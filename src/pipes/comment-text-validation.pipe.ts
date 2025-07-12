import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { CreateCommentDto } from '../modules/comment/dto/create-comment.dto';

@Injectable()
export class CommentTextValidationPipe
  implements PipeTransform<CreateCommentDto>
{
  transform(
    data: CreateCommentDto,
    metadata: ArgumentMetadata,
  ): CreateCommentDto {
    if (metadata.type === 'body' && metadata.metatype === CreateCommentDto) {
      this.validateCreateCommentDto(data);
    }

    return data;
  }

  private validateCreateCommentDto(data: CreateCommentDto) {
    if (!data || typeof data !== 'object') {
      throw new BadRequestException('Invalid data for CreateCommentDto.');
    }

    const allowedTags = new Set(['a', 'code', 'i', 'strong']);
    const tagStack: string[] = [];
    const tagRegex = /<\/?\w+\s*[^>]*>/g;
    const tags = data.text.match(tagRegex) || [];

    for (const tag of tags) {
      const tagNameMatch = tag.match(/<\/?(\w+)/);
      const tagName = tagNameMatch ? tagNameMatch[1].toLowerCase() : '';

      if (!allowedTags.has(tagName)) {
        console.log('в allowedTags');
        throw new BadRequestException(`Disallowed tag <${tagName}> found.`);
      }

      if (tag.startsWith('</')) {
        if (tagStack.pop() !== tagName) {
          throw new BadRequestException('Mismatched closing tag.');
        }
      } else {
        tagStack.push(tagName);
      }
    }

    if (tagStack.length > 0) {
      throw new BadRequestException('Unclosed HTML tags detected.');
    }
  }
}
