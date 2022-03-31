export default function usePagination(
  elementsLength: number,
  totalPerPage: number
) {
  const maxPage = Math.max(elementsLength / totalPerPage);
  const pagesToCreate: number[] = [];
  for (let i = 0; i < maxPage; i++) {
    pagesToCreate.push(i + 1);
  }
  return { maxPage, pagesToCreate };
}
