import { Component } from '@angular/core';

import { ThemedComponent } from '../../shared/theme-support/themed.component';
import { CookiesComponent } from './cookies.component';

/**
 * Themed wrapper for CookiesComponent
 */
@Component({
  selector: 'ds-cookies',
  styleUrls: [],
  templateUrl: '../../shared/theme-support/themed.component.html',
  standalone: true,
  imports: [CookiesComponent],
})
export class ThemedCookiesComponent extends ThemedComponent<CookiesComponent> {
  protected getComponentName(): string {
    return 'CookiesComponent';
  }

  protected importThemedComponent(themeName: string): Promise<any> {
    return import(`../../../themes/${themeName}/app/info/cookies/cookies.component`);
  }

  protected importUnthemedComponent(): Promise<any> {
    return import('./cookies.component');
  }
}
