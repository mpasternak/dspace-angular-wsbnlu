/**
 * TypeScript interfaces for schema.org structured data types
 * Used for generating JSON-LD structured data for SEO
 */

/**
 * Base schema.org Thing type
 */
export interface SchemaOrgThing {
  '@context'?: string;
  '@type': string;
  '@id'?: string;
  name?: string;
  description?: string;
  url?: string;
  identifier?: string | SchemaOrgPropertyValue | (string | SchemaOrgPropertyValue)[];
  image?: string | SchemaOrgImageObject;
  sameAs?: string | string[];
}

/**
 * PropertyValue for identifiers
 */
export interface SchemaOrgPropertyValue {
  '@type': 'PropertyValue';
  '@id'?: string;
  propertyID: string;
  value: string;
}

/**
 * Person type for authors/creators
 */
export interface SchemaOrgPerson {
  '@type': 'Person';
  name: string;
  givenName?: string;
  familyName?: string;
  affiliation?: SchemaOrgOrganization;
  identifier?: string | SchemaOrgPropertyValue;
  url?: string;
}

/**
 * Organization type
 */
export interface SchemaOrgOrganization {
  '@type': 'Organization' | 'EducationalOrganization';
  name: string;
  url?: string;
  logo?: string;
  identifier?: string;
}

/**
 * CreativeWork - base type for most content
 */
export interface SchemaOrgCreativeWork extends SchemaOrgThing {
  '@type': 'CreativeWork' | string;
  author?: SchemaOrgPerson | SchemaOrgPerson[] | SchemaOrgOrganization | SchemaOrgOrganization[];
  creator?: SchemaOrgPerson | SchemaOrgPerson[] | SchemaOrgOrganization | SchemaOrgOrganization[];
  datePublished?: string;
  dateModified?: string;
  dateCreated?: string;
  publisher?: SchemaOrgOrganization;
  inLanguage?: string;
  keywords?: string;
  license?: string;
  isPartOf?: SchemaOrgCreativeWork | SchemaOrgCollection;
  hasPart?: SchemaOrgCreativeWork | SchemaOrgCreativeWork[];
  abstract?: string;
  thumbnailUrl?: string;
  contentUrl?: string;
  encodingFormat?: string;
  encoding?: SchemaOrgMediaObject | SchemaOrgMediaObject[];
}

/**
 * ScholarlyArticle type
 */
export interface SchemaOrgScholarlyArticle extends SchemaOrgCreativeWork {
  '@type': 'ScholarlyArticle';
  headline?: string;
  pageStart?: string;
  pageEnd?: string;
  pagination?: string;
  issn?: string;
  isPartOf?: SchemaOrgPublicationIssue | SchemaOrgPublicationVolume;
}

/**
 * PublicationIssue for journal articles
 */
export interface SchemaOrgPublicationIssue {
  '@type': 'PublicationIssue';
  name?: string;
  issueNumber?: string;
  isPartOf?: SchemaOrgPublicationVolume;
}

/**
 * PublicationVolume for journal articles
 */
export interface SchemaOrgPublicationVolume {
  '@type': 'PublicationVolume';
  name?: string;
  volumeNumber?: string;
  isPartOf?: SchemaOrgPeriodical;
}

/**
 * Periodical for journals
 */
export interface SchemaOrgPeriodical {
  '@type': 'Periodical';
  name: string;
  issn?: string;
  publisher?: SchemaOrgOrganization;
}

/**
 * Thesis type
 */
export interface SchemaOrgThesis extends SchemaOrgCreativeWork {
  '@type': 'Thesis';
  inSupportOf?: string; // Degree name
  publisher?: SchemaOrgOrganization; // University/Institution
}

/**
 * Book type
 */
export interface SchemaOrgBook extends SchemaOrgCreativeWork {
  '@type': 'Book';
  isbn?: string;
  numberOfPages?: string | number;
  bookEdition?: string;
  bookFormat?: string;
}

/**
 * Chapter type (for book chapters)
 */
export interface SchemaOrgChapter extends SchemaOrgCreativeWork {
  '@type': 'Chapter';
  pageStart?: string;
  pageEnd?: string;
  pagination?: string;
  isPartOf?: SchemaOrgBook;
}

/**
 * Dataset type
 */
export interface SchemaOrgDataset extends SchemaOrgCreativeWork {
  '@type': 'Dataset';
  distribution?: SchemaOrgDataDownload | SchemaOrgDataDownload[];
  spatialCoverage?: string;
  temporalCoverage?: string;
  variableMeasured?: string | string[];
  measurementTechnique?: string;
}

/**
 * DataDownload for dataset distributions
 */
export interface SchemaOrgDataDownload {
  '@type': 'DataDownload';
  encodingFormat: string;
  contentUrl: string;
  contentSize?: string;
}

/**
 * SoftwareSourceCode type
 */
export interface SchemaOrgSoftwareSourceCode extends SchemaOrgCreativeWork {
  '@type': 'SoftwareSourceCode';
  codeRepository?: string;
  programmingLanguage?: string | SchemaOrgComputerLanguage;
  runtimePlatform?: string;
  targetProduct?: string;
  softwareVersion?: string;
}

/**
 * ComputerLanguage type
 */
export interface SchemaOrgComputerLanguage {
  '@type': 'ComputerLanguage';
  name: string;
}

/**
 * ImageObject type
 */
export interface SchemaOrgImageObject extends SchemaOrgCreativeWork {
  '@type': 'ImageObject';
  contentUrl?: string;
  caption?: string;
  exifData?: string;
  representativeOfPage?: boolean;
}

/**
 * VideoObject type
 */
export interface SchemaOrgVideoObject extends SchemaOrgCreativeWork {
  '@type': 'VideoObject';
  contentUrl?: string;
  duration?: string; // ISO 8601 duration
  uploadDate?: string;
  transcript?: string;
}

/**
 * AudioObject type
 */
export interface SchemaOrgAudioObject extends SchemaOrgCreativeWork {
  '@type': 'AudioObject';
  contentUrl?: string;
  duration?: string; // ISO 8601 duration
  transcript?: string;
}

/**
 * MediaObject base type
 */
export interface SchemaOrgMediaObject extends SchemaOrgCreativeWork {
  '@type': 'MediaObject' | 'ImageObject' | 'VideoObject' | 'AudioObject';
  contentUrl?: string;
  contentSize?: string;
  encodingFormat?: string;
  duration?: string;
}

/**
 * Collection type
 */
export interface SchemaOrgCollection extends SchemaOrgCreativeWork {
  '@type': 'Collection';
  numberOfItems?: number;
  hasPart?: SchemaOrgCreativeWork | SchemaOrgCreativeWork[];
  isPartOf?: SchemaOrgOrganization | SchemaOrgCollection;
}

/**
 * DataCatalog type (alternative to Collection for datasets)
 */
export interface SchemaOrgDataCatalog extends SchemaOrgCreativeWork {
  '@type': 'DataCatalog';
  dataset?: SchemaOrgDataset | SchemaOrgDataset[];
  numberOfItems?: number;
  provider?: SchemaOrgOrganization;
}

/**
 * Report type
 */
export interface SchemaOrgReport extends SchemaOrgCreativeWork {
  '@type': 'Report';
  reportNumber?: string;
  publisher?: SchemaOrgOrganization;
}

/**
 * Map type
 */
export interface SchemaOrgMap extends SchemaOrgCreativeWork {
  '@type': 'Map';
  mapType?: string;
}

/**
 * MusicComposition type
 */
export interface SchemaOrgMusicComposition extends SchemaOrgCreativeWork {
  '@type': 'MusicComposition';
  composer?: SchemaOrgPerson | SchemaOrgOrganization;
  lyricist?: SchemaOrgPerson;
  musicArrangement?: SchemaOrgMusicComposition;
}

/**
 * Course type (for learning objects)
 */
export interface SchemaOrgCourse extends SchemaOrgCreativeWork {
  '@type': 'Course';
  courseCode?: string;
  coursePrerequisites?: string | SchemaOrgCourse;
  educationalCredentialAwarded?: string;
  provider?: SchemaOrgOrganization;
}

/**
 * PresentationDigitalDocument type
 */
export interface SchemaOrgPresentationDigitalDocument extends SchemaOrgCreativeWork {
  '@type': 'PresentationDigitalDocument';
}

/**
 * BreadcrumbList for navigation
 */
export interface SchemaOrgBreadcrumbList {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: SchemaOrgListItem[];
}

/**
 * ListItem for breadcrumbs
 */
export interface SchemaOrgListItem {
  '@type': 'ListItem';
  position: number;
  name: string;
  item?: string;
}

/**
 * Type mapping configuration
 */
export const SCHEMA_ORG_TYPE_MAP: { [dcType: string]: string } = {
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

/**
 * Helper function to determine schema.org type from dc.type
 */
export function getSchemaOrgType(dcType: string | undefined): string {
  if (!dcType) {
    return 'CreativeWork';
  }

  const normalizedType = dcType.toLowerCase().trim();

  // Check for exact match
  if (SCHEMA_ORG_TYPE_MAP[normalizedType]) {
    return SCHEMA_ORG_TYPE_MAP[normalizedType];
  }

  // Check for partial match
  for (const [key, value] of Object.entries(SCHEMA_ORG_TYPE_MAP)) {
    if (normalizedType.includes(key)) {
      return value;
    }
  }

  // Default fallback
  return 'CreativeWork';
}