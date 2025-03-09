import {Routes} from '@angular/router';

export const routes: Routes = [
  {path: '', pathMatch: 'full', redirectTo: 'library'},
  {
    path: 'library',
    loadChildren: () => import('./core/components/library/library.routes').then(r => r.routes),
  }
];
