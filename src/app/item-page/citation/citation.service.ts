import { Injectable } from '@angular/core';
import { Item } from '../../core/shared/item.model';
import { MetadataValue } from '../../core/shared/metadata.models';

// Import citation-js
declare const require: any;
const Cite = require('citation-js');

export interface CitationFormat {
  key: string;
  label: string;
  format: string;
  extension?: string;
  type?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CitationService {

  // Available citation formats
  public readonly formats: CitationFormat[] = [
    { key: 'apa', label: 'APA 7', format: 'bibliography', extension: 'txt', type: 'apa' },
    { key: 'mla', label: 'MLA 9', format: 'bibliography', extension: 'txt', type: 'mla' },
    { key: 'chicago', label: 'Chicago', format: 'bibliography', extension: 'txt', type: 'chicago-note-bibliography' },
    { key: 'harvard', label: 'Harvard', format: 'bibliography', extension: 'txt', type: 'harvard-cite-them-right' },
    { key: 'vancouver', label: 'Vancouver', format: 'bibliography', extension: 'txt', type: 'vancouver' },
    { key: 'ieee', label: 'IEEE', format: 'bibliography', extension: 'txt', type: 'ieee' },
    { key: 'bibtex', label: 'BibTeX', format: 'bibtex', extension: 'bib' },
    { key: 'ris', label: 'RIS', format: 'ris', extension: 'ris' },
  ];

  constructor() { }

  /**
   * Convert DSpace Item metadata to Citation.js compatible format
   * Maps Dublin Core and other metadata fields to CSL-JSON format
   */
  private convertItemToCSLJSON(item: Item): any {
    const metadata = item.metadata;
    const cslData: any = {
      id: item.uuid,
      type: this.determineItemType(metadata),
    };

    // Title
    const title = this.getMetadataValue(metadata, 'dc.title');
    if (title) {
      cslData.title = title;
    }

    // Authors
    const authors = this.getMetadataValues(metadata, ['dc.contributor.author', 'dc.creator']);
    if (authors.length > 0) {
      cslData.author = authors.map(author => this.parseAuthorName(author));
    }

    // Date
    const dateIssued = this.getMetadataValue(metadata, 'dc.date.issued');
    if (dateIssued) {
      cslData.issued = this.parseDate(dateIssued);
    }

    // Publisher
    const publisher = this.getMetadataValue(metadata, 'dc.publisher');
    if (publisher) {
      cslData.publisher = publisher;
    }

    // Journal/Container Title
    const journalTitle = this.getMetadataValue(metadata, 'journal.title');
    if (journalTitle) {
      cslData['container-title'] = journalTitle;
    }

    // ISSN
    const issn = this.getMetadataValue(metadata, ['creativeworkseries.issn', 'journal.identifier.issn']);
    if (issn) {
      cslData.ISSN = issn;
    }

    // Volume
    const volume = this.getMetadataValue(metadata, 'journalvolume.identifier.name');
    if (volume) {
      // Try to extract just the volume number
      const volumeMatch = volume.match(/\d+/);
      if (volumeMatch) {
        cslData.volume = volumeMatch[0];
      }
    }

    // Pages
    const pages = this.getMetadataValue(metadata, 'dc.identifier.pagerange');
    if (pages) {
      cslData.page = pages;
    }

    // DOI
    const doi = this.getMetadataValue(metadata, 'dc.identifier.doi');
    if (doi) {
      cslData.DOI = doi;
    }

    // URL
    const uri = this.getMetadataValue(metadata, 'dc.identifier.uri');
    if (uri) {
      cslData.URL = uri;
    }

    // Abstract
    const abstract = this.getMetadataValue(metadata, 'dc.description.abstract');
    if (abstract) {
      cslData.abstract = abstract;
    }

    // Keywords/Subjects
    const subjects = this.getMetadataValues(metadata, 'dc.subject');
    if (subjects.length > 0) {
      cslData.keyword = subjects.join(', ');
    }

    // Language
    const language = this.getMetadataValue(metadata, 'dc.language.iso');
    if (language) {
      cslData.language = language;
    }

    return cslData;
  }

  /**
   * Determine the CSL item type based on metadata
   */
  private determineItemType(metadata: any): string {
    const dcType = this.getMetadataValue(metadata, 'dc.type');
    const entityType = this.getMetadataValue(metadata, 'dspace.entity.type');

    if (dcType) {
      const typeMapping: { [key: string]: string } = {
        'article': 'article-journal',
        'Article': 'article-journal',
        'book': 'book',
        'Book': 'book',
        'chapter': 'chapter',
        'Chapter': 'chapter',
        'dataset': 'dataset',
        'Dataset': 'dataset',
        'thesis': 'thesis',
        'Thesis': 'thesis',
        'report': 'report',
        'Report': 'report',
        'conference paper': 'paper-conference',
        'Conference Paper': 'paper-conference',
        'working paper': 'article',
        'Working Paper': 'article',
      };

      if (typeMapping[dcType]) {
        return typeMapping[dcType];
      }
    }

    // Default based on entity type
    if (entityType === 'Publication') {
      return 'article-journal';
    }

    return 'article'; // Default fallback
  }

  /**
   * Parse an author name string into CSL format
   */
  private parseAuthorName(authorString: string): any {
    // Handle "Last, First" format
    if (authorString.includes(',')) {
      const parts = authorString.split(',').map(p => p.trim());
      return {
        family: parts[0],
        given: parts[1] || ''
      };
    }

    // Handle "First Last" format
    const parts = authorString.split(' ');
    if (parts.length >= 2) {
      const lastName = parts[parts.length - 1];
      const firstName = parts.slice(0, -1).join(' ');
      return {
        family: lastName,
        given: firstName
      };
    }

    // Single name
    return {
      literal: authorString
    };
  }

  /**
   * Parse a date string into CSL date format
   */
  private parseDate(dateString: string): any {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return {
        'date-parts': [[
          date.getFullYear(),
          date.getMonth() + 1,
          date.getDate()
        ]]
      };
    }

    // Try to extract just the year
    const yearMatch = dateString.match(/\d{4}/);
    if (yearMatch) {
      return {
        'date-parts': [[parseInt(yearMatch[0], 10)]]
      };
    }

    return { raw: dateString };
  }

  /**
   * Get a single metadata value
   */
  private getMetadataValue(metadata: any, fields: string | string[]): string | null {
    const fieldArray = Array.isArray(fields) ? fields : [fields];

    for (const field of fieldArray) {
      if (metadata[field] && metadata[field].length > 0) {
        return metadata[field][0].value;
      }
    }

    return null;
  }

  /**
   * Get multiple metadata values
   */
  private getMetadataValues(metadata: any, fields: string | string[]): string[] {
    const fieldArray = Array.isArray(fields) ? fields : [fields];
    const values: string[] = [];

    for (const field of fieldArray) {
      if (metadata[field]) {
        metadata[field].forEach((mv: MetadataValue) => {
          if (mv.value) {
            values.push(mv.value);
          }
        });
      }
    }

    return values;
  }

  /**
   * Generate a citation in the specified format
   */
  public generateCitation(item: Item, formatKey: string): string {
    const format = this.formats.find(f => f.key === formatKey);
    if (!format) {
      throw new Error(`Unknown format: ${formatKey}`);
    }

    const cslData = this.convertItemToCSLJSON(item);
    const cite = new Cite(cslData);

    if (format.format === 'bibliography' && format.type) {
      return cite.format('bibliography', {
        format: 'text',
        template: format.type,
        lang: 'en-US'
      });
    } else if (format.format === 'bibtex') {
      return cite.format('bibtex');
    } else if (format.format === 'ris') {
      return cite.format('ris');
    }

    throw new Error(`Unsupported format: ${formatKey}`);
  }

  /**
   * Download citation as a file
   */
  public downloadCitation(item: Item, formatKey: string): void {
    const format = this.formats.find(f => f.key === formatKey);
    if (!format) {
      throw new Error(`Unknown format: ${formatKey}`);
    }

    const citation = this.generateCitation(item, formatKey);
    const blob = new Blob([citation], { type: 'text/plain;charset=utf-8' });

    // Create filename from item title or use default
    const title = this.getMetadataValue(item.metadata, 'dc.title') || 'citation';
    const filename = `${title.substring(0, 50).replace(/[^a-z0-9]/gi, '_')}.${format.extension}`;

    // Create download link
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Copy citation to clipboard
   */
  public async copyCitation(item: Item, formatKey: string): Promise<void> {
    const citation = this.generateCitation(item, formatKey);
    await navigator.clipboard.writeText(citation);
  }
}