import {ChangeDetectionStrategy, Component} from '@angular/core';

@Component({
  selector: 'app-library-item',
  imports: [],
  templateUrl: './item.component.html',
  styleUrl: './item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class LibraryItemComponent {

}
