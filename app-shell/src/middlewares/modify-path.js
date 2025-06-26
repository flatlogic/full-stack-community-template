function modifyPath(req, res, next) {
    if (req.body && req.body.path) {
      req.body.path = '../../../' + req.body.path;
    }
    next();
  }
  
module.exports = modifyPath;