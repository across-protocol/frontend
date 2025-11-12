/**
 * Simple utility to change color opacity using color-mix
 */

/**
 * Creates a color with a specific opacity using color-mix
 * @param color - The base color (any valid CSS color)
 * @param opacity - The opacity value (0-1)
 * @returns The color with the specified opacity
 */
export function withOpacity(color: string, opacity: number): string {
  return `color-mix(in srgb, ${color} ${opacity * 100}%, transparent)`;
}
