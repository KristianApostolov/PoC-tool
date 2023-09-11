import { TransactionReceipt as EthersTransactionReceipt } from "ethers";

type StateMutabilityType = "payable" | "nonpayable" | "view" | "pure";

type Transaction = {
    output: string;
    receipt: EthersTransactionReceipt;
    success: boolean;
}

export { StateMutabilityType, Transaction }