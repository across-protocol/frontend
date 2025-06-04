import { assert, Struct } from "superstruct";
import { getLogger } from "../_utils";

export interface ApiHandlerConfig<TRequest, TResponse> {
  name: string;
  requestSchema: Struct<TRequest>;
  responseSchema: Struct<TResponse>;
  headers: Record<string, string>;
}

export abstract class ApiHandler<TRequest, TResponse> {
  protected readonly name: string;
  protected readonly requestSchema: Struct<TRequest>;
  protected readonly responseSchema: Struct<TResponse>;
  protected readonly responseHeaders: Record<string, string>;

  constructor(config: ApiHandlerConfig<TRequest, TResponse>) {
    this.name = config.name;
    this.requestSchema = config.requestSchema;
    this.responseSchema = config.responseSchema;
    this.responseHeaders = config.headers;
  }

  public get handlerResponseHeaders(): Record<string, string> {
    return this.responseHeaders;
  }

  public get handlerName(): string {
    return this.name;
  }

  public async handle(request: Partial<TRequest>): Promise<TResponse> {
    const logger = getLogger();

    try {
      logger.debug({
        at: this.name,
        message: `${this.name} request received`,
        request: request,
      });

      assert(request, this.requestSchema);

      const result = await this.process(request as TRequest);
      assert(result, this.responseSchema);

      logger.debug({
        at: this.name,
        message: `${this.name} request processed`,
        response: result,
      });

      return result;
    } catch (error: unknown) {
      logger.error({
        at: this.name,
        message: `${this.name} request failed`,
        error,
      });
      throw error;
    }
  }

  protected abstract process(request: TRequest): Promise<TResponse>;
}
