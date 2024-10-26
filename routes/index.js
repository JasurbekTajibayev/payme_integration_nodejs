const express = require("express");
const Device = require("../models/device.model");
const Trnsaction = require("../models/transaction.model");
const transactionController = require("../controllers/transaction.controller");

const { paymeCheckToken } = require("../middlewares/transaction.middleware");

const router = express.Router();

router.post("/payments/payme", paymeCheckToken, transactionController.payme.bind(transactionController));


router.post("/add/device", async (req, res)=>{
    try {
        const { id, name, url } = req.body;
        if(!id) {
            return res.json({
                'status': 'bad',
                'msg': 'ID kiritilmadi!'
            })
        }
        if(!name) {
            return res.json({
                'status': 'bad',
                'msg': 'Name kiritilmadi!'
            })
        }
        if(!url) {
            return res.json({
                'status': 'bad',
                'msg': 'URL kiritilmadi!'
            })
        }
        const newDevice = await new Device({
            id: id,
            name: name,
            url: url
        })
        const saveDevice = await newDevice.save();
        return res.json({
            'status': 'OK',
            'msg': 'Yangi Device yaratildi'
        });
    } catch (error) {
        console.log(error.message);
    }
});

router.get('/', function(req, res) {
    res.send('hello world');
  });

router.get('/info', async (req, res)=> {
    var transactions;
    var device;
    try {
        transactions = await Trnsaction.find({});
        device=await Device.find({});
    } catch (error) {
        console.log(error);
    }
    return res.json({
        transactions: transactions,
        device: device
    });
} );


module.exports = router;
