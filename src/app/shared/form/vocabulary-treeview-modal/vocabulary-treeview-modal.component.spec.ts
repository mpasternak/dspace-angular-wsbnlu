import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';

import { VocabularyTreeviewModalComponent } from './vocabulary-treeview-modal.component';

describe('VocabularyTreeviewModalComponent', () => {
  let component: VocabularyTreeviewModalComponent;
  let fixture: ComponentFixture<VocabularyTreeviewModalComponent>;

  const modalStub = jasmine.createSpyObj('modalStub', ['close']);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ TranslateModule.forRoot() ],
      declarations: [ VocabularyTreeviewModalComponent ],
      providers: [
        { provide: NgbActiveModal, useValue: modalStub },
      ],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VocabularyTreeviewModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
