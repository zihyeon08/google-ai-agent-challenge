export type UrlRecord = {
  id: string;            // Short Key
  originalUrl: string;   // 원본 긴 URL
  createdAt: number;     // 생성 시간 (TTL 검증용)
  accessCount: number;   // 접근 횟수
};

export interface UrlRepository {
  save(record: UrlRecord): Promise<void>;
  findById(id: string): Promise<UrlRecord | null>;
  findByOriginalUrl(originalUrl: string): Promise<UrlRecord | null>;
  incrementAccessCount(id: string): Promise<void>;
}

export class InMemoryUrlRepository implements UrlRepository {
  private store: Map<string, UrlRecord> = new Map();

  async save(record: UrlRecord): Promise<void> {
    this.store.set(record.id, { ...record });
  }

  async findById(id: string): Promise<UrlRecord | null> {
    const record = this.store.get(id);
    return record ? { ...record } : null;
  }

  async findByOriginalUrl(originalUrl: string): Promise<UrlRecord | null> {
    for (const record of this.store.values()) {
      if (record.originalUrl === originalUrl) {
        return { ...record };
      }
    }
    return null;
  }

  async incrementAccessCount(id: string): Promise<void> {
    const record = this.store.get(id);
    if (record) {
      record.accessCount += 1;
      this.store.set(id, record);
    }
  }
}

// 싱글톤 인스턴스 (Mock DB)
export const repository = new InMemoryUrlRepository();
