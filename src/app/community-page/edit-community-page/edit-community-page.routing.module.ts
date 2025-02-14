import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { I18nBreadcrumbResolver } from '../../core/breadcrumbs/i18n-breadcrumb.resolver';
import { CommunityAdministratorGuard } from '../../core/data/feature-authorization/feature-authorization-guard/community-administrator.guard';
import { ResourcePolicyCreateComponent } from '../../shared/resource-policies/create/resource-policy-create.component';
import { ResourcePolicyEditComponent } from '../../shared/resource-policies/edit/resource-policy-edit.component';
import { ResourcePolicyResolver } from '../../shared/resource-policies/resolvers/resource-policy.resolver';
import { ResourcePolicyTargetResolver } from '../../shared/resource-policies/resolvers/resource-policy-target.resolver';
import { CommunityAccessControlComponent } from './community-access-control/community-access-control.component';
import { CommunityAuthorizationsComponent } from './community-authorizations/community-authorizations.component';
import { CommunityCurateComponent } from './community-curate/community-curate.component';
import { CommunityMetadataComponent } from './community-metadata/community-metadata.component';
import { CommunityRolesComponent } from './community-roles/community-roles.component';
import { EditCommunityPageComponent } from './edit-community-page.component';

/**
 * Routing module that handles the routing for the Edit Community page administrator functionality
 */
@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        resolve: {
          breadcrumb: I18nBreadcrumbResolver,
        },
        data: { breadcrumbKey: 'community.edit' },
        component: EditCommunityPageComponent,
        canActivate: [CommunityAdministratorGuard],
        children: [
          {
            path: '',
            redirectTo: 'metadata',
            pathMatch: 'full',
          },
          {
            path: 'metadata',
            component: CommunityMetadataComponent,
            data: {
              title: 'community.edit.tabs.metadata.title',
              hideReturnButton: true,
              showBreadcrumbs: true,
            },
          },
          {
            path: 'roles',
            component: CommunityRolesComponent,
            data: { title: 'community.edit.tabs.roles.title', showBreadcrumbs: true },
          },
          {
            path: 'curate',
            component: CommunityCurateComponent,
            data: { title: 'community.edit.tabs.curate.title', showBreadcrumbs: true },
          },
          {
            path: 'access-control',
            component: CommunityAccessControlComponent,
            data: { title: 'collection.edit.tabs.access-control.title', showBreadcrumbs: true },
          },
          /*{
            path: 'authorizations',
            component: CommunityAuthorizationsComponent,
            data: { title: 'community.edit.tabs.authorizations.title', showBreadcrumbs: true }
          },*/
          {
            path: 'authorizations',
            data: { showBreadcrumbs: true },
            children: [
              {
                path: 'create',
                resolve: {
                  resourcePolicyTarget: ResourcePolicyTargetResolver,
                },
                component: ResourcePolicyCreateComponent,
                data: { title: 'resource-policies.create.page.title' },
              },
              {
                path: 'edit',
                resolve: {
                  resourcePolicy: ResourcePolicyResolver,
                },
                component: ResourcePolicyEditComponent,
                data: { title: 'resource-policies.edit.page.title' },
              },
              {
                path: '',
                component: CommunityAuthorizationsComponent,
                data: { title: 'community.edit.tabs.authorizations.title', showBreadcrumbs: true, hideReturnButton: true },
              },
            ],
          },
        ],
      },
    ]),
  ],
  providers: [
    ResourcePolicyResolver,
    ResourcePolicyTargetResolver,
  ],
})
export class EditCommunityPageRoutingModule {

}
