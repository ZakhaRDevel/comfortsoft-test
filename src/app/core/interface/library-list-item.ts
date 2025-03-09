export interface LibraryListItem {
  Number: number;
  global_id: number;
  Cells: {
    FullName: string;
    ObjectAddress: {
      Address: string;
    }[]
  }
}
