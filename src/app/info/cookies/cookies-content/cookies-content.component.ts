import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'ds-cookies-content',
  templateUrl: './cookies-content.component.html',
  styleUrls: ['./cookies-content.component.scss'],
  standalone: true,
  imports: [
    RouterLink,
    TranslateModule,
  ],
})
/**
 * Component displaying the contents of the Cookies Policy
 */
export class CookiesContentComponent {
}
