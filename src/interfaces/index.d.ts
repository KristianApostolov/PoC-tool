// Implies a return value and a way to handle it, as well as a single function which will be called
interface DDContract {
  functionString: string; // Abi Function e.g. "function getRewards() external"
  address: string;  // Address of the receiving contract
  inputs: string[] // variableName[] A list of variables
}

// A call is always from a from and to a contract
interface DDCall {
  from: string; // Caller of the call / e.g. the owner, tool must impersonate them
  contract: DDContract;
}

interface DDStep {
  call: DDCall;
  ouputMappings: {
    [variableName: string]: number // returnValueIndex
  } 
}

type DDSequence = DDStep[]

interface GlobalState {
  [valueName: string]: [value: any] // prob a base type for now
}

export { DDContract, DDCall, DDStep, DDSequence, GlobalState }