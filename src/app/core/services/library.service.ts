import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {TuiAlertService} from '@taiga-ui/core';
import {Observable} from 'rxjs';
import {LibraryListItem} from '../interface/library-list-item';
import {map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LibraryService {
  protected http = inject(HttpClient);
  protected alert = inject(TuiAlertService);
  apiKey = 'c90c3519-7240-4ea9-9914-4195dd37d860'
  apiVersion = 'v1'

  getLibraries(filter?: string, cells: string[] = ["FullName", "ObjectAddress"]): Observable<LibraryListItem[]> {
    let params = new HttpParams()
      .set('api_key', this.apiKey)
    if (filter?.trim()) {
      params = params.set('$filter', `Cells/FullName eq '${filter}'`);
    }
    return this.http.post<LibraryListItem[]>(`https://apidata.mos.ru/${this.apiVersion}/datasets/526/rows`, cells, {params})
  }

  getLibrary(filter?: string, cells: string[] = ["FullName", "ObjectAddress"]): Observable<LibraryListItem | null> {
    let params = new HttpParams().set('api_key', this.apiKey);

    if (filter?.trim()) {
      params = params.set('$filter', `Cells/global_id eq ${filter}`);
    }

    return this.http.post<LibraryListItem[]>(`https://apidata.mos.ru/${this.apiVersion}/datasets/526/rows`, cells, {params})
      .pipe(
        map(response => response.length > 0 ? response[0] : null)
      );
  }


}
