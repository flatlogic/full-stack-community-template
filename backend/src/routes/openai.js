const express = require('express');
const db = require('../db/models');
const wrapAsync = require('../helpers').wrapAsync;
const router = express.Router();
const sjs = require('sequelize-json-schema');
const { getWidget, askGpt } = require('../services/openai');
const RolesService = require('../services/roles');
const RolesDBApi = require("../db/api/roles");

/**
 * @swagger
 * /api/roles/roles-info/{infoId}:
 *   delete:
 *     security:
 *       - bearerAuth: []
 *     tags: [Roles]
 *     summary: Remove role information by ID
 *     description: Remove specific role information by ID
 *     parameters:
 *       - in: path
 *         name: infoId
 *         description: ID of role information to remove
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         description: ID of the user
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: key
 *         description: Key of the role information to remove
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Role information successfully removed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: string
 *                   description: The user information
 *       400:
 *         description: Invalid ID or key supplied
 *       401:
 *         $ref: "#/components/responses/UnauthorizedError"
 *       404:
 *         description: Role not found
 *       500:
 *         description: Some server error
 */

router.delete(
    '/roles-info/:infoId',
    wrapAsync(async (req, res) => {
        const role = await RolesService.removeRoleInfoById(
            req.query.infoId,
            req.query.roleId,
            req.query.key,
            req.currentUser,
        );

        res.status(200).send(role);
    }),
);

/**
 * @swagger
 * /api/roles/role-info/{roleId}:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     tags: [Roles]
 *     summary: Get role information by key
 *     description: Get specific role information by key
 *     parameters:
 *       - in: path
 *         name: roleId
 *         description: ID of role to get information for
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: key
 *         description: Key of the role information to retrieve
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Role information successfully received
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 info:
 *                   type: string
 *                   description: The role information
 *       400:
 *         description: Invalid ID or key supplied
 *       401:
 *         $ref: "#/components/responses/UnauthorizedError"
 *       404:
 *         description: Role not found
 *       500:
 *         description: Some server error
 */

router.get(
    '/info-by-key',
    wrapAsync(async (req, res) => {
        const roleId = req.query.roleId;
        const key = req.query.key;
        const currentUser = req.currentUser;
        let info = await RolesService.getRoleInfoByKey(
            key,
            roleId,
            currentUser,
        );
        const  role = await RolesDBApi.findBy({ id: roleId });
        if (!role?.role_customization) {
            await Promise.all(["pie","bar"].map(async (e)=>{
                const schema = await sjs.getSequelizeSchema(db.sequelize, {});
                const payload = {
                    description: `Create some cool ${e} chart`,
                    modelDefinition: schema.definitions,
                };
                const widgetId = await getWidget(payload, currentUser?.id, roleId);
                if(widgetId){
                    await RolesService.addRoleInfo(
                        roleId,
                        currentUser?.id,
                        'widgets',
                        widgetId,
                        req.currentUser,
                    );
                }
            }))
            info = await RolesService.getRoleInfoByKey(
                key,
                roleId,
                currentUser,
            );
        }
        res.status(200).send(info);
    }),
);

router.post(
    '/create_widget',
    wrapAsync(async (req, res) => {
        const { description, userId, roleId } = req.body;

        const currentUser = req.currentUser;
        const schema = await sjs.getSequelizeSchema(db.sequelize, {});
        const payload = {
            description,
            modelDefinition: schema.definitions,
        };

        const widgetId = await getWidget(payload, userId, roleId);

        if (widgetId) {
            await RolesService.addRoleInfo(
                roleId,
                userId,
                'widgets',
                widgetId,
                currentUser,
            );

            return res.status(200).send(widgetId);
        } else {
            return res.status(400).send(widgetId);
        }
    }),
);

/**
 * @swagger
 * /api/openai/ask:
 *   post:
 *     security:
 *       - bearerAuth: []
 *     tags: [OpenAI]
 *     summary: Ask a question to ChatGPT
 *     description: Send a question to OpenAI's ChatGPT and get a response
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question:
 *                 type: string
 *                 description: The question to ask ChatGPT
 *               apiKey:
 *                 type: string
 *                 description: OpenAI API key
 *     responses:
 *       200:
 *         description: Question successfully answered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Whether the request was successful
 *                 data:
 *                   type: string
 *                   description: The answer from ChatGPT
 *       400:
 *         description: Invalid request
 *       401:
 *         $ref: "#/components/responses/UnauthorizedError"
 *       500:
 *         description: Some server error
 */
router.post(
    '/ask-gpt',
    wrapAsync(async (req, res) => {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).send({
                success: false,
                error: 'Question and API key are required',
            });
        }

        const response = await askGpt(prompt);

        if (response.success) {
            return res.status(200).send(response);
        } else {
            return res.status(500).send(response);
        }
    }),
);


module.exports = router;
