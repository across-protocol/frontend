import { VercelResponse } from "@vercel/node";
import { TypedVercelRequest } from "../_types";
import { getLogger, handleErrorCondition } from "../_utils";
import { ApiAdapter } from "../_base/api-adapter";
import { ApiHandler } from "../_base/api-handler";

type VercelHandler<TRequest> = (
  request: TypedVercelRequest<TRequest>,
  response: VercelResponse
) => Promise<VercelResponse | void>;

export class VercelAdapter<TRequest, TResponse> extends ApiAdapter<
  TRequest,
  TResponse,
  VercelHandler<TRequest>
> {
  protected adapt(
    handler: ApiHandler<TRequest, TResponse>
  ): VercelHandler<TRequest> {
    return async (
      request: TypedVercelRequest<TRequest>,
      response: VercelResponse
    ) => {
      const logger = getLogger();

      try {
        const result = await handler.handle(request.query);

        Object.entries(handler.handlerResponseHeaders).forEach(
          ([key, value]) => {
            response.setHeader(key, value);
          }
        );

        response.status(200).json(result);
      } catch (error: unknown) {
        return handleErrorCondition(
          handler.handlerName,
          response,
          logger,
          error
        );
      }
    };
  }
}
