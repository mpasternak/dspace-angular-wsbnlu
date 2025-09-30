import { AsyncPipe, CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Item } from '../../../core/shared/item.model';
import { NotificationsService } from '../../../shared/notifications/notifications.service';
import { CitationFormat, CitationService } from '../citation.service';

@Component({
  selector: 'ds-citation-export-modal',
  templateUrl: './citation-export-modal.component.html',
  styleUrls: ['./citation-export-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    AsyncPipe,
  ],
})
export class CitationExportModalComponent implements OnInit {
  /**
   * The item to generate citations for
   */
  @Input() item: Item;

  /**
   * Available citation formats
   */
  formats: CitationFormat[];

  /**
   * Currently selected format
   */
  selectedFormat: string;

  /**
   * The generated citation text
   */
  citationText: string = '';

  /**
   * Loading state
   */
  isLoading: boolean = false;

  /**
   * Error message if citation generation fails
   */
  errorMessage: string = '';

  constructor(
    protected activeModal: NgbActiveModal,
    private citationService: CitationService,
    private notificationsService: NotificationsService,
    private translateService: TranslateService,
  ) {
    this.formats = this.citationService.formats;
  }

  ngOnInit(): void {
    // Try to load previously selected format from localStorage
    const savedFormat = localStorage.getItem('citation-preferred-format');

    if (this.formats.length > 0) {
      // Use saved format if it exists and is valid, otherwise default to APA (first format)
      if (savedFormat && this.formats.find(f => f.key === savedFormat)) {
        this.selectedFormat = savedFormat;
      } else {
        this.selectedFormat = this.formats[0].key;
      }
      this.generateCitation();
    }
  }

  /**
   * Generate citation for the selected format
   */
  generateCitation(): void {
    if (!this.item || !this.selectedFormat) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      // Check for minimum required metadata
      const validationResult = this.citationService.validateItemForCitation(this.item);

      if (!validationResult.isValid) {
        this.errorMessage = this.translateService.instant('citation-export.error.missing-metadata', {
          fields: validationResult.missingFields.join(', ')
        });
        this.citationText = this.translateService.instant('citation-export.error.incomplete-citation');
        this.isLoading = false;
        return;
      }

      this.citationText = this.citationService.generateCitation(this.item, this.selectedFormat);
      this.isLoading = false;
    } catch (error) {
      console.error('Error generating citation:', error);
      this.errorMessage = this.translateService.instant('citation-export.error.generation-failed');
      this.isLoading = false;
    }
  }

  /**
   * Handle format selection change
   */
  onFormatChange(): void {
    // Save the selected format to localStorage for future use
    if (this.selectedFormat) {
      localStorage.setItem('citation-preferred-format', this.selectedFormat);
    }
    this.generateCitation();
  }

  /**
   * Copy citation to clipboard
   */
  async copyCitation(): Promise<void> {
    try {
      await this.citationService.copyCitation(this.item, this.selectedFormat);
      this.notificationsService.success(
        this.translateService.get('citation-export.success.copied')
      );
    } catch (error) {
      console.error('Error copying citation:', error);
      this.notificationsService.error(
        this.translateService.get('citation-export.error.copy-failed')
      );
    }
  }

  /**
   * Download citation as file
   */
  downloadCitation(): void {
    try {
      this.citationService.downloadCitation(this.item, this.selectedFormat);
      this.notificationsService.success(
        this.translateService.get('citation-export.success.downloaded')
      );
    } catch (error) {
      console.error('Error downloading citation:', error);
      this.notificationsService.error(
        this.translateService.get('citation-export.error.download-failed')
      );
    }
  }

  /**
   * Close the modal
   */
  close(): void {
    this.activeModal.close();
  }
}