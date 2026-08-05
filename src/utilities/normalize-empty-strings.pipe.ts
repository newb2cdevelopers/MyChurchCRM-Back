import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';

function normalizeEmptyStrings(value: unknown): unknown {
  if (typeof value === 'string') return value === '' ? undefined : value;

  if (Array.isArray(value)) return value.map(normalizeEmptyStrings);

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        normalizeEmptyStrings(item),
      ]),
    );
  }

  return value;
}

@Injectable()
export class NormalizeEmptyStringsPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata) {
    if (metadata.type !== 'body') return value;
    return normalizeEmptyStrings(value);
  }
}
