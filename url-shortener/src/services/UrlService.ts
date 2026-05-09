import { nanoid } from 'nanoid';
import { UrlRepository } from '../repositories/UrlRepository';
import { UrlValidator } from '../utils/UrlValidator';

export class InvalidUrlException extends Error {
  constructor() {
    super('InvalidUrlException');
    this.name = 'InvalidUrlException';
  }
}

export class NotFoundException extends Error {
  constructor() {
    super('NotFoundException');
    this.name = 'NotFoundException';
  }
}

export class ExpiredException extends Error {
  constructor() {
    super('ExpiredException');
    this.name = 'ExpiredException';
  }
}

const SHORT_ID_LENGTH = 8;
const TTL_MS = 24 * 60 * 60 * 1000;

export class UrlService {
  constructor(private repository: UrlRepository) {}

  async shortenUrl(originalUrl: string): Promise<string> {
    // Validate URL
    if (!UrlValidator.isValid(originalUrl)) {
      throw new InvalidUrlException();
    }

    // Check if already exists
    const existing = await this.repository.findByOriginalUrl(originalUrl);
    if (existing) {
      return existing.id;
    }

    // Create new
    const id = nanoid(SHORT_ID_LENGTH);
    await this.repository.save({
      id,
      originalUrl,
      createdAt: Date.now(),
      accessCount: 0,
    });

    return id;
  }

  async getOriginalUrl(shortId: string): Promise<string> {
    const record = await this.repository.findById(shortId);
    if (!record) {
      throw new NotFoundException();
    }

    // Check TTL
    if (Date.now() - record.createdAt > TTL_MS) {
      throw new ExpiredException();
    }

    await this.repository.incrementAccessCount(shortId);
    return record.originalUrl;
  }
}
