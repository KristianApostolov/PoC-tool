//! @audit-issue TYPESCRIPT IS A DUMPSTER FIRE!
import "@nomicfoundation/hardhat-ethers";
import { ethers } from "hardhat";
import {
    Contract as EthersContract,
    FunctionFragment as EthersFunctionFragment,
    AbstractProvider as EthersAbstractProvider,
    CallExceptionError as EthersCallExceptionError,
    InterfaceAbi as EthersInterfaceAbi,
    Interface as EtherInterface,
    ParamType as EthersParamType,
    AddressLike as EthersAddressLike,
    TransactionResponse as EthersTransactionResponse,
    TransactionReceipt as EthersTransactionReceipt
} from "ethers";

import { Address, Selector } from "./evmUtils";
import { LogicError, /* throwLogicError */ } from "./error";

import { StateMutabilityType, Transaction } from "../interfaces/evmUtils";
import { DDContract, DDStep } from "../interfaces/index";

function getContract(address: Address, functionString: string): {contractInstance: EthersContract, functionFragment: EthersFunctionFragment} {
    const functionFragment = getFunctionFromFunctionString(functionString);

    return {
        contractInstance: new ethers.Contract(address.value, new ethers.Interface([functionFragment])),
        functionFragment
    };
}

function getFunction(contract: EthersContract, selector: Selector): EthersFunctionFragment {
    try {
        const _function = contract.interface.getFunction(selector.value);
        if (_function === null) throw new LogicError("Function with such a selector not found.", 422);
        return _function!;
    }
    catch (_) { 
        // console.log(_);
        throw new LogicError("Function with such a selector not found.", 422);
    }
}

function getFunctionParameters(_fragments: string[]): EthersParamType[] {
    return _fragments.map((_fragment: string) => {
        // example fragment: "uint256 amount"
        const [type, name] = _fragment.split(" ");
        return EthersParamType.from({
            guard: null,
            name: name,
            type,
            baseType: type,
            indexed: null,
            components: null,
            arrayLength: null,
            arrayChildren: null
        });
    });
 }

function getFunctionFromFunctionString(_fragment: string): EthersFunctionFragment {
    // example fragment: "function getRewards() external"

    // [0] = "function"
    // [1] = function name + args
    // [2] = visibility
    // [3] = state mutability
    // [4] = function type
    // [5] = payable
    const fragment = _fragment.split(" ");
    if (fragment.length < 2) throw new LogicError("Invalid function string.", 422);

    const nameAndArgsIndex: 1 | 0 = (fragment[0] === "function" ? 1 : 0);
    const nameAndArgs = fragment[nameAndArgsIndex].split("(");
    if (nameAndArgs.length < 2) throw new LogicError("Invalid function string.", 422);
    const args = getFunctionParameters(nameAndArgs[1].split(")")[0].split(","));
    
    let returnArgs: EthersParamType[] = [];

    if (fragment[fragment.length - 1].startsWith("(") && fragment[fragment.length - 2] === "returns") {
        let args: string | string[] = fragment[fragment.length - 1].split("(")[1].split(")")[0]
        if (args.includes(",")) args = args.split(",");
        else args = [args];
        returnArgs = getFunctionParameters(args);
    }
    
    const stateMutability = fragment.length > 3 ? fragment[3] as StateMutabilityType : "nonpayable";
    
    return EthersFunctionFragment.from({
        guard: fragment[2],
        name: nameAndArgs[0],
        stateMutability,
        inputs: args,
        outputs: returnArgs,
        gas: null
    })
}

function encodeFunctionData(contract: EthersContract, _function: EthersFunctionFragment, inputs: any[]): string { 
    return contract.interface.encodeFunctionData(_function, inputs);
}

async function validateFunctionInputs(contract: DDContract, inputs: any[]): Promise<void> {
    if (contract.inputs.length != inputs.length) throw new LogicError("Wrong number of inputs.", 422);
}

// @audit-info Not done yet:
// async function parseFunctionOutput(result: any, outputMappings: { [variableName: string]: number }): Promise<void> {
//     for (const [variableName, returnValueIndex] of Object.entries(outputMappings)) {
//         if (returnValueIndex >= result.length) {
//             throwLogicError("Wrong number of return values.", 422);
//         }
//         const returnValue = result[returnValueIndex];
//     }
// }

async function executeStep(step: DDStep): Promise<Transaction> {
    // @audit-info Passing native tokens is not supported yet.
    try {
        const { call, /* ouputMappings */ } = step;
        const { from, contract } = call;
        const { address, functionString, inputs } = contract;

        const {contractInstance, functionFragment } = getContract(Address.toAddress(address),functionString);
        const contractFunction = getFunction(contractInstance, Selector.toSelector(functionFragment.selector));
        const encodedData = encodeFunctionData(contractInstance, contractFunction, inputs);

        await validateFunctionInputs(contract, inputs);

        const signer = await ethers.getImpersonatedSigner(from);

        const tx = await (await signer.sendTransaction({ to: await contractInstance.getAddress(), data: encodedData })).wait();
        
        if (!tx) throw new LogicError("Transaction failed.", 422);

        if (tx!.status == 0) throw new LogicError("Transaction reverted.", 422);
        
        return {
            output: await signer.call({
                to: await contractInstance.getAddress(),
                data: encodedData
            }),
            receipt: tx, success: !!tx.status
        };
    } catch (e: unknown) {
        if (e instanceof LogicError) {
            throw e;
        } else if ((e as EthersCallExceptionError).data != undefined) { // A sketchy way to check if it's an ethers transaction error
            // @audit-info needs to be changed out with an appropriate error code depending on the issue
            throw new LogicError((e as Error).message, 400);
        }
        else {
            throw new LogicError((e as Error).message, 500);
        }
    }
}

async function executeSequence(sequence: DDStep[]): Promise<Transaction[]> {
    const returnData: Transaction[] = [];
    if (sequence.length == 0) throw new LogicError("Empty sequence.", 422);
    for (const step of sequence) returnData.push(await executeStep(step));
    return returnData;
}

// @audit-info Anything bellow is just test code:

async function run() {

    // @audit testing:
    // const lock = await( await ethers.getContractFactory("Lock")).deploy((await ethers.provider.getBlock((await ethers.provider.getBlockNumber()) )as any).timestamp + 10 as any);

    const _step: DDStep = {
        call: {
            from: "0x0000000000000000000000000000000000000001",
            contract: {
                address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // await lock.getAddress(),
                functionString: "function balanceOf(address account) external view returns (uint)", // "0x70a08231", // lock.withdraw.getFragment().selector,
                inputs: ["0x0EBBf3b11ae65958d6265641C48f19126a575bD5"]
            }
        },
        ouputMappings: {}
    }

    console.log("My mainnet usdc balance: ", (await executeSequence([_step, _step]))[0]);


}

run();