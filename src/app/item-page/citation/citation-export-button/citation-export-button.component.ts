import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { Item } from '../../../core/shared/item.model';
import { CitationExportModalComponent } from '../citation-export-modal/citation-export-modal.component';

@Component({
  selector: 'ds-citation-export-button',
  templateUrl: './citation-export-button.component.html',
  styleUrls: ['./citation-export-button.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
  ],
})
export class CitationExportButtonComponent {
  /**
   * The item to export citations for
   */
  @Input() item: Item;

  /**
   * Optional CSS classes for the button
   */
  @Input() buttonClass: string = 'btn btn-outline-primary';

  /**
   * Whether to show icon with the button text
   */
  @Input() showIcon: boolean = true;

  /**
   * Whether to show text with the button
   */
  @Input() showText: boolean = true;

  constructor(
    private modalService: NgbModal,
  ) {}

  /**
   * Open the citation export modal
   */
  openCitationModal(): void {
    if (!this.item) {
      return;
    }

    const modalRef = this.modalService.open(CitationExportModalComponent, {
      size: 'lg',
      centered: true,
    });

    modalRef.componentInstance.item = this.item;
  }
}