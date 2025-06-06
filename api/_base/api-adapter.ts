import { ApiHandler } from "./api-handler";

export abstract class ApiAdapter<TRequest, TResponse, THandler> {
  protected abstract adapt(handler: ApiHandler<TRequest, TResponse>): THandler;

  public adaptHandler(handler: ApiHandler<TRequest, TResponse>): THandler {
    return this.adapt(handler);
  }
}
