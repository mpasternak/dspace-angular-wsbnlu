import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { LinkMenuItemModel } from '../shared/menu/menu-item/models/link.model';
import { MenuItemType } from '../shared/menu/menu-item-type.model';
import { HomePageResolver } from './home-page.resolver';
import { ThemedHomePageComponent } from './themed-home-page.component';

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        component: ThemedHomePageComponent,
        pathMatch: 'full',
        data: {
          title: 'home.title',
          menu: {
            public: [{
              id: 'statistics_site',
              active: true,
              visible: true,
              index: 2,
              model: {
                type: MenuItemType.LINK,
                text: 'menu.section.statistics',
                link: 'statistics',
              } as LinkMenuItemModel,
            }],
          },
        },
        resolve: {
          site: HomePageResolver,
        },
      },
    ]),
  ],
  providers: [
    HomePageResolver,
  ],
})
export class HomePageRoutingModule {
}
