const db = require('../db/models');
const config = require('../config');
const ForbiddenError = require('../services/notifications/errors/forbidden');

module.exports = async function requireAccountAdmin(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

  try {
    const user = req.currentUser;
    if (user.role === 'admin') return next();
    const roleAssociation = db.users.associations.app_role;
    if (roleAssociation && user[roleAssociation.foreignKey]) {
      const role = await roleAssociation.target.findByPk(user[roleAssociation.foreignKey]);
      if (role && role.name === config.roles.admin) return next();
    } else if (!user.role && user.id === config.seededAdminId) {
      // Older seeders created the administrator without assigning a role.
      return next();
    }
    return next(new ForbiddenError());
  } catch (error) {
    return next(error);
  }
};
