import {BehaviorSubject, combineLatest, Observable} from 'rxjs';
import {distinctUntilChanged, map, takeUntil} from 'rxjs/operators';

type PropertyInfo = { descriptor: PropertyDescriptor, subject: BehaviorSubject<any> };
const objectMap = new WeakMap<any, Map<string, PropertyInfo>>();

function getObjectMap(object: any): Map<string, PropertyInfo> {
  if (!objectMap.has(object)) {
    const map = new Map();
    objectMap.set(object, map);

    // TODO: remove on component destroy
  }
  return objectMap.get(object)!;
}

function getPropertyInfo(object: any, property: string): PropertyInfo {
  const map = getObjectMap(object);

  if (!map.has(property)) {
    let descriptor = Object.getOwnPropertyDescriptor(object, property)!;
    const subject = new BehaviorSubject(object[property]);

    const newDescriptor = {
      set(value: any) {
        if (value === object[property]) return;

        if (descriptor === newDescriptor) descriptor.value = value;
        else if (descriptor.set) descriptor.set(value);
        else descriptor.value = value;

        subject.next(object[property]);
      },
      get(): any {
        if (descriptor === newDescriptor) return descriptor.value;
        else return descriptor.get?.() ?? descriptor.value;
      }
    };

    if (!descriptor) descriptor = newDescriptor;

    map.set(property, {descriptor, subject});
    Object.defineProperty(object, property, newDescriptor);
  }

  return map.get(property)!;
}

/**
 * Позволяет подписаться на изменение свойства/свойств любого объекта.
 *
 * ВАЖНО! Этот метод мутирует объект. Как следствие не может работать с замороженными объектами, а так же может повлиять на работу самого объекта.
 * Наблюдение происходит путём подмены геттера/сеттера свойства объекта.
 *
 * Примеры использования
 *
 * ```
 *   const newUser = {id: null, name: 'Vasya'};

 *   // если Вася сохранится в бд, то ... добавить его в список к остальным
 *   observe(newUser, 'id').pipe(take(1)).subscribe(user => list.push(user));
 * ```
 *
 * Пример использования в компоненте
 * ```
 *   // объявляем свойства компонента и биндим их к элементам интерфейса
 *   includeDeleted = false;
 *   itemsPerPage = 15;
 *
 *   // при изменении значения переключателя загружаем данные
 *   onInit {
 *     observe(this, ['includeDeleted', 'itemsPerPage']).pipe(
 *       switchMap(([includeDeleted, itemsPerPage]) => this.load({includeDeleted, itemsPerPage}),
 *     ).subscribe(data => this.data = data);
 *   }
 * ```
 */
export function observe<T, K extends keyof T>(object: T, property: K, until?: Observable<void>): Observable<T[K]>;
export function observe<T, K extends keyof T, A extends readonly K[]>(object: T, properties: A, until?: Observable<void>): Observable<T[K][]>;
export function observe<T, K extends keyof T>(object: T, properties: K | K[], until?: Observable<void>): Observable<T[K] | T[K][]> {
  const isArray = Array.isArray(properties);
  // @ts-ignore
  const props: K[] = isArray ? properties : [properties];

  let values$ = combineLatest(props.map(property => getPropertyInfo(object, property as string)!.subject.pipe(
    distinctUntilChanged(),
  )));

  if (until) values$ = values$.pipe(takeUntil(until));

  return isArray ? values$ : values$.pipe(map(values => values[0]));
}
