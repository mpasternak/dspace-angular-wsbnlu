import { Component } from '@angular/core';

import { CookiesComponent as BaseComponent } from '../../../../../app/info/cookies/cookies.component';
import { CookiesContentComponent } from '../../../../../app/info/cookies/cookies-content/cookies-content.component';

@Component({
  selector: 'ds-themed-cookies',
  styleUrls: ['../../../../../app/info/cookies/cookies.component.scss'],
  templateUrl: '../../../../../app/info/cookies/cookies.component.html',
  standalone: true,
  imports: [
    CookiesContentComponent,
  ],
})
export class CookiesComponent extends BaseComponent {
}
