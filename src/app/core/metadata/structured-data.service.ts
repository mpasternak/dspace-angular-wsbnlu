import { Injectable } from '@angular/core';
import { Item } from '../shared/item.model';
import { Collection } from '../shared/collection.model';
import { DSpaceObject } from '../shared/dspace-object.model';
import { hasValue } from '../../shared/empty.util';
import { Bitstream } from '../shared/bitstream.model';

/**
 * Service for generating schema.org structured data in JSON-LD format
 * for DSpace objects (Items and Collections) to improve SEO
 */
@Injectable({
  providedIn: 'root'
})
export class StructuredDataService {

  /**
   * Mapping of DSpace dc.type values to schema.org types
   */
  private readonly typeMapping: { [key: string]: string } = {
    'article': 'ScholarlyArticle',
    'journal article': 'ScholarlyArticle',
    'research article': 'ScholarlyArticle',
    'thesis': 'Thesis',
    'dissertation': 'Thesis',
    'book': 'Book',
    'book chapter': 'Chapter',
    'dataset': 'Dataset',
    'data': 'Dataset',
    'software': 'SoftwareSourceCode',
    'code': 'SoftwareSourceCode',
    'image': 'ImageObject',
    'photograph': 'ImageObject',
    'video': 'VideoObject',
    'audio': 'AudioObject',
    'presentation': 'PresentationDigitalDocument',
    'poster': 'CreativeWork',
    'conference paper': 'ScholarlyArticle',
    'conference proceeding': 'ScholarlyArticle',
    'preprint': 'ScholarlyArticle',
    'working paper': 'ScholarlyArticle',
    'technical report': 'Report',
    'report': 'Report',
    'patent': 'CreativeWork',
    'map': 'Map',
    'learning object': 'Course',
    'lecture': 'CreativeWork',
    'musical composition': 'MusicComposition'
  };

  constructor() { }

  /**
   * Generate JSON-LD structured data for an Item
   * @param item The Item object
   * @param currentUrl The current page URL
   * @param thumbnailUrl Optional thumbnail URL
   * @param pdfUrl Optional PDF URL (usually from citation_pdf_url)
   * @returns JSON-LD string
   */
  public generateItemStructuredData(
    item: Item,
    currentUrl: string,
    thumbnailUrl?: string,
    pdfUrl?: string
  ): string {
    if (!item) {
      return '';
    }

    const schemaType = this.determineSchemaType(item);
    const structuredData = this.buildItemStructuredData(item, schemaType, currentUrl, thumbnailUrl, pdfUrl);

    // Clean undefined/null values and return JSON string
    const cleaned = this.cleanObject(structuredData);
    return JSON.stringify(cleaned, null, 2);
  }

  /**
   * Generate JSON-LD structured data for a Collection
   * @param collection The Collection object
   * @param currentUrl The current page URL
   * @param itemCount Optional count of items in collection
   * @returns JSON-LD string
   */
  public generateCollectionStructuredData(
    collection: Collection,
    currentUrl: string,
    itemCount?: number
  ): string {
    if (!collection) {
      return '';
    }

    const structuredData = this.buildCollectionStructuredData(collection, currentUrl, itemCount);

    // Clean undefined/null values and return JSON string
    const cleaned = this.cleanObject(structuredData);
    return JSON.stringify(cleaned, null, 2);
  }

  /**
   * Determine the appropriate schema.org type based on dc.type metadata
   * @param item The Item to analyze
   * @returns schema.org type string
   */
  private determineSchemaType(item: Item): string {
    const dcType = item.firstMetadataValue('dc.type');

    if (!hasValue(dcType)) {
      return 'CreativeWork';
    }

    const normalizedType = dcType.toLowerCase().trim();

    // Check for exact matches
    if (this.typeMapping[normalizedType]) {
      return this.typeMapping[normalizedType];
    }

    // Check for partial matches
    for (const [key, value] of Object.entries(this.typeMapping)) {
      if (normalizedType.includes(key)) {
        return value;
      }
    }

    // Default fallback
    return 'CreativeWork';
  }

  /**
   * Build the structured data object for an Item
   */
  private buildItemStructuredData(
    item: Item,
    schemaType: string,
    currentUrl: string,
    thumbnailUrl?: string,
    pdfUrl?: string
  ): any {
    const structuredData: any = {
      '@context': 'https://schema.org',
      '@type': schemaType
    };

    // Title/Name
    const title = item.firstMetadataValue('dc.title');
    if (hasValue(title)) {
      structuredData.name = title;
      if (schemaType === 'ScholarlyArticle') {
        structuredData.headline = title;
      }
    }

    // Authors/Creators
    const authors = this.buildAuthors(item);
    if (authors.length > 0) {
      if (schemaType === 'Dataset' || schemaType === 'SoftwareSourceCode') {
        structuredData.creator = authors;
      } else {
        structuredData.author = authors;
      }
    }

    // Publication Date
    const datePublished = item.firstMetadataValue(['dc.date.issued', 'dc.date.available', 'dc.date.accessioned']);
    if (hasValue(datePublished)) {
      structuredData.datePublished = this.formatDate(datePublished);
    }

    // Modified Date
    if (item.lastModified) {
      structuredData.dateModified = this.formatDate(item.lastModified.toString());
    }

    // Publisher
    const publisher = item.firstMetadataValue('dc.publisher');
    if (hasValue(publisher)) {
      structuredData.publisher = {
        '@type': 'Organization',
        name: publisher
      };
    }

    // Description/Abstract
    const abstract = item.firstMetadataValue('dc.description.abstract');
    const description = item.firstMetadataValue('dc.description');
    if (hasValue(abstract)) {
      structuredData.abstract = abstract;
      structuredData.description = abstract;
    } else if (hasValue(description)) {
      structuredData.description = description;
    }

    // Keywords/Subjects
    const subjects = item.allMetadataValues('dc.subject');
    if (subjects.length > 0) {
      structuredData.keywords = subjects.join(', ');
    }

    // Language
    const language = item.firstMetadataValue(['dc.language', 'dc.language.iso']);
    if (hasValue(language)) {
      structuredData.inLanguage = this.normalizeLanguageCode(language);
    }

    // Identifiers
    const identifiers = this.buildIdentifiers(item, currentUrl);
    if (identifiers.length > 0) {
      structuredData.identifier = identifiers.length === 1 ? identifiers[0] : identifiers;
    }

    // URL
    structuredData.url = currentUrl;

    // Thumbnail
    if (hasValue(thumbnailUrl)) {
      structuredData.thumbnailUrl = thumbnailUrl;
      structuredData.image = thumbnailUrl;
    }

    // License/Rights
    const license = item.firstMetadataValue(['dc.rights.license', 'dc.rights', 'dc.rights.uri']);
    if (hasValue(license)) {
      structuredData.license = license;
    }

    // Special handling for specific types
    this.addTypeSpecificProperties(structuredData, item, schemaType, pdfUrl);

    // Is Part Of (Collection) - skip for now as owningCollection is an Observable
    // We could add this later with async handling if needed

    return structuredData;
  }

  /**
   * Build the structured data object for a Collection
   */
  private buildCollectionStructuredData(
    collection: Collection,
    currentUrl: string,
    itemCount?: number
  ): any {
    const structuredData: any = {
      '@context': 'https://schema.org',
      '@type': 'Collection'  // Can be changed to DataCatalog if needed
    };

    // Name
    if (hasValue(collection.name)) {
      structuredData.name = collection.name;
    }

    // Description
    if (hasValue(collection.shortDescription)) {
      structuredData.description = collection.shortDescription;
    } else if (hasValue(collection.introductoryText)) {
      structuredData.description = collection.introductoryText;
    }

    // URL
    structuredData.url = currentUrl;

    // Identifier (handle)
    if (hasValue(collection.handle)) {
      structuredData.identifier = collection.handle;
    }

    // Number of items
    if (hasValue(itemCount)) {
      structuredData.numberOfItems = itemCount;
    } else if (hasValue(collection.archivedItemsCount)) {
      structuredData.numberOfItems = collection.archivedItemsCount;
    }

    // License/Rights
    if (hasValue(collection.copyrightText)) {
      structuredData.license = collection.copyrightText;
    } else if (hasValue(collection.license)) {
      structuredData.license = collection.license;
    }

    // Parent Community - skip for now as parentCommunity is an Observable
    // We could add this later with async handling if needed

    // Logo/Image - skip for now as logo is an Observable
    // We could add this later with async handling if needed

    return structuredData;
  }

  /**
   * Build authors array for structured data
   */
  private buildAuthors(item: Item): any[] {
    const authorFields = ['dc.author', 'dc.contributor.author', 'dc.creator'];
    const authors = item.allMetadataValues(authorFields);

    return authors.map(author => ({
      '@type': 'Person',
      name: author
    }));
  }

  /**
   * Build identifiers array for structured data
   */
  private buildIdentifiers(item: Item, currentUrl: string): any[] {
    const identifiers: any[] = [];

    // Handle/URI
    const handle = item.firstMetadataValue('dc.identifier.uri');
    if (hasValue(handle)) {
      identifiers.push(handle);
    }

    // DOI
    const doi = item.firstMetadataValue('dc.identifier.doi');
    if (hasValue(doi)) {
      const doiUrl = doi.startsWith('http') ? doi : `https://doi.org/${doi}`;
      identifiers.push({
        '@type': 'PropertyValue',
        '@id': doiUrl,
        propertyID: 'DOI',
        value: doi.replace(/^https?:\/\/doi\.org\//, '')
      });
    }

    // ISBN
    const isbn = item.firstMetadataValue('dc.identifier.isbn');
    if (hasValue(isbn)) {
      identifiers.push({
        '@type': 'PropertyValue',
        propertyID: 'ISBN',
        value: isbn
      });
    }

    // ISSN
    const issn = item.firstMetadataValue('dc.identifier.issn');
    if (hasValue(issn)) {
      identifiers.push({
        '@type': 'PropertyValue',
        propertyID: 'ISSN',
        value: issn
      });
    }

    // UUID
    if (hasValue(item.uuid)) {
      identifiers.push({
        '@type': 'PropertyValue',
        propertyID: 'UUID',
        value: item.uuid
      });
    }

    return identifiers;
  }

  /**
   * Add type-specific properties based on schema type
   */
  private addTypeSpecificProperties(
    structuredData: any,
    item: Item,
    schemaType: string,
    pdfUrl?: string
  ): void {
    switch (schemaType) {
      case 'ScholarlyArticle':
        // Add journal information
        const journal = item.firstMetadataValue('dc.source');
        if (hasValue(journal)) {
          structuredData.isPartOf = {
            '@type': 'PublicationIssue',
            name: journal
          };
        }
        // Add PDF as encoding
        if (hasValue(pdfUrl)) {
          structuredData.encoding = {
            '@type': 'MediaObject',
            contentUrl: pdfUrl,
            encodingFormat: 'application/pdf'
          };
        }
        break;

      case 'Thesis':
        // Add degree information
        const degree = item.firstMetadataValue('thesis.degree.name');
        if (hasValue(degree)) {
          structuredData.inSupportOf = degree;
        }
        // Add institution
        const institution = item.firstMetadataValue(['thesis.degree.grantor', 'dc.publisher']);
        if (hasValue(institution)) {
          structuredData.publisher = {
            '@type': 'EducationalOrganization',
            name: institution
          };
        }
        break;

      case 'Book':
        // Add ISBN if not already in identifiers
        const bookIsbn = item.firstMetadataValue('dc.identifier.isbn');
        if (hasValue(bookIsbn) && !structuredData.isbn) {
          structuredData.isbn = bookIsbn;
        }
        // Add number of pages
        const pages = item.firstMetadataValue('dc.format.extent');
        if (hasValue(pages)) {
          structuredData.numberOfPages = pages;
        }
        break;

      case 'Dataset':
        // Add distribution/download information
        if (hasValue(pdfUrl) || item.bundles) {
          const distributions: any[] = [];
          if (hasValue(pdfUrl)) {
            distributions.push({
              '@type': 'DataDownload',
              encodingFormat: 'application/pdf',
              contentUrl: pdfUrl
            });
          }
          if (distributions.length > 0) {
            structuredData.distribution = distributions;
          }
        }
        // Add spatial coverage
        const spatial = item.firstMetadataValue('dc.coverage.spatial');
        if (hasValue(spatial)) {
          structuredData.spatialCoverage = spatial;
        }
        // Add temporal coverage
        const temporal = item.firstMetadataValue('dc.coverage.temporal');
        if (hasValue(temporal)) {
          structuredData.temporalCoverage = temporal;
        }
        break;

      case 'SoftwareSourceCode':
        // Add programming language
        const progLang = item.firstMetadataValue(['dc.format', 'dc.type']);
        if (hasValue(progLang) && progLang.toLowerCase().includes('python')) {
          structuredData.programmingLanguage = 'Python';
        }
        // Add code repository
        const repo = item.firstMetadataValue('dc.identifier.uri');
        if (hasValue(repo) && (repo.includes('github') || repo.includes('gitlab'))) {
          structuredData.codeRepository = repo;
        }
        break;

      case 'ImageObject':
      case 'VideoObject':
      case 'AudioObject':
        // Add media-specific properties
        if (hasValue(pdfUrl)) {
          structuredData.contentUrl = pdfUrl;
        }
        const format = item.firstMetadataValue('dc.format.mimetype');
        if (hasValue(format)) {
          structuredData.encodingFormat = format;
        }
        break;
    }
  }

  /**
   * Normalize language codes to BCP 47 format
   */
  private normalizeLanguageCode(language: string): string {
    if (!language) {
      return language;
    }

    // If already in format like 'en', 'pl', etc., return as is
    if (language.length === 2) {
      return language.toLowerCase();
    }

    // If in format like 'en_US', convert to 'en-US'
    if (language.includes('_')) {
      return language.replace('_', '-');
    }

    // If it's a full language name, try to extract code
    const langMap: { [key: string]: string } = {
      'english': 'en',
      'polish': 'pl',
      'german': 'de',
      'french': 'fr',
      'spanish': 'es',
      'italian': 'it',
      'portuguese': 'pt',
      'russian': 'ru',
      'chinese': 'zh',
      'japanese': 'ja',
      'korean': 'ko'
    };

    const normalized = language.toLowerCase();
    return langMap[normalized] || language;
  }

  /**
   * Format date to ISO 8601 format
   */
  private formatDate(dateString: string): string {
    if (!dateString) {
      return dateString;
    }

    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
      }
    } catch (e) {
      // If parsing fails, return original string
    }

    return dateString;
  }

  /**
   * Remove undefined, null, and empty string values from object
   */
  private cleanObject(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.cleanObject(item))
        .filter(item => item !== undefined && item !== null && item !== '');
    }

    if (obj !== null && typeof obj === 'object') {
      return Object.entries(obj)
        .reduce((acc, [key, value]) => {
          const cleanedValue = this.cleanObject(value);
          if (cleanedValue !== undefined && cleanedValue !== null && cleanedValue !== '' &&
              !(Array.isArray(cleanedValue) && cleanedValue.length === 0)) {
            acc[key] = cleanedValue;
          }
          return acc;
        }, {} as any);
    }

    return obj;
  }
}