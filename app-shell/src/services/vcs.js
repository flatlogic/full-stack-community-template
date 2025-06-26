const util = require('util');
const exec = util.promisify(require('child_process').exec);
const path = require('path');
const { promises: fs } = require("fs");
const axios = require('axios');
const config = require('../config.js');

const ROOT_PATH = '/app';
const MAX_BUFFER = 1024 * 1024 * 50;
const GITEA_DOMAIN = config.gitea_domain;
const USERNAME = config.gitea_username;
const API_TOKEN = config.gitea_api_token;
const GITHUB_REPO_URL = config.github_repo_url;
const GITHUB_TOKEN = config.github_token;

const devSchemaFilePath = path.join(ROOT_PATH, '/app-shell/src/_schema.json');

class VCS {
    static isInitRepoRunning = false;
    // Main method – controller of the repository initialization process
    static async initRepo(projectId = 'test') {
        if (VCS.isInitRepoRunning) {
            console.warn('[WARNING] initRepo is already running. Skipping.');
            return;
        }
        VCS.isInitRepoRunning = true;
        try {
            console.log(`[DEBUG] Starting repository initialization for project "${projectId}"...`);

            await this._waitForGitLockRelease(path.join(ROOT_PATH, '.git'));
            // await this._removeGitLockIfExists(path.join(ROOT_PATH, '.git'));
            console.log('[DEBUG] Git lock released, proceeding with initialization...');

            if (GITHUB_REPO_URL) {
                console.log(`[DEBUG] GitHub repository URL provided: ${GITHUB_REPO_URL}`);
                console.log(`[DEBUG] Setting up local GitHub repository...`);
                await this.setupLocalGitHubRepo();
                console.log(`[DEBUG] GitHub repository setup completed.`);
            } else {
                console.log(`[DEBUG] No GitHub repository URL provided. Skipping GitHub setup.`);
            }

            console.log(`[DEBUG] Setting up Gitea remote repository for project "${projectId}"...`);
            const giteaRemoteUrl = await this.setupGiteaRemote(projectId);
            console.log(`[DEBUG] Gitea remote URL: ${giteaRemoteUrl.replace(/\/\/.*?@/, '//***@')}`);

            if (!GITHUB_REPO_URL) {
                console.log(`[DEBUG] Setting up local repository with Gitea remote...`);
                await this.setupLocalRepo(giteaRemoteUrl);
                console.log(`[DEBUG] Local repository setup with Gitea remote completed.`);
            } else {
                console.log(`[DEBUG] Adding Gitea as additional remote to existing GitHub repository...`);
                await this._addGiteaRemote(giteaRemoteUrl);
                console.log(`[DEBUG] Gitea remote added to GitHub repository.`);
            }

            console.log(`[DEBUG] Repository initialization for project "${projectId}" completed successfully.`);
            console.log(`[DEBUG] Repository configuration: GitHub: ${GITHUB_REPO_URL ? 'Yes' : 'No'}, Gitea: Yes`);

            return { message: `Repository ${projectId} is ready.` };
        } catch (error) {
            console.error(`[ERROR] Repository initialization for project "${projectId}" failed: ${error?.message}`);

            throw new Error(`Error during repo initialization: ${error.message}`);
        } finally {
            VCS.isInitRepoRunning = false;
            console.log(`[DEBUG] Repository initialization process for "${projectId}" finished.`);
        }
    }

    // Checks for the existence of the remote repo and creates it if it doesn't exist
    static async setupGiteaRemote(projectId) {
        console.log(`[DEBUG] Checking Gitea remote repository "${projectId}"...`);
        let repoData = await this.checkRepoExists(projectId);
        if (!repoData) {
            console.log(`[DEBUG] Gitea remote repository "${projectId}" does not exist. Creating...`);
            repoData = await this.createRemoteRepo(projectId);
            console.log(`[DEBUG] Gitea remote repository created: ${JSON.stringify(repoData)}`);
        } else {
            console.log(`[DEBUG] Gitea remote repository "${projectId}" already exists.`);
        }
        // Return the URL with token authentication
        return `https://${USERNAME}:${API_TOKEN}@${GITEA_DOMAIN}/${USERNAME}/${projectId}.git`;
    }

    // Sets up the local repository: either fetches/reset if .git exists,
    // initializes git in a non-empty directory, or clones the repository if empty.
    static async setupLocalRepo(remoteUrl) {
        const gitDir = path.join(ROOT_PATH, '.git');
        const localRepoExists = await this.exists(gitDir);
        if (localRepoExists) {
            await this.fetchAndResetRepo();
        } else {
            const files = await fs.readdir(ROOT_PATH);
            if (files.length > 0) {
                await this.initializeGitRepo(remoteUrl);
            } else {
                console.log('[DEBUG] Local directory is empty. Cloning remote repository...');
                await exec(`git clone ${remoteUrl} .`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
            }
        }
    }

    static async setupLocalGitHubRepo() {
        try {
            if (!GITHUB_REPO_URL) {
                console.log('[DEBUG] GITHUB_REPO_URL is not set. Skipping GitHub repo setup.');
                return;
            }

            const gitDir = path.join(ROOT_PATH, '.git');
            const repoExists = await this.exists(gitDir);

            if (repoExists) {
                console.log('[DEBUG] Git repository already initialized. Fetching and resetting...');

                await this._addGithubRemote();

                console.log('[DEBUG] Fetching GitHub remote...');
                await exec(`git fetch github`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });

                try {
                    console.log('[DEBUG] Checking for remote branch "github/ai-dev"...');
                    await exec(`git rev-parse --verify github/ai-dev`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
                    console.log('[DEBUG] Remote branch "github/ai-dev" exists. Resetting local repository to github/ai-dev...');
                    await exec(`git reset --hard github/ai-dev`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
                    console.log('[DEBUG] Switching to branch "ai-dev"...');
                    await exec(`git checkout -B ai-dev`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
                } catch (e) {
                    console.log('[DEBUG] Remote branch "github/ai-dev" does NOT exist. Creating initial commit...');
                    await this.commitInitialChanges();
                }
                return;
            }

            console.log('[DEBUG] Initializing git in existing directory...');
            // const gitignorePath = path.join(ROOT_PATH, '.gitignore');
            // const ignoreContent = `node_modules/\n*/node_modules/\n*/build/\n`;
            // await fs.writeFile(gitignorePath, ignoreContent, 'utf8');

            await exec(`git init`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
            console.log('[DEBUG] Configuring git user...');
            await exec(`git config user.email "support@flatlogic.com"`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
            await exec(`git config user.name "Flatlogic Bot"`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });

            await this._addGithubRemote();

            console.log('[DEBUG] Fetching GitHub remote...');
            await exec(`git fetch github`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
            try {
                console.log('[DEBUG] Checking for remote branch "github/ai-dev"...');
                await exec(`git rev-parse --verify github/ai-dev`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
                console.log('[DEBUG] Remote branch "github/ai-dev" exists. Resetting local repository to github/ai-dev...');
                await exec(`git reset --hard github/ai-dev`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
                console.log('[DEBUG] Switching to branch "ai-dev"...');
                await exec(`git checkout -B ai-dev`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
            } catch (e) {
                console.log('[DEBUG] Remote branch "github/ai-dev" does NOT exist. Creating initial commit...');
                await this.commitInitialChanges();
            }
        } catch (error) {
            console.error(`[ERROR] Failed to setup local GitHub repo: ${error?.message}`);
            throw error;
        }
    }

    // Check if a file/directory exists
    static async exists(pathToCheck) {
        try {
            await fs.access(pathToCheck);
            return true;
        } catch {
            return false;
        }
    }

    // If the local repository exists, fetches remote data and resets the repository state
    static async fetchAndResetRepo() {
        console.log('[DEBUG] Local repository exists. Fetching remotes...');

        if (GITHUB_REPO_URL) {
            await exec(`git fetch github`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
            const branchReset = await this.tryResetToBranch('ai-dev', 'github');

            if (branchReset) {
                return;
            }
        }

        await exec(`git fetch gitea`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
        const branchReset = await this.tryResetToBranch('ai-dev', 'gitea');

        if (!branchReset) {
            const masterReset = await this.tryResetToBranch('master', 'gitea');
            if (masterReset) {
                console.log('[DEBUG] Creating and switching to branch "ai-dev"...');
                await exec(`git branch ai-dev`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
                await exec(`git checkout ai-dev`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
                console.log('[DEBUG] Pushing ai-dev branch to remotes...');
                await exec(`git push -u gitea ai-dev --force`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
                if (GITHUB_REPO_URL) {
                    await exec(`git push -u github ai-dev --force`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
                }
            } else {
                console.log('[DEBUG] Neither "gitea/ai-dev" nor "gitea/master" exist. Creating initial commit...');
                await this.commitInitialChanges();
            }
        }
    }

    // Tries to check out and reset to the specified branch
    static async tryResetToBranch(branchName, remote) {
        try {
            console.log(`[DEBUG] Checking for remote branch "${remote}/${branchName}"...`);
            await exec(`git rev-parse --verify ${remote}/${branchName}`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
            console.log(`[DEBUG] Remote branch "${remote}/${branchName}" found. Resetting local repository to "${remote}/${branchName}"...`);
            await exec(`git reset --hard ${remote}/${branchName}`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
            await exec(`git checkout ${branchName === 'ai-dev' ? 'ai-dev' : branchName}`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });

            return true;
        } catch (e) {
            console.log(`[DEBUG] Remote branch "${remote}/${branchName}" does NOT exist.`);

            return false;
        }
    }

    // If remote branch doesn't exist, make the initial commit and set up branches
    static async commitInitialChanges() {
        console.log('[DEBUG] Adding all files for initial commit...');
        await exec(`git add .`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
        const { stdout: status } = await exec(`git status --porcelain`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
        if (status.trim()) {
            await exec(`git commit -m "Initial version"`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });

            if (GITHUB_REPO_URL) {
                await exec(`git push -u github master --force`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
            }
            await exec(`git push -u gitea master --force`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });

            console.log('[DEBUG] Creating and switching to branch "ai-dev"...');
            await exec(`git branch ai-dev`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
            await exec(`git checkout ai-dev`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
            console.log('[DEBUG] Making ai-dev branch identical to master...');

            if (GITHUB_REPO_URL) {
                await exec(`git reset --hard github/master`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
            } else {
                await exec(`git reset --hard gitea/master`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
            }

            console.log('[DEBUG] Pushing ai-dev branch to remotes...');
            if (GITHUB_REPO_URL) {
                await exec(`git push -u github ai-dev --force`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
            }
            await exec(`git push -u gitea ai-dev --force`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
        } else {
            console.log('[DEBUG] No local changes to commit.');
        }
    }

    // If the local directory is not empty but .git doesn't exist, initialize git,
    // add .gitignore, configure the user, and add the remote origin.
    static async initializeGitRepo(giteaRemoteUrl) {
        console.log('[DEBUG] Local directory is not empty. Initializing git...');
        const gitignorePath = path.join(ROOT_PATH, '.gitignore');
        const ignoreContent = `node_modules/\n*/node_modules/\n*/build/\n`;
        await fs.writeFile(gitignorePath, ignoreContent, 'utf8');

        await exec(`git init`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
        console.log('[DEBUG] Configuring git user...');
        await exec(`git config user.email "support@flatlogic.com"`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
        await exec(`git config user.name "Flatlogic Bot"`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });

        console.log(`[DEBUG] Adding Gitea remote ${giteaRemoteUrl}...`);
        await exec(`git remote add gitea ${giteaRemoteUrl}`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });

        if (GITHUB_REPO_URL) {
            await this._addGithubRemote();
        }

        console.log('[DEBUG] Fetching Gitea remote...');
        await exec(`git fetch gitea`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
        try {
            console.log('[DEBUG] Checking for remote branch "gitea/ai-dev"...');
            await exec(`git rev-parse --verify gitea/ai-dev`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
            console.log('[DEBUG] Remote branch "gitea/ai-dev" exists. Resetting local repository to gitea/ai-dev...');
            await exec(`git reset --hard gitea/ai-dev`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
            console.log('[DEBUG] Switching to branch "ai-dev"...');
            await exec(`git checkout -B ai-dev`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
        } catch (e) {
            console.log('[DEBUG] Remote branch "gitea/ai-dev" does NOT exist. Creating initial commit...');
            await this.commitInitialChanges();
        }
    }

    // Method to check if the repository exists on remote server
    static async checkRepoExists(repoName) {
        const url = `https://${GITEA_DOMAIN}/api/v1/repos/${USERNAME}/${repoName}`;
        try {
            const response = await axios.get(url, {
                headers: { Authorization: `token ${API_TOKEN}` }
            });
            return response.data;
        } catch (err) {
            if (err.response && err.response.status === 404) {
                return null;
            }
            throw new Error('Error checking repository existence: ' + err?.message);
        }
    }

    // Method to create a remote repository via API
    static async createRemoteRepo(repoName) {
        const createUrl = `https://${GITEA_DOMAIN}/api/v1/user/repos`;
        console.log("[DEBUG] createUrl", createUrl);

        try {
            const response = await axios.post(createUrl, {
                name: repoName,
                description: `Repository for project ${repoName}`,
                private: false
            }, {
                headers: { Authorization: `token ${API_TOKEN}` }
            });

            return response.data;
        } catch (err) {
            console.log('Error creating repository via API: ' + err?.message)
            // throw new Error('Error creating repository via API: ' + err.message);
        }
    }

    static async commitChanges(message = "", files = '.', dev_schema) {
        try {
            console.log(`[DEBUG] Starting commit process...`);
            await this._ensureDevBranch();

            console.log(`[DEBUG] Ensuring .gitignore is properly configured...`);
            await this._ensureGitignore();

            // Save dev_schema
            await this._saveDevSchema(message, dev_schema);

            console.log(`[DEBUG] Adding files to git index: ${files}`);
            if (files === '.') {
                await exec(`git add .`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
            } else {
                await exec(`git add ${files}`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
            }

            const { stdout: status } = await exec('git status --porcelain', { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
            console.log(`[DEBUG] Git status before commit: ${status}`);

            if (!status.trim()) {
                console.log(`[DEBUG] No changes to commit`);
                return { message: "No changes to commit" };
            }

            const now = new Date();
            const commitMessage = message || `Auto commit: ${now.toISOString()}`;
            console.log(`[DEBUG] Committing changes with message: "${commitMessage}"`);

            const { stdout: commitOutput, stderr: commitError } = await exec(`git commit -m "${commitMessage}"`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
            console.log(`[DEBUG] Commit output: ${commitOutput}`);
            if (commitError) {
                console.log(`[DEBUG] Commit stderr: ${commitError}`);
            }

            const { stdout: currentBranch } = await exec(`git rev-parse --abbrev-ref HEAD`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
            const branchName = currentBranch.trim();
            console.log(`[DEBUG] Current branch: ${branchName}`);

            console.log(`[DEBUG] Pushing changes to Gitea...`);
            try {
                const { stdout: giteaPushOutput, stderr: giteaPushError } = await exec(`git push gitea ${branchName}`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
                console.log(`[DEBUG] Gitea push output: ${giteaPushOutput}`);
                if (giteaPushError) {
                    console.log(`[DEBUG] Gitea push stderr: ${giteaPushError}`);
                }
            } catch (giteaError) {
                console.error(`[ERROR] Failed to push to Gitea: ${giteaError?.message}`);

                if (giteaError.stderr && giteaError.stderr.includes('rejected')) {
                    console.log(`[DEBUG] Push rejected, trying with --force...`);
                    try {
                        const { stdout, stderr } = await exec(`git push gitea ${branchName} --force`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
                        console.log(`[DEBUG] Force push to Gitea output: ${stdout}`);
                        if (stderr) {
                            console.log(`[DEBUG] Force push to Gitea stderr: ${stderr}`);
                        }
                    } catch (forceError) {
                        console.error(`[ERROR] Force push to Gitea failed: ${forceError?.message}`);
                    }
                }
            }

            if (GITHUB_REPO_URL) {
                console.log(`[DEBUG] Pushing changes to GitHub...`);
                try {
                    const { stdout: githubPushOutput, stderr: githubPushError } = await exec(`git push github ${branchName}`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
                    console.log(`[DEBUG] GitHub push output: ${githubPushOutput}`);
                    if (githubPushError) {
                        console.log(`[DEBUG] GitHub push stderr: ${githubPushError}`);
                    }
                } catch (githubError) {
                    console.error(`[ERROR] Failed to push to GitHub: ${githubError?.message}`);

                    if (githubError.stderr && githubError.stderr.includes('rejected')) {
                        console.log(`[DEBUG] Push rejected, trying with --force...`);
                        try {
                            const { stdout, stderr } = await exec(`git push github ${branchName} --force`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
                            console.log(`[DEBUG] Force push to GitHub output: ${stdout}`);
                            if (stderr) {
                                console.log(`[DEBUG] Force push to GitHub stderr: ${stderr}`);
                            }
                        } catch (forceError) {
                            console.error(`[ERROR] Force push to GitHub failed: ${forceError?.message}`);
                        }
                    }
                }
            }

            console.log(`[DEBUG] Commit process completed`);
            return { message: "Changes committed" };
        } catch (error) {
            console.error(`[ERROR] Error during commit process: ${error?.message}`);
        }
    }

    static async getLog() {
        try {
            const remote = GITHUB_REPO_URL ? 'github' : 'gitea';

            const { stdout: remotes } = await exec(`git remote -v`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
            console.log(`[DEBUG] Remotes: ${remotes}`);

            const { stdout: branches } = await exec(`git branch -a`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
            console.log(`[DEBUG] Branches: ${branches}`);

            const { stdout } = await exec(`git log ${remote}/ai-dev --oneline`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
            const lines = stdout.split(/\r?\n/).filter(line => line.trim() !== '');
            const result = {};
            lines.forEach((line) => {
                const firstSpaceIndex = line.indexOf(' ');
                if (firstSpaceIndex > 0) {
                    const hash = line.substring(0, firstSpaceIndex);
                    const message = line.substring(firstSpaceIndex + 1).trim();
                    result[hash] = message;
                }
            });
            return result;
        } catch (error) {
            console.error(`[ERROR] Error during get log: ${error?.message}`);
            throw error;
        }
    }

    static async checkout(ref) {
        try {
            await exec(`git checkout ${ref}`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
            return { message: `Checked out to ${ref}` };
        } catch (error) {
            throw new Error(`Error during checkout: ${error?.message}`);
        }
    }

    static async revert(commitHash) {
        try {
            const { stdout: currentBranch } = await exec(`git rev-parse --abbrev-ref HEAD`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
            const branchName = currentBranch.trim();

            await exec(`git reset --hard`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });

            await exec(
                `git revert --no-edit ${commitHash}..HEAD --no-commit`,
                { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER }
            );

            await exec(
                `git commit -m "Revert to version ${commitHash}"`,
                { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER }
            );

            await exec(`git push gitea ${branchName}`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
            if (GITHUB_REPO_URL) {
                await exec(`git push github ${branchName}`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
            }

            const commitMessage = await this._getCommitMessageByHash(commitHash);
            const devSchema = await this._getDevSchemaByCommitMessage(commitMessage);

            return { message: `Reverted to commit ${commitHash}`, devSchema };
        } catch (error) {
            console.error("Error during revert:", error?.message);
            if (error.stdout) {
                console.error("Revert stdout:", error.stdout);
            }
            if (error.stderr) {
                console.error("Revert stderr:", error.stderr);
            }
            throw new Error(`Error during revert: ${error?.message}`);
        }
    }

    static async mergeDevIntoMaster() {
        try {
            // First, make sure we have the latest changes from both branches
            console.log('[DEBUG] Fetching latest changes from remote repositories...');
            await exec(`git fetch gitea`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
            if (GITHUB_REPO_URL) {
                await exec(`git fetch github`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
            }

            // Switch to branch 'master'
            console.log('[DEBUG] Switching to branch "master"...');
            await exec(`git checkout master`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });

            // Pull latest changes from master
            console.log('[DEBUG] Pulling latest changes from master branch...');
            try {
                await exec(`git pull gitea master`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
                console.log('[DEBUG] Successfully pulled from Gitea master');
            } catch (pullError) {
                console.warn(`[WARN] Failed to pull from Gitea master: ${pullError?.message}`);
                // Try to continue anyway
            }

            // Switch to ai-dev and make sure it's up to date
            console.log('[DEBUG] Switching to branch "ai-dev"...');
            await exec(`git checkout ai-dev`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });

            // Pull latest changes from ai-dev
            console.log('[DEBUG] Pulling latest changes from ai-dev branch...');
            try {
                await exec(`git pull gitea ai-dev`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
                console.log('[DEBUG] Successfully pulled from Gitea ai-dev');
            } catch (pullError) {
                console.warn(`[WARN] Failed to pull from Gitea ai-dev: ${pullError?.message}`);
                // Try to continue anyway
            }

            // Switch back to master for the merge
            console.log('[DEBUG] Switching back to branch "master"...');
            await exec(`git checkout master`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });

            // Merge branch 'ai-dev' into 'master' with a forced merge.
            // Parameter -X theirs is used to resolve conflicts by keeping the changes from the branch being merged in case of conflicts.
            console.log('[DEBUG] Merging branch "ai-dev" into "master" (force merge with -X theirs)...');
            try {
                const { stdout: mergeOutput, stderr: mergeError } = await exec(
                    `git merge ai-dev --no-ff -X theirs -m "Forced merge: merge ai-dev into master"`,
                    { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER }
                );
                console.log(`[DEBUG] Merge output: ${mergeOutput}`);
                if (mergeError) {
                    console.log(`[DEBUG] Merge stderr: ${mergeError}`);
                }
            } catch (mergeError) {
                console.error(`[ERROR] Merge failed: ${mergeError?.message}`);
                if (mergeError.stdout) {
                    console.error(`[ERROR] Merge stdout: ${mergeError.stdout}`);
                }
                if (mergeError.stderr) {
                    console.error(`[ERROR] Merge stderr: ${mergeError.stderr}`);
                }

                // Abort the merge if it failed
                console.log('[DEBUG] Aborting failed merge...');
                await exec(`git merge --abort`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
                throw new Error(`Failed to merge ai-dev into master: ${mergeError?.message}`);
            }

            // Push the merged 'master' branch to both remotes
            console.log('[DEBUG] Pushing merged master branch to Gitea remote...');
            try {
                const { stdout: giteaPushOutput, stderr: giteaPushError } = await exec(`git push gitea master`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
                console.log(`[DEBUG] Gitea push output: ${giteaPushOutput}`);
                if (giteaPushError) {
                    console.log(`[DEBUG] Gitea push stderr: ${giteaPushError}`);
                }
            } catch (pushError) {
                console.error(`[ERROR] Failed to push to Gitea: ${pushError?.message}`);

                // If push is rejected, try with --force
                if (pushError.stderr && pushError.stderr.includes('rejected')) {
                    console.log('[DEBUG] Push rejected, trying with --force...');
                    try {
                        const { stdout, stderr } = await exec(`git push gitea master --force`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
                        console.log(`[DEBUG] Force push to Gitea output: ${stdout}`);
                        if (stderr) {
                            console.log(`[DEBUG] Force push to Gitea stderr: ${stderr}`);
                        }
                    } catch (forceError) {
                        console.error(`[ERROR] Force push to Gitea also failed: ${forceError?.message}`);
                        throw forceError;
                    }
                } else {
                    throw pushError;
                }
            }

            if (GITHUB_REPO_URL) {
                console.log('[DEBUG] Pushing merged master branch to GitHub remote...');
                try {
                    const { stdout: githubPushOutput, stderr: githubPushError } = await exec(`git push github master`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
                    console.log(`[DEBUG] GitHub push output: ${githubPushOutput}`);
                    if (githubPushError) {
                        console.log(`[DEBUG] GitHub push stderr: ${githubPushError}`);
                    }
                } catch (pushError) {
                    console.error(`[ERROR] Failed to push to GitHub: ${pushError?.message}`);

                    // If push is rejected, try with --force
                    if (pushError.stderr && pushError.stderr.includes('rejected')) {
                        console.log('[DEBUG] Push rejected, trying with --force...');
                        try {
                            const { stdout, stderr } = await exec(`git push github master --force`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
                            console.log(`[DEBUG] Force push to GitHub output: ${stdout}`);
                            if (stderr) {
                                console.log(`[DEBUG] Force push to GitHub stderr: ${stderr}`);
                            }
                        } catch (forceError) {
                            console.error(`[ERROR] Force push to GitHub also failed: ${forceError?.message}`);
                            throw forceError;
                        }
                    } else {
                        throw pushError;
                    }
                }
            }

            return { message: "Branch ai-dev merged into master and pushed to all remotes" };
        } catch (error) {
            console.error(`[ERROR] Error during mergeDevIntoMaster: ${error?.message}`);
            throw new Error(`Error during merge of ai-dev into master: ${error?.message}`);
        }
    }

    static async _mergeDevIntoMasterGitHub() {
        try {
            // Switch to branch 'master'
            console.log('Switching to branch "master" (GitHub)...');
            await exec(`git checkout master`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });

            // Merge branch 'ai-dev' into 'master' with a forced merge.
            console.log('Merging branch "ai-dev" into "master" (GitHub, force merge with -X theirs)...');
            await exec(
                `git merge ai-dev --no-ff -X theirs -m "Forced merge: merge ai-dev into master"`,
                { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER }
            );

            // Push the merged 'master' branch to remote (GitHub)
            console.log('Pushing merged master branch to remote (GitHub)...');
            const { stdout, stderr } = await exec(`git push -f github master`, {
                cwd: ROOT_PATH,
                maxBuffer: MAX_BUFFER
            });
            if (stdout) {
                console.log("Git push GitHub stdout:", stdout);
            }
            if (stderr) {
                console.error("Git push GitHub stderr:", stderr);
            }
            return { message: "Branch ai-dev merged into master and pushed to GitHub remote" };
        } catch (error) {
            console.error("Error during mergeDevIntoMasterGitHub:", error?.message);
            if (error.stdout) {
                console.error("Merge GitHub stdout:", error.stdout);
            }
            if (error.stderr) {
                console.error("Merge GitHub stderr:", error.stderr);
            }
            throw error;
        }
    }

    static async resetDevBranch() {
        try {
            console.log(`[DEBUG] Starting reset of ai-dev branch to match master...`);

            // First, fetch all remote branches to ensure we have the latest information
            console.log(`[DEBUG] Fetching latest changes from remotes...`);
            await exec(`git fetch --all`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });

            // Check current branch state
            const { stdout: initialBranches } = await exec(`git branch -a`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
            console.log(`[DEBUG] Initial branches: ${initialBranches}`);

            // Check if master branch exists
            const { stdout: masterExists } = await exec(`git branch --list master`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
            if (!masterExists.trim()) {
                console.log(`[DEBUG] Master branch does not exist. Creating it...`);
                await exec(`git checkout -b master`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
            }

            // Switch to master branch
            console.log(`[DEBUG] Switching to branch "master"...`);
            await exec(`git checkout master`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });

            // Pull latest changes from master
            console.log(`[DEBUG] Pulling latest changes from master...`);
            try {
                await exec(`git pull gitea master`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
            } catch (error) {
                console.log(`[DEBUG] Error pulling from master: ${error?.message}`);
            }

            // Verify we are on master branch
            const { stdout: currentBranch } = await exec(`git rev-parse --abbrev-ref HEAD`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
            console.log(`[DEBUG] Current branch after checkout: ${currentBranch.trim()}`);

            // Get master branch commit hash
            const { stdout: masterCommit } = await exec(`git rev-parse master`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
            console.log(`[DEBUG] Master branch commit hash: ${masterCommit.trim()}`);

            // Delete local ai-dev branch if it exists
            try {
                await exec(`git branch -D ai-dev`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
                console.log(`[DEBUG] Local branch ai-dev deleted successfully`);
            } catch (error) {
                console.log(`[DEBUG] Local branch ai-dev does not exist or could not be deleted: ${error?.message}`);
            }

            // Create new ai-dev branch from master using the exact commit hash
            await exec(`git branch ai-dev ${masterCommit.trim()}`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
            console.log(`[DEBUG] Created new ai-dev branch from master commit ${masterCommit.trim()}`);

            // Switch to the new ai-dev branch
            await exec(`git checkout ai-dev`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
            console.log(`[DEBUG] Switched to new ai-dev branch`);

            // Verify we are on ai-dev branch
            const { stdout: newCurrentBranch } = await exec(`git rev-parse --abbrev-ref HEAD`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
            console.log(`[DEBUG] Current branch after creating ai-dev: ${newCurrentBranch.trim()}`);

            // Verify that ai-dev points to the same commit as master
            const { stdout: aiDevCommit } = await exec(`git rev-parse ai-dev`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
            console.log(`[DEBUG] ai-dev branch commit hash: ${aiDevCommit.trim()}`);

            if (aiDevCommit.trim() !== masterCommit.trim()) {
                console.error(`[ERROR] ai-dev branch does not point to the same commit as master!`);
                console.error(`[ERROR] master: ${masterCommit.trim()}, ai-dev: ${aiDevCommit.trim()}`);
                throw new Error(`Failed to create ai-dev branch from master`);
            }

            console.log(`[DEBUG] Verified: ai-dev branch points to the same commit as master`);

            // Delete remote ai-dev branches if they exist
            console.log(`[DEBUG] Deleting remote ai-dev branches if they exist...`);

            // For Gitea
            try {
                // First check if the remote branch exists
                const { stdout: giteaBranches } = await exec(`git ls-remote --heads gitea ai-dev`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });

                if (giteaBranches.trim()) {
                    console.log(`[DEBUG] Remote branch ai-dev exists on Gitea, deleting it...`);
                    await exec(`git push gitea --delete ai-dev`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
                    console.log(`[DEBUG] Remote branch ai-dev on Gitea deleted successfully`);

                    // Verify deletion
                    const { stdout: verifyGiteaDeletion } = await exec(`git ls-remote --heads gitea ai-dev`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
                    if (verifyGiteaDeletion.trim()) {
                        console.log(`[WARN] Remote branch ai-dev on Gitea still exists after deletion attempt`);
                    } else {
                        console.log(`[DEBUG] Verified: Remote branch ai-dev on Gitea is deleted`);
                    }
                } else {
                    console.log(`[DEBUG] Remote branch ai-dev does not exist on Gitea`);
                }
            } catch (error) {
                console.log(`[DEBUG] Error checking/deleting remote branch on Gitea: ${error?.message}`);
            }

            // For GitHub
            if (GITHUB_REPO_URL) {
                try {
                    // First check if the remote branch exists
                    const { stdout: githubBranches } = await exec(`git ls-remote --heads github ai-dev`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });

                    if (githubBranches.trim()) {
                        console.log(`[DEBUG] Remote branch ai-dev exists on GitHub, deleting it...`);
                        await exec(`git push github --delete ai-dev`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
                        console.log(`[DEBUG] Remote branch ai-dev on GitHub deleted successfully`);

                        // Verify deletion
                        const { stdout: verifyGithubDeletion } = await exec(`git ls-remote --heads github ai-dev`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
                        if (verifyGithubDeletion.trim()) {
                            console.log(`[WARN] Remote branch ai-dev on GitHub still exists after deletion attempt`);
                        } else {
                            console.log(`[DEBUG] Verified: Remote branch ai-dev on GitHub is deleted`);
                        }
                    } else {
                        console.log(`[DEBUG] Remote branch ai-dev does not exist on GitHub`);
                    }
                } catch (error) {
                    console.log(`[DEBUG] Error checking/deleting remote branch on GitHub: ${error?.message}`);
                }
            }

            // Wait a moment to ensure deletion is processed
            console.log(`[DEBUG] Waiting for remote branch deletion to be processed...`);
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Push new ai-dev branch to remote repositories with force
            console.log(`[DEBUG] Pushing new ai-dev branch to Gitea (force push)...`);
            try {
                const { stdout, stderr } = await exec(`git push -u gitea ai-dev --force`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
                console.log(`[DEBUG] Gitea force push output: ${stdout}`);
                if (stderr) {
                    console.log(`[DEBUG] Gitea force push stderr: ${stderr}`);
                }

                // Verify the push
                const { stdout: verifyGiteaPush } = await exec(`git ls-remote --heads gitea ai-dev`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
                console.log(`[DEBUG] Gitea ai-dev branch after push: ${verifyGiteaPush}`);

                // Extract the hash from the output
                const giteaAiDevHash = verifyGiteaPush.split(/\s+/)[0];

                if (giteaAiDevHash === masterCommit.trim()) {
                    console.log(`[DEBUG] Verified: Gitea ai-dev branch matches master branch`);
                } else {
                    console.log(`[WARN] Gitea ai-dev branch does not match master branch!`);
                    console.log(`[WARN] master: ${masterCommit.trim()}, Gitea ai-dev: ${giteaAiDevHash}`);
                }
            } catch (error) {
                console.error(`[ERROR] Force push to Gitea failed: ${error?.message}`);
                throw error;
            }

            if (GITHUB_REPO_URL) {
                console.log(`[DEBUG] Pushing new ai-dev branch to GitHub (force push)...`);
                try {
                    const { stdout, stderr } = await exec(`git push -u github ai-dev --force`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
                    console.log(`[DEBUG] GitHub force push output: ${stdout}`);
                    if (stderr) {
                        console.log(`[DEBUG] GitHub force push stderr: ${stderr}`);
                    }

                    // Verify the push
                    const { stdout: verifyGithubPush } = await exec(`git ls-remote --heads github ai-dev`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
                    console.log(`[DEBUG] GitHub ai-dev branch after push: ${verifyGithubPush}`);

                    // Extract the hash from the output
                    const githubAiDevHash = verifyGithubPush.split(/\s+/)[0];

                    if (githubAiDevHash === masterCommit.trim()) {
                        console.log(`[DEBUG] Verified: GitHub ai-dev branch matches master branch`);
                    } else {
                        console.log(`[WARN] GitHub ai-dev branch does not match master branch!`);
                        console.log(`[WARN] master: ${masterCommit.trim()}, GitHub ai-dev: ${githubAiDevHash}`);
                    }
                } catch (error) {
                    console.error(`[ERROR] Force push to GitHub failed: ${error?.message}`);
                    throw error;
                }
            }

            // Final verification
            console.log(`[DEBUG] Performing final verification...`);

            // Get master commit hash again to ensure it hasn't changed
            const { stdout: finalMasterCommit } = await exec(`git rev-parse master`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
            console.log(`[DEBUG] Final master branch commit hash: ${finalMasterCommit.trim()}`);

            // Get ai-dev commit hash
            const { stdout: finalAiDevCommit } = await exec(`git rev-parse ai-dev`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
            console.log(`[DEBUG] Final ai-dev branch commit hash: ${finalAiDevCommit.trim()}`);

            // Get remote branches
            const { stdout: finalRemoteBranches } = await exec(`git ls-remote --heads`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
            console.log(`[DEBUG] Final remote branches: ${finalRemoteBranches}`);

            if (finalAiDevCommit.trim() !== finalMasterCommit.trim()) {
                console.error(`[ERROR] Final verification failed: ai-dev and master branches point to different commits!`);
                console.error(`[ERROR] master: ${finalMasterCommit.trim()}, ai-dev: ${finalAiDevCommit.trim()}`);
            } else {
                console.log(`[DEBUG] Final verification passed: ai-dev and master branches point to the same commit`);
            }

            console.log(`[DEBUG] Reset of ai-dev branch completed successfully`);
            return { message: "Branch ai-dev has been reset to be an exact copy of master" };
        } catch (error) {
            console.error(`[ERROR] Error during reset of dev branch: ${error?.message}`);
            throw new Error(`Error during reset of dev branch: ${error?.message}`);
        }
    }

    static async _resetDevBranchGitHub() {
        try {
            console.log('[DEBUG] Switching to branch "master" (GitHub)...');
            await exec(`git checkout master`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });

            console.log('[DEBUG] Resetting branch "ai-dev" to be identical to "master" (GitHub)...');
            await exec(`git checkout -B ai-dev master`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });

            console.log('[DEBUG] Pushing updated branch "ai-dev" to remote (GitHub, force push)...');
            await exec(`git push -f github ai-dev`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });

            return { message: 'ai-dev branch successfully reset to master (GitHub).' };
        } catch (error) {
            console.error("Error during resetting ai-dev branch (GitHub):", error?.message);
            if (error.stdout) {
                console.error("Reset GitHub stdout:", error.stdout);
            }
            if (error.stderr) {
                console.error("Reset GitHub stderr:", error.stderr);
            }
            throw new Error(`Error during resetting ai-dev branch (GitHub): ${error?.message}`);
        }
    }

    static async _pushChangesToGitea() {
        try {
            const { stdout, stderr } = await exec(`git push gitea ai-dev`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
            if (stdout) {
                console.log("Git push Gitea stdout:", stdout);
            }
            if (stderr) {
                console.error("Git push Gitea stderr:", stderr);
            }
            return { message: "Changes pushed to Gitea remote repository (ai-dev branch)" };
        } catch (error) {
            console.error("Git push Gitea error:", error?.message);
            if (error.stdout) {
                console.error("Git push Gitea stdout:", error.stdout);
            }
            if (error.stderr) {
                console.error("Git push Gitea stderr:", error.stderr);
            }
            throw error;
        }
    }

    static async _pushChangesToGithub() {
        try {
            const { stdout, stderr } = await exec(`git push github ai-dev`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
            if (stdout) {
                console.log("Git push GitHub stdout:", stdout);
            }
            if (stderr) {
                console.error("Git push GitHub stderr:", stderr);
            }
            return { message: "Changes pushed to GitHub repository (ai-dev branch)" };
        } catch (error) {
            console.error("Git push GitHub error:", error?.message);
            if (error.stdout) {
                console.error("Git push GitHub stdout:", error.stdout);
            }
            if (error.stderr) {
                console.error("Git push GitHub stderr:", error.stderr);
            }
            throw error;
        }
    }

    static async _addGithubRemote() {
        if (GITHUB_REPO_URL) {
            try {
                const { stdout: remotes } = await exec(`git remote -v`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
                if (!remotes.includes('github')) {
                    console.log(`[DEBUG] Adding GitHub remote: git remote add github ${GITHUB_REPO_URL}`);
                    await exec(`git remote add github ${GITHUB_REPO_URL}`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
                    console.log(`[DEBUG] GitHub remote added: ${GITHUB_REPO_URL}`);
                } else {
                    console.log(`[DEBUG] GitHub remote already exists.`);
                }
            } catch (error) {
                console.error(`[ERROR] Failed to add GitHub remote: ${error?.message}`);
                if (error.stdout) {
                    console.error(`[ERROR] git remote add stdout: ${error.stdout}`);
                }
                if (error.stderr) {
                    console.error(`[ERROR] git remote add stderr: ${error.stderr}`);
                }
                throw error;
            }
        }
    }

    static async _addGiteaRemote(giteaRemoteUrl) {
        try {
            const { stdout: remotes } = await exec(`git remote -v`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
            if (!remotes.includes('gitea')) {
                console.log(`[DEBUG] Adding Gitea remote: git remote add gitea ${giteaRemoteUrl}`);
                await exec(`git remote add gitea ${giteaRemoteUrl}`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
                console.log(`[DEBUG] Gitea remote added: ${giteaRemoteUrl}`);
            } else {
                console.log(`[DEBUG] Gitea remote already exists.`);
            }
        } catch (error) {
            console.error(`[ERROR] Failed to add Gitea remote: ${error?.message}`);
            if (error.stdout) {
                console.error(`[ERROR] git remote add stdout: ${error.stdout}`);
            }
            if (error.stderr) {
                console.error(`[ERROR] git remote add stderr: ${error.stderr}`);
            }
            throw error;
        }
    }

    static async _revertGitHubChanges(branchName) {
        try {
            await exec(`git push -f github ${branchName}`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
        } catch (error) {
            console.error("Error during revertGitHubChanges:", error?.message);
            if (error.stdout) {
                console.error("revertGitHubChanges stdout:", error.stdout);
            }
            if (error.stderr) {
                console.error("revertGitHubChanges stderr:", error.stderr);
            }
            throw new Error(`Error during revertGitHubChanges: ${error?.message}`);
        }
    }

    static async _ensureDevBranch() {
        try {
            console.log(`[DEBUG] Ensuring we are on 'ai-dev' branch...`);

            const { stdout: branchList } = await exec(`git branch --list ai-dev`, {
                cwd: ROOT_PATH,
                maxBuffer: MAX_BUFFER,
            });

            if (!branchList || branchList.trim() === '') {
                console.log(`[DEBUG] Branch 'ai-dev' not found. Creating branch 'ai-dev'.`);
                await exec(`git checkout -b ai-dev`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
            } else {
                const { stdout: currentBranchStdout } = await exec(`git rev-parse --abbrev-ref HEAD`, {
                    cwd: ROOT_PATH,
                    maxBuffer: MAX_BUFFER,
                });
                const currentBranch = currentBranchStdout.trim();

                if (currentBranch !== 'ai-dev') {
                    console.log(`[DEBUG] Switching from branch '${currentBranch}' to 'ai-dev'.`);
                    await exec(`git checkout ai-dev`, { cwd: ROOT_PATH, maxBuffer: MAX_BUFFER });
                } else {
                    console.log(`[DEBUG] Already on branch 'ai-dev'.`);
                }
            }

            console.log(`[DEBUG] Successfully ensured we are on 'ai-dev' branch.`);
        } catch (error) {
            console.error(`[ERROR] Error ensuring branch 'ai-dev': ${error?.message}`);
            if (error.stdout) {
                console.error(`[ERROR] stdout: ${error.stdout}`);
            }
            if (error.stderr) {
                console.error(`[ERROR] stderr: ${error.stderr}`);
            }
            throw new Error(`Error ensuring branch 'ai-dev': ${error?.message}`);
        }
    }

    static async _ensureGitignore() {
        try {
            console.log(`[DEBUG] Checking .gitignore file...`);
            const gitignorePath = path.join(ROOT_PATH, '.gitignore');

            let gitignoreContent = '';
            try {
                gitignoreContent = await fs.readFile(gitignorePath, 'utf8');
                console.log(`[DEBUG] Existing .gitignore found.`);
            } catch (error) {
                console.log(`[DEBUG] .gitignore file not found, creating new one.`);
            }


            const requiredPatterns = [
                'node_modules/',
                '*/node_modules/',
                '**/node_modules/',
                '*/build/',
                '**/build/',
                '.DS_Store',
                '.env'
            ];

            let needsUpdate = false;
            for (const pattern of requiredPatterns) {
                if (!gitignoreContent.includes(pattern)) {
                    gitignoreContent += `\n${pattern}`;
                    needsUpdate = true;
                }
            }

            if (needsUpdate) {
                console.log(`[DEBUG] Updating .gitignore file with missing patterns.`);
                await fs.writeFile(gitignorePath, gitignoreContent.trim(), 'utf8');
                console.log(`[DEBUG] .gitignore file updated successfully.`);
            } else {
                console.log(`[DEBUG] .gitignore file is up to date.`);
            }

            return true;
        } catch (error) {
            console.error(`[ERROR] Error ensuring .gitignore: ${error?.message}`);
            return false;
        }
    }

    static async _waitForGitLockRelease(gitDir, timeout = 10000, interval = 500) {
        const lockFilePath = path.join(gitDir, 'index.lock');
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            try {
                await fs.access(lockFilePath);
                console.log('[DEBUG] index.lock file exists. Waiting...');
                await new Promise(resolve => setTimeout(resolve, interval));
            } catch (err) {
                console.log('[DEBUG] index.lock file no longer exists. Proceeding...');
                return;
            }
        }

        throw new Error('Timeout waiting for index.lock to be released');
    }

    static async _removeGitLockIfExists(gitDir) {
        const lockFilePath = path.join(gitDir, 'index.lock');
        try {
            await fs.access(lockFilePath);
            console.log('[DEBUG] index.lock file exists. Removing...');
            await fs.unlink(lockFilePath);
            console.log('[DEBUG] index.lock file removed.');
        } catch (err) {
            console.log('[DEBUG] index.lock file does not exist. No action needed.');
        }
    }

    static async _saveDevSchema(commitMessage, dev_schema) {
        try {
            let devSchemaData = {};
            try {
                const fileContent = await fs.readFile(devSchemaFilePath, 'utf8');
                devSchemaData = JSON.parse(fileContent);
            } catch (readError) {
                console.log(`[DEBUG] _dev_schema.json not found or empty, creating new.`);
                devSchemaData = {};
            }

            const schema = JSON.parse(dev_schema);

            devSchemaData[commitMessage] = JSON.stringify(schema);

            await fs.writeFile(devSchemaFilePath, JSON.stringify(devSchemaData, null, 2), 'utf8');
            console.log(`[DEBUG] _dev_schema.json updated with new schema for commit '${commitMessage}'`);
        } catch (error) {
            console.error(`[ERROR] Error saving dev schema: ${error?.message}`);
            throw new Error(`Error saving dev schema: ${error?.message}`);
        }
    }

    static async _getDevSchemaByHash(hash) {
        try {
            const fileContent = await fs.readFile(devSchemaFilePath, 'utf8');
            const devSchemaData = JSON.parse(fileContent);

            if (devSchemaData[hash]) {
                return devSchemaData[hash];
            } else {
                throw new Error(`Schema not found for commit hash: ${hash}`);
            }
        } catch (error) {
            console.error(`[ERROR] Error reading dev schema: ${error?.message}`);
            console.error(`Error reading dev schema: ${error?.message}`);
        }
    }

    static async _getDevSchemaByCommitMessage(commitMessage) {
        try {
            const fileContent = await fs.readFile(devSchemaFilePath, 'utf8');
            const devSchemaData = JSON.parse(fileContent);

            if (devSchemaData[commitMessage]) {
                return devSchemaData[commitMessage];
            } else {
                throw new Error(`Schema not found for commit message: ${commitMessage}`);
            }
        } catch (error) {
            console.error(`[ERROR] Error retrieving dev schema: ${error.message}`);
            throw new Error(`Error retrieving dev schema: ${error.message}`);
        }
    }

    static async _getCommitMessageByHash(commitHash) {
        return new Promise((resolve, reject) => {
            exec(`git log -1 --format=%B ${commitHash}`, (error, stdout, stderr) => {
                if (error) {
                    reject(`Error getting commit message: ${stderr}`);
                } else {
                    resolve(stdout.trim());
                }
            });
        });
    }
}

module.exports = VCS;