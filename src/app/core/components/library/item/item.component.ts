import {ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal} from '@angular/core';
import {LibraryService} from '../../../services/library.service';
import {TuiAlertService, TuiButton, TuiLoader} from '@taiga-ui/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {LibraryListItem} from '../../../interface/library-list-item';

@Component({
  selector: 'app-library-item',
  templateUrl: './item.component.html',
  styleUrl: './item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TuiLoader,
    TuiButton,
    RouterLink
  ]
})
export class LibraryItemComponent implements OnInit {
  private libraryService = inject(LibraryService);
  private destroyRef = inject(DestroyRef);
  private alert = inject(TuiAlertService);
  private route = inject(ActivatedRoute);

  isLoading = signal(false);
  id = signal<string | null>(null);
  library = signal<LibraryListItem | null>(null);

  ngOnInit(): void {
    this.route.paramMap.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(params => {
      const libraryId = params.get('id');
      if (libraryId) {
        this.id.set(libraryId);
        this.onLoad(libraryId);
      } else {
        this.alert.open('Ошибка: ID библиотеки не найден!', {appearance: 'negative'});
      }
    });
  }

  onLoad(libraryId: string) {
    this.isLoading.set(true);
    this.libraryService.getLibrary(libraryId).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (library) => {
        this.isLoading.set(false)
        this.library.set(library)
      },
      error: (err) => {
        this.alert.open(err, {appearance: 'negative'});
        this.isLoading.set(false);
      },
    });
  }
}
