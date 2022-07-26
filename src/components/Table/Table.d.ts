export interface ICell {
  value: string | JSX.Element;
}

export interface IRow {
  cells: ICell[];
}
