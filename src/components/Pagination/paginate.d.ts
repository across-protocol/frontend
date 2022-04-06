export interface PartialNavbarArgs {
  list: number[];
  maxLength: number;
  index: number;
}
export type PartialNavbarResult = PartialNavbarArgs;

export interface NavigateArgs {
  totalPages: number;
  lastPage: number;
  currentPage: number;
  maxNavigationCount: number;
}

export interface NavigateResult {
  pageList: number[];
  activeIndex: number;
  hideStart: boolean;
  hideEnd: boolean;
  disableForward: boolean;
  disableBack: boolean;
}

export interface PageArgs {
  elementCount: number;
  elementsPerPage: number;
  currentPage: number;
}

export interface PageResult {
  startIndex: number;
  endIndex: number;
}

export interface PaginateArgs {
  elementCount: number;
  elementsPerPage?: number;
  currentPage: number;
  maxNavigationCount: number;
}

export interface PaginateValues
  extends PaginateArgs,
    NavigateResult,
    PageResult {
  totalPages: number;
  lastPage: number;
}
