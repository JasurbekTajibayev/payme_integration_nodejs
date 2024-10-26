module.exports = (error, req, res, next) => {
  // Logger
  console.log(error);

  // Responder
  if (error.isTransactionError) {
    return res.json({
      error: {
        code: error.transactionErrorCode,
        message: error.transactionErrorMessage,
        data: error.transactionData,
      },
      id: error.transactionId,
    });
  }

  res.status(error.statusCode || 200).json({
    error: error
  });
};
