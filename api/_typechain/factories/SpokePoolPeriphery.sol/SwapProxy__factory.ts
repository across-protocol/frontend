/* Autogenerated file. Do not edit manually. */
/* tslint:disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  SwapProxy,
  SwapProxyInterface,
} from "../../SpokePoolPeriphery.sol/SwapProxy";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_permit2",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "InvalidExchange",
    type: "error",
  },
  {
    inputs: [],
    name: "SwapFailed",
    type: "error",
  },
  {
    inputs: [],
    name: "UnsupportedTransferType",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
      {
        internalType: "bytes",
        name: "",
        type: "bytes",
      },
    ],
    name: "isValidSignature",
    outputs: [
      {
        internalType: "bytes4",
        name: "magicBytes",
        type: "bytes4",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "inputToken",
        type: "address",
      },
      {
        internalType: "address",
        name: "outputToken",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "inputAmount",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "exchange",
        type: "address",
      },
      {
        internalType: "enum SpokePoolPeripheryInterface.TransferType",
        name: "transferType",
        type: "uint8",
      },
      {
        internalType: "bytes",
        name: "routerCalldata",
        type: "bytes",
      },
    ],
    name: "performSwap",
    outputs: [
      {
        internalType: "uint256",
        name: "outputAmount",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "permit2",
    outputs: [
      {
        internalType: "contract IPermit2",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

const _bytecode =
  "0x60a03461009357601f610ceb38819003918201601f19168301916001600160401b038311848410176100975780849260209460405283398101031261009357516001600160a01b038116908190036100935760015f55608052604051610c3f90816100ac82396080518181816101230152818161030e015281816104ce015281816105a30152818161077001526108670152f35b5f80fd5b634e487b7160e01b5f52604160045260245ffdfe6080806040526004361015610012575f80fd5b5f905f3560e01c90816312261ee71461081f575080631626ba7e146107085763c0437b7c1461003f575f80fd5b346106585760c07ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc3601126106585760043573ffffffffffffffffffffffffffffffffffffffff811681036106585760249081359073ffffffffffffffffffffffffffffffffffffffff821682036106585773ffffffffffffffffffffffffffffffffffffffff60643516606435036106585760843560038110156106585760a43567ffffffffffffffff8111610658576100fe90369060040161088b565b9260025f54146106585760025f5573ffffffffffffffffffffffffffffffffffffffff7f00000000000000000000000000000000000000000000000000000000000000001673ffffffffffffffffffffffffffffffffffffffff60643516146106de578692806102ae5750906101938394926044359073ffffffffffffffffffffffffffffffffffffffff6064359116610984565b81604051928392833781018381520390826064355af16101b1610927565b501561028457602060405180937f70a082310000000000000000000000000000000000000000000000000000000082523060048301528173ffffffffffffffffffffffffffffffffffffffff85165afa918215610279578392610240575b506020926102378360019373ffffffffffffffffffffffffffffffffffffffff339116610ab9565b55604051908152f35b9091506020813d602011610271575b8161025c602093836108b9565b8101031261026d575190602061020f565b8280fd5b3d915061024f565b6040513d85823e3d90fd5b60046040517f81ceff30000000000000000000000000000000000000000000000000000000008152fd5b600181036102e65750906102e18394926044359073ffffffffffffffffffffffffffffffffffffffff6064359116610ab9565b610193565b919250906002036106b45761034a60443573ffffffffffffffffffffffffffffffffffffffff7f00000000000000000000000000000000000000000000000000000000000000001673ffffffffffffffffffffffffffffffffffffffff8416610984565b60017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00600254161760025573ffffffffffffffffffffffffffffffffffffffff81165f52600160205260405f2073ffffffffffffffffffffffffffffffffffffffff606435165f5260205260405f2080549065ffffffffffff808316146106885765ffffffffffff600181841601167fffffffffffffffffffffffffffffffffffffffffffffffffffff00000000000083161790556040519182608081011067ffffffffffffffff60808501111761065c579073ffffffffffffffffffffffffffffffffffffffff65ffffffffffff926080850160405216835273ffffffffffffffffffffffffffffffffffffffff6044351660208401528142166040840152166060820152604051906060820182811067ffffffffffffffff82111761065c5760405281526020810173ffffffffffffffffffffffffffffffffffffffff606435168152604082019042825273ffffffffffffffffffffffffffffffffffffffff7f0000000000000000000000000000000000000000000000000000000000000000163b156106585773ffffffffffffffffffffffffffffffffffffffff9065ffffffffffff6060604051957f2b67b57000000000000000000000000000000000000000000000000000000000875230600488015251848151168b8801528460208201511660448801528260408201511660648801520151166084850152511660a48301525160c482015261010060e48201525f6101048201525f81610124818373ffffffffffffffffffffffffffffffffffffffff7f0000000000000000000000000000000000000000000000000000000000000000165af1801561064d57610602575b50849182917fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0060025416600255610193565b9091945067ffffffffffffffff8111610621576040525f93905f6105d0565b837f4e487b71000000000000000000000000000000000000000000000000000000005f5260416004525ffd5b6040513d5f823e3d90fd5b5f80fd5b867f4e487b71000000000000000000000000000000000000000000000000000000005f5260416004525ffd5b867f4e487b71000000000000000000000000000000000000000000000000000000005f5260116004525ffd5b60046040517f4b26f70d000000000000000000000000000000000000000000000000000000008152fd5b60046040517f40892c33000000000000000000000000000000000000000000000000000000008152fd5b346106585760407ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc3601126106585760243567ffffffffffffffff81116106585761075790369060040161088b565b505073ffffffffffffffffffffffffffffffffffffffff7f000000000000000000000000000000000000000000000000000000000000000016331480610813575b156107eb5760207f1626ba7e000000000000000000000000000000000000000000000000000000005b7fffffffff0000000000000000000000000000000000000000000000000000000060405191168152f35b60207fffffffff000000000000000000000000000000000000000000000000000000006107c1565b5060ff60025416610798565b34610658575f7ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc3601126106585760209073ffffffffffffffffffffffffffffffffffffffff7f0000000000000000000000000000000000000000000000000000000000000000168152f35b9181601f840112156106585782359167ffffffffffffffff8311610658576020838186019501011161065857565b90601f7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0910116810190811067ffffffffffffffff8211176108fa57604052565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52604160045260245ffd5b3d1561097f573d9067ffffffffffffffff82116108fa576040519161097460207fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0601f84011601846108b9565b82523d5f602084013e565b606090565b6040517f095ea7b3000000000000000000000000000000000000000000000000000000006020820181815273ffffffffffffffffffffffffffffffffffffffff851660248401526044808401969096529482529390926109e56064856108b9565b73ffffffffffffffffffffffffffffffffffffffff915f808486169287519082855af190610a11610927565b82610a87575b5081610a7c575b5015610a2c575b5050505050565b6040519460208601521660248401525f6044840152604483526080830183811067ffffffffffffffff8211176108fa57610a7293610a6d9160405282610b35565b610b35565b5f80808080610a25565b90503b15155f610a1e565b80519192508115918215610a9f575b5050905f610a17565b610ab29250602080918301019101610b1d565b5f80610a96565b6040517fa9059cbb00000000000000000000000000000000000000000000000000000000602082015273ffffffffffffffffffffffffffffffffffffffff929092166024830152604480830193909352918152610b1b91610a6d6064836108b9565b565b90816020910312610658575180151581036106585790565b73ffffffffffffffffffffffffffffffffffffffff166040516040810181811067ffffffffffffffff8211176108fa57610bb0937f5361666545524332303a206c6f772d6c6576656c2063616c6c206661696c656460205f948594604052818152015260208151910182855af1610baa610927565b91610be0565b8051908115918215610bc6575b50501561065857565b610bd99250602080918301019101610b1d565b5f80610bbd565b9015610bfa57815115610bf1575090565b3b156106585790565b50805190811561065857602001fdfea26469706673582212208f7c599e4b1d9f5bdd297a0c012211465b8ee6db6aded8e7b5ca5960a00287cd64736f6c63430008170033";

type SwapProxyConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: SwapProxyConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class SwapProxy__factory extends ContractFactory {
  constructor(...args: SwapProxyConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    _permit2: string,
    overrides?: Overrides & { from?: string }
  ): Promise<SwapProxy> {
    return super.deploy(_permit2, overrides || {}) as Promise<SwapProxy>;
  }
  override getDeployTransaction(
    _permit2: string,
    overrides?: Overrides & { from?: string }
  ): TransactionRequest {
    return super.getDeployTransaction(_permit2, overrides || {});
  }
  override attach(address: string): SwapProxy {
    return super.attach(address) as SwapProxy;
  }
  override connect(signer: Signer): SwapProxy__factory {
    return super.connect(signer) as SwapProxy__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): SwapProxyInterface {
    return new utils.Interface(_abi) as SwapProxyInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): SwapProxy {
    return new Contract(address, _abi, signerOrProvider) as SwapProxy;
  }
}
