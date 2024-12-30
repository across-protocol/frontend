import axios from "axios";
import { RelayRequest, RelayStrategy } from "../_types";
import { encodeCalldataForRelayRequest } from "../_utils";

const GELATO_API_KEY = process.env.GELATO_API_KEY;

export function getGelatoStrategy(): RelayStrategy {
  return {
    strategyName: "gelato",
    queueParallelism: 2,
    relay: async (request: RelayRequest) => {
      const encodedCalldata = encodeCalldataForRelayRequest(request);

      const taskId = await relayWithGelatoApi({
        chainId: request.chainId,
        target: request.to,
        data: encodedCalldata,
      });

      let txHash: string | undefined;

      while (true) {
        const taskStatus = await getGelatoTaskStatus(taskId);

        if (
          ["Cancelled", "NotFound", "ExecReverted", "Blacklisted"].includes(
            taskStatus.taskState
          )
        ) {
          throw new Error(
            `Can not relay request via Gelato due to task state ${taskStatus.taskState}`
          );
        }

        if (taskStatus.transactionHash) {
          txHash = taskStatus.transactionHash;
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 1_000));
      }

      return txHash;
    },
  };
}

const gelatoBaseUrl = "https://api.gelato.digital";

async function relayWithGelatoApi({
  chainId,
  target,
  data,
}: {
  chainId: number;
  target: string;
  data: string;
}) {
  if (!GELATO_API_KEY) {
    throw new Error("Can not call Gelato API: key is not set");
  }

  const response = await axios.post(
    `${gelatoBaseUrl}/relays/v2/sponsored-call`,
    {
      chainId,
      target,
      data,
      sponsorApiKey: GELATO_API_KEY,
    }
  );

  return response.data.taskId as string;
}

async function getGelatoTaskStatus(taskId: string) {
  const response = await axios.get<{
    task: {
      taskState:
        | "CheckPending"
        | "ExecPending"
        | "ExecSuccess"
        | "ExecReverted"
        | "WaitingForConfirmation"
        | "Blacklisted"
        | "Cancelled"
        | "NotFound";
      transactionHash?: string;
    };
  }>(`${gelatoBaseUrl}/tasks/status/${taskId}`);
  return response.data.task;
}
