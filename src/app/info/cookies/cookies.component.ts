import { Component } from '@angular/core';

import { CookiesContentComponent } from './cookies-content/cookies-content.component';

@Component({
  selector: 'ds-cookies',
  templateUrl: './cookies.component.html',
  styleUrls: ['./cookies.component.scss'],
  standalone: true,
  imports: [CookiesContentComponent],
})
/**
 * Component displaying the Cookies Policy page
 */
export class CookiesComponent {
}
