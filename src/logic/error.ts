class LogicError extends Error {
  statusCode = 400;

  constructor(message: string, _statusCode?: number) {
    super(message);
      
    if (_statusCode) this.statusCode = _statusCode;
      
    Object.setPrototypeOf(this, LogicError.prototype);
  }

  getErrorMessage(): object {
      return {
        "message": this.message,
        "statusCode": this.statusCode
    }
  }
}

// function throwLogicError(message: string, statusCode?: number): void {
//     throw new LogicError(message, statusCode);
// }

export { LogicError, /* throwLogicError */ }