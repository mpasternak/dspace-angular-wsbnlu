import {
  ComponentFixture,
  inject,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { APP_CONFIG } from '../../config/app-config.interface';
import { environment } from '../../environments/environment.test';
import { NotifyInfoService } from '../core/coar-notify/notify-info/notify-info.service';
import { AuthorizationDataService } from '../core/data/feature-authorization/authorization-data.service';
import { ActivatedRouteStub } from '../shared/testing/active-router.stub';
import { AuthorizationDataServiceStub } from '../shared/testing/authorization-service.stub';
import { FooterComponent } from './footer.component';

let comp: FooterComponent;
let fixture: ComponentFixture<FooterComponent>;

let notifyInfoService = {
  isCoarConfigEnabled: () => of(true),
};

describe('Footer component', () => {
  beforeEach(waitForAsync(() => {
    return TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot(),
      ],
      providers: [
        FooterComponent,
        { provide: AuthorizationDataService, useClass: AuthorizationDataServiceStub },
        { provide: NotifyInfoService, useValue: notifyInfoService },
        { provide: ActivatedRoute, useValue: new ActivatedRouteStub() },
        { provide: APP_CONFIG, useValue: environment },
      ],
    });
  }));

  // synchronous beforeEach
  beforeEach(() => {
    fixture = TestBed.createComponent(FooterComponent);
    comp = fixture.componentInstance;
  });

  it('should create footer', inject([FooterComponent], (app: FooterComponent) => {
    // Perform test using fixture and service
    expect(app).toBeTruthy();
  }));


  it('should set showPrivacyPolicy to the value of environment.info.enablePrivacyStatement', () => {
    comp.ngOnInit();
    expect(comp.showPrivacyPolicy).toBe(environment.info.enablePrivacyStatement);
  });

  it('should set showEndUserAgreement to the value of environment.info.enableEndUserAgreement', () => {
    comp.ngOnInit();
    expect(comp.showEndUserAgreement).toBe(environment.info.enableEndUserAgreement);
  });

  describe('openCookieSettings', () => {
    it('should call cookies.showSettings() if cookies is defined', () => {
      const cookies = jasmine.createSpyObj('cookies', ['showSettings']);
      comp.cookies = cookies;
      comp.openCookieSettings();
      expect(cookies.showSettings).toHaveBeenCalled();
    });

    it('should not call cookies.showSettings() if cookies is undefined', () => {
      comp.cookies = undefined;
      expect(() => comp.openCookieSettings()).not.toThrow();
    });

    it('should return false', () => {
      expect(comp.openCookieSettings()).toBeFalse();
    });
  });

});
