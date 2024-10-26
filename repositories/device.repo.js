const deviceModel = require("../models/device.model");
class DeviceRepo {
  constructor(model) {
    this.model = model;
  }

  async getById(deviceId) {
        return this.model.findOne({id: deviceId});
  }
}

module.exports = new DeviceRepo(deviceModel);
