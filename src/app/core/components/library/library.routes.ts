import {Routes} from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./list/list.component').then(c => c.LibraryListComponent),
  },
  {
    path: ':id',
    loadChildren: () => import('./item/item.component').then(c => c.LibraryItemComponent)
  },
];
