interface PartialNavbar {
  list: number[];
  maxLength: number;
  index: number;
}
export function partialNavbar({
  list,
  maxLength,
  index,
}: PartialNavbar): PartialNavbar {
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
interface Params {
  elementCount: number;
  elementsPerPage?: number;
  currentPage?: number;
  maxNavigationCount?: number;
}
interface Result extends Params {
  startIndex: number;
  endIndex: number;
  navigationList: number[];
  navigationIndex: number;
  totalPages: number;
}
export function paginate({
  elementCount,
  elementsPerPage = 25,
  currentPage = 0,
  maxNavigationCount = 5,
}: Params): Result {
  const totalPages = Math.ceil(elementCount / elementsPerPage);
  if (currentPage < 0) currentPage = 0;
  if (currentPage >= totalPages) currentPage = totalPages - 1;

  const startIndex = Math.min(currentPage * elementsPerPage, elementCount);
  const endIndex = Math.min(
    currentPage * elementsPerPage + elementsPerPage,
    elementCount
  );

  const navigationList = [...Array(totalPages).keys()];
  const partialNavigation = partialNavbar({
    list: navigationList,
    maxLength: maxNavigationCount,
    index: currentPage,
  });

  return {
    elementCount,
    elementsPerPage,
    currentPage,
    maxNavigationCount,
    startIndex,
    endIndex,
    navigationList: partialNavigation.list,
    navigationIndex: partialNavigation.index,
    totalPages,
  };
}
