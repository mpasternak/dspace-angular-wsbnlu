import { TestBed } from '@angular/core/testing';
import { StructuredDataService } from './structured-data.service';
import { Item } from '../shared/item.model';
import { Collection } from '../shared/collection.model';

describe('StructuredDataService', () => {
  let service: StructuredDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StructuredDataService]
    });
    service = TestBed.inject(StructuredDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('generateItemStructuredData', () => {
    it('should generate JSON-LD for a basic item', () => {
      const mockItem = Object.assign(new Item(), {
        uuid: 'test-uuid-123',
        metadata: {
          'dc.title': [{ value: 'Test Article Title' }],
          'dc.author': [{ value: 'Smith, John' }],
          'dc.date.issued': [{ value: '2024-01-15' }],
          'dc.description.abstract': [{ value: 'This is a test abstract' }],
          'dc.subject': [{ value: 'Testing' }, { value: 'Research' }],
          'dc.type': [{ value: 'Article' }]
        },
        firstMetadataValue: (key: string | string[]) => {
          const keys = Array.isArray(key) ? key : [key];
          for (const k of keys) {
            if (mockItem.metadata[k] && mockItem.metadata[k].length > 0) {
              return mockItem.metadata[k][0].value;
            }
          }
          return null;
        },
        allMetadataValues: (keys: string[]) => {
          const values: string[] = [];
          for (const key of keys) {
            if (mockItem.metadata[key]) {
              values.push(...mockItem.metadata[key].map((m: any) => m.value));
            }
          }
          return values;
        },
        hasMetadata: () => false
      });

      const currentUrl = 'https://example.com/items/test-uuid-123';
      const result = service.generateItemStructuredData(mockItem, currentUrl);

      expect(result).toBeTruthy();
      expect(result).toContain('"@context": "https://schema.org"');
      expect(result).toContain('"@type": "ScholarlyArticle"');
      expect(result).toContain('Test Article Title');
      expect(result).toContain('Smith, John');
      expect(result).toContain('This is a test abstract');
    });

    it('should handle item with no metadata gracefully', () => {
      const mockItem = Object.assign(new Item(), {
        uuid: 'test-uuid-456',
        metadata: {},
        firstMetadataValue: () => null,
        allMetadataValues: () => [],
        hasMetadata: () => false
      });

      const currentUrl = 'https://example.com/items/test-uuid-456';
      const result = service.generateItemStructuredData(mockItem, currentUrl);

      expect(result).toBeTruthy();
      expect(result).toContain('"@context": "https://schema.org"');
      expect(result).toContain('"@type": "CreativeWork"'); // Default type
    });

    it('should map thesis type correctly', () => {
      const mockItem = Object.assign(new Item(), {
        uuid: 'test-uuid-789',
        metadata: {
          'dc.title': [{ value: 'Test Thesis' }],
          'dc.type': [{ value: 'Thesis' }]
        },
        firstMetadataValue: (key: string | string[]) => {
          const keys = Array.isArray(key) ? key : [key];
          for (const k of keys) {
            if (mockItem.metadata[k] && mockItem.metadata[k].length > 0) {
              return mockItem.metadata[k][0].value;
            }
          }
          return null;
        },
        allMetadataValues: () => [],
        hasMetadata: () => false
      });

      const currentUrl = 'https://example.com/items/test-uuid-789';
      const result = service.generateItemStructuredData(mockItem, currentUrl);

      expect(result).toBeTruthy();
      expect(result).toContain('"@type": "Thesis"');
    });
  });

  describe('generateCollectionStructuredData', () => {
    it('should generate JSON-LD for a collection', () => {
      const mockCollection = Object.assign(new Collection(), {
        uuid: 'collection-uuid-123',
        handle: 'hdl:123456/789',
        name: 'Test Collection',
        shortDescription: 'A test collection for unit tests',
        archivedItemsCount: 42
      });

      const currentUrl = 'https://example.com/collections/collection-uuid-123';
      const result = service.generateCollectionStructuredData(mockCollection, currentUrl);

      expect(result).toBeTruthy();
      expect(result).toContain('"@context": "https://schema.org"');
      expect(result).toContain('"@type": "Collection"');
      expect(result).toContain('Test Collection');
      expect(result).toContain('A test collection for unit tests');
      expect(result).toContain('"numberOfItems": 42');
    });

    it('should handle collection with minimal metadata', () => {
      const mockCollection = Object.assign(new Collection(), {
        uuid: 'collection-uuid-456',
        name: 'Minimal Collection'
      });

      const currentUrl = 'https://example.com/collections/collection-uuid-456';
      const result = service.generateCollectionStructuredData(mockCollection, currentUrl);

      expect(result).toBeTruthy();
      expect(result).toContain('"@context": "https://schema.org"');
      expect(result).toContain('"@type": "Collection"');
      expect(result).toContain('Minimal Collection');
    });
  });

  describe('type mapping', () => {
    it('should map dataset type correctly', () => {
      const mockItem = Object.assign(new Item(), {
        uuid: 'test-dataset',
        metadata: {
          'dc.title': [{ value: 'Test Dataset' }],
          'dc.type': [{ value: 'Dataset' }]
        },
        firstMetadataValue: (key: string | string[]) => {
          const keys = Array.isArray(key) ? key : [key];
          for (const k of keys) {
            if (mockItem.metadata[k] && mockItem.metadata[k].length > 0) {
              return mockItem.metadata[k][0].value;
            }
          }
          return null;
        },
        allMetadataValues: () => [],
        hasMetadata: () => false
      });

      const result = service.generateItemStructuredData(mockItem, 'https://example.com/items/test-dataset');
      expect(result).toContain('"@type": "Dataset"');
    });

    it('should map software type correctly', () => {
      const mockItem = Object.assign(new Item(), {
        uuid: 'test-software',
        metadata: {
          'dc.title': [{ value: 'Test Software' }],
          'dc.type': [{ value: 'Software' }]
        },
        firstMetadataValue: (key: string | string[]) => {
          const keys = Array.isArray(key) ? key : [key];
          for (const k of keys) {
            if (mockItem.metadata[k] && mockItem.metadata[k].length > 0) {
              return mockItem.metadata[k][0].value;
            }
          }
          return null;
        },
        allMetadataValues: () => [],
        hasMetadata: () => false
      });

      const result = service.generateItemStructuredData(mockItem, 'https://example.com/items/test-software');
      expect(result).toContain('"@type": "SoftwareSourceCode"');
    });
  });
});
