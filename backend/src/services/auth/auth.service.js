const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userProvider = require('../../dataProviders/userProvider');
const UserSessionDataProvider = require('../../dataProviders/userSessionsProvider');
const userService = require('../user/user.service');
const teamService = require('../teams/team.service');
const roleService = require('../roles/role.service');
const generateUsernameFromEmail = require('../../utils/generateUsernameFromEmail');
const { JWT_SECRET } = process.env;
const config = require('../../utils/environment');
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(config.GOOGLE_CLIENT_ID);

const AuthService = {};

AuthService.register = async ({ username, email, password }) => {
    // Check if user already exists
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await userProvider.create({ username, email, password: hashedPassword });

    return user;
};

AuthService.login = async ({ email, password, isSSO }) => {
    let user = await userProvider.findByEmail(email);
    const username = generateUsernameFromEmail(email);
    // 2. If not found → register new user
    if (!user) {
        if (isSSO) {
            // For Google SSO – password may not be required
            user = await userProvider.create({ username, email, password: null });
            
            // Setup default team for all first-time SSO users
            await AuthService.setupDefaultTeamForUser(user);
        } else {
            if (!password) throw new Error("Password required for normal login");
            const hashedPassword = await bcrypt.hash(password, 10);
            user = await userProvider.create({ username, email, password: hashedPassword });
            
            // Setup default team for all first-time users
            await AuthService.setupDefaultTeamForUser(user);
        }
    } else {
        // 3. If existing user & not SSO → validate password
        if (!isSSO) {
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) throw new Error("Invalid credentials");
        }
    }

    // 4. Generate JWT token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "1h" });
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // 5. Store session in DB
    await UserSessionDataProvider.create({ userId: user.id, token, expiresAt });

    // 6. Return token + user
    return { token, user , username};
};

AuthService.verifyToken = async (token) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const session = await UserSessionDataProvider.findByToken(token);
        if (!session) throw new Error('Invalid session');
        return decoded;
    } catch (err) {
        throw new Error('Invalid or expired token');
    }
};

AuthService.logout = async (token) => {
    await UserSessionDataProvider.deleteSession(token);
    return { message: 'Logged out successfully' };
};

AuthService.setupDefaultTeamForUser = async (user) => {
    try {
        // 1. Check if "Team Launchpad" already exists
        let defaultTeam = await teamService.findByEmail('team@launchpad.com');
        
        if (!defaultTeam) {
            // Create the default team
            defaultTeam = await teamService.create({
                name: 'Team Launchpad',
                email: 'team@launchpad.com'
            });
        } else {
        }

        // 2. Determine user role based on email
        const isAdmin = user.email === 'launchpad_admin@gmail.com';
        const roleName = isAdmin ? 'ADMIN' : 'MEMBER';
        
        // 3. Get or create the role
        let userRole = await roleService.findByName(roleName);
        if (!userRole) {
            userRole = await roleService.create({ name: roleName });
        }

        // 4. Check if user is already in the team
        const { UserTeamRoleMapping } = require('../../db/models');
        const existingMapping = await UserTeamRoleMapping.findOne({
            where: {
                user_id: user.id,
                team_id: defaultTeam.id
            }
        });

        if (!existingMapping) {
            // Add user to team with appropriate role
            await teamService.addMemberToTeam(defaultTeam.id, {
                userId: user.id,
                roleId: userRole.id
            });
        } else {
        }

    } catch (error) {
        console.error('Error setting up default team for user:', error);
        // Don't throw error to avoid breaking login flow
    }
};

AuthService.googleOAuth = async (token) => {
    try {
        const verifyToken = await client.verifyIdToken({
            idToken: token,
            audience: config.GOOGLE_CLIENT_ID,
        });

        const payload = verifyToken.getPayload();
        const { given_name, family_name, email, picture } = payload;

        // if (!this.isProboEmail(email)) {
        //   throw new Error("Please use valid email");
        // }

        let user = await userProvider.findByEmail(email);
        if (!user) {
            try {
                const username = generateUsernameFromEmail(email);
                const hashedPassword = await bcrypt.hash(`${given_name}_${family_name}_${email}`, 10);
                user = await userProvider.create({ 
                    username, 
                    email, 
                    password: hashedPassword 
                });
                
                // Setup default team for first-time SSO users
                await AuthService.setupDefaultTeamForUser(user);
            } catch (error) {
                console.error("Error creating SSO user:", error);
                throw error;
            }
        }
        const jwtToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "1h" });
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        const authToken = await UserSessionDataProvider.create({ userId: user.id, token: jwtToken, expiresAt });
        const response = {
            name: user?.username,
            email: user?.email,
            token: authToken.dataValues.token,
            image: picture
        }
        return response;
    } catch (err) {
        throw new Error("AuthService::Err::googleOAuth");
    }
}

module.exports = AuthService;
