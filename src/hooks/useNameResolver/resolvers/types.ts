export interface NameResolver {
  suffix: string;
  resolve: (name: string) => Promise<string | null>;
  canResolve: (input: string) => boolean;
}
