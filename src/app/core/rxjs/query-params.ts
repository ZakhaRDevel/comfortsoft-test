import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, EMPTY, merge, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, share, takeUntil, tap } from 'rxjs/operators';
import { TuiMonth } from '@taiga-ui/cdk';
import { inject } from '@angular/core';
import {observe} from './observe';
import {JSONDateParser} from './json-date-parser';


export function query<P extends Record<string, unknown>>(
  params: P,
  route = inject(ActivatedRoute),
  router = inject(Router),
) {
  const keys = Object.keys(params);
  observe(params, keys).pipe(
    map(v => Object.fromEntries(keys.map(k => [k, v]))),
  );
}

/**
 * Позволяет привязать свойства компонента с GET парамерами url.
 * При изменении url сработает подписка и в переменной будет значение указанное в url.
 * Так же при изменении значения свойства изменится url (двухстороннее связывание).
 * Для реализации используется {@link observe} функция, которая мутирует объект заменяя объявление свойства на get, set.
 *
 * @param component Компонент, чьи свойства необходимо связать с url параметрами
 * @param properties Свойство, значение которого необходимо вынести в url
 * @param route (Временное решение) текущий ActiveRoute для компонента для получения параметров
 * @param router (Временное решение) инстанция Router для изменения url параметров
 * считаются значениями по-умолчанию. Т.е. если из url убрать этот параметр, то переменной присвоится первичное значение
 */
export function queryParams<C, T extends readonly (keyof C)[]>(
  component: C,
  properties: T,
  route: ActivatedRoute,
  router: Router,
) {
  return combineLatest(properties.map(property => queryParam(component, property, route, router))).pipe(
    debounceTime(0),
    distinctUntilChanged(),
    share(),
  ); // as Observable<{ [I in keyof T]: C[keyof C & T[I]] }>;
}

/**
 * См. {@link queryParams}
 */
export function queryParam<C, T extends keyof C>(
  component: C,
  property: T,
  route = inject(ActivatedRoute),
  router = inject(Router),
): Observable<C[T]> {
  // предотвращаем зацикливание
  let lastStrValue: string | null;
  let lastValue: any;

  const query$ = route.queryParamMap.pipe(
    debounceTime(0),
    map(params => params.get(property as string)),
    filter(value => value !== lastStrValue),
    tap(value => lastStrValue = value),
    map(value => fromUrlString(value) ?? component[property]),
    tap(value => lastValue = value),
    tap(value => component[property] = value),
  );

  const change$ = observe(component, property).pipe(
    debounceTime(0),
    tap(value => lastValue = value),
    map(value => toUrlString(value)),
    filter(value => value !== lastStrValue),
    tap(value => lastStrValue = value),
    tap(strValue => setParam(property as string, strValue, router)),
  );

  return merge(query$, change$).pipe(
    debounceTime(0),
    distinctUntilChanged(),
    map(() => lastValue),
    share(),
  );
}


interface QueryParamDecoratorOptions {
  attrs?: string[];
}

export function QueryParam(name?: string, options: QueryParamDecoratorOptions = {}) {
  return (component: any, property: string) => {
    const param: string = name ?? property;

    // TODO: resolve this via injector if possible
    const route = component.route as ActivatedRoute;
    if (!route) throw new Error('Activated Route not provided');

    const router = component.router as Router;
    if (!router) throw new Error('Router not provided');

    const destroy$ = component.destroy$ as Observable<void>;
    if (!destroy$) throw new Error('TuiDestroyService not provided');


    route.paramMap.pipe(
      map(params => params.get(param)),
      takeUntil(destroy$),
    ).subscribe(value => component[property] = value);

    observe(component, property, destroy$).pipe(
      map(value => toUrlString(value, options)),
    ).subscribe(strValue => setParam(param, strValue, router));
  };
}

let paramsBuffer: Record<string, string> = {};
let update: any;

function setParam(param: string, value: string | null, router: Router) {

  if (value) paramsBuffer[param] = value;
  else delete paramsBuffer[param];

  if (update) return;
  update = setTimeout(() => {
    router.navigate([], {
      queryParams: paramsBuffer,
      queryParamsHandling: 'merge',
      preserveFragment: true,
    });
    paramsBuffer = {};
    update = undefined;
  });
}

function toUrlString(data: any, options: QueryParamDecoratorOptions & {
  root?: boolean
} = {root: true}): string | null {
  if (data === null) return options.root ? null : 'null';
  else if (Array.isArray(data)) return `[${data.map(item => toUrlString(item, {...options, root: false}))}]`;
  else if (typeof data === 'object' && (options.attrs || isEntity(data))) {
    const result: { [key: string]: string } = {};
    if (options.attrs) {
      options.attrs.forEach(attr => result[attr] = data[attr]);
    } else {
      if ('id' in data) {
        if (data.id == null) return null;
        result['id'] = data.id;
      }
      if ('name' in data) result['name'] = data.name;
      else if ('title' in data) result['title'] = data.title;
      else if ('label' in data) result['label'] = data.label;
    }
    return JSON.stringify(result);
  } else return JSON.stringify(data);
}

function isEntity(object: { [prop: string]: any }) {
  return 'id' in object;
}

function fromUrlString(str: string | null): any {
  if (str === null) return str;
  const value = JSON.parse(str, JSONDateParser);
  if (typeof value === 'string') {
    // TuiMonth format
    if (str.match(/^\d{4}-\d{2}$/)) {
      return new TuiMonth(+str.substr(0, 4), +str.substr(5, 2) - 1);
    }
  }
  return value;
}
