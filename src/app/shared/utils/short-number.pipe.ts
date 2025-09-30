import {
  Optional,
  Pipe,
  PipeTransform,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { LocaleService } from '../../core/locale/locale.service';
import { isEmpty } from '../empty.util';


@Pipe({
  name: 'dsShortNumber',
  standalone: true,
})
export class ShortNumberPipe implements PipeTransform {

  constructor(
    @Optional() private localeService: LocaleService,
    @Optional() private translateService: TranslateService,
  ) {}

  transform(number: number, args?: any): any {
    // will only work value is a valid number
    if (isNaN(number) || isEmpty(number) || number === 0) {
      return number;
    }

    let abs = Math.abs(number);
    const rounder = Math.pow(10, 1);
    const isNegative = number < 0; // will also work for Negetive numbers
    let key = '';

    // Get locale-specific abbreviations
    const abbreviations = this.getAbbreviations();

    const powers = [
      { key: abbreviations.quadrillion, value: Math.pow(10, 15) },
      { key: abbreviations.trillion, value: Math.pow(10, 12) },
      { key: abbreviations.billion, value: Math.pow(10, 9) },
      { key: abbreviations.million, value: Math.pow(10, 6) },
      { key: abbreviations.thousand, value: 1000 },
    ];

    for (let i = 0; i < powers.length; i++) {
      let reduced = abs / powers[i].value;
      reduced = Math.round(reduced * rounder) / rounder;
      if (reduced >= 1) {
        abs = reduced;
        key = powers[i].key;
        break;
      }
    }
    return (isNegative ? '-' : '') + abs + key;
  }

  private getAbbreviations(): any {
    // Get the current language from LocaleService or TranslateService
    let currentLang = null;

    if (this.localeService) {
      currentLang = this.localeService.getCurrentLanguageCode();
    } else if (this.translateService) {
      currentLang = this.translateService.currentLang || this.translateService.defaultLang;
    }

    // Check if current language is Polish
    if (currentLang && currentLang.toLowerCase().startsWith('pl')) {
      return {
        thousand: ' tys.',
        million: ' mln',
        billion: ' mld',
        trillion: ' bln',
        quadrillion: ' bld'
      };
    }
    // Default to English abbreviations
    return {
      thousand: 'K',
      million: 'M',
      billion: 'B',
      trillion: 'T',
      quadrillion: 'Q'
    };
  }
}
