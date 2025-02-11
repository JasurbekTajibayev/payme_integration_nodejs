const transactionRepo = require("../repositories/transaction.repo");
const deviceRepo = require("../repositories/device.repo");
const axios = require('axios');
const {
  PaymeError,
  PaymeData,
  TransactionState,
} = require("../enums/transaction.enum");

const TransactionError = require("../errors/transaction.error");

class TransactionService {
  constructor(repo,deviceRepo) {
    this.repo = repo;
    this.deviceRepo=deviceRepo; 
  }

  async checkPerformTransaction(params, id) {
    const {
      account: { device_id: deviceId },
    } = params;
    let { amount } = params;

    amount = Math.floor(amount / 100);

    const device = await this.deviceRepo.getById(deviceId);
    if (!device) {
      throw new TransactionError(PaymeError.UserNotFound, id, PaymeData.DeviceId);
    }
    if (amount < 50) {
      throw new TransactionError(PaymeError.InvalidAmount, id);
    }
  }

  async checkTransaction(params, id) {
    const transaction = await this.repo.getById(params.id);
    if (!transaction) {
      throw new TransactionError(PaymeError.TransactionNotFound, id);
    }

    return {
      create_time: transaction.create_time,
      perform_time: transaction.perform_time,
      cancel_time: transaction.cancel_time,
      transaction: params.id,
      state: transaction.state,
      reason: transaction.reason,
    };
  }

  async createTransaction(params, id) {
    const {
      account: { device_id: deviceId },
      time,
    } = params;
    let { amount } = params;

    amount = Math.floor(amount / 100);

    await this.checkPerformTransaction(params, id);

    let transaction = await this.repo.getById(params.id);

    if (transaction) {
      if (transaction.state !== TransactionState.Pending) {
        throw new TransactionError(PaymeError.CantDoOperation, id);
      }

      const currentTime = Date.now();

      const expirationTime =
        (currentTime - transaction.create_time) / 60000 < 12; // 12m

      if (!expirationTime) {
        await this.repo.updateById(params.id, {
          state: TransactionState.PendingCanceled,
          reason: 4,
        });

        throw new TransactionError(PaymeError.CantDoOperation, id);
      }

      return {
        create_time: transaction.create_time,
        transaction: params.id,
        state: TransactionState.Pending,
      };
    }

    transaction = await this.repo.getByFilter({
      id: params.id,
      device_id: deviceId
    });
    if (transaction) {
      if (transaction.state === TransactionState.Paid)
        throw new TransactionError(PaymeError.AlreadyDone, id);
      if (transaction.state === TransactionState.Pending)
        throw new TransactionError(PaymeError.Pending, id);
    }
    
    const newTransaction = await this.repo.create({
      id: params.id,
      state: TransactionState.Pending,
      amount,
      device_id: deviceId,
      create_time: time,
    });
    
    return {
      transaction: params.id,
      state: TransactionState.Pending,
      create_time: time,
    };
  }

  async performTransaction(params, id) {
    const currentTime = Date.now();
    const transaction = await this.repo.getById(params.id);
    if (!transaction) {
      throw new TransactionError(PaymeError.TransactionNotFound, id);
    }
    const device = await this.deviceRepo.getById(transaction.device_id);
    // amount ni boshqa serverga yo'naltirish.
    // try {
    //   const s= await axios.post(device.url,{balance:transaction.amount});
    //   } 
    // catch (error) {
    //       console.log(error);
    //   }
    
    
      if (transaction.state !== TransactionState.Pending) {
      if (transaction.state !== TransactionState.Paid) {
        throw new TransactionError(PaymeError.CantDoOperation, id);
      }
      return {
        perform_time: transaction.perform_time,
        transaction: params.id.toString(),
        state: TransactionState.Paid,
      };
    }

    const expirationTime = (currentTime - transaction.create_time) / 60000 < 12; // 12m

    if (!expirationTime) {
      await this.repo.updateById(params.id, {
        state: TransactionState.PendingCanceled,
        reason: 4,
        cancel_time: currentTime,
      });

      throw new TransactionError(PaymeError.CantDoOperation, id);
    }

    await this.repo.updateById(params.id, {
      state: TransactionState.Paid,
      perform_time: currentTime,
    });

    return {
      perform_time: currentTime,
      transaction: params.id,
      state: TransactionState.Paid,
    };
  }

  async cancelTransaction(params, id) {
    const transaction = await this.repo.getById(params.id);
    if (!transaction) {
      throw new TransactionError(PaymeError.TransactionNotFound, id);
    }

    const currentTime = Date.now();

    if (transaction.state > 0) {
      await this.repo.updateById(params.id, {
        state: -Math.abs(transaction.state),
        reason: params.reason,
        cancel_time: currentTime,
      });
    }

    return {
      cancel_time: transaction.cancel_time || currentTime,
      transaction: params.id,
      state: -Math.abs(transaction.state),
    };
  }
}

module.exports = new TransactionService(transactionRepo, deviceRepo);