const express = require('express');
const wrapAsync = require('../helpers').wrapAsync; // Ваша обёртка для обработки асинхронных маршрутов
const VSC = require('../services/vcs');
const router = express.Router();

router.post('/init', wrapAsync(async (req, res) => {
    const result = await VSC.initRepo();
    res.status(200).send(result);
}));

router.post('/commit', wrapAsync(async (req, res) => {
    const { message, files, dev_schema } = req.body;
    const result = await VSC.commitChanges(message, files, dev_schema);
    res.status(200).send(result);
}));

router.post('/log', wrapAsync(async (req, res) => {
    const result = await VSC.getLog();
    res.status(200).send(result);
}));

router.post('/rollback', wrapAsync(async (req, res) => {
    const { ref } = req.body;
    // const result = await VSC.checkout(ref);
    const result = await VSC.revert(ref);
    res.status(200).send(result);
}));

router.post('/sync-to-stable', wrapAsync(async (req, res) => {
    const result = await VSC.mergeDevIntoMaster();
    res.status(200).send(result);
}));

router.post('/reset-dev', wrapAsync(async (req, res) => {
    const result = await VSC.resetDevBranch();
    res.status(200).send(result);
}));

router.use('/', require('../helpers').commonErrorHandler);
module.exports = router;