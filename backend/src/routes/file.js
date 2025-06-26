const express = require('express');
const config = require('../config');
const path = require('path');
const passport = require('passport');
const services = require('../services/file');
const router = express.Router();

router.get('/download', (req, res) => {
  if (process.env.NODE_ENV == "production" || process.env.NEXT_PUBLIC_BACK_API) {
    services.downloadGCloud(req, res);
  }
  else {
    services.downloadLocal(req, res);
  }
});

router.post('/upload/:table/:field', passport.authenticate('jwt', {session: false}), (req, res) => {
  const fileName = `${req.params.table}/${req.params.field}`;

  if (process.env.NODE_ENV == "production" || process.env.NEXT_PUBLIC_BACK_API) {
    services.uploadGCloud(fileName, req, res);
  }
  else {
    services.uploadLocal(fileName, {
      entity: null,
      maxFileSize: 10 * 1024 * 1024,
      folderIncludesAuthenticationUid: false,
    })(req, res);
  }
});

module.exports = router;
