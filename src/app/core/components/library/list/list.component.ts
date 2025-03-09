import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-library-list',
  imports: [],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class LibraryListComponent {

}
