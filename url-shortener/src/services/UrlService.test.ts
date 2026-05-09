import { UrlService } from './UrlService';
import { InMemoryUrlRepository } from '../repositories/UrlRepository';

describe('UrlService', () => {
  let repository: InMemoryUrlRepository;
  let service: UrlService;

  beforeEach(() => {
    repository = new InMemoryUrlRepository();
    service = new UrlService(repository);
  });

  describe('shortenUrl', () => {
    it('should generate a short key for a new valid URL', async () => {
      const url = 'https://google.com';
      const shortId = await service.shortenUrl(url);
      expect(shortId.length).toBeGreaterThan(0);

      const record = await repository.findById(shortId);
      expect(record?.originalUrl).toBe(url);
      expect(record?.accessCount).toBe(0);
    });

    it('should throw InvalidUrlException for an invalid URL', async () => {
      await expect(service.shortenUrl('invalid-url')).rejects.toThrow('InvalidUrlException');
    });

    it('should return the existing short key if the URL was already shortened', async () => {
      const url = 'https://google.com';
      const firstId = await service.shortenUrl(url);
      const secondId = await service.shortenUrl(url);
      expect(firstId).toBe(secondId);
    });
  });

  describe('getOriginalUrl', () => {
    it('should return the original URL and increment access count', async () => {
      const url = 'https://google.com';
      const shortId = await service.shortenUrl(url);

      const originalUrl = await service.getOriginalUrl(shortId);
      expect(originalUrl).toBe(url);

      const record = await repository.findById(shortId);
      expect(record?.accessCount).toBe(1);
    });

    it('should throw NotFoundException for non-existent short key', async () => {
      await expect(service.getOriginalUrl('non-existent')).rejects.toThrow('NotFoundException');
    });

    it('should throw ExpiredException for a short key older than 24 hours', async () => {
      jest.useFakeTimers();
      
      const url = 'https://google.com';
      const shortId = await service.shortenUrl(url);

      // Advance time by 24 hours + 1 second
      jest.advanceTimersByTime(24 * 60 * 60 * 1000 + 1000);

      await expect(service.getOriginalUrl(shortId)).rejects.toThrow('ExpiredException');

      jest.useRealTimers();
    });
  });
});
