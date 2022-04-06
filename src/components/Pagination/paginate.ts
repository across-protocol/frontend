import assert from "assert";
import {
  PartialNavbarArgs,
  PartialNavbarResult,
  NavigateArgs,
  NavigateResult,
  PageArgs,
  PageResult,
  PaginateArgs,
  PaginateValues,
} from "./paginate.d";

// Utility to turn a full list of pages 1-N to a subset of pages around the current page
function partialNavbar({
  list,
  maxLength,
  index,
}: PartialNavbarArgs): PartialNavbarResult {
  const length = Math.min(list.length, maxLength);
  const sliceStart = index - Math.floor(length / 2);
  const sliceEnd = Math.ceil(length / 2) + index;
  let offset = 0;
  if (sliceStart < 0) {
    offset = -sliceStart;
  } else if (sliceEnd > list.length) {
    offset = list.length - sliceEnd;
  }
  const slice = list.slice(sliceStart + offset, sliceEnd + offset);
  const sliceIndex = slice.indexOf(index);
  return {
    list: slice,
    index: sliceIndex,
    maxLength,
  };
}

// calculate the rows or elements you need to slice from the main array for this page
function page({
  elementCount,
  elementsPerPage,
  currentPage,
}: PageArgs): PageResult {
  assert(currentPage >= 0, "Invalid current page, below 0");

  const startIndex = Math.min(currentPage * elementsPerPage, elementCount);
  const endIndex = Math.min(
    currentPage * elementsPerPage + elementsPerPage,
    elementCount
  );

  return {
    startIndex,
    endIndex,
  };
}

// calculates the state of the page navigation numbers only
function navigate({
  totalPages,
  lastPage,
  currentPage,
  maxNavigationCount,
}: NavigateArgs): NavigateResult {
  const navigationList = [...Array(totalPages).keys()];
  const partialNavigation = partialNavbar({
    list: navigationList,
    maxLength: maxNavigationCount,
    index: currentPage,
  });
  const hideStart = totalPages <= 0 || partialNavigation.list.includes(0);
  const hideEnd = totalPages <= 0 || partialNavigation.list.includes(lastPage);
  const disableForward = totalPages <= 0 || currentPage >= lastPage;
  const disableBack = totalPages <= 0 || currentPage <= 0;
  let pageList = partialNavigation.list;
  let activeIndex = partialNavigation.index;
  // this prevents us from showing more than maxNavigationCount buttons when showing the first/last nav buttons
  if (!hideStart) {
    pageList = pageList.slice(1);
    activeIndex--;
  }
  if (!hideEnd) {
    pageList = pageList.slice(0, -1);
  }

  return {
    pageList,
    activeIndex,
    hideStart,
    hideEnd,
    disableForward,
    disableBack,
  };
}

// the main interface to paginating both the page and the page navigation state
export default function paginate({
  elementCount,
  elementsPerPage = 25,
  currentPage = 0,
  maxNavigationCount = 5,
}: PaginateArgs): PaginateValues {
  const totalPages = Math.ceil(elementCount / elementsPerPage);
  const lastPage = Math.max(totalPages - 1, 0);
  if (currentPage < 0) currentPage = 0;
  if (currentPage >= totalPages) currentPage = lastPage;
  const pageState = page({ elementCount, elementsPerPage, currentPage });
  const navigateState = navigate({
    totalPages,
    lastPage,
    currentPage,
    maxNavigationCount,
  });
  return {
    elementCount,
    elementsPerPage,
    currentPage,
    maxNavigationCount,
    totalPages,
    lastPage,
    ...pageState,
    ...navigateState,
  };
}
