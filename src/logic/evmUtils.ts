import { ethers } from "hardhat";
import { LogicError } from "./error";

// import { throwLogicError } from "./error";

abstract class TAddress {
    
    public value: string = "";
    
    public static toAddress(_: string): TAddress {
        throw new LogicError("Not implemented.", 500);
    }
}

abstract class TSelector {
    
        public value: string = "";
    
        public static toSelector(_: string): TSelector {
            throw new LogicError("Not implemented.", 500);
        }
    
}

async function isHexAndPositive(value: string): Promise<boolean> {
    const parsedValue = parseInt(value);
    if (isNaN(parsedValue)) return false;
    return value.startsWith("0x") && parseInt(value) >= 0;
}

class Address implements TAddress {

    public value: string;

    constructor(address: string) {
        if (!address.startsWith("0x") || address.length != 42 || !isHexAndPositive(address)) throw new LogicError("Invalid address.", 422);
        this.value = address;
    }

    public static toAddress(address: string): Address {
        return new Address(address)
    }

}

class Selector implements TSelector { 
    
        public value: string;
    
        constructor(selector: string) {
            if (!selector.startsWith("0x") || selector.length != 10 || !isHexAndPositive(selector)) throw new LogicError("Invalid selector.", 422);
            this.value = selector;
        }
    
        public static toSelector(selector: string): Selector {
            return new Selector(selector)
        }
}

export { Address, Selector }