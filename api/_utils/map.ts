/**
 * Performs a filter after amapping operation in O(n) time
 * @param array array An array of elements to apply this transform
 * @param filterFn A function which resolves a boolean. A true return will appear in the final output array
 * @param mappingFn A function to transform an array element into the mapping
 * @param mapFirst If true, the element will be transformed prior to being filtered
 * @returns A copy of the `array`, but filtered and mapped
 */
export function applyMapFilter<InputType, MapType>(
  array: InputType[],
  filterFn: (arg: MapType) => boolean,
  mappingFn: (arg: InputType) => MapType
) {
  return array.reduce((accumulator: MapType[], currentValue: InputType) => {
    const currentValueMapping = mappingFn(currentValue);
    if (filterFn(currentValueMapping)) {
      accumulator.push(currentValueMapping);
    }
    return accumulator;
  }, []);
}
