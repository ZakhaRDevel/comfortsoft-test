import {ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal, ViewEncapsulation} from '@angular/core';
import {TuiAlertService, TuiButton, TuiLoader, TuiScrollable, TuiScrollbar} from '@taiga-ui/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {TuiInputModule, TuiTextfieldControllerModule} from '@taiga-ui/legacy';
import {LibraryListItem} from '../../../interface/library-list-item';
import {LibraryService} from '../../../services/library.service';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {queryParams} from '../../../rxjs/query-params';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {debounceTime, distinctUntilChanged, switchMap, tap} from 'rxjs/operators';
import {
  TuiTableCell,
  TuiTableDirective,
  TuiTableHead,
  TuiTableTbody,
  TuiTableTd,
  TuiTableTh,
  TuiTableThead,
  TuiTableThGroup,
  TuiTableTr
} from '@taiga-ui/addon-table';
import {CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport} from '@angular/cdk/scrolling';
import {HighlightPipe} from '../../../pipe/highlight.pipe';

@Component({
  selector: 'app-library-list',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    TuiInputModule,
    TuiButton,
    TuiLoader,
    TuiTableDirective,
    TuiTableThead,
    TuiTableThGroup,
    TuiTableTh,
    TuiTableHead,
    TuiTableTbody,
    TuiTableTr,
    TuiTableTd,
    TuiTableCell,
    RouterLink,
    TuiScrollbar,
    CdkVirtualScrollViewport,
    CdkFixedSizeVirtualScroll,
    CdkVirtualForOf,
    TuiScrollable,
    TuiTextfieldControllerModule,
    HighlightPipe,
  ],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  encapsulation: ViewEncapsulation.None
})
export class LibraryListComponent implements OnInit {
  private libraryService = inject(LibraryService)
  private destroyRef = inject(DestroyRef)
  private alert = inject(TuiAlertService)
  private router = inject(Router)
  private route = inject(ActivatedRoute)

  columns: string[] = [
    'number',
    'fullName',
    'address'
  ] as const

  search = ''
  libraries = signal<LibraryListItem[]>([])
  isLoading = signal(false)


  ngOnInit(): void {
    queryParams(this, ['search'] as const, this.route, this.router).pipe(
      distinctUntilChanged(),
      debounceTime(500),
      takeUntilDestroyed(this.destroyRef),
      tap(() => this.isLoading.set(true)),
      switchMap(([search]) => this.libraryService.getLibraries(search as string))
    ).subscribe({
      next: libraries => {
        this.libraries.set(libraries)
        this.isLoading.set(false);
      },
      error: error => {
        this.alert.open(error, {
          appearance: 'negative'
        })
        this.isLoading.set(false);
      },
    })
  }

  onSearch(search: string) {
    this.search = search
  }

  trackByFn(global_id: number) {
    return global_id
  }
}
