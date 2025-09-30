import {
  Component,
  OnInit,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { HomeNewsComponent as BaseComponent } from '../../../../../app/home-page/home-news/home-news.component';

@Component({
  selector: 'ds-themed-home-news',
  styleUrls: ['./home-news.component.scss'],
  templateUrl: './home-news.component.html',
  standalone: true,
  imports: [TranslateModule],
})

/**
 * Component to render the news section on the home page
 */
export class HomeNewsComponent extends BaseComponent implements OnInit {
  randomFact: string;

  ngOnInit(): void {
    // All available facts, tips, and information
    const allFacts = [
      // WSB-NLU Facts (10)
      'home.wsb.fact.1',
      'home.wsb.fact.2',
      'home.wsb.fact.3',
      'home.wsb.fact.4',
      'home.wsb.fact.5',
      'home.wsb.fact.6',
      'home.wsb.fact.7',
      'home.wsb.fact.8',
      'home.wsb.fact.9',
      'home.wsb.fact.10',
      // DSpace Search Tips (10)
      'home.dspace.tip.1',
      'home.dspace.tip.2',
      'home.dspace.tip.3',
      'home.dspace.tip.4',
      'home.dspace.tip.5',
      'home.dspace.tip.6',
      'home.dspace.tip.7',
      'home.dspace.tip.8',
      'home.dspace.tip.9',
      'home.dspace.tip.10',
      // DSpace Facts (5)
      'home.dspace.fact.1',
      'home.dspace.fact.2',
      'home.dspace.fact.3',
      'home.dspace.fact.4',
      'home.dspace.fact.5',
    ];

    // Randomly select one fact
    const randomIndex = Math.floor(Math.random() * allFacts.length);
    this.randomFact = allFacts[randomIndex];
  }
}

